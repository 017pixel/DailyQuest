/**
 * Test 02: Daten-Integritaet.
 * Validiert Struktur von exercises, achievements, dungeons, translations.
 */
const { loadData, TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Daten-Integritaet');
    const { DQ_DATA, DQ_DUNGEONS } = loadData();

    // ── Exercise Pool ──
    const pool = DQ_DATA.exercisePool || {};
    const categories = Object.keys(pool);
    t.ok(categories.length >= 5, `Lokale Exercise-Kategorien (${categories.length})`);
    const requiredExerciseCategories = [
        'muscle', 'endurance', 'fatloss', 'kraft_abnehmen', 'calisthenics',
        'restday', 'learning', 'sick', 'senior', 'general_workout'
    ];
    for (const category of requiredExerciseCategories) {
        t.ok(Array.isArray(pool[category]) && pool[category].length > 0, `exercisePool.${category} ist vorhanden und nicht leer`);
    }
    t.ok(DQ_DATA.wgerDefaults && DQ_DATA.wgerDefaults.WGER_CATEGORIES.length === 8, 'wger-Sportkategorien definiert');

    const requiredFields = ['id', 'nameKey', 'type', 'baseValue', 'mana', 'gold'];
    let exerciseCount = 0;
    for (const cat of categories) {
        const exercises = pool[cat];
        t.ok(Array.isArray(exercises), `pool.${cat} ist ein Array (${exercises ? exercises.length : 0} items)`);
        if (!exercises) continue;
        for (const ex of exercises) {
            for (const f of requiredFields) {
                t.ok(ex[f] !== undefined, `exercise "${ex.id || ex.nameKey}" hat Feld "${f}"`);
            }
            t.ok(['reps', 'time', 'check', 'focus'].includes(ex.type), `exercise "${ex.id}" type ist gültig (${ex.type})`);
            t.ok(ex.mana >= 0, `exercise "${ex.id}" mana >= 0`);
            t.ok(ex.gold >= 0, `exercise "${ex.id}" gold >= 0`);
            exerciseCount++;
        }
    }
    t.ok(exerciseCount >= 30, `Insgesamt >= 30 lokale Nicht-Sport-Exercises (${exerciseCount})`);

    // ── Achievements ──
    const achievements = DQ_DATA.achievements || {};
    const achievementCategories = Object.keys(achievements);
    t.ok(achievementCategories.length >= 5, `Achievement-Kategorien (${achievementCategories.length})`);

    for (const cat of achievementCategories) {
        const a = achievements[cat];
        t.ok(a.key, `Achievement ${cat} hat key`);
        t.ok(a.nameKey, `Achievement ${cat} hat nameKey`);
        t.ok(Array.isArray(a.tiers), `Achievement ${cat} hat tiers-Array`);
        if (a.tiers) t.ok(a.tiers.length >= 5, `Achievement ${cat} hat >= 5 Tiers (${a.tiers.length})`);
    }

    // ── Dungeons ──
    const dungeons = DQ_DUNGEONS.list || [];
    t.ok(dungeons.length >= 1, `Dungeons: ${dungeons.length} definiert`);
    for (const d of dungeons) {
        t.ok(d.id, `Dungeon hat id`);
        t.ok(Array.isArray(d.monsters), `Dungeon "${d.id}" hat monsters`);
        t.ok(Array.isArray(d.tasks), `Dungeon "${d.id}" hat tasks`);
        if (d.tasks) t.ok(d.tasks.length >= 1, `Dungeon "${d.id}" hat >= 1 Task`);
        t.ok(d.rewards && typeof d.rewards.xp === 'number', `Dungeon "${d.id}" hat rewards.xp`);
    }

    // ── Translations ──
    const trans = DQ_DATA.translations;
    t.ok(trans && trans.de && trans.en, 'Translations: DE und EN vorhanden');
    if (trans && trans.de && trans.en) {
        const deKeys = Object.keys(trans.de).length;
        const enKeys = Object.keys(trans.en).length;
        t.ok(deKeys >= 200, `DE translation keys >= 200 (${deKeys})`);
        t.ok(enKeys >= 200, `EN translation keys >= 200 (${enKeys})`);
    }

    return t;
}

module.exports = { run, name: '02-data-structure' };
