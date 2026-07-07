/**
 * Test-Helfer: Daten-Loader und Assertions fuer die DailyQuest Test-Suite.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

// ── Daten-Loader ──────────────────────────────────────────────
// Laedt alle data/*.js-Dateien in den globalen Scope und gibt sie zurueck.
// Nutzt new Function(), das im globalen Scope laeuft (nicht strict).
let _dataCache = null;

function loadData() {
    if (_dataCache) return _dataCache;

    // Fake Browser-Window (einige Daten-Dateien nutzen window.DQ_DATA)
    global.window = global;

    const files = [
        'data/translations.js',
        'data/exercises.js',
        'data/wger-defaults.js',
        'data/daily-quest-catalog.js',
        'data/training_plans.js',
        'data/achievements.js',
        'data/dungeons.js',
    ];

    for (const file of files) {
        let code = fs.readFileSync(path.join(BASE, file), 'utf8');
        // const-Deklarationen in Zuweisung auf global umwandeln (new-Function-Scope)
        code = code.replace(
            /^const\s+(DQ_DATA|DQ_DUNGEONS|DQ_TRAINING_PLAN_SHARED_REP_STAGES|DQ_TRAINING_PLAN_ENDURANCE_STAGES|DQ_TRAINING_PLAN_SENIOR_STAGES)\s*=/gm,
            'global.$1 ='
        );
        try {
            new Function(code)();
        } catch (e) {
            console.warn(`  [WARN] Konnte ${file} nicht laden: ${e.message.split('\n')[0]}`);
        }
    }

    _dataCache = {
        DQ_DATA: global.DQ_DATA,
        DQ_DUNGEONS: global.DQ_DUNGEONS,
        sharedStages: global.DQ_TRAINING_PLAN_SHARED_REP_STAGES,
        enduranceStages: global.DQ_TRAINING_PLAN_ENDURANCE_STAGES,
        seniorStages: global.DQ_TRAINING_PLAN_SENIOR_STAGES,
    };
    return _dataCache;
}

// ── Datei-Auflistung ──────────────────────────────────────────
function getJsFiles(dir = BASE, rel = '') {
    const results = [];
    const entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
    for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'vendor' || e.name === 'node_modules' || e.name === 'dist') continue;
        const fullRel = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) {
            results.push(...getJsFiles(dir, fullRel));
        } else if (e.name.endsWith('.js')) {
            results.push(fullRel);
        }
    }
    return results.filter(f => !f.startsWith('tests/'));
}

function getCssFiles(dir = BASE, rel = '') {
    const results = [];
    const entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
    for (const e of entries) {
        const fullRel = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) {
            results.push(...getCssFiles(dir, fullRel));
        } else if (e.name.endsWith('.css')) {
            results.push(fullRel);
        }
    }
    return results;
}

// ── Assertions ────────────────────────────────────────────────
class TestRunner {
    constructor(name) {
        this.name = name;
        this.passed = 0;
        this.failed = 0;
        this.errors = [];
    }

    ok(condition, msg) {
        if (condition) { this.passed++; }
        else { this.failed++; this.errors.push(`FAIL: ${msg}`); }
    }

    equal(actual, expected, msg) {
        const ok = actual === expected;
        if (ok) { this.passed++; }
        else { this.failed++; this.errors.push(`FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
    }

    deepEqual(actual, expected, msg) {
        const ok = JSON.stringify(actual) === JSON.stringify(expected);
        if (ok) { this.passed++; }
        else { this.failed++; this.errors.push(`FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
    }

    throws(fn, msg) {
        try { fn(); this.failed++; this.errors.push(`FAIL: ${msg} — no error thrown`); }
        catch (e) { this.passed++; }
    }

    report() {
        const total = this.passed + this.failed;
        const status = this.failed === 0 ? 'PASS' : 'FAIL';
        console.log(`  ${status}  ${this.name}: ${this.passed}/${total}`);
        for (const err of this.errors) {
            console.log(`       ${err}`);
        }
        return this.failed === 0;
    }
}

module.exports = { loadData, getJsFiles, getCssFiles, TestRunner, BASE };
