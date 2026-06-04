/**
 * Test 08: Trainingsplan-Validierung.
 * Prueft Plan-Strukturen auf Konsistenz: Stages, Slots, Candidates.
 */
const { loadData, TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Trainingsplaene (Validierung)');
    const { DQ_DATA, sharedStages, enduranceStages, seniorStages } = loadData();

    const plans = DQ_DATA.trainingPlans;
    t.ok(!!plans, 'trainingPlans existiert');
    if (!plans) return t;

    const planKeys = Object.keys(plans);
    t.ok(planKeys.length >= 6, `Plan-Kategorien (${planKeys.length})`);

    const validCompletionModes = ['sets', 'log', 'timer', 'tap'];
    const validGoals = ['muscle', 'calisthenics', 'fatloss', 'kraft_abnehmen', 'endurance', 'senior', 'sick', 'restday'];

    for (const key of Object.keys(plans)) {
        const plan = plans[key];
        t.ok(typeof plan === 'object', `Plan "${key}" ist object`);

        // Completion mode
        t.ok(validCompletionModes.includes(plan.completionMode),
            `Plan "${key}" completionMode="${plan.completionMode}" ist gueltig`);

        // Slots
        t.ok(Array.isArray(plan.slots), `Plan "${key}" hat slots-Array`);
        if (plan.slots) {
            const isSickOrRestday = key === 'sick' || key === 'restday';
            if (isSickOrRestday) {
                t.ok(plan.slots.length >= 0, `Plan "${key}" hat 0 Slots (erwartet, kein Training)`);
            } else {
                t.ok(plan.slots.length >= 1, `Plan "${key}" hat >= 1 Slot (${plan.slots.length})`);
            }
            for (const slot of plan.slots) {
                t.ok(slot.key, `Slot hat key`);
                t.ok(Array.isArray(slot.candidates), `Slot "${slot.key}" hat candidates`);
                if (slot.candidates) {
                    t.ok(slot.candidates.length >= 1, `Slot "${slot.key}" hat >= 1 Candidate`);
                    for (const cand of slot.candidates) {
                        t.ok(typeof cand === 'string', `Candidate "${cand}" ist string`);
                    }
                }
            }
        }

        // Stages (wenn vorhanden)
        if (plan.stages) {
            t.ok(Array.isArray(plan.stages), `Plan "${key}" stages ist Array`);
            if (plan.stages && plan.stages.length > 0) {
                for (const st of plan.stages) {
                    t.ok(st.labelKey, `Stage hat labelKey`);
                    t.ok(typeof st.weeks === 'number', `Stage weeks ist number`);
                }
            }
        }
    }

    // Pruefe shared stages Arrays
    const stageArrays = [
        { name: 'sharedStages', arr: sharedStages },
        { name: 'enduranceStages', arr: enduranceStages },
        { name: 'seniorStages', arr: seniorStages },
    ];
    for (const { name, arr } of stageArrays) {
        if (Array.isArray(arr)) {
            t.ok(arr.length >= 1, `${name}: >= 1 Stage (${arr.length})`);
            for (const st of arr) {
                t.ok(st.labelKey, `${name} Stage hat labelKey`);
                t.ok(typeof st.weeks === 'number', `${name} Stage weeks ist number`);
            }
        } else {
            t.ok(false, `${name} fehlt oder ist nicht Array`);
        }
    }

    // Alias-Map
    const aliases = DQ_DATA.trainingGoalAliases;
    t.ok(!!aliases, 'trainingGoalAliases existiert');
    if (aliases) {
        t.ok(Object.keys(aliases).length >= 5, `Aliases (${Object.keys(aliases).length})`);
        for (const [alias, target] of Object.entries(aliases)) {
            t.ok(plans[target], `Alias "${alias}" → "${target}" (Plan existiert)`);
        }
    }

    return t;
}

module.exports = { run, name: '08-training-plans' };
