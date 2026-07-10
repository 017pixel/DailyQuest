/**
 * Test 18: Standardplan-Auswahl aus dem Trainingsziel-Popup.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { BASE, TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Standardplan-Overlay');
    const main = fs.readFileSync(path.join(BASE, 'main.js'), 'utf8');
    const css = fs.readFileSync(path.join(BASE, 'css/pages/exercises.css'), 'utf8');
    const html = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8');

    const openFunction = main.match(/function openPresetPlanOverlay\(\) \{[\s\S]*?\n\}/)?.[0] || '';
    const classes = new Set();
    const overlay = {
        classList: {
            add: className => classes.add(className),
            contains: className => classes.has(className)
        }
    };
    const context = {
        document: { getElementById: id => id === 'preset-plan-overlay' ? overlay : null }
    };
    vm.createContext(context);
    vm.runInContext(`${openFunction}\nopenPresetPlanOverlay();`, context);
    t.ok(overlay.classList.contains('open'), 'Klickpfad setzt die sichtbare open-Klasse');

    t.ok(css.includes('#preset-plan-overlay.open {'), 'Preset-Overlay besitzt eine CSS-Regel fuer open');
    t.ok(/#preset-plan-overlay\.open\s*\{[\s\S]*?display:\s*block;[\s\S]*?pointer-events:\s*auto;/.test(css), 'Open-Zustand ist sichtbar und anklickbar');
    t.ok(css.includes('#preset-plan-overlay.open .settings-sheet'), 'Preset-Sheet faehrt im Open-Zustand ein');
    t.ok(css.includes('#preset-plan-overlay.open .settings-overlay-bg'), 'Preset-Hintergrund wird im Open-Zustand sichtbar');

    const setupListenerStart = main.indexOf("const setupMethodPresets = document.getElementById('setup-method-presets')");
    const setupListenerEnd = main.indexOf("const setupMethodManual", setupListenerStart);
    const setupListener = main.slice(setupListenerStart, setupListenerEnd);
    t.ok(setupListener.includes('openPresetPlanOverlay();'), 'Standardplaene-Button ruft die Overlay-Oeffnung auf');

    const selectionStart = main.indexOf('async function handlePresetSelection');
    const selectionEnd = main.indexOf('async function openManualPlanOverlay', selectionStart);
    const selectionFlow = main.slice(selectionStart, selectionEnd);
    t.ok(selectionFlow.indexOf('closePresetPlanOverlay();') < selectionFlow.indexOf('DQ_UI.showCustomPopup('), 'Planwahl schliesst das Overlay vor der Startabfrage');

    const backStart = main.indexOf("const presetPlanBackBtn = document.getElementById('preset-plan-back-btn')");
    const backEnd = main.indexOf("const presetPlanOverlayBg", backStart);
    const backFlow = main.slice(backStart, backEnd);
    t.ok(backFlow.includes('closePresetPlanOverlay();'), 'Zurueck-Button schliesst die Standardplan-Auswahl');
    t.ok(backFlow.includes('DQ_UI.showPopup(elements.goalSetupPopup);'), 'Zurueck-Button oeffnet die Trainingsziel-Auswahl erneut');

    t.ok(html.includes('id="preset-plan-overlay"'), 'Standardplan-Overlay ist im HTML vorhanden');
    t.equal((html.match(/class="training-preset-card"/g) || []).length, 4, 'Alle vier Standardplaene sind auswaehlbar');

    return t;
}

module.exports = { run, name: '18-preset-plan-overlay' };
