/**
 * Test 04: Reine Funktionen (Unit Tests).
 * Testet mathematisch/logische Funktionen, die keine Seiteneffekte haben.
 * Funktionen sind hier repliziert, da sie im Original auf Browser-APIs angewiesen sind.
 */
const { TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Reine Funktionen (Unit)');

    // ── getAgeBand ──────────────────────────────────────────
    function getAgeBand(age) {
        if (typeof age !== 'number' || !Number.isFinite(age)) return 'unknown';
        if (age < 18) return 'u18';
        if (age <= 29) return '18-29';
        if (age <= 44) return '30-44';
        if (age <= 59) return '45-59';
        return '60+';
    }

    t.equal(getAgeBand(null), 'unknown', 'ageBand(null) → unknown');
    t.equal(getAgeBand(undefined), 'unknown', 'ageBand(undefined) → unknown');
    t.equal(getAgeBand(NaN), 'unknown', 'ageBand(NaN) → unknown');
    t.equal(getAgeBand(0), 'u18', 'ageBand(0) → u18');
    t.equal(getAgeBand(17), 'u18', 'ageBand(17) → u18');
    t.equal(getAgeBand(18), '18-29', 'ageBand(18) → 18-29');
    t.equal(getAgeBand(29), '18-29', 'ageBand(29) → 18-29');
    t.equal(getAgeBand(30), '30-44', 'ageBand(30) → 30-44');
    t.equal(getAgeBand(44), '30-44', 'ageBand(44) → 30-44');
    t.equal(getAgeBand(45), '45-59', 'ageBand(45) → 45-59');
    t.equal(getAgeBand(60), '60+', 'ageBand(60) → 60+');
    t.equal(getAgeBand(120), '60+', 'ageBand(120) → 60+');

    // ── getDifficultyMultiplier ──────────────────────────────
    function getDifficultyMultiplier(difficulty) {
        const map = { 1: 0.80, 2: 0.90, 3: 1.00, 4: 1.15, 5: 1.30 };
        return map[Math.max(1, Math.min(5, Number(difficulty) || 3))];
    }

    t.equal(getDifficultyMultiplier(1), 0.80, 'diff(1) → 0.80');
    t.equal(getDifficultyMultiplier(2), 0.90, 'diff(2) → 0.90');
    t.equal(getDifficultyMultiplier(3), 1.00, 'diff(3) → 1.00');
    t.equal(getDifficultyMultiplier(4), 1.15, 'diff(4) → 1.15');
    t.equal(getDifficultyMultiplier(5), 1.30, 'diff(5) → 1.30');
    t.equal(getDifficultyMultiplier(0), 1.00, 'diff(0) → 0||3=3 → 1.00');
    t.equal(getDifficultyMultiplier(6), 1.30, 'diff(6) → clamped to 5 → 1.30');
    t.equal(getDifficultyMultiplier(NaN), 1.00, 'diff(NaN) → 3 → 1.00');

    // ── scaleReps ───────────────────────────────────────────
    function scaleReps(baseReps, difficulty) {
        const mult = getDifficultyMultiplier(difficulty);
        return Math.max(1, Math.round(baseReps * mult));
    }

    t.equal(scaleReps(10, 3), 10, 'scaleReps(10, 3) → 10');
    t.equal(scaleReps(10, 1), 8, 'scaleReps(10, 1) → 8');
    t.equal(scaleReps(10, 5), 13, 'scaleReps(10, 5) → 13');
    t.equal(scaleReps(1, 1), 1, 'scaleReps(1, 1) → min=1 → 1');
    t.equal(scaleReps(0, 5), 1, 'scaleReps(0, 5) → min=1 → 1');

    // ── formatDuration ───────────────────────────────────────
    function formatDuration(seconds) {
        if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '0 s';
        if (seconds >= 60) return `${Math.round(seconds / 60)} min`;
        return `${Math.round(seconds)} s`;
    }

    t.equal(formatDuration(0), '0 s', 'formatDuration(0) → 0 s');
    t.equal(formatDuration(30), '30 s', 'formatDuration(30) → 30 s');
    t.equal(formatDuration(60), '1 min', 'formatDuration(60) → 1 min');
    t.equal(formatDuration(90), '2 min', 'formatDuration(90) → 2 min (rundet)');
    t.equal(formatDuration(125), '2 min', 'formatDuration(125) → 2 min');
    t.equal(formatDuration(NaN), '0 s', 'formatDuration(NaN) → 0 s');

    // ── getTodayString ───────────────────────────────────────
    function getTodayString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const today = getTodayString();
    t.ok(/^\d{4}-\d{2}-\d{2}$/.test(today), `getTodayString Format YYYY-MM-DD (${today})`);
    const expected = new Date().toISOString().split('T')[0];
    t.equal(today, expected, `getTodayString ist heute (${today})`);

    // ── normalizeGoal ────────────────────────────────────────
    function normalizeGoal(goal) {
        const aliases = {
            muskelaufbau: 'muscle', muscle: 'muscle', muskel: 'muscle',
            ausdauer: 'endurance', endurance: 'endurance', cardio: 'endurance',
            abnehmen: 'fatloss', fatloss: 'fatloss', fat_loss: 'fatloss',
            kraft: 'kraft_abnehmen', kraft_abnehmen: 'kraft_abnehmen',
            calisthenics: 'calisthenics', bodyweight: 'calisthenics',
            senior: 'senior', senioren: 'senior',
            sick: 'sick', krank: 'sick',
            restday: 'restday', pause: 'restday',
        };
        return aliases[(goal || '').toLowerCase()] || 'muscle';
    }

    t.equal(normalizeGoal('muscle'), 'muscle', 'normalizeGoal(muscle) → muscle');
    t.equal(normalizeGoal('ausdauer'), 'endurance', 'normalizeGoal(ausdauer) → endurance');
    t.equal(normalizeGoal('abnehmen'), 'fatloss', 'normalizeGoal(abnehmen) → fatloss');
    t.equal(normalizeGoal('xyz'), 'muscle', 'normalizeGoal(unbekannt) → muscle (default)');
    t.equal(normalizeGoal(''), 'muscle', 'normalizeGoal(leer) → muscle');
    t.equal(normalizeGoal(null), 'muscle', 'normalizeGoal(null) → muscle');

    // ── Settings-Validation ───────────────────────────────────
    function validateDifficulty(val) { return Math.max(1, Math.min(5, Number(val) || 3)); }
    function validateRestDays(val) { return [0, 1, 2, 3].includes(Number(val)) ? Number(val) : 2; }

    t.equal(validateDifficulty(1), 1);
    t.equal(validateDifficulty(3), 3);
    t.equal(validateDifficulty(5), 5);
    t.equal(validateDifficulty(7), 5);
    t.equal(validateDifficulty(-1), 1);
    t.equal(validateDifficulty(NaN), 3);

    t.equal(validateRestDays(0), 0);
    t.equal(validateRestDays(2), 2);
    t.equal(validateRestDays(3), 3);
    t.equal(validateRestDays(5), 2);
    t.equal(validateRestDays('x'), 2);

    return t;
}

module.exports = { run, name: '04-pure-functions' };
