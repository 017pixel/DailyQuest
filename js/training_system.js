const DQ_TRAINING_SYSTEM = {
    todayCache: null,

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
        if (completionMode === 'log') {
            const distance = typeof stage.distance === 'number' ? stage.distance.toFixed(1) : '0.0';
            return `${distance} km · ${stage.duration || 0} min · ${this.t('power', 'Power')} ${stage.power || 0}`;
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
        if (quest.completionMode === 'log') return this.t('endurance_entry_button', 'Eintragen');
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

    pickCandidate(slot, recentExerciseKeys, hasEquipment) {
        const goalExercises = Object.values(DQ_DATA.exercisePool).flat();
        const candidates = (slot.candidates || [])
            .map(nameKey => goalExercises.find(ex => ex.nameKey === nameKey))
            .filter(Boolean);
        const filtered = candidates.filter(ex => hasEquipment !== false || !ex.needsEquipment);
        const pool = hasEquipment === false
            ? (filtered.length > 0 ? filtered : goalExercises.filter(ex => !ex.needsEquipment))
            : (filtered.length > 0 ? filtered : candidates);
        if (pool.length === 0) return null;

        const scored = pool.map(ex => {
            let score = 1;
            if (recentExerciseKeys.includes(ex.nameKey)) score -= 0.7;
            if (ex.needsEquipment && hasEquipment === false) score -= 0.5;
            return { ex, score };
        }).sort((a, b) => b.score - a.score);

        const topScore = scored[0].score;
        const best = scored.filter(item => item.score === topScore);
        return best[Math.floor(Math.random() * best.length)].ex;
    },

    getTargetValue(template, stage) {
        if (stage?.targetDuration) return stage.targetDuration;
        if (template.type === 'time') {
            const seconds = Math.max(20, Math.round((stage.reps || 1) * 6));
            return seconds;
        }
        if (template.type === 'check' || template.type === 'focus') return 1;
        return stage.reps || template.baseValue || 1;
    },

    getCompletionMode(goal, template) {
        const plan = this.getPlan(goal);
        if (plan?.completionMode) return plan.completionMode;
        if (template.type === 'focus') return 'tap';
        if (template.type === 'check') return 'tap';
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
        const sets = completionMode === 'sets' ? Math.max(1, stageContext.stage.sets || 1) : 1;
        const reps = completionMode === 'sets'
            ? this.scaleReps(stageContext.stage.reps || template.baseValue || 1, difficulty)
            : targetValue;
        const setProgress = completionMode === 'sets' ? Array.from({ length: sets }, () => false) : [];
        const loadFactor = this.getLoadFactor(goal, stageContext.stage, template);
        const rewardScale = Math.max(0.8, Math.min(3, loadFactor * (1 + (difficulty - 3) * 0.08)));
        const label = this.getStageLabel(stageContext.stage);
        const header = this.getPhaseHeaderText(stageContext);

        const quest = {
            date: todayStr,
            goal,
            slotKey: slot.key,
            nameKey: template.nameKey,
            type: completionMode === 'log' ? 'log' : template.type,
            target: targetValue,
            setPlan: completionMode === 'sets' ? { sets, reps } : null,
            setProgress,
            phaseIndex: stageContext.stageIndex,
            phaseLabel: header,
            phaseName: label,
            phaseSummary: this.getStageSummary(goal, stageContext.stage, completionMode, difficulty),
            completionMode,
            loadFactor: rewardScale,
            manaReward: Math.max(1, Math.round(template.mana * rewardScale)),
            goldReward: Math.max(1, Math.round(template.gold * (rewardScale * 0.9 + 0.1))),
            completed: false,
            canComplete: completionMode === 'tap',
            bonusInfoSynced: true,
            equipmentHint: !!template.needsEquipment && hasEquipment !== false,
            analytics: {
                ageBand: this.getAgeBand(DQ_CONFIG.userSettings?.age ?? null),
                stageIndex: stageContext.stageIndex,
                loadFactor: rewardScale
            }
        };

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
            const template = this.pickCandidate(slot, recent, hasEquipment) || this.pickCandidate({ candidates: ['walk_30min', 'stretch_10min'] }, recent, hasEquipment);
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

    formatQuestTarget(quest) {
        if (quest.completionMode === 'log') {
            const summary = quest.targetSummary || {};
            const duration = summary.duration || quest.target || 20;
            const distance = summary.distance || 0;
            const power = summary.power || 0;
            return `${distance.toFixed(1)} km · ${duration} min · ${this.t('power', 'Power')} ${power}`;
        }

        if (quest.setPlan) {
            return `${quest.setPlan.sets} ${this.t('sets_label', 'Sätze')} · ${quest.setPlan.reps} ${this.t('reps_label', 'Wdh.')}`;
        }

        if (quest.type === 'time') return `${quest.target} s`;
        if (quest.type === 'focus') return `${quest.target} min`;
        if (quest.type === 'check') return 'Check';
        return `${quest.target} ${this.t('reps_label', 'Wdh.')}`;
    },

    getPhaseHeaderText(context) {
        if (!context) return '';
        const stageLabel = this.getStageLabel(context.stage);
        const phaseLabel = this.t('training_phase', 'Phase');
        return `${phaseLabel} ${context.stageIndex + 1} · ${stageLabel}`;
    },

    async applyPhaseAction(goal, action) {
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
                tx.oncomplete = () => resolve(quest);
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

