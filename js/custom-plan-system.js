/**
 * @file custom-plan-system.js
 * @description DQ_CUSTOM_PLAN Modul - Verwaltet KI-generierte Trainingsplne.
 * Zweck: Custom Plans in IndexedDB speichern, Balancing-Algorithmus fuer 6/Tag,
 *         Stage-Progression, Quest-Building fuer Custom Plans.
 * Verbindungen: Wird von DQ_TRAINING_SYSTEM.getTodayQuestSet() aufgerufen wenn
 *               planType === 'custom'. Arbeitet mit DQ_MISTRAL zusammen.
 */

const DQ_CUSTOM_PLAN = {
    STORE_NAME: 'custom_plans',
    STATE_STORE: 'training_plan_state',
    PRIORITY_TAGS: ['push', 'pull', 'legs', 'core', 'cardio', 'full_body', 'mobility'],
    CUSTOM_REWARD_MULTIPLIER: 12,

    prettifyNameKey(nameKey) {
        const raw = String(nameKey || '')
            .replace(/^custom_ai_(rest_)?fill_\d+$/i, '')
            .replace(/^custom_+/i, '')
            .replace(/_\d+$/g, '')
            .trim();
        if (!raw) return '';

        const known = {
            standing_calf_raises: 'Wadenheben stehend',
            calf_raises: 'Wadenheben',
            standing_side_bends: 'Seitbeugen stehend',
            progressive_walking: 'Zuegiges Gehen',
            standing_arm_raises: 'Armheben stehend',
            standing_bicycle_crunch: 'Bicycle Crunches stehend',
            hamstring_curls: 'Beinbeuger-Curls',
            standing_hamstring_curls: 'Beinbeuger-Curls stehend',
            active_recovery: 'Aktive Erholung'
        };
        if (known[raw]) return known[raw];

        return raw
            .split('_')
            .filter(Boolean)
            .map(part => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    },

    isPlaceholderExercise(ex) {
        if (!ex || typeof ex !== 'object') return true;
        const key = String(ex.nameKey || '');
        if (!key || /^custom_ai_(rest_)?fill_\d+$/i.test(key)) return true;
        const display = String(ex.displayName || '').trim().toLowerCase();
        const desc = String(ex.description || '').trim().toLowerCase();
        return (!display || display === key.toLowerCase() || /^custom_/.test(display) || display.startsWith('bonus-uebung') || display.startsWith('uebung '))
            && (!desc || desc === 'ki-generierte uebung' || desc === 'bonus');
    },

    normalizeExercise(ex) {
        if (!ex || typeof ex !== 'object') return null;
        if (/^custom_ai_(rest_)?fill_\d+$/i.test(String(ex.nameKey || ''))) return null;

        const normalized = { ...ex };
        if (!normalized.nameKey) return null;
        const pretty = this.prettifyNameKey(normalized.nameKey);
        const badDisplay = !normalized.displayName ||
            normalized.displayName === normalized.nameKey ||
            /^custom_/.test(String(normalized.displayName).toLowerCase()) ||
            /^custom_/.test(String(normalized.nameKey).toLowerCase()) && String(normalized.displayName).includes('_');
        if (badDisplay && pretty) normalized.displayName = pretty;
        if (!normalized.description || String(normalized.description).trim().length < 8 || String(normalized.description).toLowerCase() === 'ki-generierte uebung') {
            normalized.description = normalized.isRest
                ? `Beginne locker, bewege dich ruhig durch ${normalized.displayName || 'Erholung'} und halte die Intensitaet niedrig. Atme gleichmaessig und stoppe bei Schmerz.`
                : `Starte stabil, fuehre ${normalized.displayName || 'Training'} langsam und kontrolliert aus und halte die Koerperspannung. Achte auf saubere Technik statt Tempo.`;
        }
        return normalized;
    },

    createSafetyFallbackExercises() {
        const suffix = Date.now().toString(36);
        return [
            { nameKey: `custom_bodyweight_push_${suffix}`, displayName: 'Liegestuetze', description: 'Starte im hohen Stuetz, senke den Brustkorb kontrolliert Richtung Boden und druecke dich mit Spannung wieder hoch.', type: 'reps', baseValue: 8, tags: ['push', 'core'], isRest: false, needsEquipment: false, muscles: ['chest', 'triceps'], statPoints: { kraft: 1 }, mana: 25, gold: 10 },
            { nameKey: `custom_bodyweight_legs_${suffix}`, displayName: 'Kniebeugen', description: 'Stelle die Fuesse etwa hueftbreit, schiebe die Huefte nach hinten und richte dich mit stabilen Knien wieder auf.', type: 'reps', baseValue: 12, tags: ['legs', 'core'], isRest: false, needsEquipment: false, muscles: ['quads', 'glutes'], statPoints: { kraft: 1 }, mana: 25, gold: 10 },
            { nameKey: `custom_bodyweight_core_${suffix}`, displayName: 'Plank', description: 'Stuetz dich auf Unterarme und Zehen, halte den Koerper gerade und spanne Bauch und Gesäß aktiv an.', type: 'time', baseValue: 25, tags: ['core'], isRest: false, needsEquipment: false, muscles: ['core'], statPoints: { durchhaltevermoegen: 1 }, mana: 22, gold: 9 },
            { nameKey: `custom_bodyweight_cardio_${suffix}`, displayName: 'Kniehebelauf', description: 'Laufe auf der Stelle, ziehe die Knie abwechselnd hoch und halte Oberkoerper sowie Atmung kontrolliert.', type: 'time', baseValue: 30, tags: ['cardio', 'legs'], isRest: false, needsEquipment: false, muscles: ['quads', 'core'], statPoints: { ausdauer: 1 }, mana: 24, gold: 10 },
            { nameKey: `custom_bodyweight_pull_${suffix}`, displayName: 'Reverse Flys ohne Gewicht', description: 'Beuge dich leicht vor, fuehre die Arme seitlich nach hinten und ziehe die Schulterblaetter kontrolliert zusammen.', type: 'reps', baseValue: 12, tags: ['pull'], isRest: false, needsEquipment: false, muscles: ['back', 'shoulders'], statPoints: { kraft: 1 }, mana: 22, gold: 9 },
            { nameKey: `custom_bodyweight_full_${suffix}`, displayName: 'Mountain Climbers', description: 'Starte im hohen Stuetz und ziehe die Knie abwechselnd Richtung Brust, ohne die Huefte stark anzuheben.', type: 'time', baseValue: 30, tags: ['full_body', 'cardio'], isRest: false, needsEquipment: false, muscles: ['core', 'shoulders'], statPoints: { ausdauer: 1 }, mana: 28, gold: 12 },
            { nameKey: `custom_bodyweight_rest_${suffix}_1`, displayName: 'Aktive Erholung', description: 'Gehe locker umher, kreise Schultern und Huefte sanft und halte die Belastung bewusst niedrig.', type: 'check', baseValue: 1, tags: ['rest', 'mobility'], isRest: true, needsEquipment: false, muscles: ['general'], statPoints: { beweglichkeit: 1 }, mana: 15, gold: 6 },
            { nameKey: `custom_bodyweight_rest_${suffix}_2`, displayName: 'Lockerer Spaziergang', description: 'Gehe entspannt in leichtem Tempo, halte die Schultern locker und atme ruhig durch die Nase.', type: 'time', baseValue: 600, tags: ['rest', 'cardio'], isRest: true, needsEquipment: false, muscles: ['general'], statPoints: { durchhaltevermoegen: 1 }, mana: 18, gold: 7 },
            { nameKey: `custom_bodyweight_rest_${suffix}_3`, displayName: 'Atemfokus', description: 'Setze dich ruhig hin, atme langsam ein und aus und entspanne Schultern, Kiefer und Nacken bewusst.', type: 'check', baseValue: 1, tags: ['rest', 'mobility'], isRest: true, needsEquipment: false, muscles: ['general'], statPoints: { willenskraft: 1 }, mana: 15, gold: 6 },
            { nameKey: `custom_bodyweight_rest_${suffix}_4`, displayName: 'Sanftes Dehnen', description: 'Dehne Beine, Ruecken und Schultern langsam ohne Federn und bleibe in einem angenehmen Bereich.', type: 'time', baseValue: 300, tags: ['rest', 'mobility'], isRest: true, needsEquipment: false, muscles: ['general'], statPoints: { beweglichkeit: 1 }, mana: 18, gold: 7 },
            { nameKey: `custom_bodyweight_rest_${suffix}_5`, displayName: 'Regeneration Check', description: 'Pruefe kurz Schlaf, Energie und Muskelkater und entscheide bewusst, heute locker zu bleiben.', type: 'check', baseValue: 1, tags: ['rest'], isRest: true, needsEquipment: false, muscles: ['general'], statPoints: { willenskraft: 1 }, mana: 15, gold: 6 }
        ];
    },

    normalizeExercises(exercises) {
        if (!Array.isArray(exercises)) return [];
        return exercises
            .map(ex => this.normalizeExercise(ex))
            .filter(ex => ex && !this.isPlaceholderExercise(ex));
    },

    /**
     * Speichert einen Plan in IndexedDB.
     * @param {object} plan - Der validierte Plan aus Mistral
     * @param {string} prompt - Originaler User-Prompt
     * @returns {Promise<number>} - ID des gespeicherten Plans
     */
    savePlan(plan, prompt = '') {
        return new Promise((resolve, reject) => {
            const exercises = this.normalizeExercises(plan.exercises);
            const record = {
                planName: plan.planName,
                planDescription: plan.planDescription,
                exercises,
                stages: plan.stages,
                prompt: prompt,
                createdAt: Date.now(),
                isActive: false
            };
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Holt einen Plan by ID.
     */
    getPlan(planId) {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const request = tx.objectStore(this.STORE_NAME).get(planId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Holt den aktiven Plan.
     */
    async getActivePlan(planId) {
        if (!planId) return null;
        return await this.getPlan(planId);
    },

    /**
     * Setzt einen Plan als aktiv (deaktiviert alle anderen).
     */
    setActivePlan(planId) {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const getAll = store.getAll();
            getAll.onsuccess = () => {
                const plans = getAll.result || [];
                plans.forEach(plan => {
                    if (plan.id === planId) {
                        plan.isActive = true;
                    } else {
                        plan.isActive = false;
                    }
                    store.put(plan);
                });
            };
            getAll.onerror = () => reject(getAll.error);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    /**
     * Holt alle gespeicherten Plne.
     */
    getAllPlans() {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readonly');
            const request = tx.objectStore(this.STORE_NAME).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Loescht alle Custom Plne (fuer Reset).
     */
    clearAllPlans() {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction([this.STORE_NAME], 'readwrite');
            const request = tx.objectStore(this.STORE_NAME).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Prueft ob heute ein Rest Day ist (Wochentag-Logik).
     * Bug I Fix: Deckt jetzt 0-7 Rest Days ab (vorher nur 0-3, alle anderen
     * Werte fuehrten zu leerem activeRestDays -> niemals Rest Day erkannt).
     */
    checkRestDay(restDays) {
        const numRestDays = parseInt(restDays, 10) || 0;
        if (numRestDays <= 0) return false;
        if (numRestDays >= 7) return true;

        const dayOfWeek = new Date().getDay();
        // Verteilungsmuster: Ruhetage moeglichst gleichmaessig ueber die Woche.
        // main.js nutzt dieselbe Logik - hier dupliziert, um keine Cross-Modul-Imports zu erzwingen.
        const patterns = {
            1: [0],          // So
            2: [2, 6],       // Mi, Sa  (kompatibel mit main.js Default)
            3: [0, 2, 4],    // So, Mi, Fr
            4: [0, 2, 4, 6], // So, Mi, Fr, Sa
            5: [0, 1, 3, 5, 6], // So, Mo, Do, Sa
            6: [0, 1, 2, 4, 5, 6] // So, Mo, Di, Fr, Sa
        };
        return (patterns[numRestDays] || []).includes(dayOfWeek);
    },

    /**
     * Waehlt 6 balancierte Ubungen aus 30 getaggten.
     * @param {array} exercises - 30 Ubungen mit tags
     * @param {number} count - Gewuenschte Anzahl (default 6, Rest Day 5)
     * @param {boolean} isRestDay
     * @param {array} recentKeys - kuerzlich verwendete nameKeys (fuer Variety)
     * @returns {array} - Ausgewaehlte Ubungen
     */
    pickBalancedQuests(exercises, count = 6, isRestDay = false, recentKeys = []) {
        let pool = isRestDay
            ? exercises.filter(ex => ex && ex.isRest === true)
            : exercises.filter(ex => ex && ex.isRest !== true);

        if (pool.length === 0) {
            console.warn('Keine Ubungen im Pool fuer isRestDay=' + isRestDay);
            return [];
        }

        // Wenn der Pool kleiner ist als die gewuenschte Anzahl, liefern wir
        // vorhandene Uebungen mehrfach zurueck statt weniger.
        const targetCount = Math.max(1, count);
        if (pool.length < targetCount) {
            const out = this.shuffle(pool);
            while (out.length < targetCount) {
                out.push(pool[Math.floor(Math.random() * pool.length)]);
            }
            return out;
        }

        if (isRestDay) {
            return this.shuffle(pool).slice(0, Math.min(targetCount, pool.length));
        }

        const byTag = {};
        pool.forEach(ex => {
            const tag = (ex.tags && ex.tags[0]) || 'full_body';
            if (!byTag[tag]) byTag[tag] = [];
            byTag[tag].push(ex);
        });

        const selected = [];
        const usedKeys = new Set();

        for (const tag of this.PRIORITY_TAGS) {
            if (selected.length >= count) break;
            const candidates = (byTag[tag] || []).filter(ex => !usedKeys.has(ex.nameKey));
            if (candidates.length > 0) {
                const scored = candidates.map(ex => ({
                    ex,
                    score: recentKeys.includes(ex.nameKey) ? 0.3 : 1.0
                })).sort((a, b) => b.score - a.score);
                const topScore = scored[0].score;
                const best = scored.filter(s => s.score === topScore);
                const pick = best[Math.floor(Math.random() * best.length)].ex;
                selected.push(pick);
                usedKeys.add(pick.nameKey);
            }
        }

        while (selected.length < count && usedKeys.size < pool.length) {
            const remaining = pool.filter(ex => !usedKeys.has(ex.nameKey));
            if (remaining.length === 0) break;
            const scored = remaining.map(ex => ({
                ex,
                score: recentKeys.includes(ex.nameKey) ? 0.3 : 1.0
            })).sort((a, b) => b.score - a.score);
            const topScore = scored[0].score;
            const best = scored.filter(s => s.score === topScore);
            const pick = best[Math.floor(Math.random() * best.length)].ex;
            selected.push(pick);
            usedKeys.add(pick.nameKey);
        }

        return selected;
    },

    /**
     * Filtert Custom-Plan-Uebungen passend zur Equipment-Einstellung und haelt
     * Rest-Day-Uebungen erhalten. Wenn ein alter KI-Plan zu wenig Bodyweight-
     * Material hat, werden sichere Fallbacks injiziert statt Equipment-Quests
     * auszugeben.
     */
    getAvailableExercises(exercises, hasEquipment) {
        exercises = this.normalizeExercises(exercises);
        if (!Array.isArray(exercises)) return [];
        const filtered = hasEquipment !== false
            ? exercises
            : exercises.filter(ex => ex && ex.needsEquipment !== true);
        const fallback = this.createSafetyFallbackExercises();
        const trainingCount = filtered.filter(ex => ex.isRest !== true).length;
        const restCount = filtered.filter(ex => ex.isRest === true).length;
        const neededTraining = Math.max(0, 6 - trainingCount);
        const neededRest = Math.max(0, 4 - restCount);

        return filtered
            .concat(fallback.filter(ex => ex.isRest !== true).slice(0, neededTraining))
            .concat(fallback.filter(ex => ex.isRest === true).slice(0, neededRest));
    },

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    /**
     * Holt oder erstellt den State fuer einen Custom Plan.
     */
    async getState(planId) {
        return new Promise((resolve, reject) => {
            const key = 'custom_' + planId;
            const tx = DQ_DB.db.transaction([this.STATE_STORE], 'readwrite');
            const store = tx.objectStore(this.STATE_STORE);
            const request = store.get(key);
            request.onsuccess = () => {
                if (!request.result) {
                    const newState = {
                        key: key,
                        startedAt: new Date().toISOString(),
                        lastGeneratedDate: null,
                        lastStageIndex: 0,
                        lastStageWeek: 0,
                        recentExercises: [],
                        manualWeekShift: 0,
                        stageExtensions: {},
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

    saveState(state) {
        return new Promise((resolve, reject) => {
            state.updatedAt = Date.now();
            const tx = DQ_DB.db.transaction([this.STATE_STORE], 'readwrite');
            tx.objectStore(this.STATE_STORE).put(state);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    /**
     * Berechnet die aktuelle Stage basierend auf Wochen seit Start.
     */
    getStageForState(stages, state) {
        const baseWeek = this.getWeekOffset(state.startedAt);
        const shiftedWeek = Math.max(0, baseWeek + (state.manualWeekShift || 0));
        let remaining = shiftedWeek;
        let stageIndex = stages.length - 1;
        let stageWeek = 0;

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const extension = (state.stageExtensions && state.stageExtensions[i]) || 0;
            const weeks = Math.max(1, (stage.weeks || 1) + extension);
            if (remaining < weeks) {
                stageIndex = i;
                stageWeek = remaining;
                break;
            }
            remaining -= weeks;
        }

        const stage = stages[stageIndex];
        const stageWeeks = Math.max(1, (stage.weeks || 1) + ((state.stageExtensions && state.stageExtensions[stageIndex]) || 0));
        const progress = stageWeek / stageWeeks;

        return { stageIndex, stage, stageWeek, stageWeeks, progress, shiftedWeek };
    },

    getWeekOffset(startedAt) {
        if (!startedAt) return 0;
        const start = new Date(startedAt);
        const now = new Date();
        const diffMs = now - start;
        return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    },

    /**
     * Hauptfunktion: Generiert die heutigen Quests aus einem Custom Plan.
     */
    async getTodayQuestSet(customPlan, settings) {
        const todayStr = DQ_CONFIG.getTodayString();
        const isRestDay = this.checkRestDay(settings.restDays);
        const difficulty = settings.difficulty || 3;
        const hasEquipment = settings.hasEquipment !== false;

        const state = await this.getState(customPlan.id);
        const stageContext = this.getStageForState(customPlan.stages, state);
        const recent = Array.isArray(state.recentExercises) ? state.recentExercises.slice(-12) : [];

        const questCount = isRestDay ? 5 : 6;
        const availableExercises = this.getAvailableExercises(customPlan.exercises, hasEquipment);
        const exercises = this.pickBalancedQuests(
            availableExercises, questCount, isRestDay, recent
        );

        const quests = exercises.map((template, index) => {
            return this.buildCustomQuest(
                customPlan, template, stageContext,
                todayStr, index, difficulty, hasEquipment
            );
        });

        state.recentExercises = exercises.map(ex => ex.nameKey).concat(recent).slice(-12);
        state.lastGeneratedDate = todayStr;
        state.lastStageIndex = stageContext.stageIndex;
        state.lastStageWeek = stageContext.stageWeek;
        await this.saveState(state);

        return {
            goal: 'custom',
            quests,
            state,
            plan: customPlan,
            stageContext
        };
    },

    /**
     * Baut ein Quest-Objekt aus einer Custom-Plan Ubung.
     */
    buildCustomQuest(customPlan, template, stageContext, todayStr, index, difficulty, hasEquipment) {
        const stage = stageContext.stage;
        const diffMultiplier = DQ_TRAINING_SYSTEM.getDifficultyMultiplier(difficulty);

        let target = template.baseValue;
        if (template.type === 'reps') {
            target = Math.max(1, Math.round(template.baseValue * diffMultiplier));
        } else if (template.type === 'time') {
            target = Math.max(10, Math.round(template.baseValue * diffMultiplier));
        }

        const sets = stage.sets || 1;
        const reps = stage.reps || template.baseValue || 1;
        const base = 2 * 8;
        const loadFactor = Math.max(0.7, Math.min(2.5, (sets * reps) / base));
        const rewardScale = Math.max(0.8, Math.min(3, loadFactor * (1 + (difficulty - 3) * 0.08)));
        const customRewardScale = rewardScale * this.CUSTOM_REWARD_MULTIPLIER;

        const manaReward = Math.max(20, Math.round(template.mana * customRewardScale));
        const goldReward = Math.max(10, Math.round(template.gold * (customRewardScale * 0.9 + 0.1)));

        let completionMode = 'tap';
        let setPlan = null;
        let setProgress = [];

        if (template.type === 'reps') {
            completionMode = 'sets';
            setPlan = { sets: sets, reps: target };
            setProgress = new Array(sets).fill(false);
        } else if (template.type === 'time') {
            completionMode = 'timer';
        } else if (template.type === 'focus') {
            completionMode = 'timer';
        }

        const stageLabel = stage.label || ('Phase ' + (stageContext.stageIndex + 1));
        const phaseSummary = `${sets} Saetze \u00b7 ${reps} Wdh.`;

        return {
            date: todayStr,
            goal: 'custom',
            slotKey: (template.tags && template.tags[0]) || 'full_body',
            nameKey: template.nameKey,
            customDisplayName: template.displayName,
            customDescription: template.description,
            type: template.type,
            target: target,
            targetLabel: null,
            setPlan: setPlan,
            setProgress: setProgress,
            phaseIndex: stageContext.stageIndex,
            phaseLabel: `Phase ${stageContext.stageIndex + 1} \u00b7 ${stageLabel}`,
            phaseName: stageLabel,
            phaseSummary: phaseSummary,
            completionMode: completionMode,
            loadFactor: loadFactor,
            manaReward: manaReward,
            goldReward: goldReward,
            completed: false,
            canComplete: completionMode === 'tap',
            bonusInfoSynced: true,
            equipmentHint: !!template.needsEquipment && hasEquipment,
            needsEquipment: !!template.needsEquipment,
            statPoints: template.statPoints || null,
            directStatGain: template.directStatGain || null,
            timerDuration: template.timerDuration || null,
            muscles: template.muscles || [],
            isCustom: true
        };
    },

    /**
     * Reskaliert offene Custom-Plan Quests (bei Difficulty-Aenderung).
     */
    async rescaleOpenQuests(openQuests, todayStr, opts = {}) {
        const settings = DQ_CONFIG.userSettings || {};
        const planId = settings.customPlanId;
        if (!planId) return;

        const plan = await this.getPlan(planId);
        if (!plan) return;

        const difficulty = opts.difficulty || settings.difficulty || 3;
        const state = await this.getState(planId);
        const stageContext = this.getStageForState(plan.stages, state);

        for (const quest of openQuests) {
            if (!quest.isCustom) continue;
            const template = plan.exercises.find(ex => ex.nameKey === quest.nameKey);
            if (!template) continue;

            const rebuilt = this.buildCustomQuest(
                plan, template, stageContext, todayStr, 0, difficulty,
                settings.hasEquipment !== false
            );

            quest.target = rebuilt.target;
            quest.setPlan = rebuilt.setPlan;
            quest.phaseIndex = rebuilt.phaseIndex;
            quest.phaseLabel = rebuilt.phaseLabel;
            quest.phaseName = rebuilt.phaseName;
            quest.phaseSummary = rebuilt.phaseSummary;
            quest.loadFactor = rebuilt.loadFactor;
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

    /**
     * Wendet Phase-Aktionen an (repeat/skip/extend).
     * Bug J Fix: Gibt jetzt den aktualisierten state + stageContext zurueck,
     * damit der Caller den neuen Stage-Index fuer Rescaling nutzen kann.
     */
    async applyPhaseAction(action) {
        const settings = DQ_CONFIG.userSettings || {};
        const planId = settings.customPlanId;
        if (!planId) return { state: null, stageContext: null };

        const plan = await this.getPlan(planId);
        if (!plan) return { state: null, stageContext: null };

        const state = await this.getState(planId);
        const currentContext = this.getStageForState(plan.stages, state);
        const stageWeeks = currentContext.stageWeeks;

        if (action === 'repeat') {
            state.manualWeekShift = (state.manualWeekShift || 0) - stageWeeks;
        } else if (action === 'skip') {
            state.manualWeekShift = (state.manualWeekShift || 0) + stageWeeks;
        } else if (action === 'extend') {
            if (!state.stageExtensions) state.stageExtensions = {};
            state.stageExtensions[currentContext.stageIndex] =
                (state.stageExtensions[currentContext.stageIndex] || 0) + 1;
        }

        await this.saveState(state);
        const newContext = this.getStageForState(plan.stages, state);
        return { state, stageContext: newContext };
    }
};

if (typeof window !== 'undefined') {
    window.DQ_CUSTOM_PLAN = DQ_CUSTOM_PLAN;
}
