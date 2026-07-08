/**
 * Test 15: KI-Plan-Import.
 * Prueft den 7-Tage-JSON-Vertrag fuer extern generierte Trainingsplaene.
 */
const { TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

function loadAiImport() {
    global.window = global;
    global.DQ_DATA = {
        translations: {
            de: {
                ai_plan_error_empty: 'Bitte fuege zuerst das JSON der KI ein.',
                ai_plan_error_invalid_json: 'Das eingefuegte JSON ist nicht gueltig.'
            }
        }
    };
    global.DQ_CONFIG = { userSettings: { language: 'de' } };
    const code = fs.readFileSync(path.join(BASE, 'js/ai-plan-import.js'), 'utf8');
    new Function(code)();
    return global.DQ_AI_PLAN_IMPORT;
}

function loadManualPlan() {
    global.window = global;
    const code = fs.readFileSync(path.join(BASE, 'js/manual-plan-system.js'), 'utf8');
    new Function(code)();
    return global.DQ_MANUAL_PLAN;
}

function exercise(id, type = 'reps') {
    const base = {
        id,
        nameDe: `Uebung ${id}`,
        nameEn: `Exercise ${id}`,
        descriptionDe: 'Sauber ausfuehren, kontrolliert atmen und die Technik halten.',
        type,
        category: 'Chest',
        muscles: ['chest'],
        equipment: [],
        statPoints: { kraft: 1 },
        manaReward: 20,
        goldReward: 6
    };
    if (type === 'reps') return { ...base, sets: 3, reps: 10 };
    if (type === 'time') return { ...base, durationSeconds: 45 };
    return base;
}

function validPayload(schemaVersion = 1) {
    return {
        schemaVersion,
        planName: '7 Tage Testplan',
        language: 'de',
        cycleLength: 7,
        phases: schemaVersion === 2 ? [
            { labelDe: 'Grundlage', labelEn: 'Foundation', summaryDe: 'Sauber starten.', weeks: 2, repsMultiplier: 1, timeMultiplier: 1, rewardMultiplier: 1, setsAdd: 0 },
            { labelDe: 'Intensiv', labelEn: 'Intense', summaryDe: 'Maximal.', weeks: 9999, repsMultiplier: 1.2, timeMultiplier: 1.1, rewardMultiplier: 1.15, setsAdd: 1 }
        ] : [],
        days: Array.from({ length: 7 }, (_, index) => {
            const day = index + 1;
            if (day === 3 || day === 6) {
                return { day, kind: 'rest', label: 'Mobility Restday', restFocus: 'mobility', summaryDe: 'Aktive Erholung mit Spaziergang.', exercises: [] };
            }
            return {
                day,
                kind: 'training',
                label: `Training ${day}`,
                exercises: Array.from({ length: 6 }, (__, exIndex) => exercise(`d${day}_e${exIndex + 1}`, exIndex === 1 ? 'time' : (exIndex === 2 ? 'check' : 'reps')))
            };
        })
    };
}

function run() {
    const t = new TestRunner('KI-Plan-Import');
    const importer = loadAiImport();

    t.ok(!!importer, 'DQ_AI_PLAN_IMPORT wird geladen');
    t.ok(importer.buildPrompt().includes('exakt 7 Tage'), 'Prompt erzwingt 7-Tage-Grenze');
    t.ok(importer.buildPrompt().includes('exakt 6 Uebungen'), 'Prompt erzwingt 6 Uebungen pro Trainingstag');
    t.ok(importer.buildPrompt().includes('schemaVersion MUSS 2'), 'Prompt fordert schemaVersion 2');
    t.ok(importer.buildPrompt().includes('repsMultiplier'), 'Prompt enthaelt Phasen-Felder');
    t.ok(importer.buildPrompt().includes('Stelle zuerst Rueckfragen'), 'Prompt fordert Rueckfragen vor JSON');
    t.ok(importer.buildPrompt().includes('Restdays werden im JSON'), 'Prompt erklaert JSON-konfigurierte Restdays');

    const validV1 = importer.validatePayload(validPayload(1));
    t.ok(validV1.valid, 'Schema v1 wird akzeptiert');
    t.equal(validV1.normalized.schemaVersion, 1, 'Schema v1 bleibt als version 1 erhalten');
    t.equal(validV1.normalized.days.length, 7, 'Normalisierter Plan (v1) hat 7 Tage');
    t.equal(validV1.normalized.exercises.length, 30, '5 Trainingstage ergeben 30 Uebungen');
    t.ok(validV1.normalized.exercises.every(ex => String(ex.id).startsWith('ai:')), 'Importierte Uebungen nutzen ai:-IDs');
    t.ok(validV1.normalized.exercises.some(ex => ex.type === 'reps'), 'Import akzeptiert reps-Uebungen');
    t.ok(validV1.normalized.exercises.some(ex => ex.type === 'time'), 'Import akzeptiert time-Uebungen');
    t.ok(validV1.normalized.exercises.some(ex => ex.type === 'check'), 'Import akzeptiert check-Uebungen');
    t.equal(validV1.normalized.days.find(day => day.day === 3).exerciseIds.length, 0, 'Restday bleibt ohne Trainingsuebungen');
    t.equal(validV1.normalized.days.find(day => day.day === 3).restFocus, 'mobility', 'Restday restFocus wird normalisiert');
    t.equal(validV1.normalized.days.find(day => day.day === 3).summaryDe, 'Aktive Erholung mit Spaziergang.', 'Restday summaryDe wird normalisiert');
    t.ok(Array.isArray(validV1.normalized.phases) && validV1.normalized.phases.length === 0, 'Schema v1 hat leere phases');

    const validV2 = importer.validatePayload(validPayload(2));
    t.ok(validV2.valid, 'Schema v2 mit Phasen wird akzeptiert');
    t.equal(validV2.normalized.schemaVersion, 2, 'Schema v2 bleibt als version 2 erhalten');
    t.equal(validV2.normalized.phases.length, 2, 'Schema v2 hat 2 Phasen');
    t.equal(validV2.normalized.phases[0].labelDe, 'Grundlage', 'Phase 1 labelDe korrekt');
    t.equal(validV2.normalized.phases[0].weeks, 2, 'Phase 1 weeks korrekt');
    t.equal(validV2.normalized.phases[0].repsMultiplier, 1, 'Phase 1 repsMultiplier korrekt');
    t.equal(validV2.normalized.phases[1].repsMultiplier, 1.2, 'Phase 2 repsMultiplier korrekt');
    t.equal(validV2.normalized.phases[1].setsAdd, 1, 'Phase 2 setsAdd korrekt');

    const fenced = importer.parseJsonInput('```json\n' + JSON.stringify(validPayload(2)) + '\n```');
    t.equal(fenced.schemaVersion, 2, 'Markdown-Codefence mit v2 wird bereinigt');

    const v2NoPhasePayload = validPayload(2);
    delete v2NoPhasePayload.phases;
    const v2NoPhaseResult = importer.validatePayload(v2NoPhasePayload);
    t.ok(v2NoPhaseResult.valid, 'Schema v2 ohne phases-Array wird akzeptiert (leer)');
    t.ok(Array.isArray(v2NoPhaseResult.normalized.phases) && v2NoPhaseResult.normalized.phases.length === 0, 'Fehlende phases wird zu leerem Array');

    const badSchema = validPayload(2);
    badSchema.schemaVersion = 3;
    const badSchemaResult = importer.validatePayload(badSchema);
    t.ok(!badSchemaResult.valid, 'Schema version 3 wird abgelehnt');
    t.ok(badSchemaResult.errors.some(e => e.path === 'schemaVersion'), 'Fehler zeigt schemaVersion-Pfad');

    const tooManyPhases = validPayload(2);
    tooManyPhases.phases = Array.from({ length: 10 }, (_, i) => ({ labelDe: `Phase ${i + 1}`, weeks: 1 }));
    const manyPhaseResult = importer.validatePayload(tooManyPhases);
    t.ok(!manyPhaseResult.valid, 'Mehr als 8 Phasen werden abgelehnt');
    t.ok(manyPhaseResult.errors.some(e => e.path === 'phases'), 'Fehler zeigt phases-Pfad');

    const invalidPhase = validPayload(2);
    invalidPhase.phases = [{ labelDe: 'Bad', weeks: 0 }];
    const badPhaseResult = importer.validatePayload(invalidPhase);
    t.ok(!badPhaseResult.valid, 'Phase mit weeks=0 wird abgelehnt');
    t.ok(badPhaseResult.errors.some(e => e.path.includes('phases[0].weeks')), 'Fehler zeigt phases[0].weeks');

    const sixDays = validPayload(1);
    sixDays.days = sixDays.days.slice(0, 6);
    const sixDayResult = importer.validatePayload(sixDays);
    t.ok(!sixDayResult.valid, 'Plan mit 6 Tagen wird abgelehnt');
    t.ok(sixDayResult.errors.some(error => error.message.includes('exakt 7')), 'Fehler nennt die 7-Tage-Regel');

    const fiveExercises = validPayload(1);
    fiveExercises.days[0].exercises = fiveExercises.days[0].exercises.slice(0, 5);
    const fiveExerciseResult = importer.validatePayload(fiveExercises);
    t.ok(!fiveExerciseResult.valid, 'Trainingstag mit 5 Uebungen wird abgelehnt');
    t.ok(fiveExerciseResult.errors.some(error => error.message.includes('exakt 6')), 'Fehler nennt die 6-Uebungen-Regel');

    const restWithExercise = validPayload(1);
    restWithExercise.days[2].exercises = [exercise('rest_wrong')];
    const restResult = importer.validatePayload(restWithExercise);
    t.ok(!restResult.valid, 'Restday mit Uebung wird abgelehnt');
    t.ok(restResult.errors.some(error => error.message.includes('Restday')), 'Fehler nennt Restday-Regel');

    const badType = validPayload(1);
    badType.days[0].exercises[0].type = 'interval';
    const badTypeResult = importer.validatePayload(badType);
    t.ok(!badTypeResult.valid, 'Ungueltiger Uebungstyp wird abgelehnt');
    t.ok(importer.buildFollowUpPrompt(badTypeResult.errors, JSON.stringify(badType)).includes('reps, time oder check'), 'Follow-up Prompt nennt erlaubte Typen');
    t.ok(importer.buildFollowUpPrompt(badTypeResult.errors, JSON.stringify(badType)).includes('Phasen'), 'Follow-up Prompt erkennt schemaVersion 2 Phasen');

    const manualPlan = loadManualPlan();
    global.DQ_TRAINING_SYSTEM = { getDifficultyMultiplier: difficulty => ({ 1: 0.8, 2: 0.9, 3: 1, 4: 1.15, 5: 1.3 }[difficulty] || 1) };
    const phaseContext = { phaseIndex: 1, phase: { repsMultiplier: 1.2, timeMultiplier: 1.1, rewardMultiplier: 1.15, setsAdd: 1 } };
    const scaledQuest = manualPlan.buildQuest({ nameKey: 'ai_strength', displayName: 'AI Strength', type: 'reps', baseValue: 10, sets: 3, manaReward: 20, goldReward: 6, muscles: ['chest'], statPoints: { kraft: 1 }, source: 'ai_generated' }, '2026-07-08', 0, 5, true, phaseContext);
    t.equal(scaledQuest.setPlan.reps, 16, 'KI-Quest skaliert reps mit difficulty und Phase');
    t.equal(scaledQuest.setPlan.sets, 4, 'KI-Quest addiert setsAdd aus Phase');
    t.ok(scaledQuest.manaReward > 35, 'KI-Quest skaliert Rewards mit difficulty und Phase');

    const timerQuest = manualPlan.buildQuest({ nameKey: 'ai_timer', displayName: 'AI Timer', type: 'time', baseValue: 60, manaReward: 15, goldReward: 5, muscles: ['core'], statPoints: { ausdauer: 1 }, source: 'ai_generated' }, '2026-07-08', 0, 5, true, phaseContext);
    t.equal(timerQuest.completionMode, 'timer', 'KI-time-Uebung nutzt Timer-Flow');
    t.equal(timerQuest.target, 86, 'KI-time-Uebung skaliert Dauer mit difficulty und Phase');

    const checkQuest = manualPlan.buildQuest({ nameKey: 'ai_check', displayName: 'AI Check', type: 'check', baseValue: 1, manaReward: 12, goldReward: 4, muscles: ['mobility'], statPoints: { willenskraft: 0.5 }, source: 'ai_generated' }, '2026-07-08', 0, 5, true, phaseContext);
    t.equal(checkQuest.completionMode, 'tap', 'KI-check-Uebung nutzt Abhak-Flow');
    t.equal(checkQuest.canComplete, true, 'KI-check-Uebung ist direkt abschliessbar');

    global.DQ_DATA.exercisePool = { restday: [{ nameKey: 'stretch_10min', type: 'time', baseValue: 60, mana: 10, gold: 4, statPoints: { beweglichkeit: 1 }, muscles: ['mobility'] }] };
    const restSetPromise = manualPlan.buildRestDayQuestSet('2026-07-08', 3, { day: 3, kind: 'rest', label: 'Mobility Restday', restFocus: 'mobility', summaryDe: 'Locker bewegen.' });
    return Promise.resolve(restSetPromise).then(restSet => {
        t.equal(restSet.goal, 'custom_restday', 'KI-Restday wird als custom_restday erkannt');
        t.equal(restSet.scheduledDay.label, 'Mobility Restday', 'KI-Restday behaelt Schedule-Metadaten');
        t.equal(restSet.quests[0].phaseLabel, 'Mobility Restday', 'Restday-Quest nutzt JSON-Label');
        t.equal(restSet.quests[0].restFocus, 'mobility', 'Restday-Quest nutzt JSON-restFocus');

        return t;
    });
}

module.exports = { run, name: '15-ai-plan-import' };
