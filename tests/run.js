/**
 * DailyQuest Test Runner
 * Fuehrt alle 10 Tests aus und gibt eine Zusammenfassung aus.
 * Usage: node tests/run.js
 */
const fs = require('fs');
const path = require('path');

const testFiles = fs.readdirSync(__dirname)
    .filter(f => /^\d{2}-.+\.test\.js$/.test(f))
    .sort();

console.log(`\n  DailyQuest Test-Suite (${testFiles.length} Tests)\n  ==========================================\n`);

let totalPassed = 0;
let totalFailed = 0;
let allPassed = true;

for (const file of testFiles) {
    const mod = require(path.join(__dirname, file));
    const result = mod.run();
    const ok = result.report();
    totalPassed += result.passed;
    totalFailed += result.failed;
    if (!ok) allPassed = false;
}

console.log(`\n  ------------------------------------------`);
console.log(`  Ergebnis: ${totalPassed} passed, ${totalFailed} failed`);
console.log(`  Status:   ${allPassed ? 'ALLES OK' : 'FEHLER GEFUNDEN'}`);
console.log(`  ------------------------------------------\n`);

process.exit(allPassed ? 0 : 1);
