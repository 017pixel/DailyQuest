/**
 * Test 19: KI-Plan-Wochentage.
 * Stellt sicher, dass day 1..7 immer Montag..Sonntag bedeutet und nicht
 * relativ zum Import- oder Aktivierungsdatum verschoben wird.
 */
const { TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

function loadManualPlan() {
    global.window = global;
    const code = fs.readFileSync(path.join(BASE, 'js/manual-plan-system.js'), 'utf8');
    new Function(code)();
    return global.DQ_MANUAL_PLAN;
}

function run() {
    const t = new TestRunner('KI-Plan-Wochentage');
    const manualPlan = loadManualPlan();

    const stateStartedOnSunday = { startedAt: '2026-08-09T12:00:00.000Z' };

    t.equal(
        manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-10', 7),
        0,
        'Montag bleibt day 1, auch wenn der KI-Plan am Sonntag gestartet wurde'
    );
    t.equal(
        manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-11', 7),
        1,
        'Dienstag entspricht day 2'
    );
    t.equal(
        manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-15', 7),
        5,
        'Samstag entspricht day 6'
    );
    t.equal(
        manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-16', 7),
        6,
        'Sonntag entspricht day 7'
    );

    const schedule = [
        { day: 1, kind: 'training' },
        { day: 2, kind: 'rest' },
        { day: 3, kind: 'training' },
        { day: 4, kind: 'training' },
        { day: 5, kind: 'training' },
        { day: 6, kind: 'rest' },
        { day: 7, kind: 'training' }
    ];

    const monday = schedule[manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-10', 7)];
    const tuesday = schedule[manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-11', 7)];
    const saturday = schedule[manualPlan.getCycleDayIndex(stateStartedOnSunday, '2026-08-15', 7)];

    t.equal(monday.kind, 'training', 'Montag wird bei Dienstag/Samstag-Restdays als Training erkannt');
    t.equal(tuesday.kind, 'rest', 'Dienstag bleibt Restday');
    t.equal(saturday.kind, 'rest', 'Samstag bleibt Restday');

    return t;
}

module.exports = { run, name: '19-ai-plan-weekday-schedule' };
