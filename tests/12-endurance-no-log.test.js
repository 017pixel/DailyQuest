/**
 * Test 12: Ausdauer-Quests ohne Eintragen-Flow.
 * Distanz-/Ausdauer-Aufgaben sollen Ziele anzeigen, aber per OK abschliessbar sein.
 */
const { loadData, TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

function run() {
    const t = new TestRunner('Ausdauer ohne Eintragen');
    const { DQ_DATA } = loadData();

    const endurance = DQ_DATA.trainingPlans.endurance;
    const wgerDefaults = DQ_DATA.wgerDefaults || {};
    t.equal(endurance.completionMode, 'tap', 'Endurance-Plan nutzt direkten OK-Abschluss');
    t.equal(endurance.stageType, 'tap', 'Endurance-Plan ist kein Log-Plan mehr');
    t.ok((wgerDefaults.SLOT_CATEGORY_MAPPING?.distance || []).includes('Cardio'), 'WGER-Distanzslot nutzt Cardio-Uebungen');
    t.ok((wgerDefaults.SLOT_CATEGORY_MAPPING?.distance || []).includes('Legs'), 'WGER-Distanzslot nutzt Bein-Uebungen');
    t.ok((wgerDefaults.SLOT_CATEGORY_MAPPING?.tempo || []).includes('Cardio'), 'WGER-Temposlot nutzt Cardio-Uebungen');

    const trainingSystem = fs.readFileSync(path.join(BASE, 'js/training_system.js'), 'utf8');
    const exercisesTraining = fs.readFileSync(path.join(BASE, 'js/page_exercises_training.js'), 'utf8');
    const main = fs.readFileSync(path.join(BASE, 'main.js'), 'utf8');

    t.ok(trainingSystem.includes("return 'tap';") && !trainingSystem.includes("return 'log';"), 'Endurance-Kandidaten erzeugen keinen Log-Abschluss mehr');
    t.ok(trainingSystem.includes("if (slot.key === 'distance' && distance)"), 'Distance-Slot bekommt Strecken-Zielanzeige');
    t.ok(trainingSystem.includes("targetLabel = `${distance} km`;"), 'Strecke bleibt als km-Ziel sichtbar');
    t.ok(trainingSystem.includes("if (quest.completionMode === 'log') return 'OK';"), 'Legacy-Log-Quests zeigen OK statt Eintragen');
    t.ok(!exercisesTraining.includes("await this.openEnduranceEntryPopup(questId);"), 'Daily-Quest-Abschluss oeffnet kein Eintragen-Popup mehr');
    t.ok(!main.includes('Ausdauer-Daten müssen zuerst eingetragen werden.'), 'Quest-Abschluss blockiert nicht mehr auf Ausdauer-Eintrag');

    return t;
}

module.exports = { run, name: '12-endurance-no-log' };
