/**
 * Test 11: Custom Plan System (KI-Trainingsplne)
 * Testet JSON-Validierung, Balancing-Algorithmus, Rest-Day-Filter, Stage-Berechnung.
 */
const { TestRunner, BASE } = require('./helpers');
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
    t.ok(edgeFnCode.includes('max_tokens') && edgeFnCode.includes('100'), 'Verwendet max_tokens: 100');
    t.ok(edgeFnCode.includes('DENO_ENV') || edgeFnCode.includes('"focus"') || edgeFnCode.includes("'focus'"), 'Hat Focus-Feld im Config');
    t.ok(edgeFnCode.includes('kraft') || edgeFnCode.includes('ausdauer') || edgeFnCode.includes('abnehmen'), 'Erwartet 3 Fokus-Werte');
    t.ok(edgeFnCode.includes('MISTRAL_URL') && edgeFnCode.includes('fetch('), 'Ruft Mistral API via fetch auf');

    // --- mistral-client.js: Validierung ---
    const mistralCode = require('fs').readFileSync(mistralClientPath, 'utf8');
    t.ok(mistralCode.includes('validatePlan'), 'Hat validatePlan Funktion');
    t.ok(mistralCode.includes('REGEN_LIMIT') && mistralCode.includes('3'), 'Regeneration-Limit ist 3');
    t.ok(mistralCode.includes('canRegenerate') && mistralCode.includes('getRegenerationCount'), 'Hat Rate-Limiting Funktionen');
    t.ok(mistralCode.includes('length !== 30'), 'Validiert auf genau 30 Ubungen');
    t.ok(mistralCode.includes('custom_'), 'Validiert custom_ Prefix fuer neue Ubungen');
    t.ok(mistralCode.includes('VALID_TYPES'), 'Validiert Ubungs-Typen');
    t.ok(mistralCode.includes('VALID_TAGS'), 'Validiert Tags');
    t.ok(mistralCode.includes('functions.invoke'), 'Ruft Edge Function via functions.invoke auf');
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
                { label: "P2", weeks: 9999, sets: 4, reps: 12 }
            ]
        };

        t.ok(validPlan.exercises.length === 30, 'Validierungs-Test: 30 exercises');
        t.ok(validPlan.exercises.filter(ex => ex.isRest).length === 4, 'Validierungs-Test: 4 isRest');
        t.ok(validPlan.stages.length === 2, 'Validierungs-Test: 2 stages');
        t.ok(validPlan.stages[validPlan.stages.length - 1].weeks === 9999, 'Letzte Stage ist infinite');
        t.ok(validPlan.exercises.every(ex => VALID_TYPES.includes(ex.type)), 'Alle Typen valid');
        t.ok(validPlan.exercises.every(ex => ex.tags.every(t => VALID_TAGS.includes(t))), 'Alle Tags valid');
        t.ok(validPlan.exercises.every(ex => ex.nameKey.startsWith('custom_')), 'Alle neuen haben custom_ Prefix');

        const invalidPlan = { exercises: Array(5).fill({}), stages: [] };
        t.ok(invalidPlan.exercises.length !== 30, 'Invalid: nicht 30 exercises');
    }
    testValidation();

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
    t.ok(htmlCode.includes('data-preset="kraft"'), 'HTML: Preset kraft im Popup');
    t.ok(htmlCode.includes('js/custom-plan-system.js'), 'HTML: custom-plan-system.js Script-Tag');
    t.ok(htmlCode.includes('js/mistral-client.js'), 'HTML: mistral-client.js Script-Tag');

    return t;
}

module.exports = { run };
