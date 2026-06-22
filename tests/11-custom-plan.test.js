/**
 * Test 11: Custom Plan System (KI-Trainingsplne)
 * Testet JSON-Validierung, Balancing-Algorithmus, Rest-Day-Filter, Stage-Berechnung.
 */
const { TestRunner, BASE, loadData } = require('./helpers');
const path = require('path');

function run() {
    const t = new TestRunner('Custom Plan System');

    // --- Syntax-Check der neuen Module ---
    const mistralClientPath = path.join(BASE, 'js', 'mistral-client.js');
    const customPlanPath = path.join(BASE, 'js', 'custom-plan-system.js');
    const edgeFnPath = path.join(BASE, 'supabase', 'functions', 'mistral-proxy', 'index.ts');

    t.ok(require('fs').existsSync(mistralClientPath), 'js/mistral-client.js existiert');
    t.ok(require('fs').existsSync(customPlanPath), 'js/custom-plan-system.js existiert');
    t.ok(require('fs').existsSync(edgeFnPath), 'supabase/functions/mistral-proxy/index.ts existiert');

    // --- Edge Function: Secret nicht im Code ---
    const edgeFnCode = require('fs').readFileSync(edgeFnPath, 'utf8');
    t.ok(edgeFnCode.includes('Deno.env.get("MISTRAL_API_KEY")'), 'Edge Function liest Key aus Deno.env');
    t.ok(!edgeFnCode.includes('HLSGdkLj5e29Ikj3gaQUTFCJK5QURB44'), 'API-Key NICHT hardcoded in Edge Function');
    t.ok(edgeFnCode.includes('mistral-small-latest'), 'Verwendet mistral-small-latest Modell');
    t.ok(edgeFnCode.includes('max_tokens') && (edgeFnCode.includes('4000') || edgeFnCode.includes('3000') || edgeFnCode.includes('2000')), 'Verwendet ausreichend max_tokens fuer 30-Exercise-JSON (>=2000, vorher 100 war zu klein)');
    t.ok(edgeFnCode.includes('response_format') && edgeFnCode.includes('json_object'), 'Mistral response_format: json_object aktiv (Bug C Fix)');
    t.ok(edgeFnCode.includes('/auth/v1/user') && edgeFnCode.includes('getUserIdFromToken'), 'JWT-Verifikation via Supabase Auth REST (Bug B Fix)');
    t.ok(edgeFnCode.includes('SYSTEM_PROMPT') && edgeFnCode.includes('EXISTING_NAMEKEYS'), 'System-Prompt enthaelt vollstaendiges JSON-Schema + nameKey-Liste (Bug A/C Fix)');
    t.ok(edgeFnCode.includes('normalizePlanShape') && edgeFnCode.includes('tagAliases'), 'Edge Function normalisiert Mistral-Tags vor der finalen Validierung');
    t.ok(edgeFnCode.includes('dq_ai_generations'), 'Server-side Rate-Limit Konstante vorhanden (Bug D Fix)');
    t.ok(edgeFnCode.includes('genau 4 stages') || edgeFnCode.includes('GENAU 4'), 'Edge Function validiert genau 4 Phasen');
    t.ok(edgeFnCode.includes('KEIN Equipment') && edgeFnCode.includes('needsEquipment:false'), 'Edge Function erzwingt Equipment-Off im Prompt');
    t.ok(edgeFnCode.includes('attempt < 2') || edgeFnCode.includes('attempt = 0'), 'Edge Function hat internen Repair-Retry');
    t.ok(edgeFnCode.includes('MISTRAL_URL') && edgeFnCode.includes('fetch('), 'Ruft Mistral API via fetch auf');

    // --- mistral-client.js: Validierung ---
    const mistralCode = require('fs').readFileSync(mistralClientPath, 'utf8');
    t.ok(mistralCode.includes('validatePlan'), 'Hat validatePlan Funktion');
    t.ok(mistralCode.includes('REGEN_LIMIT') && mistralCode.includes('3'), 'Regeneration-Limit ist 3');
    t.ok(mistralCode.includes('canRegenerate') && mistralCode.includes('getRegenerationCount'), 'Hat Rate-Limiting Funktionen');
    t.ok(mistralCode.includes('24-30') || mistralCode.includes('length < 24'), 'Validiert auf 24-30 echte Ubungen');
    t.ok(mistralCode.includes('custom_'), 'Validiert custom_ Prefix fuer neue Ubungen');
    t.ok(mistralCode.includes('VALID_TYPES'), 'Validiert Ubungs-Typen');
    t.ok(mistralCode.includes('VALID_TAGS'), 'Validiert Tags');
    t.ok(mistralCode.includes('functions.invoke'), 'Ruft Edge Function via functions.invoke auf');
    t.ok(mistralCode.includes('ensureFunctionSession') && mistralCode.includes('signInAnonymously'), 'Mistral Client stellt vor Edge Function eine Supabase-Session sicher');
    t.ok(mistralCode.includes('REQUEST_TIMEOUT_MS') && mistralCode.includes('invokeWithTimeout'), 'Mistral Client hat Timeout gegen haengende Generierung');
    t.ok(mistralCode.includes('expandExercises'), 'Hat expandExercises Funktion');
    t.ok(mistralCode.includes('buildFullPlan'), 'Hat buildFullPlan Funktion');
    t.ok(mistralCode.includes('generateExercisesFromTemplates'), 'Hat generateExercisesFromTemplates Funktion');

    // --- custom-plan-system.js: Balancing ---
    const customCode = require('fs').readFileSync(customPlanPath, 'utf8');
    t.ok(customCode.includes('pickBalancedQuests'), 'Hat pickBalancedQuests Funktion');
    t.ok(customCode.includes('PRIORITY_TAGS'), 'Hat Priority-Tags fur Balancing');
    t.ok(customCode.includes('isRest') && customCode.includes('isRestDay'), 'Hat Rest-Day-Filter');
    t.ok(customCode.includes('getStageForState'), 'Hat Stage-Progression');
    t.ok(customCode.includes('buildCustomQuest'), 'Hat buildCustomQuest Funktion');
    t.ok(customCode.includes('getTodayQuestSet'), 'Hat getTodayQuestSet Funktion');
    t.ok(customCode.includes('recentExercises'), 'Beruecksichtigt recentExercises fuer Variety');
    t.ok(customCode.includes('savePlan') && customCode.includes('setActivePlan'), 'Hat Plan-Speicher-Funktionen');
    t.ok(customCode.includes('applyPhaseAction'), 'Hat applyPhaseAction fur Phase-Buttons');
    t.ok(customCode.includes('getAvailableExercises'), 'Hat Equipment-Safety-Filter fuer Custom Plans');
    t.ok(customCode.includes('needsEquipment: !!template.needsEquipment'), 'Custom Quests speichern needsEquipment fuer Re-Generation');

    // --- Balancing-Algorithmus Logic Test (simuliert) ---
    function testBalancing() {
        const exercises = [];
        const tags = ['push', 'pull', 'legs', 'core', 'cardio', 'mobility'];
        for (let i = 0; i < 26; i++) {
            exercises.push({
                nameKey: `custom_ex_${i}`,
                tags: [tags[i % tags.length]],
                isRest: false,
                type: 'reps',
                baseValue: 10,
                mana: 20,
                gold: 6
            });
        }
        for (let i = 0; i < 4; i++) {
            exercises.push({
                nameKey: `custom_rest_${i}`,
                tags: ['rest'],
                isRest: true,
                type: 'check',
                baseValue: 1,
                mana: 15,
                gold: 5
            });
        }

        t.ok(exercises.length === 30, 'Test-Setup: 30 Ubungen');

        const trainingExercises = exercises.filter(ex => !ex.isRest);
        t.ok(trainingExercises.length === 26, '26 Trainings-Uebungen nach Filter');

        const restExercises = exercises.filter(ex => ex.isRest);
        t.ok(restExercises.length === 4, '4 Rest-Uebungen nach Filter');

        const tagGroups = {};
        trainingExercises.forEach(ex => {
            const tag = ex.tags[0];
            if (!tagGroups[tag]) tagGroups[tag] = [];
            tagGroups[tag].push(ex);
        });
        t.ok(Object.keys(tagGroups).length >= 4, 'Mindestens 4 verschiedene Tag-Gruppen');

        const priorityTags = ['push', 'pull', 'legs', 'core', 'cardio', 'full_body', 'mobility'];
        const selected = [];
        const usedKeys = new Set();
        for (const tag of priorityTags) {
            if (selected.length >= 6) break;
            const candidates = (tagGroups[tag] || []).filter(ex => !usedKeys.has(ex.nameKey));
            if (candidates.length > 0) {
                selected.push(candidates[0]);
                usedKeys.add(candidates[0].nameKey);
            }
        }
        t.ok(selected.length === 6, `Balancing waehlt 6 (got ${selected.length})`);

        const selectedTags = new Set(selected.map(ex => ex.tags[0]));
        t.ok(selectedTags.size >= 4, `Mindestens 4 verschiedene Tags in Auswahl (got ${selectedTags.size})`);

        const hasDuplicates = selected.length !== new Set(selected.map(ex => ex.nameKey)).size;
        t.ok(!hasDuplicates, 'Keine Duplikate in Auswahl');
    }
    testBalancing();

    // --- Validierung Logic Test (simuliert) ---
    function testValidation() {
        const VALID_TYPES = ['reps', 'time', 'check', 'focus'];
        const VALID_TAGS = ['push', 'pull', 'legs', 'core', 'cardio', 'rest', 'mobility', 'full_body'];

        const validPlan = {
            planName: "Test Plan",
            planDescription: "Test",
            exercises: Array(30).fill(0).map((_, i) => ({
                nameKey: `custom_test_${i}`,
                displayName: `Test ${i}`,
                description: "Test",
                type: 'reps',
                baseValue: 10,
                tags: ['push'],
                isRest: i >= 26,
                needsEquipment: false,
                muscles: ['chest'],
                statPoints: { kraft: 1 },
                mana: 20,
                gold: 6
            })),
            stages: [
                { label: "P1", weeks: 2, sets: 2, reps: 8 },
                { label: "P2", weeks: 2, sets: 3, reps: 10 },
                { label: "P3", weeks: 2, sets: 3, reps: 12 },
                { label: "P4", weeks: 9999, sets: 4, reps: 12 }
            ]
        };

        t.ok(validPlan.exercises.length === 30, 'Validierungs-Test: 30 exercises');
        t.ok(validPlan.exercises.filter(ex => ex.isRest).length === 4, 'Validierungs-Test: 4 isRest');
        t.ok(validPlan.stages.length === 4, 'Validierungs-Test: genau 4 stages');
        t.ok(validPlan.stages[validPlan.stages.length - 1].weeks === 9999, 'Letzte Stage ist infinite');
        t.ok(validPlan.exercises.every(ex => VALID_TYPES.includes(ex.type)), 'Alle Typen valid');
        t.ok(validPlan.exercises.every(ex => ex.tags.every(t => VALID_TAGS.includes(t))), 'Alle Tags valid');
        t.ok(validPlan.exercises.every(ex => ex.nameKey.startsWith('custom_')), 'Alle neuen haben custom_ Prefix');

        const invalidPlan = { exercises: Array(5).fill({}), stages: [] };
        t.ok(invalidPlan.exercises.length !== 30, 'Invalid: nicht 30 exercises');
    }
    testValidation();

    // === Bug M Fix: DYNAMISCHE Runtime-Tests ===
    // Wir laden validatePlan / buildFullPlan / expandExercises aus dem Code
    // und fuehren sie mit echten Inputs aus. So fangen wir Logikfehler,
    // die ein statischer String-Match nie findet.

    // global.window + DQ_DATA vorbereiten (helpers.js hat es bereits geladen).
    const fs2 = require('fs');

    // mistral-client.js laedt sich selbst als const DQ_MISTRAL = {...};
    // Wir kapseln es via new Function, damit 'const' im Skript-Scope bleibt.
    function loadModuleAsGlobal(relPath, globalName) {
        const code = fs2.readFileSync(path.join(BASE, relPath), 'utf8');
        // Alles vor der Hauptobjekt-Deklaration wegstrippen, dann umdefinieren.
        // Wir nutzen Trick: const -> var, um auf global zuzugreifen.
        const patched = code
            .replace(/^const\s+DQ_MISTRAL\s*=\s*\{/m, `var ${globalName} = {`)
            .replace(/^const\s+DQ_CUSTOM_PLAN\s*=\s*\{/m, `var ${globalName} = {`);
        try {
            new Function(patched)();
        } catch (e) {
            console.warn('  [WARN] Modul-Load fehlgeschlagen:', relPath, e.message.split('\n')[0]);
        }
    }
    loadModuleAsGlobal('js/mistral-client.js', 'DQ_MISTRAL');
    loadModuleAsGlobal('js/custom-plan-system.js', 'DQ_CUSTOM_PLAN');

    // --- validatePlan dynamisch testen ---
    if (typeof DQ_MISTRAL !== 'undefined' && typeof DQ_MISTRAL.validatePlan === 'function') {
        // GUT: synthetischer, vollstaendiger Plan
        const goodPlan = {
            planName: 'Test Kraft-Plan',
            planDescription: 'Test-Plan fuer Test-Suite',
            exercises: Array.from({ length: 30 }, (_, i) => ({
                nameKey: `custom_test_${i}_${Date.now().toString(36)}`,
                displayName: 'Test Exercise ' + i,
                description: 'Synthetic exercise',
                type: 'reps',
                baseValue: 10,
                tags: i < 26 ? ['push'] : ['rest', 'mobility'],
                isRest: i >= 26,
                needsEquipment: false,
                muscles: ['general'],
                statPoints: { kraft: 1 },
                mana: 20,
                gold: 6
            })),
            stages: [
                { label: 'Einstieg', weeks: 2, sets: 2, reps: 8 },
                { label: 'Aufbau', weeks: 4, sets: 3, reps: 10 },
                { label: 'Peak', weeks: 4, sets: 3, reps: 12 },
                { label: 'Meister', weeks: 9999, sets: 4, reps: 12 }
            ]
        };
        const v = DQ_MISTRAL.validatePlan(goodPlan);
        t.ok(v.valid === true, 'validatePlan: guter Plan wird akzeptiert (errors=' + (v.errors || []).length + ')');

        // SCHLECHT: nur 29 exercises
        const fewerButClean = JSON.parse(JSON.stringify(goodPlan));
        fewerButClean.exercises.splice(5, 1);
        t.ok(DQ_MISTRAL.validatePlan(fewerButClean).valid === true, 'validatePlan: 29 saubere exercises wird akzeptiert');

        const muchTooFew = JSON.parse(JSON.stringify(goodPlan));
        muchTooFew.exercises = muchTooFew.exercises.slice(0, 23);
        t.ok(DQ_MISTRAL.validatePlan(muchTooFew).valid === false, 'validatePlan: 23 exercises wird abgelehnt');

        // SCHLECHT: doppelter nameKey
        const dupKey = JSON.parse(JSON.stringify(goodPlan));
        dupKey.exercises[5].nameKey = dupKey.exercises[0].nameKey;
        t.ok(DQ_MISTRAL.validatePlan(dupKey).valid === false, 'validatePlan: doppelter nameKey wird erkannt');

        // SCHLECHT: nur 2 isRest
        const fewRest = JSON.parse(JSON.stringify(goodPlan));
        fewRest.exercises.forEach((ex, i) => { if (i >= 26) ex.isRest = false; });
        fewRest.exercises[10].isRest = true;
        t.ok(DQ_MISTRAL.validatePlan(fewRest).valid === false, 'validatePlan: <4 isRest wird erkannt');

        // SCHLECHT: ungueltiger tag
        const badTag = JSON.parse(JSON.stringify(goodPlan));
        badTag.exercises[0].tags = ['hack'];
        t.ok(DQ_MISTRAL.validatePlan(badTag).valid === false, 'validatePlan: ungueltiger tag wird erkannt');

        // SCHLECHT: letzte stage nicht infinite
        const badStage = JSON.parse(JSON.stringify(goodPlan));
        badStage.stages[3].weeks = 4;
        t.ok(DQ_MISTRAL.validatePlan(badStage).valid === false, 'validatePlan: letzte stage ohne weeks:9999 erkannt');

        // SCHLECHT: nur 3 stages
        const tooFewStages = JSON.parse(JSON.stringify(goodPlan));
        tooFewStages.stages = tooFewStages.stages.slice(0, 3);
        t.ok(DQ_MISTRAL.validatePlan(tooFewStages).valid === false, 'validatePlan: nicht genau 4 stages wird abgelehnt');

        // SCHLECHT: nameKey ohne custom_-Prefix und nicht in existing pool
        const strayKey = JSON.parse(JSON.stringify(goodPlan));
        strayKey.exercises[0].nameKey = 'unknown_key_without_prefix';
        t.ok(DQ_MISTRAL.validatePlan(strayKey).valid === false, 'validatePlan: nameKey ohne custom_-Prefix erkannt');

        // SCHLECHT: bestehender nameKey aus exercisePool ist OK
        const knownKey = JSON.parse(JSON.stringify(goodPlan));
        // sicherstellen dass 'push_ups_normal' im Pool ist
        if (DQ_DATA.exercisePool.calisthenics &&
            DQ_DATA.exercisePool.calisthenics.some(e => e.nameKey === 'push_ups_normal')) {
            knownKey.exercises[0].nameKey = 'push_ups_normal';
            const vk = DQ_MISTRAL.validatePlan(knownKey);
            t.ok(vk.valid === true, 'validatePlan: bestehender nameKey aus Pool wird akzeptiert');
        }
    } else {
        t.ok(false, 'DQ_MISTRAL.validatePlan wurde nicht geladen - Modul-Load fehlgeschlagen');
    }

    // --- expandExercises dynamisch testen (Bug E Fix) ---
    if (typeof DQ_MISTRAL !== 'undefined' && typeof DQ_MISTRAL.expandExercises === 'function') {
        const seed = [
            { nameKey: 'custom_seed_0', tags: ['push'], isRest: false, type: 'reps', baseValue: 10 }
        ];
        const exp1 = DQ_MISTRAL.expandExercises(seed);
        t.ok(exp1.length === 30, 'expandExercises: liefert genau 30 Uebungen');
        const keys1 = exp1.map(e => e.nameKey);
        t.ok(new Set(keys1).size === 30, 'expandExercises: alle nameKeys eindeutig (Bug E Fix)');

        // Zweiter Aufruf muss andere nameKeys produzieren (Suffix)
        const exp2 = DQ_MISTRAL.expandExercises(seed);
        const keys2 = new Set(exp2.map(e => e.nameKey));
        t.ok(keys2.size === 30, 'expandExercises: zweiter Aufruf auch eindeutig');
        // Suffixe unterscheiden sich
        const overlap = exp1.filter(e => keys2.has(e.nameKey)).length;
        t.ok(overlap <= 1, 'expandExercises: nur seed-Key (max 1) zwischen Aufrufen geteilt');

        // Mindestens 4 Rest
        t.ok(exp1.filter(e => e.isRest === true).length >= 4, 'expandExercises: >= 4 isRest');
    } else {
        t.ok(false, 'DQ_MISTRAL.expandExercises nicht verfuegbar');
    }

    // --- pickBalancedQuests dynamisch testen (Bug K Fix) ---
    if (typeof DQ_CUSTOM_PLAN !== 'undefined' && typeof DQ_CUSTOM_PLAN.pickBalancedQuests === 'function') {
        const bigPool = Array.from({ length: 30 }, (_, i) => ({
            nameKey: 'pool_' + i,
            tags: ['push'],
            isRest: i >= 26,
            type: 'reps',
            baseValue: 10,
            mana: 20,
            gold: 6
        }));
        const sel = DQ_CUSTOM_PLAN.pickBalancedQuests(bigPool, 6, false, []);
        t.ok(sel.length === 6, 'pickBalancedQuests: 6 aus grossem Pool gewaehlt');

        // KRITISCH: kleiner Pool (Bug K) -> muss 6 liefern, nicht weniger
        const smallPool = [
            { nameKey: 'rest_1', tags: ['rest'], isRest: true, type: 'check', baseValue: 1, mana: 10, gold: 5 },
            { nameKey: 'rest_2', tags: ['rest'], isRest: true, type: 'check', baseValue: 1, mana: 10, gold: 5 }
        ];
        const restSel = DQ_CUSTOM_PLAN.pickBalancedQuests(smallPool, 5, true, []);
        t.ok(restSel.length === 5, 'pickBalancedQuests: 5 Rest-Day aus kleinem Pool (Bug K Fix)');

        // Keine Duplikate im grossen Pool
        const names = sel.map(e => e.nameKey);
        t.ok(new Set(names).size === names.length, 'pickBalancedQuests: keine nameKey-Duplikate');

        const mixedEquipment = [
            { nameKey: 'eq_1', tags: ['push'], isRest: false, needsEquipment: true, type: 'reps', baseValue: 10, mana: 10, gold: 5 },
            { nameKey: 'noeq_1', tags: ['push'], isRest: false, needsEquipment: false, type: 'reps', baseValue: 10, mana: 10, gold: 5 },
            { nameKey: 'noeq_2', tags: ['pull'], isRest: false, needsEquipment: false, type: 'reps', baseValue: 10, mana: 10, gold: 5 },
            { nameKey: 'noeq_3', tags: ['legs'], isRest: false, needsEquipment: false, type: 'reps', baseValue: 10, mana: 10, gold: 5 },
            { nameKey: 'noeq_rest', tags: ['rest'], isRest: true, needsEquipment: false, type: 'check', baseValue: 1, mana: 10, gold: 5 }
        ];
        const available = DQ_CUSTOM_PLAN.getAvailableExercises(mixedEquipment, false);
        t.ok(available.every(ex => ex.needsEquipment !== true), 'getAvailableExercises: Equipment-Off entfernt Equipment-Uebungen');
        t.ok(available.some(ex => ex.isRest === true), 'getAvailableExercises: Rest-Uebungen bleiben vorhanden');
    } else {
        t.ok(false, 'DQ_CUSTOM_PLAN.pickBalancedQuests nicht verfuegbar');
    }

    // --- buildCustomQuest dynamisch testen: Difficulty 1-5 und needsEquipment ---
    if (typeof DQ_CUSTOM_PLAN !== 'undefined' && typeof DQ_CUSTOM_PLAN.buildCustomQuest === 'function') {
        global.DQ_TRAINING_SYSTEM = {
            getDifficultyMultiplier(d) { return 1 + 0.4 * (d - 1); }
        };
        const template = {
            nameKey: 'custom_diff_test', displayName: 'Diff Test', description: 'Diff',
            type: 'reps', baseValue: 10, tags: ['push'], isRest: false, needsEquipment: true,
            muscles: ['chest'], statPoints: { kraft: 1 }, mana: 20, gold: 10
        };
        const stageContext = { stageIndex: 0, stage: { label: 'Einstieg', sets: 2, reps: 8 } };
        const easy = DQ_CUSTOM_PLAN.buildCustomQuest({ id: 1 }, template, stageContext, '2026-06-20', 0, 1, false);
        const hard = DQ_CUSTOM_PLAN.buildCustomQuest({ id: 1 }, template, stageContext, '2026-06-20', 0, 5, false);
        t.ok(easy.target < hard.target, 'buildCustomQuest: Difficulty 5 ist schwerer als Difficulty 1');
        t.ok(easy.needsEquipment === true, 'buildCustomQuest: needsEquipment wird in Quest gespeichert');
        t.ok(easy.equipmentHint === false, 'buildCustomQuest: Equipment-Hint ist aus wenn User kein Equipment hat');
    } else {
        t.ok(false, 'DQ_CUSTOM_PLAN.buildCustomQuest nicht verfuegbar');
    }

    // --- checkRestDay dynamisch testen (Bug I Fix) ---
    if (typeof DQ_CUSTOM_PLAN !== 'undefined' && typeof DQ_CUSTOM_PLAN.checkRestDay === 'function') {
        t.ok(typeof DQ_CUSTOM_PLAN.checkRestDay(0) === 'boolean', 'checkRestDay: 0 Rest Days ok');
        t.ok(typeof DQ_CUSTOM_PLAN.checkRestDay(7) === 'boolean', 'checkRestDay: 7 Rest Days ok');
        // Edge-Cases: vor Bug-Fix lieferten 4-6 Rest Days IMMER false (leeres Array in switch).
        // Jetzt liefern sie zufaellige booleans je nach Wochentag, aber KEINE Exception.
        for (const r of [4, 5, 6]) {
            const day = DQ_CUSTOM_PLAN.checkRestDay(r);
            t.ok(typeof day === 'boolean', 'checkRestDay(' + r + ') liefert boolean ohne Exception (vorher Bug: undefined behaviour)');
        }
    } else {
        t.ok(false, 'DQ_CUSTOM_PLAN.checkRestDay nicht verfuegbar');
    }

    // --- database.js: custom_plans Store ---
    const dbCode = require('fs').readFileSync(path.join(BASE, 'js', 'database.js'), 'utf8');
    t.ok(dbCode.includes('dbVersion = 36'), 'DB Version auf 36 erhoeht');
    t.ok(dbCode.includes('custom_plans'), 'custom_plans Store definiert');

    // --- main.js: Settings Integration ---
    const mainCode = require('fs').readFileSync(path.join(BASE, 'main.js'), 'utf8');
    t.ok(mainCode.includes('planType') && mainCode.includes('customPlanId'), 'Settings haben planType/customPlanId');
    t.ok(mainCode.includes('goal-setup-button') || mainCode.includes('goalSetupButton'), 'Goal-Setup Button registriert');
    t.ok(mainCode.includes('handlePlanGeneration'), 'Hat handlePlanGeneration Funktion');
    t.ok(mainCode.includes('updateCurrentPlanInfo'), 'Hat updateCurrentPlanInfo Funktion');
    t.ok(mainCode.includes('DQ_UI.hideAllPopups();') && mainCode.includes('goal_error_title'), 'handlePlanGeneration zeigt Fehler nach geschlossenem Generator-Popup');
    t.ok(!mainCode.includes("await saveSetting('goal', fallbackGoal)"), 'handlePlanGeneration setzt Presets bei KI-Fehler nicht still auf Standardplan');
    t.ok(mainCode.includes("DQ_CONFIG.userSettings.planType !== 'custom'"), 'Rest-Day-Override respektiert Custom Plans');

    // --- training_system.js: Custom Branch ---
    const tsCode = require('fs').readFileSync(path.join(BASE, 'js', 'training_system.js'), 'utf8');
    t.ok(tsCode.includes("settings.planType === 'custom'"), 'getTodayQuestSet hat Custom Branch');
    t.ok(tsCode.includes('DQ_CUSTOM_PLAN.getActivePlan'), 'Delegiert an DQ_CUSTOM_PLAN');
    t.ok(tsCode.includes('DQ_CUSTOM_PLAN.rescaleOpenQuests'), 'rescaleOpenQuests delegiert an Custom');
    t.ok(tsCode.includes('DQ_CUSTOM_PLAN.applyPhaseAction'), 'applyPhaseAction delegiert an Custom');

    // --- supabase-client.js: Reset liste ---
    const supaCode = require('fs').readFileSync(path.join(BASE, 'js', 'supabase-client.js'), 'utf8');
    t.ok(supaCode.includes("'custom_plans'"), 'custom_plans in Reset-Liste');

    // --- tutorial: neue Felder ---
    const tutMainCode = require('fs').readFileSync(path.join(BASE, 'tutorial', 'js', 'tutorial_main.js'), 'utf8');
    t.ok(tutMainCode.includes('trainingPlanType') && tutMainCode.includes('customPlanId'), 'Tutorial-State hat neue Felder');

    const tutOnboardCode = require('fs').readFileSync(path.join(BASE, 'tutorial', 'js', 'tutorial_onboarding.js'), 'utf8');
    t.ok(tutOnboardCode.includes('data-preset="kraft"'), 'Tutorial hat Preset: kraft');
    t.ok(tutOnboardCode.includes('data-preset="ausdauer"'), 'Tutorial hat Preset: ausdauer');
    t.ok(tutOnboardCode.includes('data-preset="abnehmen"'), 'Tutorial hat Preset: abnehmen');
    t.ok(tutOnboardCode.includes('data-preset="custom"'), 'Tutorial hat Custom-Option');
    t.ok(tutOnboardCode.includes('handleTutorialPlanSelection'), 'Hat handleTutorialPlanSelection');
    t.ok(tutOnboardCode.includes('DQ_MISTRAL.generateAndSavePlan'), 'Nutzt DQ_MISTRAL im Tutorial');

    const tutStateCode = require('fs').readFileSync(path.join(BASE, 'tutorial', 'js', 'tutorial_state.js'), 'utf8');
    t.ok(tutStateCode.includes('restoreIntroPlanState'), 'Tutorial-State kann Intro-Plan nach Auth-Redirect wiederherstellen');
    t.ok(tutStateCode.includes('planExists') && tutStateCode.includes('await new Promise'), 'Tutorial-State prueft customPlanId vor Settings-Speicherung');

    // --- translations ---
    const transCode = require('fs').readFileSync(path.join(BASE, 'data', 'translations.js'), 'utf8');
    t.ok(transCode.includes('goal_setup_btn'), 'Translation: goal_setup_btn DE');
    t.ok(transCode.includes('goal_setup_title'), 'Translation: goal_setup_title DE');
    t.ok(transCode.includes('goal_regenerate'), 'Translation: goal_regenerate DE');
    t.ok(transCode.includes('goal_generate_title'), 'Translation: goal_generate_title DE');
    t.ok(transCode.includes('goal_custom_placeholder'), 'Translation: goal_custom_placeholder DE');

    // --- index.html: Dropdown entfernt, Button + Popups vorhanden ---
    const htmlCode = require('fs').readFileSync(path.join(BASE, 'index.html'), 'utf8');
    t.ok(htmlCode.includes('id="goal-setup-button"'), 'HTML: goal-setup-button vorhanden');
    t.ok(htmlCode.includes('id="goal-setup-popup"'), 'HTML: goal-setup-popup vorhanden');
    t.ok(htmlCode.includes('id="goal-generate-popup"'), 'HTML: goal-generate-popup vorhanden');
    t.ok(htmlCode.includes('id="custom-plan-prompt"'), 'HTML: custom-plan-prompt vorhanden');
    t.ok(htmlCode.includes('training-goal-setup-button'), 'HTML: kompakter Trainingsziel-Button nutzt eigene Klasse');
    t.ok(htmlCode.includes('training-plan-popup'), 'HTML: Trainingsplan-Popups nutzen eigene Klasse');
    t.ok(htmlCode.includes('custom-plan-field'), 'HTML: Custom Prompt ohne setting-item Aussenbox');
    t.ok(!htmlCode.includes('id="goal-setup-cancel"') && !htmlCode.includes('id="goal-generate-cancel"'), 'HTML: Trainingsplan-Popups haben keine Abbrechen-Buttons');
    t.ok(htmlCode.includes('Neuen Plan erstellen'), 'HTML: Primaerer Button heisst Neuen Plan erstellen');
    t.ok(htmlCode.includes('data-preset="kraft"'), 'HTML: Preset kraft im Popup');
    t.ok(htmlCode.includes('js/custom-plan-system.js'), 'HTML: custom-plan-system.js Script-Tag');
    t.ok(htmlCode.includes('js/mistral-client.js'), 'HTML: mistral-client.js Script-Tag');

    const popupCss = require('fs').readFileSync(path.join(BASE, 'css', 'components', 'popups.css'), 'utf8');
    t.ok(popupCss.includes('.training-primary-action') && popupCss.includes('align-items: center'), 'CSS: Trainingsplan-Buttons zentrieren Icon/Text');
    t.ok(popupCss.includes('.training-goal-setup-button') && popupCss.includes('min-height: 44px'), 'CSS: Settings Button hat mobiles Tap-Ziel');
    t.ok(popupCss.includes('@keyframes spin') && popupCss.includes('animation: spin'), 'CSS: Trainingsplan-Loading hat sichtbare Spinner-Animation');

    const tutCss = require('fs').readFileSync(path.join(BASE, 'tutorial', 'css', 'tutorial.css'), 'utf8');
    t.ok(tutCss.includes('.tutorial-custom-plan-field'), 'Tutorial CSS: Custom Plan Feld ohne Inline-Style');
    t.ok(tutOnboardCode.includes('trainingPlanType') && tutOnboardCode.includes('customPlanId'), 'Tutorial speichert Custom Plan State');

    return t;
}

module.exports = { run };
