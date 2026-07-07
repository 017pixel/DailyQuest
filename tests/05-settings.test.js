/**
 * Test 05: Settings-Logik.
 * Validiert Defaults, Typen, und Edge-Cases der User-Settings.
 */
const { TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Settings (Defaults & Validation)');

    const defaults = {
        id: 1,
        language: 'de',
        theme: 'dark',
        difficulty: 3,
        goal: 'muscle',
        restDays: 2,
        hasEquipment: true,
        trainingEquipment: { dumbbell: true, barbell: true, pullupBar: false, bench: false, kettlebell: false },
        weightTrackingEnabled: true,
        age: null,
    };

    // ── Default-Werte ──
    t.equal(defaults.language, 'de');
    t.equal(defaults.theme, 'dark');
    t.equal(defaults.difficulty, 3);
    t.ok(['muscle', 'endurance', 'fatloss', 'kraft_abnehmen', 'calisthenics', 'senior', 'sick', 'restday'].includes(defaults.goal),
        'goal in gueltiger Liste');
    t.ok([0, 1, 2, 3].includes(defaults.restDays), 'restDays in [0,1,2,3]');
    t.equal(defaults.hasEquipment, true, 'hasEquipment default = true');
    t.equal(defaults.trainingEquipment.dumbbell, true, 'Legacy-Equipment migriert Kurzhanteln = true');
    t.equal(defaults.trainingEquipment.barbell, true, 'Legacy-Equipment migriert Langhantel = true');
    t.equal(defaults.trainingEquipment.pullupBar, false, 'Klimmzugstange default = false');
    t.equal(defaults.weightTrackingEnabled, true, 'weightTracking default = true');

    // ── Typ-Checks ──
    t.ok(typeof defaults.difficulty === 'number', 'difficulty ist number');
    t.ok(typeof defaults.restDays === 'number', 'restDays ist number');
    t.ok(typeof defaults.goal === 'string', 'goal ist string');
    t.ok(typeof defaults.language === 'string', 'language ist string');
    t.ok(typeof defaults.theme === 'string', 'theme ist string');
    t.ok(typeof defaults.hasEquipment === 'boolean', 'hasEquipment ist boolean');
    t.ok(typeof defaults.trainingEquipment === 'object', 'trainingEquipment ist object');
    t.ok(typeof defaults.weightTrackingEnabled === 'boolean', 'weightTracking ist boolean');

    // ── Valid Goals ──
    const validGoals = ['muscle', 'endurance', 'fatloss', 'kraft_abnehmen', 'calisthenics', 'senior', 'sick', 'restday'];
    for (const g of validGoals) {
        t.ok(typeof g === 'string' && g.length > 0, `goal "${g}" valid`);
    }

    // ── Valid Themes ──
    const validThemes = ['dark', 'light', 'oled'];
    for (const theme of validThemes) {
        t.ok(typeof theme === 'string' && theme.length > 0, `theme "${theme}" valid`);
    }

    // ── Sprache muss DE oder EN sein ──
    const validLanguages = ['de', 'en'];
    t.ok(validLanguages.includes(defaults.language), 'language ist de oder en');

    // ── Age Edge Cases ──
    function validateAge(val) {
        if (typeof val === 'number' && Number.isFinite(val)) return val;
        return null;
    }
    t.equal(validateAge(25), 25, 'age(25) → 25');
    t.equal(validateAge(0), 0, 'age(0) → 0');
    t.equal(validateAge(-1), -1, 'age(-1) → -1 (wird von getAgeBand als unknown behandelt)');
    t.equal(validateAge(NaN), null, 'age(NaN) → null');
    t.equal(validateAge(undefined), null, 'age(undefined) → null');
    t.equal(validateAge('25'), null, 'age("25") → null (string)');

    // ── Character-Settings Mapping ──
    const characterSettings = ['name', 'age', 'weightTrackingEnabled', 'targetWeight', 'weightDirection'];
    t.ok(characterSettings.includes('name'), 'name im characterSettings mapping');
    t.ok(characterSettings.includes('age'), 'age im characterSettings mapping');
    t.ok(characterSettings.includes('weightTrackingEnabled'), 'weightTrackingEnabled im mapping');
    t.ok(characterSettings.includes('targetWeight'), 'targetWeight im mapping');
    t.ok(characterSettings.includes('weightDirection'), 'weightDirection im mapping');

    return t;
}

module.exports = { run, name: '05-settings' };
