/**
 * Test 11: Intro-Onboarding und Equipment-Guards.
 * Sichert ab, dass Auswahl-Schritte wirklich auf User-Klick warten
 * und Quest-Generatoren hasEquipment=false respektieren.
 */
const { TestRunner, BASE, loadData } = require('./helpers');
const fs = require('fs');
const path = require('path');

function getBlock(source, startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    if (start === -1 || end === -1) return '';
    return source.slice(start, end);
}

function run() {
    const t = new TestRunner('Onboarding-Flow & Equipment');

    const tutorialMain = fs.readFileSync(path.join(BASE, 'tutorial/js/tutorial_main.js'), 'utf8');
    const onboarding = fs.readFileSync(path.join(BASE, 'tutorial/js/tutorial_onboarding.js'), 'utf8');
    const trainingSystem = fs.readFileSync(path.join(BASE, 'js/training_system.js'), 'utf8');
    const wgerImport = fs.readFileSync(path.join(BASE, 'js/wger-import.js'), 'utf8');
    const manualPlan = fs.readFileSync(path.join(BASE, 'js/manual-plan-system.js'), 'utf8');
    const main = fs.readFileSync(path.join(BASE, 'main.js'), 'utf8');

    const languageBlock = getBlock(onboarding, 'async showLanguageSelection()', 'async showInstallChoice()');
    const installBlock = getBlock(onboarding, 'async showInstallChoice()', 'async showInstallInstructions()');

    t.ok(tutorialMain.includes('await this.showLanguageSelection();'), 'Intro wartet auf Sprach-Auswahl');
    t.ok(tutorialMain.includes('await this.showInstallChoice();'), 'Intro wartet auf Installations-Auswahl');
    t.ok(languageBlock.includes('return new Promise(resolve => {'), 'Sprach-Auswahl resolved erst nach Klick');
    t.ok(languageBlock.includes('buttons.forEach(button => button.disabled = true);'), 'Sprach-Auswahl hat Doppelklick-Schutz');
    t.ok(languageBlock.includes('resolve();'), 'Sprach-Auswahl beendet Promise explizit');
    t.ok(installBlock.includes('return new Promise(resolve => {'), 'Installations-Auswahl resolved erst nach Auswahl');
    t.ok(installBlock.includes('await self.showInstallInstructions();'), 'App-Auswahl zeigt Installationshinweise vor naechstem Schritt');
    t.ok(installBlock.includes('resolve();'), 'Installations-Auswahl beendet Promise explizit');
    t.ok(onboarding.includes("language: this.selectedLanguage || 'de'"), 'Neue Intro-Settings speichern gewaehlte Sprache');
    t.ok(onboarding.includes("settings.language = this.selectedLanguage || settings.language || 'de';"), 'Bestehende Intro-Settings aktualisieren gewaehlte Sprache');

    t.ok(onboarding.includes('settings.hasEquipment = this.hasEquipment;'), 'Intro speichert hasEquipment in Settings');
    t.ok(onboarding.includes('settings.trainingEquipment = this.trainingEquipment;'), 'Intro speichert granulare trainingEquipment-Auswahl');
    t.ok(onboarding.includes('data-tutorial-equipment="pullupBar"'), 'Intro bietet Klimmzugstange als Equipment-Auswahl');
    t.ok(main.includes('normalizeTrainingEquipmentSettings'), 'Settings migrieren altes hasEquipment in trainingEquipment');
    t.ok(trainingSystem.includes('isExerciseAllowedByEquipment'), 'Predefined-Generator nutzt granulare Equipment-Pruefung');
    t.ok(trainingSystem.includes('pickDailyQuestCandidate'), 'Predefined-Generator nutzt Daily-Quest-Allowlist');
    t.ok(wgerImport.includes('isAllowedByUserEquipment'), 'WGER-Listen respektieren granulare Equipment-Auswahl');
    t.ok(manualPlan.includes('isExerciseAvailable'), 'Custom-Plan-Generator filtert Equipment-Uebungen granular');
    t.ok(main.includes('questsToday.some(questNeedsEquipment)'), 'DailyQuest-Regeneration erkennt unpassende Equipment-Quests');

    const { DQ_DATA } = loadData();
    global.window = global;
    global.DQ_DATA = DQ_DATA;
    global.DQ_CONFIG = {
        userSettings: {
            hasEquipment: false,
            trainingEquipment: { dumbbell: false, barbell: false, pullupBar: false, bench: false, kettlebell: false }
        }
    };
    new Function(trainingSystem.replace(/^const\s+DQ_TRAINING_SYSTEM\s*=/m, 'global.DQ_TRAINING_SYSTEM ='))();

    const noEquipmentSettings = global.DQ_CONFIG.userSettings;
    const dumbbellSettings = {
        hasEquipment: true,
        trainingEquipment: { dumbbell: true, barbell: false, pullupBar: false, bench: false, kettlebell: false }
    };
    t.ok(DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment({ nameKey: 'push_ups_normal', requiredEquipment: [] }, noEquipmentSettings), 'Bodyweight-Quest bleibt ohne Equipment erlaubt');
    t.ok(!DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment({ nameKey: 'legacy_unknown_equipment', needsEquipment: true, requiredEquipment: [], equipment: [] }, noEquipmentSettings), 'Legacy needsEquipment ohne konkrete Equipment-Liste ist nicht erlaubt');
    t.ok(!DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment({ nameKey: 'bicep_curls', requiredEquipment: ['dumbbell'] }, noEquipmentSettings), 'Dumbbell-Quest ohne Dumbbell nicht erlaubt');
    t.ok(DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment({ nameKey: 'bicep_curls', requiredEquipment: ['dumbbell'] }, dumbbellSettings), 'Dumbbell-Quest mit Dumbbell erlaubt');

    return t;
}

module.exports = { run, name: '11-onboarding-equipment' };
