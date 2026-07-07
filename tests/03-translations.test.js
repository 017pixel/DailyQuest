/**
 * Test 03: Uebersetzungs-Konsistenz.
 * Prueft, dass alle DE-Keys auch in EN existieren und umgekehrt.
 */
const { loadData, TestRunner } = require('./helpers');
const fs = require('fs');
const path = require('path');
const { BASE } = require('./helpers');

function run() {
    const t = new TestRunner('Uebersetzungen (DE/EN)');
    const { DQ_DATA } = loadData();
    const trans = DQ_DATA.translations;
    if (!trans || !trans.de || !trans.en) {
        t.ok(false, 'Translations fehlen — Test uebersprungen');
        return t;
    }

    const deKeys = Object.keys(trans.de);
    const enKeys = Object.keys(trans.en);

    // DE -> EN
    let missingInEn = 0;
    for (const key of deKeys) {
        if (trans.en[key] === undefined) {
            if (missingInEn < 10) t.ok(false, `DE-Key "${key}" fehlt in EN`);
            else if (missingInEn === 10) t.ok(false, '... (weitere fehlende Keys abgeschnitten)');
            missingInEn++;
        }
    }
    if (missingInEn === 0) t.ok(true, `Alle ${deKeys.length} DE-Keys existieren in EN`);

    // EN -> DE
    let missingInDe = 0;
    for (const key of enKeys) {
        if (trans.de[key] === undefined) {
            if (missingInDe < 10) t.ok(false, `EN-Key "${key}" fehlt in DE`);
            else if (missingInDe === 10) t.ok(false, '... (weitere fehlende Keys abgeschnitten)');
            missingInDe++;
        }
    }
    if (missingInDe === 0) t.ok(true, `Alle ${enKeys.length} EN-Keys existieren in DE`);

    // Leere Werte
    let emptyValues = 0;
    for (const lang of ['de', 'en']) {
        for (const key of Object.keys(trans[lang])) {
            if (trans[lang][key] === '' || trans[lang][key] === null || trans[lang][key] === undefined) {
                if (emptyValues < 10) t.ok(false, `Leerer Wert: ${lang}.${key}`);
                emptyValues++;
            }
        }
    }
    if (emptyValues === 0) t.ok(true, 'Keine leeren Uebersetzungswerte');

    const translationSource = fs.readFileSync(path.join(BASE, 'data/translations.js'), 'utf8');
    const shortWalkMatches = translationSource.match(/short_walk\s*:/g) || [];
    t.equal(shortWalkMatches.length, 2, 'short_walk ist genau einmal pro Sprache definiert');

    const expectedEnglishStatsLabels = {
        profile_type_title: 'Profile Type',
        consistency_title: 'Consistency',
        time_patterns_title: 'Time Patterns',
        endurance_progress_title: 'Endurance Progress',
        mana_gold_title: 'Mana & Gold',
        achievement_stats_title: 'Achievements',
        extra_shop_title: 'Extra Quests & Shop'
    };
    for (const [key, expected] of Object.entries(expectedEnglishStatsLabels)) {
        t.equal(trans.en[key], expected, `EN ${key} ist englisch`);
    }

    // Platzhalter-Konsistenz (%s, %d)
    for (const key of deKeys) {
        if (!trans.en[key] || !trans.de[key]) continue;
        if (typeof trans.de[key] !== 'string' || typeof trans.en[key] !== 'string') continue;
        const dePlaceholders = (trans.de[key].match(/%[sd]/g) || []).length;
        const enPlaceholders = (trans.en[key].match(/%[sd]/g) || []).length;
        t.ok(dePlaceholders === enPlaceholders,
            `Platzhalter-Count fuer "${key}": DE=${dePlaceholders}, EN=${enPlaceholders}`);
    }

    return t;
}

module.exports = { run, name: '03-translations' };
