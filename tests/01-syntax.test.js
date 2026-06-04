/**
 * Test 01: Syntax-Check aller JavaScript-Dateien.
 * Stellt sicher, dass jede .js-Datei im Projekt syntaktisch korrekt ist.
 */
const { getJsFiles, TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function run() {
    const t = new TestRunner('Syntax-Check (JS-Dateien)');
    const files = getJsFiles();

    t.ok(files.length > 30, `Mindestens 30 JS-Dateien gefunden (${files.length})`);

    for (const file of files) {
        const code = fs.readFileSync(path.join(BASE, file), 'utf8');
        try {
            new vm.Script(code, { filename: file });
            t.ok(true, `Parsed: ${file}`);
        } catch (e) {
            t.ok(false, `Syntax-Error in ${file}: ${e.message.split('\n')[0]}`);
        }
    }

    return t;
}

module.exports = { run, name: '01-syntax' };
