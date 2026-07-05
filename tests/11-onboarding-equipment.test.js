/**
 * Test 11: Intro-Onboarding und Equipment-Guards.
 * Sichert ab, dass Auswahl-Schritte wirklich auf User-Klick warten
 * und Quest-Generatoren hasEquipment=false respektieren.
 */
const { TestRunner, BASE } = require('./helpers');
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
    t.ok(trainingSystem.includes('candidates.filter(ex => hasEquipment !== false || !ex.needsEquipment)'), 'Predefined-Generator filtert Equipment-Kandidaten');
    t.ok(trainingSystem.includes("goalExercises.filter(ex => !ex.needsEquipment"), 'Predefined-Generator nutzt No-Equipment-Fallback');
    t.ok(wgerImport.includes('if (hasEquipment === false && ex.needsEquipment) return false;'), 'WGER-Trainingspool filtert Equipment-Uebungen');
    t.ok(manualPlan.includes('pool = hasEquipment ? pool : pool.filter(ex => !ex.needsEquipment);'), 'Custom-Plan-Generator filtert Equipment-Uebungen');
    t.ok(main.includes('!hasEquipment && questsToday.some(questNeedsEquipment)'), 'DailyQuest-Regeneration erkennt unpassende Equipment-Quests');

    return t;
}

module.exports = { run, name: '11-onboarding-equipment' };
