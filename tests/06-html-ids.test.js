/**
 * Test 06: HTML-Element-ID-Konsistenz.
 * Stellt sicher, dass alle in JS referenzierten IDs auch im HTML existieren
 * und keine IDs mehrfach vergeben sind.
 */
const { TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

// Dynamisch erzeugte / JS-gerenderte Elemente (in HTML nicht vorhanden — OK)
const DYNAMIC_IDS = new Set([
    'character-tab-content-wrapper', 'character-tab-stats', 'character-tab-inventory',
    'stats-carousel-track', 'stats-carousel-dots', 'stats-radar-chart',
    'stats-list-container', 'stats-chart-label-layer',
    'focus-stats-section', 'focus-stats-container',
    'profile-type-section', 'profile-type-container',
    'consistency-section', 'consistency-container', 'consistency-ring-chart',
    'time-patterns-section', 'time-patterns-container',
    'endurance-stats-section', 'endurance-stats-container', 'endurance-chart-canvas',
    'mana-gold-section', 'mana-gold-container', 'mana-gold-chart-canvas',
    'achievement-stats-section', 'achievement-stats-container',
    'extra-shop-section', 'extra-shop-container',
    'character-header-grid', 'streak-box', 'streak-value',
    'phase-info-popup', 'phase-info-title', 'phase-info-body',
    'tutorial-text-container', 'tutorial-continue-btn', 'tutorial-name-input',
    'dungeon-root', 'dungeon-spawn-chip', 'monster-image', 'monster-hp-fill',
    'monster-hp-text', 'screen-damage-overlay',
    'reset-popup1-cancel', 'reset-popup1-continue',
    'reset-popup2-cancel', 'reset-popup2-confirm',
    'update-notice-prev-button', 'update-notice-next-button',
    'start-stop-btn', 'timer-warning-box',
    'free-training-container', 'daily-quest-container',
    'focus-label-list',
    'timer-warning-cancel', 'timer-warning-confirm',
    'timer-progress', 'timer-progress-fill', 'timer-circle-progress',
    'timer-countdown-overlay', 'timer-countdown-number',
    'player-hp-fill', 'character-lab', 'quest-list',
    'add-new-label-button', 'new-focus-label-input', 'save-new-label-button',
    // Shop (dynamisch gerendert)
    'shop-tab-switcher',
    // Endurance-Power (dynamisch/nicht in diesem HTML)
    'endurance-power-input',
    // Tutorial-Onboarding (dynamisch im Overlay)
    'tutorial-name-submit', 'tutorial-name-input-container',
    'tutorial-language-selection', 'tutorial-install-selection', 'tutorial-install-skip',
    'tutorial-equipment-selection', 'tutorial-goal-selection',
    'tutorial-progressive-overlay',
    'tutorial-plan-selection', 'tutorial-custom-input',
    'tutorial-plan-prompt', 'tutorial-plan-generate', 'tutorial-plan-loading',
    'goal-select',
]);

function run() {
    const t = new TestRunner('HTML-Element-IDs (JS vs. HTML)');

    const html = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8');

    // Alle IDs aus dem HTML extrahieren
    const idRegex = /id="([^"]+)"/g;
    const htmlIds = new Set();
    let match;
    while ((match = idRegex.exec(html)) !== null) {
        if (htmlIds.has(match[1])) {
            t.ok(false, `Doppelte HTML-ID: "${match[1]}"`);
        }
        htmlIds.add(match[1]);
    }

    t.ok(htmlIds.size >= 80, `Mindestens 80 eindeutige IDs in HTML (${htmlIds.size})`);
    t.ok(!html.includes('data-lang-key=""'), 'Keine leeren data-lang-key Attribute');

    // Alle getElementById-Aufrufe aus JS-Dateien extrahieren
    const jsFiles = [
        'main.js',
        'js/ui.js',
        'js/supabase-client.js',
        'js/page_exercises.js',
        'js/page_exercises_training.js',
        'js/page_shop.js',
        'js/page_extra_quest.js',
        'js/page_achievements.js',
        'js/timer-popup.js',
        'js/character/page_character_main.js',
        'js/character/page_character_stats.js',
        'js/character/page_character_cards.js',
        'js/character/page_character_inventory.js',
        'js/character/page_character_swipe.js',
        'js/character/page_character_labels.js',
        'js/dungeons/page_dungeon_main.js',
        'js/vibe-fokus/page_fokus_main.js',
        'js/vibe-fokus/page_fokus_timer.js',
        'js/fallback-check.js',
        'js/training_system.js',
        'tutorial/js/tutorial_main.js',
        'tutorial/js/tutorial_onboarding.js',
        'tutorial/js/tutorial_progressive.js',
        'tutorial/js/tutorial_triggers.js',
    ];

    const idCallRegex = /getElementById\(['"]([^'"]+)['"]\)/g;
    let missingIds = 0;

    for (const file of jsFiles) {
        const fullPath = path.join(BASE, file);
        if (!fs.existsSync(fullPath)) continue;
        const code = fs.readFileSync(fullPath, 'utf8');

        let m;
        while ((m = idCallRegex.exec(code)) !== null) {
            const id = m[1];
            if (DYNAMIC_IDS.has(id)) continue;
            if (!htmlIds.has(id)) {
                if (missingIds < 20) t.ok(false, `JS-Referenz: "${id}" in ${file} — fehlt im HTML`);
                missingIds++;
            }
        }
    }

    if (missingIds === 0) {
        t.ok(true, 'Alle getElementById-Referenzen im HTML gefunden');
    } else {
        t.ok(false, `${missingIds} getElementById-Referenzen ohne HTML-Gegenstueck`);
    }

    return t;
}

module.exports = { run, name: '06-html-ids' };
