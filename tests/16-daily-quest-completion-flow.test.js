/**
 * Test 16: Funktionale Abschlussmatrix fuer alle Daily-Quest-Modi.
 * Prueft echte Methodenaufrufe inklusive Timer-Klick und Satz-Zwischenstaenden.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { BASE, TestRunner } = require('./helpers');

function loadExerciseFlow(quests, advanceResults) {
    const finalizeCalls = [];
    const context = {
        DQ_EXERCISES: {},
        DQ_DB: {
            db: {
                transaction() {
                    return {
                        objectStore() {
                            return {
                                get(id) {
                                    const request = {};
                                    queueMicrotask(() => request.onsuccess?.({ target: { result: quests[id] || null } }));
                                    return request;
                                }
                            };
                        }
                    };
                }
            }
        },
        DQ_TRAINING_SYSTEM: {
            async advanceSetProgress() {
                return advanceResults.shift() || null;
            }
        },
        document: { querySelector: () => null },
        console,
        setTimeout,
        clearTimeout,
        requestAnimationFrame: callback => callback()
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(BASE, 'js/page_exercises_training.js'), 'utf8'), context);
    context.DQ_EXERCISES.finalizeQuestCompletion = async (questId, options) => {
        finalizeCalls.push({ questId, options });
        return { ok: true, quest: { ...quests[questId], completed: true }, char: { id: 1 } };
    };
    return { exercises: context.DQ_EXERCISES, finalizeCalls };
}

function createClassList(initial = []) {
    const values = new Set(initial);
    return {
        add: (...names) => names.forEach(name => values.add(name)),
        remove: (...names) => names.forEach(name => values.delete(name)),
        contains: name => values.has(name)
    };
}

function createElement() {
    return {
        textContent: '',
        disabled: false,
        style: {},
        classList: createClassList(),
        listeners: {},
        addEventListener(type, handler) { this.listeners[type] = handler; },
        querySelector() { return null; }
    };
}

function loadTimerFlow(results) {
    const elements = {};
    [
        'timer-exercise-name', 'timer-display', 'timer-progress-fill', 'timer-circle-progress',
        'timer-start-button', 'timer-pause-button', 'timer-resume-button', 'timer-done-button',
        'timer-countdown-overlay', 'timer-countdown-number', 'timer-warning-cancel',
        'timer-warning-confirm', 'timer-warning-popup'
    ].forEach(id => { elements[id] = createElement(); });

    const doneLabel = createElement();
    doneLabel.textContent = 'Geschafft!';
    elements['timer-done-button'].querySelector = selector => selector.includes('timer_done') ? doneLabel : null;

    const dragHandle = createElement();
    const timerPopup = createElement();
    timerPopup.id = 'timer-popup';
    timerPopup.querySelector = selector => selector === '.popup-drag-handle' ? dragHandle : null;
    elements['timer-popup'] = timerPopup;

    const rewardCalls = [];
    const completeCalls = [];
    const freeCalls = [];
    const popupOverlay = createElement();
    const context = {
        DQ_CONFIG: { userSettings: { language: 'de' } },
        DQ_DATA: {
            translations: { de: { timer_done: 'Geschafft!', timer_saving: 'Speichere...', exercise_names: { plank: 'Plank' } } },
            exerciseExplanations: { de: { plank: 'Plank' } }
        },
        DQ_EXERCISES: {
            async completeQuest(questId, options) {
                completeCalls.push({ questId, options });
                return results.shift() || { ok: false };
            },
            async completeFreeExercise(exerciseId, options) {
                freeCalls.push({ exerciseId, options });
                return results.shift() || { ok: false };
            },
            showQuestCompletionReward(quest) { rewardCalls.push(quest); }
        },
        DQ_UI: {
            popupStack: [],
            elements: { popupOverlay },
            showPopup(popup) {
                if (!this.popupStack.includes(popup)) this.popupStack.push(popup);
                popup.classList.add('show');
            },
            hideAllPopups() {
                this.popupStack.forEach(popup => popup.classList.remove('show'));
                this.popupStack = [];
            },
            showCustomPopup() {}
        },
        document: {
            getElementById: id => elements[id] || null,
            addEventListener(type, handler) {
                if (type === 'DOMContentLoaded') handler();
            }
        },
        console,
        setInterval,
        clearInterval,
        setTimeout: callback => { callback(); return 1; }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(BASE, 'js/timer-popup.js'), 'utf8'), context);
    return { context, elements, doneLabel, rewardCalls, completeCalls, freeCalls, timerPopup };
}

async function run() {
    const t = new TestRunner('Daily-Quest Abschlussmatrix');
    const exerciseSource = fs.readFileSync(path.join(BASE, 'js/page_exercises_training.js'), 'utf8');
    t.ok(
        exerciseSource.indexOf(': (isSetQuest\n                        ? progressText') !== -1,
        'Zeitbasierter Satzfortschritt bleibt nach Re-Render als 1/2 sichtbar'
    );

    const directModes = [
        { completionMode: 'tap', type: 'check', label: 'Abhak-Quest' },
        { completionMode: 'tap', type: 'time', goal: 'endurance', label: 'Ausdauer-Quest' },
        { completionMode: 'timer', type: 'time', source: 'manual', label: 'Manuelle Timer-Quest' },
        { completionMode: 'timer', type: 'time', source: 'ai', label: 'KI-Timer-Quest' },
        { completionMode: 'tap', type: 'focus', label: 'Fokus-Quest' }
    ];

    for (let index = 0; index < directModes.length; index++) {
        const questId = index + 1;
        const quest = { questId, ...directModes[index] };
        const { exercises, finalizeCalls } = loadExerciseFlow({ [questId]: quest }, []);
        const result = await exercises.completeQuest(questId, { showReward: false });
        t.ok(result.ok && result.completed, `${quest.label} wird vollstaendig abgeschlossen`);
        t.equal(finalizeCalls.length, 1, `${quest.label} persistiert genau einmal`);
        t.equal(finalizeCalls[0].options.showReward, false, `${quest.label} reicht Popup-Optionen weiter`);
    }

    const setQuest = {
        questId: 20,
        completionMode: 'sets',
        type: 'reps',
        setPlan: { sets: 3, reps: 12 },
        setProgress: [false, false, false]
    };
    const firstSet = { ...setQuest, setProgress: [true, false, false], canComplete: false };
    const secondSet = { ...setQuest, setProgress: [true, true, false], canComplete: false };
    const finalSet = { ...setQuest, setProgress: [true, true, true], canComplete: true };
    const setFlow = loadExerciseFlow({ 20: setQuest }, [firstSet, secondSet, finalSet]);
    const intermediate = await setFlow.exercises.completeQuest(20);
    t.ok(intermediate.ok && !intermediate.completed, 'Wiederholungs-Quest bleibt nach erstem Satz offen');
    t.equal(intermediate.doneSets, 1, 'Erster Satz ergibt Fortschritt 1/3');
    t.equal(setFlow.finalizeCalls.length, 0, 'Zwischenstand vergibt noch keine Belohnung');
    const secondIntermediate = await setFlow.exercises.completeQuest(20);
    t.ok(secondIntermediate.ok && !secondIntermediate.completed, 'Wiederholungs-Quest bleibt nach zweitem Satz offen');
    t.equal(secondIntermediate.doneSets, 2, 'Zweiter Satz ergibt Fortschritt 2/3');
    t.equal(setFlow.finalizeCalls.length, 0, 'Auch der zweite Zwischenstand vergibt keine Belohnung');
    const completedSetQuest = await setFlow.exercises.completeQuest(20);
    t.ok(completedSetQuest.ok && completedSetQuest.completed, 'Wiederholungs-Quest schliesst nach letztem Satz ab');
    t.equal(setFlow.finalizeCalls.length, 1, 'Letzter Satz persistiert genau einmal');

    const timedSetQuest = {
        ...setQuest,
        questId: 30,
        type: 'time',
        nameKey: 'plank',
        setPlan: { sets: 2, reps: 60 },
        setProgress: [false, false]
    };
    const timer = loadTimerFlow([
        { ok: true, completed: false, quest: { ...timedSetQuest, setProgress: [true, false] }, doneSets: 1, totalSets: 2 },
        { ok: true, completed: true, quest: { ...timedSetQuest, completed: true }, doneSets: 2, totalSets: 2 }
    ]);
    t.ok(typeof timer.elements['timer-done-button'].listeners.click === 'function', 'Timer-Geschafft-Click-Handler ist registriert');

    timer.context.openTimerPopup({ id: 501, nameKey: 'plank', type: 'time', baseValue: 60, target: 60 }, 30);
    await timer.elements['timer-done-button'].listeners.click();
    t.equal(timer.completeCalls.length, 1, 'Timer leitet ersten Satz an completeQuest weiter');
    t.equal(timer.completeCalls[0].options.showReward, false, 'Timer unterdrueckt vorzeitiges Reward-Popup');
    t.equal(timer.rewardCalls.length, 0, 'Timer-Zwischenstand zeigt keine Belohnung');
    t.ok(!timer.timerPopup.classList.contains('show'), 'Timer schliesst nach gespeichertem Zwischensatz');

    timer.context.openTimerPopup({ id: 501, nameKey: 'plank', type: 'time', baseValue: 60, target: 60 }, 30);
    await timer.elements['timer-done-button'].listeners.click();
    t.equal(timer.completeCalls.length, 2, 'Timer leitet letzten Satz genau einmal weiter');
    t.equal(timer.rewardCalls.length, 1, 'Nur der letzte Timer-Satz zeigt die Quest-Belohnung');
    t.ok(!timer.timerPopup.classList.contains('show'), 'Timer schliesst nach vollstaendigem Quest-Abschluss');

    const failedTimer = loadTimerFlow([{ ok: false, error: new Error('Testfehler') }]);
    failedTimer.context.openTimerPopup({ id: 501, nameKey: 'plank', type: 'time', baseValue: 60, target: 60 }, 30);
    await failedTimer.elements['timer-done-button'].listeners.click();
    t.equal(failedTimer.doneLabel.textContent, 'Geschafft!', 'Fehler stellt nur das Timer-Label wieder her');
    t.equal(failedTimer.elements['timer-done-button'].disabled, false, 'Timer kann nach Fehler erneut gespeichert werden');
    t.ok(failedTimer.timerPopup.classList.contains('show'), 'Timer bleibt bei Speicherfehler fuer Wiederholung offen');

    const freeTimer = loadTimerFlow([{ ok: true, mana: 5, gold: 3 }]);
    freeTimer.context.openTimerPopup({ id: 501, nameKey: 'plank', type: 'time', baseValue: 30, target: 30 });
    await freeTimer.elements['timer-done-button'].listeners.click();
    t.equal(freeTimer.freeCalls.length, 1, 'Freies Timer-Training nutzt weiterhin den freien Abschluss');
    t.ok(!freeTimer.timerPopup.classList.contains('show'), 'Freier Timer schliesst nach Erfolg');

    return t;
}

module.exports = { run, name: '16-daily-quest-completion-flow' };
