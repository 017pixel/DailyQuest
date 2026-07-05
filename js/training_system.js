const DQ_TRAINING_SYSTEM = {
    todayCache: null,
    blockedQuestNameKeys: ['jump_rope'],

    t(key, fallback = key) {
        const lang = this.getLang();
        return (DQ_DATA.translations[lang] && DQ_DATA.translations[lang][key]) || fallback;
    },

    getLang() {
        return DQ_CONFIG.userSettings.language || 'de';
    },

    normalizeGoal(goal) {
        const aliases = DQ_DATA.trainingGoalAliases || {};
        return aliases[goal] || 'muscle';
    },

    getPlan(goal) {
        const normalized = this.normalizeGoal(goal);
        return DQ_DATA.trainingPlans[normalized] || DQ_DATA.trainingPlans.muscle;
    },

    isWgerSportGoal(goal) {
        const normalized = this.normalizeGoal(goal);
        return ['muscle', 'kraft_abnehmen', 'endurance', 'fatloss', 'calisthenics'].includes(normalized);
    },

    async getTemplateByNameKey(nameKey) {
        const local = Object.values(DQ_DATA.exercisePool || {}).flat().find(ex => ex.nameKey === nameKey);
        if (local) return local;
        if (typeof DQ_WGER !== 'undefined') {
            return await DQ_WGER.getByNameKey(nameKey);
        }
        return null;
    },

    getAgeBand(age) {
        if (typeof age !== 'number' || Number.isNaN(age)) return 'unknown';
        if (age < 18) return 'u18';
        if (age < 30) return '18-29';
        if (age < 45) return '30-44';
        if (age < 60) return '45-59';
        return '60+';
    },

    getStageLabel(stage) {
        return this.t(stage?.labelKey, stage?.labelKey || 'Phase');
    },

    getStageSummary(goal, stage, completionMode, difficulty = 3) {
        if (!stage) return '';
        if (goal === 'endurance' || completionMode === 'log') {
            const distance = typeof stage.distance === 'number' ? stage.distance.toFixed(1) : '0.0';
            return `${distance} km · ${stage.duration || 0} min`;
        }

        const setsLabel = this.t('sets_label', 'Sätze');
        const repsLabel = this.t('reps_label', 'Wdh.');
        const sets = Math.max(1, stage.sets || 1);
        const reps = this.scaleReps(stage.reps || 1, difficulty);
        return `${sets} ${setsLabel} · ${reps} ${repsLabel}`;
    },

    getDifficultyMultiplier(difficulty = 3) {
        const normalized = Math.max(1, Math.min(5, Number(difficulty) || 3));
        return { 1: 0.8, 2: 0.9, 3: 1, 4: 1.15, 5: 1.3 }[normalized] || 1;
    },

    scaleReps(baseReps, difficulty = 3) {
        return Math.max(1, Math.round(Math.max(1, baseReps) * this.getDifficultyMultiplier(difficulty)));
    },

    getQuestActionLabel(quest) {
        if (!quest || quest.completed) return 'check';
        if (quest.completionMode === 'log') return 'OK';
        if (quest.completionMode === 'timer') return this.t('timer_start_button', 'Los');
        if (quest.completionMode === 'sets') {
            const totalSets = Math.max(1, quest.setPlan?.sets || quest.setProgress?.length || 1);
            const doneSets = Array.isArray(quest.setProgress) ? quest.setProgress.filter(Boolean).length : 0;
            return `${doneSets}/${totalSets}`;
        }
        if (quest.type === 'focus') return this.t('start_task_button', 'Los');
        return 'OK';
    },
    async getState(goal) {
        const normalized = this.normalizeGoal(goal);
        const tx = DQ_DB.db.transaction(['training_plan_state'], 'readwrite');
        const store = tx.objectStore('training_plan_state');
        const existing = await new Promise(resolve => {
            store.get(normalized).onsuccess = e => resolve(e.target.result || null);
        });

        if (existing) return existing;

        const state = {
            key: normalized,
            goal: normalized,
            startedAt: DQ_CONFIG.getTodayString(),
            manualWeekShift: 0,
            stageExtensions: {},
            recentExercises: [],
            updatedAt: Date.now()
        };

        store.put(state);
        return state;
    },

    async saveState(state) {
        const tx = DQ_DB.db.transaction(['training_plan_state'], 'readwrite');
        tx.objectStore('training_plan_state').put(state);
        return new Promise(resolve => {
            tx.oncomplete = () => resolve(state);
            tx.onerror = () => resolve(state);
        });
    },

    async resetPhaseState(goal) {
        const normalized = this.normalizeGoal(goal);
        const state = await this.getState(normalized);
        state.goal = normalized;
        state.startedAt = DQ_CONFIG.getTodayString();
        state.manualWeekShift = 0;
        state.stageExtensions = {};
        state.recentExercises = [];
        state.lastGeneratedDate = null;
        state.lastStageIndex = 0;
        state.lastStageWeek = 0;
        state.updatedAt = Date.now();
        await this.saveState(state);
        return state;
    },

    getWeekOffset(startedAt) {
        if (!startedAt) return 0;
        const start = new Date(startedAt);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
    },

    getStageForState(plan, state) {
        const baseWeek = this.getWeekOffset(state.startedAt);
        const shiftedWeek = Math.max(0, baseWeek + (state.manualWeekShift || 0));
        let remaining = shiftedWeek;
        let stageIndex = plan.stages.length - 1;
        let stageWeek = 0;

        for (let i = 0; i < plan.stages.length; i++) {
            const stage = plan.stages[i];
            const extension = state.stageExtensions?.[i] || 0;
            const weeks = Math.max(1, (stage.weeks || 1) + extension);
            if (remaining < weeks) {
                stageIndex = i;
                stageWeek = remaining;
                break;
            }
            remaining -= weeks;
        }

        const stage = plan.stages[Math.min(stageIndex, plan.stages.length - 1)] || plan.stages[plan.stages.length - 1];
        const extension = state.stageExtensions?.[stageIndex] || 0;
        const stageWeeks = Math.max(1, (stage.weeks || 1) + extension);
        const progress = stageWeeks > 0 ? Math.min(1, stageWeek / stageWeeks) : 1;

        return { stageIndex, stage, stageWeek, stageWeeks, progress, shiftedWeek };
    },

    pickCandidate(slot, recentExerciseKeys, hasEquipment, pickedToday = [], goal = null) {
        const exercisePool = DQ_DATA.exercisePool;
        let poolKeys;
        if (goal === 'senior') {
            poolKeys = ['senior'];
        } else {
            poolKeys = Object.keys(exercisePool).filter(k => k !== 'senior');
        }
        const goalExercises = poolKeys.flatMap(k => exercisePool[k]);
        const blocked = new Set(this.blockedQuestNameKeys || []);
        const candidates = (slot.candidates || [])
            .map(nameKey => goalExercises.find(ex => ex.nameKey === nameKey))
            .filter(ex => !!ex && !blocked.has(ex.nameKey));
        const filtered = candidates.filter(ex => hasEquipment !== false || !ex.needsEquipment);
        const pool = hasEquipment === false
            ? (filtered.length > 0 ? filtered : goalExercises.filter(ex => !ex.needsEquipment && !blocked.has(ex.nameKey)))
            : (filtered.length > 0 ? filtered : candidates);
        const available = pool.filter(ex => !pickedToday.includes(ex.nameKey));
        const finalPool = available.length > 0 ? available : [];
        if (finalPool.length === 0) return null;

        const scored = finalPool.map(ex => {
            let score = 1;
            if (recentExerciseKeys.includes(ex.nameKey)) score -= 0.7;
            if (ex.needsEquipment && hasEquipment === false) score -= 0.5;
            return { ex, score };
        }).sort((a, b) => b.score - a.score);

        const topScore = scored[0].score;
        const best = scored.filter(item => item.score === topScore);
        return best[Math.floor(Math.random() * best.length)].ex;
    },

    async pickWgerCandidate(slot, recentExerciseKeys, hasEquipment, pickedToday = [], goal = null) {
        if (typeof DQ_WGER === 'undefined') return null;
        const pool = await DQ_WGER.getTrainingPool(goal || 'muscle', slot?.key || 'general', hasEquipment);
        const blocked = new Set(this.blockedQuestNameKeys || []);
        const available = pool.filter(ex => !blocked.has(ex.nameKey) && !pickedToday.includes(ex.nameKey));
        const finalPool = available.length > 0 ? available : pool.filter(ex => !blocked.has(ex.nameKey));
        if (finalPool.length === 0) return null;

        const scored = finalPool.map(ex => {
            let score = 1;
            if (recentExerciseKeys.includes(ex.nameKey)) score -= 0.7;
            if (ex.hasImage) score += 0.08;
            if (ex.descriptionDe || ex.descriptionEn) score += 0.04;
            return { ex, score };
        }).sort((a, b) => b.score - a.score);

        const top = scored.slice(0, Math.max(1, Math.min(12, Math.ceil(scored.length * 0.2))));
        return top[Math.floor(Math.random() * top.length)].ex;
    },

    getTargetValue(template, stage) {
        if (stage?.targetDuration) return stage.targetDuration;
        if (template.type === 'time') {
            if (typeof stage?.reps === 'number') {
                return Math.max(20, Math.round(stage.reps * 6));
            }
            return Math.max(20, template.baseValue || 20);
        }
        if (template.type === 'check' || template.type === 'focus') return 1;
        return stage.reps || template.baseValue || 1;
    },

    formatDuration(seconds) {
        const safe = Math.max(1, Math.round(seconds || 0));
        if (safe >= 60) {
            const minutes = Math.floor(safe / 60);
            const rest = safe % 60;
            return rest === 0 ? `${minutes} min` : `${minutes}m ${rest}s`;
        }
        return `${safe} s`;
    },

    getEnduranceTarget(template, stageContext, difficulty = 3) {
        if (!template) return null;

        const stageIndex = Math.max(0, stageContext?.stageIndex || 0);
        const stageTimeMultiplier = 0.75 + (stageIndex * 0.12);
        const stageRepMultiplier = 0.9 + (stageIndex * 0.08);
        const diffMultiplier = this.getDifficultyMultiplier(difficulty);
        const adjustedDifficulty = 1 + ((diffMultiplier - 1) * 0.6);

        if (template.type === 'time') {
            const baseSeconds = Math.max(15, template.baseValue || 30);
            const seconds = Math.max(15, Math.round(baseSeconds * stageTimeMultiplier * adjustedDifficulty));
            return {
                kind: 'time',
                value: seconds,
                label: this.formatDuration(seconds)
            };
        }

        if (template.type === 'reps') {
            const baseReps = Math.max(1, template.baseValue || 1);
            const reps = Math.max(1, Math.round(baseReps * stageRepMultiplier * adjustedDifficulty));
            return {
                kind: 'reps',
                value: reps,
                label: `${reps} ${this.t('reps_label', 'Wdh.')}`
            };
        }

        if (template.nameKey === 'walk_30min' || template.nameKey === 'short_walk') {
            const baseMinutes = template.nameKey === 'walk_30min' ? 15 : 8;
            const minutes = Math.max(8, Math.round(baseMinutes * (1 + stageIndex * 0.08) * adjustedDifficulty));
            return {
                kind: 'time',
                value: minutes * 60,
                label: `${minutes} min`
            };
        }

        return null;
    },

    getCompletionMode(goal, template) {
        const plan = this.getPlan(goal);
        // Spezifische Logik fuer Ausdauer-Training
        if (goal === 'endurance') {
            if (template.type === 'time' && template.baseValue <= 180) return 'timer';
            if (template.type === 'check') return 'tap';
            if (template.nameKey === 'walking_lunges') return 'tap';
            return 'tap';
        }
        if (plan?.completionMode && goal !== 'endurance') return plan.completionMode;
        if (template.type === 'focus') return 'tap';
        if (template.type === 'check') return 'tap';
        if (template.nameKey === 'walk_30min' || template.nameKey === 'short_walk') return 'tap';
        return 'sets';
    },

    getLoadFactor(goal, stage, template) {
        if (goal === 'endurance') {
            const duration = stage.duration || 20;
            const distance = stage.distance || 2;
            const power = stage.power || 4;
            return Math.max(0.6, Math.min(2.2, (duration / 20) * 0.45 + (distance / 2) * 0.35 + (power / 4) * 0.3));
        }

        const sets = stage.sets || 1;
        const reps = stage.reps || template.baseValue || 1;
        const base = 2 * 8;
        return Math.max(0.7, Math.min(2.5, (sets * reps) / base));
    },

    buildQuest(goal, plan, state, stageContext, slot, template, todayStr, index, difficulty, hasEquipment) {
        const completionMode = this.getCompletionMode(goal, template);
        const targetValue = this.getTargetValue(template, stageContext.stage);
        const enduranceTarget = goal === 'endurance'
            ? this.getEnduranceTarget(template, stageContext, difficulty)
            : null;
        const sets = completionMode === 'sets' ? Math.max(1, stageContext.stage.sets || 1) : 1;
        const reps = completionMode === 'sets'
            ? (template.type === 'time'
                ? (enduranceTarget?.value || targetValue)
                : this.scaleReps(stageContext.stage.reps || template.baseValue || 1, difficulty))
            : targetValue;
        const setProgress = completionMode === 'sets' ? Array.from({ length: sets }, () => false) : [];
        const loadFactor = this.getLoadFactor(goal, stageContext.stage, template);
        const rewardScale = Math.max(0.8, Math.min(3, loadFactor * (1 + (difficulty - 3) * 0.08)));
        const label = this.getStageLabel(stageContext.stage);
        const header = this.getPhaseHeaderText(stageContext);

        let targetLabel = enduranceTarget?.label || null;
        if (goal === 'endurance') {
            const stage = stageContext.stage || {};
            const distance = typeof stage.distance === 'number' ? stage.distance.toFixed(1) : null;
            const duration = stage.duration || null;
            if (slot.key === 'distance' && distance) {
                targetLabel = `${distance} km`;
            } else if ((slot.key === 'warmup' || slot.key === 'tempo' || slot.key === 'cooldown') && duration) {
                targetLabel = `${duration} min`;
            }
        }

        const quest = {
            date: todayStr,
            goal,
            slotKey: slot.key,
            nameKey: template.nameKey,
            type: template.type,
            target: enduranceTarget?.value || targetValue,
            targetLabel,
            setPlan: completionMode === 'sets' ? { sets, reps } : null,
            setProgress,
            phaseIndex: stageContext.stageIndex,
            phaseLabel: header,
            phaseName: label,
            phaseSummary: this.getStageSummary(goal, stageContext.stage, completionMode, difficulty),
            completionMode,
            loadFactor: rewardScale,
            manaReward: Math.max(1, Math.round((template.mana ?? template.manaReward ?? 1) * rewardScale)),
            goldReward: Math.max(1, Math.round((template.gold ?? template.goldReward ?? 1) * (rewardScale * 0.9 + 0.1))),
            completed: false,
            canComplete: completionMode === 'tap',
            bonusInfoSynced: true,
            equipmentHint: !!template.needsEquipment && hasEquipment !== false,
            source: template.source || (template.wgerId ? 'wger' : 'local'),
            wgerId: template.wgerId || null,
            nameDe: template.nameDe || null,
            nameEn: template.nameEn || null,
            descriptionDe: template.descriptionDe || null,
            descriptionEn: template.descriptionEn || null,
            customDisplayName: template.source === 'wger' ? (DQ_WGER.getDisplayName(template, this.getLang())) : null,
            customDescription: template.source === 'wger' ? DQ_WGER.getDescription(template, this.getLang()) : null,
            needsEquipment: !!template.needsEquipment,
            muscles: template.muscles || [],
            musclesSecondary: template.musclesSecondary || [],
            equipment: template.equipment || [],
            statPoints: template.statPoints || null,
            imageUrl: template.imageUrl || '',
            imageThumbSm: template.imageThumbSm || '',
            imageThumbMd: template.imageThumbMd || '',
            category: template.category || null,
            license: template.license || null,
            licenseUrl: template.licenseUrl || null,
            licenseAuthor: template.licenseAuthor || null,
            hasImage: template.hasImage || false,
            videos: template.videos || [],
            analytics: {
                ageBand: this.getAgeBand(DQ_CONFIG.userSettings?.age ?? null),
                stageIndex: stageContext.stageIndex,
                loadFactor: rewardScale
            }
        };

        // Spezifische Anpassungen fuer Ausdauer-Timer
        if (completionMode === 'timer') {
            const timerScale = (1 + 0.3 * (difficulty - 1));
            quest.target = Math.ceil(template.baseValue * timerScale);
            quest.type = 'time';
            quest.targetLabel = this.formatDuration(quest.target);
        }

        if (goal === 'endurance') {
            quest.targetSummary = {
                duration: stageContext.stage.duration || 20,
                distance: stageContext.stage.distance || 2,
                power: stageContext.stage.power || 4
            };
        }

        return quest;
    },

    async getTodayQuestSet(forceRegenerate = false) {
        const settings = DQ_CONFIG.userSettings || {};
        const goal = this.normalizeGoal(settings.goal || 'muscle');

        if (settings.planType === 'custom' && settings.customPlanId && typeof DQ_MANUAL_PLAN !== 'undefined') {
            try {
                const customPlan = await DQ_MANUAL_PLAN.getActivePlan(settings.customPlanId);
                if (customPlan) {
                    return await DQ_MANUAL_PLAN.getTodayQuestSet(customPlan, settings);
                }
                console.warn('Custom Plan nicht gefunden (id=' + settings.customPlanId + '), nutze predefined');
            } catch (e) {
                console.error('Custom Plan getTodayQuestSet error, nutze predefined:', e);
            }
        }

        if (goal === 'sick' || goal === 'restday') return { goal, quests: [], state: null, plan: null };

        const plan = this.getPlan(goal);
        const state = await this.getState(goal);
        const stageContext = this.getStageForState(plan, state);
        const hasEquipment = settings.hasEquipment !== false;
        const difficulty = settings.difficulty || 3;
        const recent = Array.isArray(state.recentExercises) ? state.recentExercises.slice(-10) : [];
        const todayStr = DQ_CONFIG.getTodayString();
        const questIds = [];
        const quests = [];

        for (let i = 0; i < 6; i++) {
            const slot = plan.slots[i] || plan.slots[plan.slots.length - 1];
            let template = null;
            if (this.isWgerSportGoal(goal)) {
                template = await this.pickWgerCandidate(slot, recent, hasEquipment, questIds, goal);
            }
            if (!template) {
                template = this.pickCandidate(slot, recent, hasEquipment, questIds, goal) || this.pickCandidate({ candidates: ['walk_30min', 'stretch_10min'] }, recent, hasEquipment, questIds, goal);
            }
            if (!template) continue;
            const quest = this.buildQuest(goal, plan, state, stageContext, slot, template, todayStr, i, difficulty, hasEquipment);
            questIds.push(quest.nameKey);
            recent.push(quest.nameKey);
            quests.push(quest);
        }

        state.recentExercises = recent.slice(-12);
        state.lastGeneratedDate = todayStr;
        state.lastStageIndex = stageContext.stageIndex;
        state.lastStageWeek = stageContext.stageWeek;
        state.updatedAt = Date.now();
        await this.saveState(state);

        return { goal, quests, state, plan, stageContext, questIds };
    },

    // Re-skaliert offene Quests: gleiche Übungen (nameKey), aber Parameter
    // (reps/duration/mana/gold/phase) werden mit aktueller Difficulty / neuem
    // stageContext neu berechnet. Erledigte Quests werden nie angetastet.
    async rescaleOpenQuests(openQuests, todayStr, opts = {}) {
        if (!Array.isArray(openQuests) || openQuests.length === 0) return [];
        const settings = DQ_CONFIG.userSettings || {};
        const difficulty = opts.difficulty != null ? opts.difficulty : (settings.difficulty || 3);
        const hasEquipment = settings.hasEquipment !== false;

        if (settings.planType === 'custom' && settings.customPlanId && typeof DQ_MANUAL_PLAN !== 'undefined') {
            try {
                await DQ_MANUAL_PLAN.rescaleOpenQuests(openQuests, todayStr, { difficulty });
                return openQuests;
            } catch (e) {
                console.error('Custom rescaleOpenQuests error:', e);
            }
        }

        const updated = [];

        for (const quest of openQuests) {
            const template = await this.getTemplateByNameKey(quest.nameKey);
            if (!template) { updated.push(quest); continue; }

            const goal = quest.goal || this.normalizeGoal(settings.goal || 'muscle');

            if (goal === 'restday' || goal === 'sick') {
                // Einfacher Pfad ohne Slot/Plan — Difficulty-Skalierung wie main.js
                let targetValue = template.baseValue;
                if (template.type !== 'check' && template.type !== 'link' && template.type !== 'focus') {
                    targetValue = Math.ceil(template.baseValue + (template.baseValue * 0.4 * (difficulty - 1)));
                }
                quest.target = targetValue;
                quest.manaReward = Math.ceil(template.mana * (1 + 0.2 * (difficulty - 1)));
                quest.goldReward = Math.ceil(template.gold * (1 + 0.15 * (difficulty - 1)));
                quest.bonusInfoSynced = true;
                updated.push(quest);
                continue;
            }

            const plan = this.getPlan(goal);
            const state = await this.getState(goal);
            const stageContext = opts.stageContext
                ? opts.stageContext
                : this.getStageForState(plan, state);
            const slot = plan.slots.find(s => s.key === quest.slotKey) || plan.slots[0];

            const rebuilt = this.buildQuest(goal, plan, state, stageContext, slot, template, todayStr, 0, difficulty, hasEquipment);

            quest.target = rebuilt.target;
            quest.targetLabel = rebuilt.targetLabel;
            quest.setPlan = rebuilt.setPlan;
            quest.phaseIndex = rebuilt.phaseIndex;
            quest.phaseLabel = rebuilt.phaseLabel;
            quest.phaseName = rebuilt.phaseName;
            quest.phaseSummary = rebuilt.phaseSummary;
            quest.loadFactor = rebuilt.loadFactor;
            quest.manaReward = rebuilt.manaReward;
            quest.goldReward = rebuilt.goldReward;
            quest.equipmentHint = rebuilt.equipmentHint;
            quest.bonusInfoSynced = true;
            if (quest.completionMode === 'sets' && Array.isArray(quest.setProgress) && quest.setPlan) {
                const newLen = quest.setPlan.sets || 1;
                while (quest.setProgress.length < newLen) quest.setProgress.push(false);
                if (quest.setProgress.length > newLen) quest.setProgress.length = newLen;
                quest.canComplete = quest.setProgress.length > 0 && quest.setProgress.every(Boolean);
            }

            updated.push(quest);
        }

        await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            updated.forEach(q => store.put(q));
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });

        return updated;
    },

    // Ersetzt gezielt unbrauchbare Quests (z.B. Hantel-Quests nach Equipment-Off)
    // durch nicht-Equipment-Alternativen aus dem gleichen Slot. Andere Quests und
    // erledigte Quests bleiben unangetastet.
    async regenerateSpecificQuests(questsToReplace, excludeNameKeys, todayStr) {
        if (!Array.isArray(questsToReplace) || questsToReplace.length === 0) return [];
        const settings = DQ_CONFIG.userSettings || {};
        const goal = this.normalizeGoal(settings.goal || 'muscle');
        const hasEquipment = settings.hasEquipment !== false;
        const difficulty = settings.difficulty || 3;
        const exclude = new Set(excludeNameKeys || []);
        const newQuests = [];

        if (goal === 'restday' || goal === 'sick') {
            const blockedSet = new Set(this.blockedQuestNameKeys || []);
            let pool = [...(DQ_DATA.exercisePool[goal] || DQ_DATA.exercisePool.restday || [])]
                .filter(ex => !blockedSet.has(ex.nameKey) && !exclude.has(ex.nameKey));
            if (!hasEquipment) pool = pool.filter(ex => !ex.needsEquipment);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            for (let i = 0; i < questsToReplace.length && i < pool.length; i++) {
                const t = pool[i];
                let targetValue = t.baseValue;
                if (t.type !== 'check' && t.type !== 'link' && t.type !== 'focus') {
                    targetValue = Math.ceil(t.baseValue + (t.baseValue * 0.4 * (difficulty - 1)));
                }
                newQuests.push({
                    questId: questsToReplace[i].questId,
                    date: todayStr, nameKey: t.nameKey, type: t.type, target: targetValue,
                    manaReward: Math.ceil(t.mana * (1 + 0.2 * (difficulty - 1))),
                    goldReward: Math.ceil(t.gold * (1 + 0.15 * (difficulty - 1))),
                    completed: false, goal: goal, completionMode: 'tap', setProgress: [],
                    bonusInfoSynced: true
                });
                exclude.add(t.nameKey);
            }
        } else {
            const plan = this.getPlan(goal);
            const state = await this.getState(goal);
            const stageContext = this.getStageForState(plan, state);
            const picked = [];
            for (const oldQuest of questsToReplace) {
                const slot = plan.slots.find(s => s.key === oldQuest.slotKey) || plan.slots[0];
                let template = null;
                if (this.isWgerSportGoal(goal)) {
                    template = await this.pickWgerCandidate(slot, state.recentExercises || [], hasEquipment, picked.concat([...exclude]), goal);
                }
                if (!template) {
                    template = this.pickCandidate(slot, state.recentExercises || [], hasEquipment, picked.concat([...exclude]), goal);
                }
                if (!template) { newQuests.push(oldQuest); continue; }
                const rebuilt = this.buildQuest(goal, plan, state, stageContext, slot, template, todayStr, 0, difficulty, hasEquipment);
                rebuilt.questId = oldQuest.questId;
                newQuests.push(rebuilt);
                picked.push(template.nameKey);
                exclude.add(template.nameKey);
            }
            state.recentExercises = (state.recentExercises || []).concat(picked).slice(-12);
            state.updatedAt = Date.now();
            await this.saveState(state);
        }

        await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            newQuests.forEach(q => store.put(q));
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });

        return newQuests;
    },

    formatQuestTarget(quest) {
        if (quest.completionMode === 'log' || quest.goal === 'endurance' || quest.targetSummary) {
            if (quest.targetLabel) return quest.targetLabel;
            const summary = quest.targetSummary || {};
            const duration = summary.duration || quest.target || 20;
            const distance = summary.distance || 0;
            if (quest.slotKey === 'distance') return `${distance.toFixed(1)} km`;
            return `${duration} min`;
        }

        if (quest.setPlan) {
            if (quest.type === 'time') return `${quest.setPlan.sets} ${this.t('sets_label', 'Sätze')} · ${quest.setPlan.reps} s`;
            return `${quest.setPlan.sets} ${this.t('sets_label', 'Sätze')} · ${quest.setPlan.reps} ${this.t('reps_label', 'Wdh.')}`;
        }

        if (quest.type === 'time') return `${quest.target} s`;
        if (quest.type === 'focus') return null;
        if (quest.type === 'check') return null;
        return `${quest.target} ${this.t('reps_label', 'Wdh.')}`;
    },

    getPhaseHeaderText(context) {
        if (!context) return '';
        const stageLabel = this.getStageLabel(context.stage);
        const phaseLabel = this.t('training_phase', 'Phase');
        return `${phaseLabel} ${context.stageIndex + 1} · ${stageLabel}`;
    },

    async applyPhaseAction(goal, action) {
        const settings = DQ_CONFIG.userSettings || {};

        if (settings.planType === 'custom' && settings.customPlanId && typeof DQ_MANUAL_PLAN !== 'undefined') {
            return;
        }

        const normalized = this.normalizeGoal(goal);
        const state = await this.getState(normalized);
        const plan = this.getPlan(normalized);
        const current = this.getStageForState(plan, state);

        if (action === 'skip') {
            state.manualWeekShift = (state.manualWeekShift || 0) + Math.max(1, current.stageWeeks);
        } else if (action === 'repeat') {
            state.manualWeekShift = (state.manualWeekShift || 0) - Math.max(1, current.stageWeeks);
        } else if (action === 'extend') {
            state.stageExtensions[current.stageIndex] = (state.stageExtensions[current.stageIndex] || 0) + 1;
        }

        state.updatedAt = Date.now();
        await this.saveState(state);
        return state;
    },

    async toggleSetProgress(questId, setIndex) {
        const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
        const store = tx.objectStore('daily_quests');
        return new Promise((resolve, reject) => {
            store.get(questId).onsuccess = e => {
                const quest = e.target.result;
                if (!quest || !Array.isArray(quest.setProgress)) {
                    resolve(null);
                    return;
                }

                quest.setProgress[setIndex] = !quest.setProgress[setIndex];
                quest.canComplete = quest.setProgress.every(Boolean);
                quest.completed = false;
                store.put(quest);
                tx.oncomplete = () => resolve(quest);
            };
            tx.onerror = ev => reject(ev.target.error);
        });
    },

    async advanceSetProgress(questId) {
        const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
        const store = tx.objectStore('daily_quests');
        return new Promise((resolve, reject) => {
            store.get(questId).onsuccess = e => {
                const quest = e.target.result;
                if (!quest || !Array.isArray(quest.setProgress) || !quest.setProgress.length) {
                    resolve(null);
                    return;
                }

                const nextIndex = quest.setProgress.findIndex(done => !done);
                if (nextIndex >= 0) {
                    quest.setProgress[nextIndex] = true;
                }

                quest.canComplete = quest.setProgress.every(Boolean);
                quest.completed = false;
                store.put(quest);
                tx.oncomplete = () => resolve(quest);
            };
            tx.onerror = ev => reject(ev.target.error);
        });
    },
    async saveEnduranceLog(questId, payload) {
        const tx = DQ_DB.db.transaction(['daily_quests', 'training_activity_log'], 'readwrite');
        const questStore = tx.objectStore('daily_quests');
        const logStore = tx.objectStore('training_activity_log');

        return new Promise((resolve, reject) => {
            questStore.get(questId).onsuccess = e => {
                const quest = e.target.result;
                if (!quest) {
                    resolve(null);
                    return;
                }

                quest.enduranceLog = payload;
                quest.canComplete = true;
                quest.analytics = {
                    ...(quest.analytics || {}),
                    ageBand: this.getAgeBand(payload.age),
                    enduranceScore: Math.round((payload.distance || 0) * 10 + (payload.duration || 0) * 4 + (payload.power || 0) * 6),
                    distance: payload.distance || 0,
                    duration: payload.duration || 0,
                    power: payload.power || 0
                };

                questStore.put(quest);
                logStore.put({
                    date: DQ_CONFIG.getTodayString(),
                    timestamp: Date.now(),
                    type: 'endurance_entry',
                    goal: quest.goal,
                    questId,
                    nameKey: quest.nameKey,
                    phaseIndex: quest.phaseIndex,
                    phaseLabel: quest.phaseLabel,
                    distance: payload.distance || 0,
                    duration: payload.duration || 0,
                    power: payload.power || 0,
                    notes: payload.notes || '',
                    age: payload.age || null,
                    ageBand: this.getAgeBand(payload.age),
                    analysis: {
                        enduranceScore: quest.analytics.enduranceScore,
                        distance: payload.distance || 0,
                        duration: payload.duration || 0,
                        power: payload.power || 0
                    }
                });
                if (typeof DQ_ANALYTICS !== 'undefined') {
                    DQ_ANALYTICS.logEnduranceEntry(payload.distance || 0, payload.duration || 0, payload.power || 0);
                }
                tx.oncomplete = () => {
                    if (typeof DQ_SUPABASE !== 'undefined') DQ_SUPABASE.triggerSync();
                    resolve(quest);
                };
            };
            tx.onerror = ev => reject(ev.target.error);
        });
    },

    async recordQuestActivity(quest, extras = {}) {
        const tx = DQ_DB.db.transaction(['training_activity_log'], 'readwrite');
        const store = tx.objectStore('training_activity_log');
        store.put({
            date: DQ_CONFIG.getTodayString(),
            timestamp: Date.now(),
            type: 'quest_completion',
            goal: quest.goal,
            questId: quest.questId,
            nameKey: quest.nameKey,
            phaseIndex: quest.phaseIndex,
            phaseLabel: quest.phaseLabel,
            completionMode: quest.completionMode,
            sets: quest.setPlan?.sets || 1,
            reps: quest.setPlan?.reps || quest.target || 1,
            target: quest.target,
            loadFactor: quest.loadFactor || 1,
            age: extras.age ?? null,
            ageBand: this.getAgeBand(extras.age)
        });
        return new Promise(resolve => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    }
};

try {
    window.DQ_TRAINING_SYSTEM = DQ_TRAINING_SYSTEM;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TRAINING_SYSTEM:', e);
}
