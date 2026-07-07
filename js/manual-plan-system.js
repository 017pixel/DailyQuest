/**
 * @file manual-plan-system.js
 * @description DQ_MANUAL_PLAN Modul - Verwaltet manuelle Trainingsplaene.
 * Zweck: Custom Pläne mit bis zu 30 ausgewählten Übungen, Randomizer für 6/Tag,
 *         Variety-Logik, wger-Auswahl, Rest-Day-Logik.
 * Verbindungen: Wird von DQ_TRAINING_SYSTEM.getTodayQuestSet() aufgerufen wenn
 *               planType === 'custom'. Arbeitet mit DQ_CONFIG zusammen.
 */

const DQ_MANUAL_PLAN = {
    STORE_NAME: 'custom_plans',
    STATE_STORE: 'training_plan_state',
    MAX_EXERCISES: 30,
    DAILY_QUEST_COUNT: 6,
    RESTDAY_QUEST_COUNT: 5,
    RECENT_HISTORY_SIZE: 10,
    VARIETY_PENALTY: 0.7,

    PRESETS: [
        { key: 'muscle', icon: 'fitness_center', nameKey: 'goal_preset_kraft', hintKey: 'goal_preset_kraft_hint' },
        { key: 'endurance', icon: 'directions_run', nameKey: 'goal_preset_ausdauer', hintKey: 'goal_preset_ausdauer_hint' },
        { key: 'fatloss', icon: 'local_fire_department', nameKey: 'goal_preset_abnehmen', hintKey: 'goal_preset_abnehmen_hint' },
        { key: 'calisthenics', icon: 'self_improvement', nameKey: 'goal_preset_calisthenics', hintKey: 'goal_preset_calisthenics_hint' }
    ],

    CATEGORY_TABS: [
        { key: 'all', labelKey: 'filter_all' },
        { key: 'Abs', labelKey: 'Abs' },
        { key: 'Arms', labelKey: 'Arms' },
        { key: 'Back', labelKey: 'Back' },
        { key: 'Calves', labelKey: 'Calves' },
        { key: 'Cardio', labelKey: 'Cardio' },
        { key: 'Chest', labelKey: 'Chest' },
        { key: 'Legs', labelKey: 'Legs' },
        { key: 'Shoulders', labelKey: 'Shoulders' },
        { key: 'learning', labelKey: 'filter_learning' },
        { key: 'restday', labelKey: 'filter_restday' }
    ],

    t(key, fallback = key) {
        const lang = (typeof DQ_CONFIG !== 'undefined' && DQ_CONFIG.userSettings.language) || 'de';
        return (typeof DQ_DATA !== 'undefined' && DQ_DATA.translations[lang] && DQ_DATA.translations[lang][key]) || fallback;
    },

    getExerciseDisplayName(nameKey) {
        const lang = (typeof DQ_CONFIG !== 'undefined' && DQ_CONFIG.userSettings.language) || 'de';
        if (typeof DQ_DATA !== 'undefined' && DQ_DATA.translations[lang] && DQ_DATA.translations[lang].exercise_names) {
            const name = DQ_DATA.translations[lang].exercise_names[nameKey];
            if (name) return name;
        }
        return nameKey;
    },

    getLegacyExerciseById(id) {
        const numeric = Number(id);
        const pool = (typeof DQ_DATA !== 'undefined' && DQ_DATA.exercisePool) ? DQ_DATA.exercisePool : {};
        return Object.values(pool).flat().find(ex => Number(ex.id) === numeric) || null;
    },

    getLegacyExerciseByNameKey(nameKey) {
        const pool = (typeof DQ_DATA !== 'undefined' && DQ_DATA.exercisePool) ? DQ_DATA.exercisePool : {};
        return Object.values(pool).flat().find(ex => ex.nameKey === nameKey) || null;
    },

    normalizeLegacyExercise(ex, category = null) {
        if (!ex) return null;
        return {
            ...ex,
            category: category || ex.category || 'legacy',
            source: ex.source || 'legacy_local',
            manaReward: ex.manaReward ?? ex.mana,
            goldReward: ex.goldReward ?? ex.gold
        };
    },

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    checkRestDay(restDays) {
        const numRestDays = parseInt(restDays, 10) || 0;
        if (numRestDays <= 0) return false;
        if (numRestDays >= 7) return true;

        const dayOfWeek = new Date().getDay();
        const patterns = {
            1: [0],
            2: [2, 6],
            3: [0, 2, 4],
            4: [0, 2, 4, 6],
            5: [0, 1, 3, 5, 6],
            6: [0, 1, 2, 4, 5, 6]
        };
        return (patterns[numRestDays] || []).includes(dayOfWeek);
    },

    getAllExercises() {
        if (typeof DQ_WGER !== 'undefined') {
            return DQ_WGER.getLocalExercises().filter(ex => !['senior', 'sick', 'general_workout'].includes(ex.category));
        }
        const pool = (typeof DQ_DATA !== 'undefined' && DQ_DATA.exercisePool) ? DQ_DATA.exercisePool : {};
        return ['learning', 'restday'].flatMap(category => (pool[category] || []).map(ex => ({ ...ex, category })));
    },

    async getSelectableExercises(category = 'all', filters = {}) {
        if (typeof DQ_WGER === 'undefined') return this.getAllExercises();
        const result = await DQ_WGER.queryExercises({
            category,
            search: filters.search || '',
            equipment: filters.equipment || 'all',
            muscle: filters.muscle || 'all',
            hasEquipment: DQ_CONFIG.userSettings.hasEquipment !== false,
            offset: 0,
            limit: 1000
        });
        return result.items.filter(ex => !['sick', 'senior', 'general_workout'].includes(ex.category));
    },

    async getExerciseById(id) {
        if (typeof DQ_WGER !== 'undefined') {
            const wger = await DQ_WGER.getById(id);
            if (wger) return wger;
        }
        const legacy = this.getLegacyExerciseById(id);
        if (legacy) return this.normalizeLegacyExercise(legacy);
        const all = this.getAllExercises();
        return all.find(ex => String(ex.id) === String(id)) || null;
    },

    async getExerciseByNameKey(nameKey) {
        if (typeof DQ_WGER !== 'undefined') {
            const wger = await DQ_WGER.getByNameKey(nameKey);
            if (wger) return wger;
        }
        const legacy = this.getLegacyExerciseByNameKey(nameKey);
        if (legacy) return this.normalizeLegacyExercise(legacy);
        const all = this.getAllExercises();
        return all.find(ex => ex.nameKey === nameKey) || null;
    },

    async getAllCustomExercises() {
        if (!DQ_DB.db?.objectStoreNames.contains('custom_user_exercises')) return [];
        return new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['custom_user_exercises'], 'readonly');
            const request = tx.objectStore('custom_user_exercises').getAll();
            request.onsuccess = () => resolve((request.result || []).map(ex => this.normalizeLegacyExercise(ex, 'user_created')));
            request.onerror = () => resolve([]);
        });
    },

    async saveCustomExercise(exercise) {
        throw new Error('Eigene Übungen wurden durch die wger-Datenbank ersetzt.');
    },

    async deleteCustomExercise(id) {
        return;
    },

    calculateMana(ex) {
        const base = Math.max(5, Math.round((ex.baseValue || 10) * 1.5));
        if (ex.type === 'time') return Math.max(15, base + 5);
        if (ex.type === 'check') return Math.max(10, base - 5);
        return base;
    },

    calculateGold(ex) {
        const base = Math.max(3, Math.round((ex.baseValue || 10) * 0.5));
        if (ex.needsEquipment) return base + 3;
        return base;
    },

    calculateStatPoints(ex) {
        if (ex.type === 'time') return { ausdauer: 1 };
        if (ex.type === 'check') return { willenskraft: 0.5 };
        if (ex.needsEquipment) return { kraft: 1 };
        return { kraft: 0.5, durchhaltevermoegen: 0.5 };
    },

    isExerciseAvailable(exercise, settings = DQ_CONFIG.userSettings || {}) {
        if (typeof DQ_TRAINING_SYSTEM !== 'undefined' && typeof DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment === 'function') {
            return DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment(exercise, settings);
        }
        return settings.hasEquipment !== false || !exercise?.needsEquipment;
    },

    async savePlan(name, exerciseIds) {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const record = {
                planName: name || 'Mein Plan',
                exerciseIds: exerciseIds.slice(0, this.MAX_EXERCISES),
                createdAt: Date.now(),
                isActive: false
            };
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getPlan(planId) {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const request = tx.objectStore(this.STORE_NAME).get(planId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    async getActivePlan(planId) {
        if (!planId) return null;
        return await this.getPlan(planId);
    },

    async setActivePlan(planId) {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const getAll = store.getAll();
            getAll.onsuccess = () => {
                (getAll.result || []).forEach(plan => {
                    plan.isActive = (plan.id === planId);
                    store.put(plan);
                });
            };
            getAll.onerror = () => reject(getAll.error);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getAllPlans() {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const request = tx.objectStore(this.STORE_NAME).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async clearAllPlans() {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const request = tx.objectStore(this.STORE_NAME).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getState(planId) {
        return new Promise((resolve, reject) => {
            const key = 'manual_' + planId;
            const tx = DQ_DB.db.transaction([this.STATE_STORE], 'readwrite');
            const store = tx.objectStore(this.STATE_STORE);
            const request = store.get(key);
            request.onsuccess = () => {
                if (!request.result) {
                    const newState = {
                        key: key,
                        startedAt: new Date().toISOString(),
                        lastGeneratedDate: null,
                        recentExercises: [],
                        updatedAt: Date.now()
                    };
                    store.add(newState);
                    resolve(newState);
                } else {
                    resolve(request.result);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    async saveState(state) {
        return new Promise((resolve, reject) => {
            state.updatedAt = Date.now();
            const tx = DQ_DB.db.transaction([this.STATE_STORE], 'readwrite');
            tx.objectStore(this.STATE_STORE).put(state);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async resolveExerciseById(id, customExercises) {
        const builtIn = await this.getExerciseById(id);
        if (builtIn) return builtIn;
        if (Array.isArray(customExercises)) {
            const custom = customExercises.find(ex => String(ex.id) === String(id));
            if (custom) return custom;
        }
        return null;
    },

    async resolveExerciseByNameKey(nameKey, customExercises) {
        const builtIn = await this.getExerciseByNameKey(nameKey);
        if (builtIn) return builtIn;
        if (Array.isArray(customExercises)) {
            const custom = customExercises.find(ex => ex.nameKey === nameKey);
            if (custom) return custom;
        }
        return null;
    },

    pickVarietyQuests(exercises, count, recentKeys) {
        if (!Array.isArray(exercises) || exercises.length === 0) return [];
        const targetCount = Math.max(1, count);
        if (exercises.length <= targetCount) {
            const shuffled = this.shuffle(exercises);
            const result = [];
            while (result.length < targetCount) {
                if (shuffled.length === 0) break;
                result.push(shuffled[result.length % shuffled.length]);
            }
            return result;
        }

        const VARIETY_THRESHOLD = 13;

        if (exercises.length <= VARIETY_THRESHOLD) {
            return this.shuffle(exercises).slice(0, targetCount);
        }

        const recentSet = new Set(recentKeys || []);
        const fresh = exercises.filter(ex => !recentSet.has(ex.nameKey));

        if (fresh.length >= targetCount) {
            const selected = this.shuffle(fresh).slice(0, targetCount);
            while (selected.length < targetCount) {
                const remaining = exercises.filter(ex => !selected.includes(ex));
                if (remaining.length === 0) break;
                selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
            }
            return selected;
        }

        const selected = [];
        const usedKeys = new Set();

        const scored = exercises.map(ex => ({
            ex,
            score: recentSet.has(ex.nameKey) ? 0.1 : 1.0
        })).sort((a, b) => b.score - a.score);

        while (selected.length < targetCount && usedKeys.size < exercises.length) {
            const remaining = scored.filter(s => !usedKeys.has(s.ex.nameKey));
            if (remaining.length === 0) break;
            const topScore = remaining[0].score;
            const best = remaining.filter(s => s.score === topScore);
            const pick = best[Math.floor(Math.random() * best.length)].ex;
            selected.push(pick);
            usedKeys.add(pick.nameKey);
        }

        return selected;
    },

    async getTodayQuestSet(customPlan, settings, skipRestDay = false) {
        const todayStr = DQ_CONFIG.getTodayString();
        const isRestDay = skipRestDay ? false : this.checkRestDay(settings.restDays);
        const difficulty = settings.difficulty || 3;
        const hasEquipment = settings.hasEquipment !== false;

        if (isRestDay) {
            return await this.buildRestDayQuestSet(todayStr, difficulty);
        }

        const customExercises = await this.getAllCustomExercises();
        const state = await this.getState(customPlan.id);
        const recent = Array.isArray(state.recentExercises) ? state.recentExercises.slice(-this.RECENT_HISTORY_SIZE) : [];

        let pool = (await Promise.all((customPlan.exerciseIds || [])
            .map(id => this.resolveExerciseById(id, customExercises))))
            .filter(ex => !!ex);

        pool = pool.filter(ex => this.isExerciseAvailable(ex, settings));

        if (pool.length === 0) {
            console.warn('Manual Plan: Keine Übungen im Pool, nutze Fallback');
            pool = this.getAllExercises().filter(ex => this.isExerciseAvailable(ex, settings)).slice(0, 10);
        }

        const exercises = this.pickVarietyQuests(pool, this.DAILY_QUEST_COUNT, recent);

        const quests = exercises.map((template, index) => {
            return this.buildQuest(template, todayStr, index, difficulty, hasEquipment);
        });

        state.recentExercises = exercises.map(ex => ex.nameKey).concat(recent).slice(-this.RECENT_HISTORY_SIZE);
        state.lastGeneratedDate = todayStr;
        await this.saveState(state);

        return {
            goal: 'custom',
            quests,
            state,
            plan: customPlan
        };
    },

    async buildRestDayQuestSet(todayStr, difficulty) {
        const restdayPool = (DQ_DATA.exercisePool.restday || []).slice();
        const blocked = (typeof DQ_TRAINING_SYSTEM !== 'undefined' && Array.isArray(DQ_TRAINING_SYSTEM.blockedQuestNameKeys)) ? DQ_TRAINING_SYSTEM.blockedQuestNameKeys : [];
        const blockedSet = new Set(blocked);
        let pool = restdayPool.filter(ex => !blockedSet.has(ex.nameKey));

        pool = this.shuffle(pool);
        const questCount = Math.min(this.RESTDAY_QUEST_COUNT, pool.length);
        const exercises = pool.slice(0, questCount);

        const quests = exercises.map((template, index) => {
            let targetValue = template.baseValue;
            if (template.type !== 'check' && template.type !== 'link' && template.type !== 'focus') {
                targetValue = Math.ceil(template.baseValue + (template.baseValue * 0.4 * (difficulty - 1)));
            }
            return {
                date: todayStr,
                goal: 'restday',
                slotKey: 'rest',
                nameKey: template.nameKey,
                type: template.type,
                target: targetValue,
                manaReward: Math.ceil(template.mana * (1 + 0.2 * (difficulty - 1))),
                goldReward: Math.ceil(template.gold * (1 + 0.15 * (difficulty - 1))),
                completed: false,
                completionMode: 'tap',
                setProgress: [],
                bonusInfoSynced: true,
                directStatGain: template.directStatGain || null,
                statPoints: template.statPoints || null,
                timerDuration: template.timerDuration || null,
                muscles: template.muscles || [],
                isCustom: false
            };
        });

        return {
            goal: 'restday',
            quests,
            state: null,
            plan: null
        };
    },

    buildQuest(template, todayStr, index, difficulty, hasEquipment) {
        const diffMultiplier = (typeof DQ_TRAINING_SYSTEM !== 'undefined')
            ? DQ_TRAINING_SYSTEM.getDifficultyMultiplier(difficulty)
            : { 1: 0.8, 2: 0.9, 3: 1, 4: 1.15, 5: 1.3 }[difficulty] || 1;

        let target = template.baseValue;
        if (template.type === 'reps') {
            target = Math.max(1, Math.round(template.baseValue * diffMultiplier));
        } else if (template.type === 'time') {
            target = Math.max(10, Math.round(template.baseValue * diffMultiplier));
        }

        const manaReward = Math.max(5, Math.round((template.mana ?? template.manaReward ?? 1) * (1 + 0.2 * (difficulty - 1))));
        const goldReward = Math.max(3, Math.round((template.gold ?? template.goldReward ?? 1) * (1 + 0.15 * (difficulty - 1))));

        let completionMode = 'tap';
        let setPlan = null;
        let setProgress = [];

        if (template.type === 'reps') {
            completionMode = 'sets';
            const sets = 3;
            setPlan = { sets: sets, reps: target };
            setProgress = new Array(sets).fill(false);
        } else if (template.type === 'time') {
            completionMode = 'timer';
        } else if (template.type === 'focus') {
            completionMode = 'timer';
        }

        return {
            date: todayStr,
            goal: 'custom',
            slotKey: 'custom',
            nameKey: template.nameKey,
            nameDe: template.nameDe || null,
            nameEn: template.nameEn || null,
            descriptionDe: template.descriptionDe || null,
            descriptionEn: template.descriptionEn || null,
            customDisplayName: template.displayName || (typeof DQ_WGER !== 'undefined' ? DQ_WGER.getDisplayName(template) : this.getExerciseDisplayName(template.nameKey)),
            customDescription: template.description || (typeof DQ_WGER !== 'undefined' ? DQ_WGER.getDescription(template) : ''),
            type: template.type,
            target: target,
            targetLabel: null,
            setPlan: setPlan,
            setProgress: setProgress,
            phaseIndex: 0,
            phaseLabel: '',
            phaseName: '',
            phaseSummary: '',
            completionMode: completionMode,
            loadFactor: 1,
            manaReward: manaReward,
            goldReward: goldReward,
            completed: false,
            canComplete: completionMode === 'tap',
            bonusInfoSynced: true,
            equipmentHint: !!template.needsEquipment && hasEquipment,
            needsEquipment: !!template.needsEquipment,
            requiredEquipment: template.requiredEquipment || [],
            statPoints: template.statPoints || null,
            directStatGain: template.directStatGain || null,
            timerDuration: template.timerDuration || null,
            muscles: template.muscles || [],
            musclesSecondary: template.musclesSecondary || [],
            equipment: template.equipment || [],
            source: template.source || (template.wgerId ? 'wger' : 'local'),
            wgerId: template.wgerId || null,
            imageUrl: template.imageUrl || '',
            imageThumbSm: template.imageThumbSm || '',
            imageThumbMd: template.imageThumbMd || '',
            category: template.category || null,
            license: template.license || null,
            licenseUrl: template.licenseUrl || null,
            licenseAuthor: template.licenseAuthor || null,
            hasImage: template.hasImage || false,
            videos: template.videos || [],
            isCustom: true
        };
    },

    async rescaleOpenQuests(openQuests, todayStr, opts = {}) {
        const settings = DQ_CONFIG.userSettings || {};
        const planId = settings.customPlanId;
        if (!planId) return;

        const plan = await this.getPlan(planId);
        if (!plan) return;

        const difficulty = opts.difficulty || settings.difficulty || 3;
        const hasEquipment = settings.hasEquipment !== false;
        const customExercises = await this.getAllCustomExercises();

        for (const quest of openQuests) {
            if (!quest.isCustom && quest.goal !== 'custom') continue;
            const template = await this.resolveExerciseByNameKey(quest.nameKey, customExercises);
            if (!template) continue;

            const rebuilt = this.buildQuest(template, todayStr, 0, difficulty, hasEquipment);
            quest.target = rebuilt.target;
            quest.setPlan = rebuilt.setPlan;
            quest.manaReward = rebuilt.manaReward;
            quest.goldReward = rebuilt.goldReward;
            quest.equipmentHint = rebuilt.equipmentHint;

            if (quest.completionMode === 'sets' && rebuilt.setPlan) {
                const oldLen = quest.setProgress ? quest.setProgress.length : 0;
                const newLen = rebuilt.setPlan.sets;
                if (oldLen !== newLen) {
                    quest.setProgress = new Array(newLen).fill(false);
                    quest.canComplete = false;
                }
            }
        }

        const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
        const store = tx.objectStore('daily_quests');
        openQuests.forEach(q => store.put(q));
        return new Promise(res => tx.oncomplete = res);
    },

    async migrateOldAiPlan() {
        const settings = DQ_CONFIG.userSettings || {};
        if (settings.planType === 'custom' && settings.customPlanId) {
            let isOldAi = true;
            const oldPlanId = settings.customPlanId;
            try {
                const plan = await this.getPlan(oldPlanId);
                if (plan && plan.exerciseIds && !plan.stages && !plan.prompt) {
                    isOldAi = false;
                }
            } catch (e) { /* Plan nicht lesbar → migriere sicherheitshalber */ }

            if (!isOldAi) return false;

            // Phase vom alten KI-Plan auf Muskelaufbau-Preset uebertragen
            try {
                const oldStateKey = 'custom_' + oldPlanId;
                const oldState = await new Promise((resolve, reject) => {
                    const tx = DQ_DB.db.transaction([this.STATE_STORE], 'readwrite');
                    const request = tx.objectStore(this.STATE_STORE).get(oldStateKey);
                    request.onsuccess = () => resolve(request.result || null);
                    request.onerror = () => reject(request.error);
                });

                if (oldState && oldState.startedAt) {
                    const muscleState = {
                        key: 'muscle',
                        goal: 'muscle',
                        startedAt: oldState.startedAt,
                        manualWeekShift: 0,
                        stageExtensions: {},
                        recentExercises: [],
                        updatedAt: Date.now()
                    };
                    await new Promise((resolve, reject) => {
                        const tx = DQ_DB.db.transaction([this.STATE_STORE], 'readwrite');
                        tx.objectStore(this.STATE_STORE).put(muscleState);
                        tx.oncomplete = resolve;
                        tx.onerror = reject;
                    });
                }
            } catch (e) {
                console.warn('migrateOldAiPlan: Phase konnte nicht uebertragen werden:', e);
            }

            settings.planType = 'predefined';
            settings.goal = 'muscle';
            settings.customPlanId = null;
            settings.customPlanExerciseIds = null;

            await this.clearAllPlans();

            return new Promise(resolve => {
                const tx = DQ_DB.db.transaction(['settings'], 'readwrite');
                tx.objectStore('settings').put(settings);
                tx.oncomplete = () => {
                    if (typeof DQ_SUPABASE !== 'undefined') DQ_SUPABASE.triggerSync();
                    resolve(true);
                };
                tx.onerror = () => resolve(false);
            });
        }
        return false;
    }
};

if (typeof window !== 'undefined') {
    window.DQ_MANUAL_PLAN = DQ_MANUAL_PLAN;
}
