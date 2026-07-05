/**
 * Test 13: Update-Sicherheit fuer bestehende Nutzer.
 * Bestehende Plaene, eigene Uebungen und heutiger Fortschritt duerfen beim
 * wger-Update nicht geloescht oder automatisch umgeschrieben werden.
 */
const { TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

function run() {
    const t = new TestRunner('Update-Sicherheit 2.15');

    const database = fs.readFileSync(path.join(BASE, 'js/database.js'), 'utf8');
    const manualPlan = fs.readFileSync(path.join(BASE, 'js/manual-plan-system.js'), 'utf8');
    const wgerImport = fs.readFileSync(path.join(BASE, 'js/wger-import.js'), 'utf8');
    const main = fs.readFileSync(path.join(BASE, 'main.js'), 'utf8');

    t.ok(database.includes('dbVersion = 41'), 'IndexedDB-Migration fuer grosses Update aktiviert');
    t.ok(database.includes('custom_user_exercises'), 'Legacy-Store fuer eigene Uebungen bleibt Teil der DB');
    t.ok(!database.includes("deleteObjectStore('custom_user_exercises')"), 'Migration loescht keine eigenen Alt-Uebungen');

    t.ok(manualPlan.includes('getLegacyExerciseById'), 'Alte lokale Uebungs-IDs bleiben aufloesbar');
    t.ok(manualPlan.includes('getLegacyExerciseByNameKey'), 'Alte lokale Uebungs-Keys bleiben aufloesbar');
    t.ok(manualPlan.includes("transaction(['custom_user_exercises'], 'readonly')"), 'Alte eigene Uebungen bleiben fuer Plaene lesbar');
    t.ok(manualPlan.includes("source: ex.source || 'legacy_local'"), 'Legacy-Uebungen werden als lokale Alt-Uebungen markiert');

    t.ok(wgerImport.includes('markLegacyPlansPreserved'), 'wger-Import markiert Alt-Plaene als erhalten');
    t.ok(wgerImport.includes('return 0;') && !wgerImport.includes('plan.exerciseIds ='), 'wger-Import schreibt alte Plaene nicht automatisch um');
    t.ok(!main.includes('clearAllPlans()'), 'Update loescht keine vorhandenen Trainingsplaene');

    return t;
}

module.exports = { run, name: '13-update-safety' };
