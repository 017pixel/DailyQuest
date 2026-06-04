/**
 * Test 07: CSS-Theme-Vollstaendigkeit.
 * Prueft, dass alle CSS-Variablen in allen drei Themes (dark/light/oled) definiert sind.
 */
const { TestRunner, BASE } = require('./helpers');
const fs = require('fs');
const path = require('path');

function run() {
    const t = new TestRunner('CSS Themes (Variablen-Konsistenz)');

    const css = fs.readFileSync(path.join(BASE, 'css', 'main.css'), 'utf8');

    // Extrahiere alle Var-Deklarationen aus :root (Dark Theme)
    const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
    t.ok(!!rootMatch, ':root-Block gefunden');
    if (!rootMatch) return t;

    const rootVars = [];
    const varRegex = /--([\w-]+)\s*:/g;
    let m;
    while ((m = varRegex.exec(rootMatch[1])) !== null) {
        rootVars.push(`--${m[1]}`);
    }

    t.ok(rootVars.length >= 14, `Dark-Theme Variablen (${rootVars.length})`);

    // Extrahiere Light-Theme ([data-theme='light'])
    const lightMatch = css.match(/html\[data-theme='light'\]\s*\{([^}]+)\}/s);
    t.ok(!!lightMatch, 'Light-Theme-Block gefunden');

    // Extrahiere OLED-Theme
    const oledMatch = css.match(/html\[data-theme='oled'\]\s*\{([^}]+)\}/s);
    t.ok(!!oledMatch, 'OLED-Theme-Block gefunden');

    // Pruefe, dass zentrale Variablen in allen Themes definiert sind
    const criticalVars = [
        '--background-color', '--surface-color', '--primary-color',
        '--on-surface-color', '--outline-color', '--penalty-color',
    ];

    for (const v of criticalVars) {
        t.ok(rootVars.includes(v), `Dark: ${v}`);
        if (lightMatch) t.ok(lightMatch[1].includes(v), `Light: ${v}`);
        if (oledMatch) t.ok(oledMatch[1].includes(v), `OLED: ${v}`);
    }

    // Pruefe, dass --primary-color-rgb existiert (wird in manchen Styles benoetigt)
    t.ok(rootVars.includes('--primary-color-rgb'), 'Dark: --primary-color-rgb');
    if (lightMatch) t.ok(lightMatch[1].includes('--primary-color-rgb'), 'Light: --primary-color-rgb');
    if (oledMatch) t.ok(oledMatch[1].includes('--primary-color-rgb'), 'OLED: --primary-color-rgb');

    // Pruefe Popup-Variablen
    const popupVars = ['--popup-bg-dark', '--popup-glow-dark', '--popup-glow-penalty-dark'];
    for (const v of popupVars) {
        t.ok(rootVars.includes(v) || rootMatch[1].includes(v), `Dark: ${v}`);
        if (oledMatch) t.ok(oledMatch[1].includes(v), `OLED: ${v}`);
    }

    // Light hat andere Popup-Namen
    if (lightMatch) {
        t.ok(lightMatch[1].includes('--popup-bg-light'), 'Light: --popup-bg-light');
        t.ok(lightMatch[1].includes('--popup-glow-light'), 'Light: --popup-glow-light');
        t.ok(lightMatch[1].includes('--popup-glow-penalty-light'), 'Light: --popup-glow-penalty-light');
    }

    // Pruefe, dass Farb-Variablen gueltige Werte haben (Hex, rgb, etc.)
    const colorVars = rootVars.filter(v => v.includes('color') && !v.includes('rgb'));
    for (const v of colorVars) {
        const match = rootMatch[1].match(new RegExp(v.replace('--', '--') + '\\s*:\\s*([^;]+)'));
        if (match) {
            const val = match[1].trim();
            t.ok(val.startsWith('#') || val.startsWith('rgb') || val.startsWith('linear-gradient'),
                `${v} hat gueltigen Farbwert (${val.substring(0, 20)})`);
        }
    }

    return t;
}

module.exports = { run, name: '07-css-themes' };
