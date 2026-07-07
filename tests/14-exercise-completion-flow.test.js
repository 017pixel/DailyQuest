/**
 * Test 14: Uebungsabschluss-Flows fuer Daily Quests und Freies Training.
 */
const fs = require('fs');
const path = require('path');
const { BASE, TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Uebungsabschluss-Flows');

    const main = fs.readFileSync(path.join(BASE, 'main.js'), 'utf8');
    const exercises = fs.readFileSync(path.join(BASE, 'js/page_exercises_training.js'), 'utf8');
    const trainingSystem = fs.readFileSync(path.join(BASE, 'js/training_system.js'), 'utf8');

    // Button-Labels / Completion-Modes
    t.ok(trainingSystem.includes("if (quest.completionMode === 'log') return 'OK';"), 'Legacy-Log-Quests bleiben per OK abschliessbar');
    t.ok(trainingSystem.includes("if (quest.completionMode === 'timer') return this.t('timer_start_button', 'Los');"), 'Timer-Quests zeigen Los');
    t.ok(trainingSystem.includes("return `${doneSets}/${totalSets}`;"), 'Set-Quests zeigen Fortschritt wie 1/2');
    t.ok(trainingSystem.includes("if (quest.type === 'focus') return this.t('start_task_button', 'Los');"), 'Fokus-Quests zeigen Los');

    // Daily Quest Abschluss muss den neuen Character fuer Achievement-Pruefungen zurueckgeben.
    t.ok(main.includes("return await navigator.locks.request('quest-completion-lock', runCompletion);"), 'Daily-Quest-Abschluss gibt Character auch mit Web Locks zurueck');
    t.ok(main.includes('return await runCompletion();'), 'Daily-Quest-Abschluss gibt Character ohne Web Locks zurueck');
    t.ok(main.includes('char.mana += quest.manaReward;') && main.includes('char.gold += quest.goldReward;'), 'Daily-Quest-Abschluss vergibt Mana und Gold');
    t.ok(main.includes('quest.completed = true;'), 'Daily-Quest-Abschluss markiert Quest als erledigt');
    t.ok(main.includes("quest.completionMode === 'sets'") && main.includes('setProgress.every(Boolean)'), 'Set-Quest kann erst nach allen Saetzen final abgeschlossen werden');

    // Freies Training darf keine offene Readwrite-Transaktion ueber await DQ_WGER.getById halten.
    const freeCompletionStart = exercises.indexOf('async completeFreeExercise(exerciseId)');
    const exerciseLoad = exercises.indexOf('const exercise = await DQ_WGER.getById(exerciseId);', freeCompletionStart);
    const firstWriteTx = exercises.indexOf("DQ_DB.db.transaction(['character'], 'readwrite')", freeCompletionStart);
    t.ok(exerciseLoad !== -1 && firstWriteTx !== -1 && exerciseLoad < firstWriteTx, 'Freies Training laedt Uebung vor der Write-Transaktion');
    t.ok(exercises.includes("DQ_DB.db.transaction(['character'], 'readonly')"), 'Freies Training liest Character in separater Readonly-Transaktion');
    t.ok(exercises.includes('char.mana += scaledMana;') && exercises.includes('char.gold += scaledGold;'), 'Freies Training vergibt skalierte Belohnungen');
    t.ok(exercises.includes('DQ_ACHIEVEMENTS.checkAllAchievements(char);'), 'Freies Training prueft Achievements mit aktualisiertem Character');

    return t;
}

module.exports = { run, name: '14-exercise-completion-flow' };
