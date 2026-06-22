/**
 * @file mistral-client.js
 * @description DQ_MISTRAL Modul - KI-Trainingsplan-Generierung via Supabase Edge Function.
 * Zweck: Ruft die 'mistral-proxy' Edge Function auf, validiert das JSON-Response,
 *         handhabt Loading/Errors/Fallback und limitiert Regenerationen.
 * Verbindungen: Wird von Settings-UI und Tutorial aufgerufen. Speichert Plne in
 *               IndexedDB via DQ_CUSTOM_PLAN.
 */

const DQ_MISTRAL = {
    REGEN_LIMIT: 3,
    REGEN_STORAGE_KEY: 'dq_mistral_regen',
    REQUEST_TIMEOUT_MS: 30000,
    VALID_TYPES: ['reps', 'time', 'check', 'focus'],
    VALID_TAGS: ['push', 'pull', 'legs', 'core', 'cardio', 'rest', 'mobility', 'full_body'],
    VALID_STATS: ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'],

    /**
     * Validiert einen KI-generierten Trainingsplan gegen das erwartete Schema.
     * @param {object} plan - Der Plan aus der Mistral API
     * @returns {{valid: boolean, errors: string[]}}
     */
    validatePlan(plan) {
        const errors = [];

        if (!plan || typeof plan !== 'object') {
            return { valid: false, errors: ['Plan ist kein Objekt'] };
        }

        if (!plan.planName || typeof plan.planName !== 'string') {
            errors.push('planName fehlt oder kein String');
        }
        if (!plan.planDescription || typeof plan.planDescription !== 'string') {
            errors.push('planDescription fehlt oder kein String');
        }
        if (!plan.exercises || !Array.isArray(plan.exercises)) {
            errors.push('exercises fehlt oder kein Array');
        }
        if (!plan.stages || !Array.isArray(plan.stages)) {
            errors.push('stages fehlt oder kein Array');
        }

        if (plan.exercises) {
            if (plan.exercises.length < 24 || plan.exercises.length > 30) {
                errors.push(`Brauche 24-30 exercises, got ${plan.exercises.length}`);
            }

            const restCount = plan.exercises.filter(ex => ex && ex.isRest === true).length;
            if (restCount < 4) {
                errors.push(`Mindestens 4 isRest exercises noetig, got ${restCount}`);
            }

            const existingKeys = new Set(
                Object.values(DQ_DATA.exercisePool).flat().map(ex => ex.nameKey)
            );

            const seenKeys = new Set();
            plan.exercises.forEach((ex, i) => {
                if (!ex) { errors.push(`exercise[${i}] ist null`); return; }
                if (!ex.nameKey || typeof ex.nameKey !== 'string') {
                    errors.push(`exercise[${i}].nameKey fehlt`);
                } else {
                    if (seenKeys.has(ex.nameKey)) {
                        errors.push(`exercise[${i}].nameKey doppelt: ${ex.nameKey}`);
                    }
                    seenKeys.add(ex.nameKey);
                    if (!existingKeys.has(ex.nameKey) && !ex.nameKey.startsWith('custom_')) {
                        errors.push(`exercise[${i}].nameKey muss custom_ Prefix haben wenn neu: ${ex.nameKey}`);
                    }
                }
                if (!ex.displayName || typeof ex.displayName !== 'string') {
                    errors.push(`exercise[${i}].displayName fehlt`);
                }
                if (!ex.description || typeof ex.description !== 'string') {
                    errors.push(`exercise[${i}].description fehlt`);
                }
                if (!this.VALID_TYPES.includes(ex.type)) {
                    errors.push(`exercise[${i}].type invalid: ${ex.type}`);
                }
                if (typeof ex.baseValue !== 'number' || ex.baseValue < 1) {
                    errors.push(`exercise[${i}].baseValue invalid: ${ex.baseValue}`);
                }
                if (!ex.tags || !Array.isArray(ex.tags) || ex.tags.length === 0) {
                    errors.push(`exercise[${i}].tags fehlt oder leer`);
                } else {
                    const invalidTags = ex.tags.filter(t => !this.VALID_TAGS.includes(t));
                    if (invalidTags.length > 0) {
                        errors.push(`exercise[${i}].tags invalid: ${invalidTags.join(', ')}`);
                    }
                }
                if (typeof ex.isRest !== 'boolean') {
                    errors.push(`exercise[${i}].isRest muss boolean sein`);
                }
                if (typeof ex.needsEquipment !== 'boolean') {
                    errors.push(`exercise[${i}].needsEquipment muss boolean sein`);
                }
                if (!ex.muscles || !Array.isArray(ex.muscles)) {
                    errors.push(`exercise[${i}].muscles fehlt`);
                }
                if (ex.statPoints && typeof ex.statPoints === 'object') {
                    for (const stat in ex.statPoints) {
                        if (!this.VALID_STATS.includes(stat)) {
                            errors.push(`exercise[${i}].statPoints invalid stat: ${stat}`);
                        }
                    }
                }
                if (typeof ex.mana !== 'number' || ex.mana < 1) {
                    errors.push(`exercise[${i}].mana invalid: ${ex.mana}`);
                }
                if (typeof ex.gold !== 'number' || ex.gold < 1) {
                    errors.push(`exercise[${i}].gold invalid: ${ex.gold}`);
                }
            });
        }

        if (plan.stages) {
            if (plan.stages.length !== 4) {
                errors.push(`Genau 4 stages noetig, got ${plan.stages.length}`);
            }
            plan.stages.forEach((stage, i) => {
                if (!stage) { errors.push(`stage[${i}] ist null`); return; }
                if (typeof stage.weeks !== 'number' || stage.weeks < 1) {
                    errors.push(`stage[${i}].weeks invalid`);
                }
                if (typeof stage.sets !== 'number' || stage.sets < 1) {
                    errors.push(`stage[${i}].sets invalid`);
                }
                if (typeof stage.reps !== 'number' || stage.reps < 1) {
                    errors.push(`stage[${i}].reps invalid`);
                }
                if (!stage.label || typeof stage.label !== 'string') {
                    errors.push(`stage[${i}].label fehlt`);
                }
            });
            const last = plan.stages[plan.stages.length - 1];
            if (last && last.weeks < 9999) {
                errors.push('Letzte stage muss weeks: 9999 haben (infinite)');
            }
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Expandiert Seed-Exercises auf genau 30 mit tag-balancierten Variationen.
     * Bug E Fix: nameKey nutzt eindeutige Suffixe (Timestamp + Random),
     * damit mehrfache expand-Aufrufe keine nameKey-Kollisionen erzeugen.
     * Bug M-Test Fix: stellt garantiert >= 4 isRest sicher, indem Rest-Entries
     * zuerst injiziert werden, BEVOR die tag-Priority-Expansion laeuft.
     * @param {object[]} seed - 8-10 AI-generierte Uebungen
     * @returns {object[]} - 30 Uebungen
     */
    expandExercises(seed) {
        if (!Array.isArray(seed) || seed.length === 0) return [];
        const result = [...seed];
        const primaryTags = ['push', 'pull', 'legs', 'core', 'cardio', 'rest', 'mobility', 'full_body'];
        const tagCounts = {};
        primaryTags.forEach(t => tagCounts[t] = 0);
        result.forEach(ex => {
            (ex.tags || []).forEach(t => { if (tagCounts[t] !== undefined) tagCounts[t]++; });
        });

        const tagPools = { push: ['push', 'cardio'], pull: ['pull', 'core'], legs: ['legs', 'cardio'], core: ['core'], cardio: ['cardio'], rest: ['rest', 'mobility'], mobility: ['mobility', 'rest'], full_body: ['full_body', 'core'] };
        const names = { push: 'Druecken', pull: 'Ziehen', legs: 'Beine', core: 'Rumpf', cardio: 'Cardio', rest: 'Erholung', mobility: 'Mobilitaet', full_body: 'Ganzkoerper' };
        const muscleMap = { push: ['chest', 'triceps'], pull: ['back', 'biceps'], legs: ['quads', 'glutes'], core: ['core'], cardio: ['general'], rest: ['general'], mobility: ['general'], full_body: ['core', 'general'] };
        const statKeys = ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'];

        // Eindeutiger Suffix pro Aufruf - vermeidet nameKey-Duplikate.
        const uniqSuffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

        // Phase 1: Mindestens 4 isRest sicherstellen. Wenn der seed zu wenig hat,
        // werden Rest-Eintraege VOR der Expansion injiziert - so ueberleben sie
        // das spaetere slice(0,30).
        let restCount = result.filter(ex => ex.isRest === true).length;
        let restIdx = 0;
        while (restCount < 4) {
            result.unshift({
                nameKey: `custom_rest_${uniqSuffix}_pre${restIdx++}`,
                displayName: `Erholung ${restIdx}`,
                description: 'Aktive Erholung',
                type: 'check',
                baseValue: 1,
                tags: ['rest', 'mobility'],
                isRest: true,
                needsEquipment: false,
                muscles: ['general'],
                statPoints: { durchhaltevermoegen: 1 },
                mana: 10,
                gold: 5
            });
            restCount++;
            tagCounts['rest']++;
        }

        let attempt = 0;
        while (result.length < 30 && attempt < 60) {
            attempt++;
            const neededTag = primaryTags.filter(t => t !== 'rest' && t !== 'mobility').sort((a, b) => tagCounts[a] - tagCounts[b])[0] || 'full_body';
            const base = seed[result.length % seed.length];
            if (!base) break;
            const n = result.length;
            const variationNum = Math.floor(n / seed.length) + 1;
            const ex = {
                nameKey: `custom_${neededTag}_${uniqSuffix}_${n}`,
                displayName: `${names[neededTag] || 'Uebung'} V${variationNum}`,
                description: `${base.displayName || names[neededTag] || 'Uebung'}-Variante`,
                type: neededTag === 'cardio' ? 'time' : 'reps',
                baseValue: neededTag === 'rest' ? 1 : (10 + n % 20),
                tags: neededTag === 'rest' ? ['rest', 'mobility'] : [neededTag].concat(tagPools[neededTag] ? [tagPools[neededTag][0]] : ['full_body']),
                isRest: neededTag === 'rest',
                needsEquipment: base.needsEquipment === true,
                muscles: muscleMap[neededTag] || ['general'],
                statPoints: { [statKeys[n % 5]]: 1 },
                mana: 15 + (n % 6) * 5,
                gold: 10 + (n % 4) * 5
            };
            result.push(ex);
            tagCounts[neededTag]++;
        }

        // Falls die Expansion nicht auf 30 kam (sehr kurzer seed), rest-affin
        // auf 30 auffuellen -- Rest-Entries werden NICHT abgeschnitten.
        while (result.length < 30) {
            const idx = result.length;
            result.push({
                nameKey: `custom_fill_${uniqSuffix}_${idx}`,
                displayName: 'Ganzkoerper-Routine',
                description: 'Kontrollierte Ganzkoerperuebung mit sauberer Technik.',
                type: 'reps',
                baseValue: 10,
                tags: ['full_body'],
                isRest: false,
                needsEquipment: false,
                muscles: ['general'],
                statPoints: { durchhaltevermoegen: 1 },
                mana: 10,
                gold: 5
            });
        }

        return result.slice(0, 30);
    },

    /**
     * Generiert 30 Uebungen aus Vorlagen basierend auf einem Fokus (kraft/ausdauer/abnehmen/general).
     * @param {string} focus - Trainingsfokus
     * @param {number} intensity - Intensitaet 1-5
     * @returns {object[]} - 30 Uebungen
     */
    generateExercisesFromTemplates(focus, intensity) {
        const scale = intensity / 3;
        const templates = {
            kraft: [
                { nameKey: 'push_ups_normal', displayName: 'Liegestuetze', description: 'Klassische Liegestuetze', type: 'reps', baseValue: Math.round(10 * scale), tags: ['push', 'core'], isRest: false, needsEquipment: false, muscles: ['chest', 'triceps'], statPoints: { kraft: 1 }, mana: 20, gold: 10 },
                { nameKey: 'squats', displayName: 'Kniebeugen', description: 'Koerpergewicht Kniebeugen', type: 'reps', baseValue: Math.round(15 * scale), tags: ['legs', 'core'], isRest: false, needsEquipment: false, muscles: ['quads', 'glutes'], statPoints: { kraft: 1 }, mana: 20, gold: 10 },
                { nameKey: 'plank', displayName: 'Plank', description: 'Unterarmstuetz', type: 'time', baseValue: Math.round(30 * scale), tags: ['core', 'full_body'], isRest: false, needsEquipment: false, muscles: ['core'], statPoints: { durchhaltevermoegen: 1 }, mana: 15, gold: 8 },
                { nameKey: 'dumbbell_rows', displayName: 'Kurzhantel-Rudern', description: 'Rudern mit Kurzhanteln', type: 'reps', baseValue: Math.round(10 * scale), tags: ['pull', 'core'], isRest: false, needsEquipment: true, muscles: ['back', 'biceps'], statPoints: { kraft: 1 }, mana: 25, gold: 12 },
                { nameKey: 'lunges', displayName: 'Ausfallschritte', description: 'Abwechselnde Ausfallschritte', type: 'reps', baseValue: Math.round(10 * scale), tags: ['legs', 'core'], isRest: false, needsEquipment: false, muscles: ['quads', 'glutes'], statPoints: { kraft: 1 }, mana: 20, gold: 10 },
                { nameKey: 'shoulder_press', displayName: 'Schulterdruecken', description: 'Ueberkopf-Presse', type: 'reps', baseValue: Math.round(8 * scale), tags: ['push', 'full_body'], isRest: false, needsEquipment: true, muscles: ['shoulders', 'triceps'], statPoints: { kraft: 1 }, mana: 25, gold: 12 },
            ],
            ausdauer: [
                { nameKey: 'jumpingjacks', displayName: 'Jumping Jacks', description: 'Hampelmaenner', type: 'reps', baseValue: Math.round(20 * scale), tags: ['cardio', 'full_body'], isRest: false, needsEquipment: false, muscles: ['general'], statPoints: { ausdauer: 1 }, mana: 15, gold: 8 },
                { nameKey: 'high_knees', displayName: 'Kniehebelauf', description: 'Laufen mit angehobenen Knien', type: 'time', baseValue: Math.round(30 * scale), tags: ['cardio', 'legs'], isRest: false, needsEquipment: false, muscles: ['quads', 'core'], statPoints: { ausdauer: 1 }, mana: 15, gold: 8 },
                { nameKey: 'burpees', displayName: 'Burpees', description: 'Burpees mit Liegestuetz', type: 'reps', baseValue: Math.round(8 * scale), tags: ['cardio', 'full_body', 'push'], isRest: false, needsEquipment: false, muscles: ['chest', 'quads', 'core'], statPoints: { ausdauer: 0.5, kraft: 0.5 }, mana: 25, gold: 15 },
                { nameKey: 'mountain_climbers', displayName: 'Mountain Climbers', description: 'Bergsteiger in Liegestuetzposition', type: 'time', baseValue: Math.round(30 * scale), tags: ['cardio', 'core', 'full_body'], isRest: false, needsEquipment: false, muscles: ['core', 'shoulders'], statPoints: { ausdauer: 1 }, mana: 20, gold: 10 },
                // Bug F Fix: jump_rope entfernt - ist im blockedQuestNameKeys
                // des Training-Systems und produzierte sonst stille Slot-Verluste.
            ],
            abnehmen: [
                { nameKey: 'burpees', displayName: 'Burpees', description: 'Ganzkoerper Fatburner', type: 'reps', baseValue: Math.round(10 * scale), tags: ['cardio', 'full_body', 'push'], isRest: false, needsEquipment: false, muscles: ['chest', 'quads', 'core'], statPoints: { ausdauer: 0.5, durchhaltevermoegen: 0.5 }, mana: 30, gold: 15 },
                { nameKey: 'jumpingjacks', displayName: 'Jumping Jacks', description: 'Hampelmaenner', type: 'reps', baseValue: Math.round(25 * scale), tags: ['cardio', 'full_body'], isRest: false, needsEquipment: false, muscles: ['general'], statPoints: { ausdauer: 1 }, mana: 15, gold: 8 },
                { nameKey: 'mountain_climbers', displayName: 'Mountain Climbers', description: 'Bergsteiger', type: 'time', baseValue: Math.round(30 * scale), tags: ['cardio', 'core', 'full_body'], isRest: false, needsEquipment: false, muscles: ['core', 'shoulders'], statPoints: { ausdauer: 1 }, mana: 20, gold: 10 },
                { nameKey: 'squats', displayName: 'Kniebeugen', description: 'Koerpergewicht', type: 'reps', baseValue: Math.round(15 * scale), tags: ['legs', 'core'], isRest: false, needsEquipment: false, muscles: ['quads', 'glutes'], statPoints: { kraft: 0.5, durchhaltevermoegen: 0.5 }, mana: 20, gold: 10 },
                { nameKey: 'high_knees', displayName: 'Kniehebelauf', description: 'Laufen mit hohen Knien', type: 'time', baseValue: Math.round(30 * scale), tags: ['cardio', 'legs'], isRest: false, needsEquipment: false, muscles: ['quads', 'core'], statPoints: { ausdauer: 1 }, mana: 15, gold: 8 },
            ],
            general: [
                { nameKey: 'push_ups_normal', displayName: 'Liegestuetze', description: 'Klassische Liegestuetze', type: 'reps', baseValue: 10, tags: ['push', 'core'], isRest: false, needsEquipment: false, muscles: ['chest', 'triceps'], statPoints: { kraft: 1 }, mana: 20, gold: 10 },
                { nameKey: 'situps', displayName: 'Situps', description: 'Bauchtraining', type: 'reps', baseValue: 15, tags: ['core'], isRest: false, needsEquipment: false, muscles: ['abs'], statPoints: { durchhaltevermoegen: 1 }, mana: 15, gold: 8 },
                { nameKey: 'squats', displayName: 'Kniebeugen', description: 'Koerpergewicht', type: 'reps', baseValue: 15, tags: ['legs', 'core'], isRest: false, needsEquipment: false, muscles: ['quads', 'glutes'], statPoints: { kraft: 1 }, mana: 20, gold: 10 },
                { nameKey: 'plank', displayName: 'Plank', description: 'Unterarmstuetz', type: 'time', baseValue: 30, tags: ['core', 'full_body'], isRest: false, needsEquipment: false, muscles: ['core'], statPoints: { durchhaltevermoegen: 1 }, mana: 15, gold: 8 },
                { nameKey: 'lunges', displayName: 'Ausfallschritte', description: 'Abwechselnd', type: 'reps', baseValue: 10, tags: ['legs', 'core'], isRest: false, needsEquipment: false, muscles: ['quads', 'glutes'], statPoints: { kraft: 1 }, mana: 20, gold: 10 },
                { nameKey: 'stretch_10min', displayName: 'Dehnen', description: 'Ganzkoerper dehnen', type: 'time', baseValue: 60, tags: ['mobility', 'full_body'], isRest: false, needsEquipment: false, muscles: ['general'], statPoints: { beweglichkeit: 1 }, mana: 10, gold: 5 },
            ]
        };

        const seed = templates[focus] || templates.general;
        return this.expandExercises(seed);
    },

    /**
     * Baut aus roher Mistral-Antwort einen vollstaendigen Plan mit 30 Uebungen.
     * @param {*} raw - Rohdaten von der Edge Function (Config-Objekt oder exercises-Array)
     * @param {string} prompt - Der Prompt/Preset
     * @returns {object} - Vollstaendiger Plan
     */
    buildFullPlan(raw, prompt) {
        let exercises = [];
        let planName = `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}-Plan`;
        let planDesc = `Personalisierter ${prompt} Trainingsplan`;
        let stages = null;

        if (raw && raw.focus) {
            exercises = this.generateExercisesFromTemplates(raw.focus, raw.intensity || 3);
            if (raw.name) planName = raw.name;
            if (raw.desc) planDesc = raw.desc;
        } else if (Array.isArray(raw)) {
            exercises = this.expandExercises(raw);
        } else if (raw && Array.isArray(raw.exercises)) {
            exercises = raw.exercises;
            if (raw.planName) planName = raw.planName;
            if (raw.planDescription) planDesc = raw.planDescription;
            if (Array.isArray(raw.stages)) stages = raw.stages;
        }

        exercises = exercises.filter(ex => ex && ex.nameKey && !/^custom_ai_(rest_)?fill_\d+$/i.test(ex.nameKey));

        if (exercises.length < 24) {
            exercises = this.generateExercisesFromTemplates('general', 3);
        }

        if (!Array.isArray(stages) || stages.length !== 4) {
            stages = [
                { label: 'Einstieg', weeks: 4, sets: 2, reps: 10 },
                { label: 'Aufbau', weeks: 4, sets: 3, reps: 10 },
                { label: 'Fortgeschritten', weeks: 4, sets: 3, reps: 12 },
                { label: 'Meister', weeks: 9999, sets: 4, reps: 12 }
            ];
        }

        return {
            planName,
            planDescription: planDesc,
            exercises: exercises.slice(0, 30),
            stages
        };
    },

    invokeWithTimeout(body, timeoutMs) {
        const request = DQ_SUPABASE.client.functions.invoke('mistral-proxy', { body });
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Plan-Generierung dauerte zu lange')), timeoutMs || this.REQUEST_TIMEOUT_MS);
        });
        return Promise.race([request, timeout]);
    },

    async ensureFunctionSession() {
        if (!DQ_SUPABASE || !DQ_SUPABASE.client) {
            throw new Error('Supabase Client nicht initialisiert');
        }

        const { data: sessionData, error: sessionError } = await DQ_SUPABASE.client.auth.getSession();
        if (sessionError) {
            throw new Error(`Supabase Session konnte nicht gelesen werden: ${sessionError.message}`);
        }
        if (sessionData && sessionData.session) {
            DQ_SUPABASE.currentUser = sessionData.session.user;
            return sessionData.session;
        }

        if (typeof DQ_SUPABASE.signInAnonymously !== 'function') {
            throw new Error('Keine Supabase-Session aktiv. Bitte melde dich an und versuche es erneut.');
        }

        const { data, error } = await DQ_SUPABASE.signInAnonymously();
        if (error || !data || !data.session) {
            throw new Error(`Anonyme Anmeldung fuer KI-Plan fehlgeschlagen: ${error ? error.message : 'keine Session'}`);
        }

        DQ_SUPABASE.currentUser = data.session.user;
        localStorage.setItem('dq_auth_decision_made', 'true');
        return data.session;
    },

    /**
     * Ruft die Edge Function auf und generiert einen Trainingsplan.
     * @param {string} prompt - Preset-Key ('kraft'|'ausdauer'|'abnehmen') oder freier Text
     * @param {object} userContext - { age, hasEquipment, difficulty, restDays }
     * @returns {Promise<object>} - Validierter Plan
     * @throws {Error} - Bei API-Fehler oder Validierungsfehler
     */
    async generatePlan(prompt, userContext = {}, options = {}) {
        if (!DQ_SUPABASE || !DQ_SUPABASE.client) {
            throw new Error('Supabase Client nicht initialisiert');
        }

        await this.ensureFunctionSession();

        const maxAttempts = options.retry === true ? 2 : 1;
        let lastError = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const { data, error } = await this.invokeWithTimeout({
                    prompt,
                    userContext,
                    repair: attempt > 0
                }, options.timeoutMs || this.REQUEST_TIMEOUT_MS);

                if (error) {
                    throw new Error(`Edge Function Fehler: ${error.message || JSON.stringify(error)}`);
                }

                if (!data) {
                    throw new Error('Edge Function lieferte keine Daten');
                }

                if (data.error) {
                    throw new Error(`Edge Function Fehler: ${data.error}`);
                }

                const plan = this.buildFullPlan(data, prompt);
                const validation = this.validatePlan(plan);
                if (!validation.valid) {
                    console.error('Plan validation failed:', validation.errors);
                    throw new Error(`Invalid plan: ${validation.errors.slice(0, 5).join('; ')}`);
                }

                return plan;
            } catch (e) {
                lastError = e;
                if (attempt < maxAttempts - 1) {
                    console.warn('Plan-Generierung fehlgeschlagen, starte Repair-Retry:', e.message || e);
                }
            }
        }

        throw lastError || new Error('Plan-Generierung fehlgeschlagen');
    },

    /**
     * Hoch-Level-Funktion: Generiert Plan, speichert ihn, aktiviert ihn.
     * @param {string} prompt
     * @param {object} userContext
     * @param {object} options - { skipIncrement: boolean }
     * @returns {Promise<{success: boolean, plan?: object, planId?: number, error?: string}>}
     */
    async generateAndSavePlan(prompt, userContext = {}, options = {}) {
        if (!options.skipIncrement && !this.canRegenerate()) {
            return {
                success: false,
                error: 'Regenerations-Limit erreicht (max ' + this.REGEN_LIMIT + '/Tag)'
            };
        }

        try {
            const plan = await this.generatePlan(prompt, userContext, options);
            const planId = await DQ_CUSTOM_PLAN.savePlan(plan, prompt);

            if (!options.skipIncrement) {
                this.incrementRegeneration();
            }

            await DQ_CUSTOM_PLAN.setActivePlan(planId);
            if (typeof DQ_SUPABASE !== 'undefined' && DQ_SUPABASE.triggerSync) {
                DQ_SUPABASE.triggerSync();
            }

            return { success: true, plan, planId };
        } catch (e) {
            console.error('generateAndSavePlan error:', e);
            return { success: false, error: e.message || 'Unbekannter Fehler' };
        }
    },

    /**
     * Regenerations-Counter (localStorage, reset pro Tag).
     */
    getRegenerationCount() {
        const today = DQ_CONFIG.getTodayString();
        const data = localStorage.getItem(this.REGEN_STORAGE_KEY);
        if (!data) return 0;
        try {
            const parsed = JSON.parse(data);
            return parsed.date === today ? (parsed.count || 0) : 0;
        } catch { return 0; }
    },

    getRemainingRegenerations() {
        return Math.max(0, this.REGEN_LIMIT - this.getRegenerationCount());
    },

    canRegenerate() {
        return this.getRegenerationCount() < this.REGEN_LIMIT;
    },

    incrementRegeneration() {
        const today = DQ_CONFIG.getTodayString();
        const count = this.getRegenerationCount();
        localStorage.setItem(this.REGEN_STORAGE_KEY, JSON.stringify({ date: today, count: count + 1 }));
    },

    /**
     * Holt den Fallback-Goal aus einem Preset oder dem aktuellen goal.
     */
    getFallbackGoal(preset) {
        if (preset === 'kraft') return 'muscle';
        if (preset === 'ausdauer') return 'endurance';
        if (preset === 'abnehmen') return 'fatloss';
        return DQ_CONFIG.userSettings.goal || 'muscle';
    }
};

if (typeof window !== 'undefined') {
    window.DQ_MISTRAL = DQ_MISTRAL;
}
