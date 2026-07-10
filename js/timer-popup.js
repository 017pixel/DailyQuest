let timerInterval = null;
let currentExercise = null;
let currentQuestId = null;
let totalTime = 0;
let remainingTime = 0;
let isRunning = false;
let isPaused = false;

// Funktion SOFORT global verfügbar machen
function openTimerPopup(exercise, questId = null) {
    currentExercise = exercise;
    currentQuestId = questId;
    
    // Zeit skalieren falls noetig
    let scaledTime = exercise.baseValue;
    if (exercise.type === 'time' && !exercise.target) {
        const difficulty = DQ_CONFIG.userSettings?.difficulty || 3;
        scaledTime = Math.ceil(exercise.baseValue * (1 + 0.4 * (difficulty - 1)));
    } else if (exercise.target) {
        scaledTime = exercise.target;
    }
    totalTime = scaledTime;
    remainingTime = totalTime;

    const exerciseName = getExerciseName(exercise.nameKey);
    document.getElementById('timer-exercise-name').textContent = exerciseName;

    isRunning = false;
    isPaused = false;
    resetTimerUI();

    DQ_UI.showPopup(document.getElementById('timer-popup'));
};

function getExerciseName(nameKey) {
    const lang = DQ_CONFIG.userSettings?.language || 'de';
    if (currentExercise && typeof DQ_WGER !== 'undefined') {
        const displayName = DQ_WGER.getDisplayName(currentExercise, lang);
        if (displayName && displayName !== 'Training') return displayName;
    }
    const nameTranslations = DQ_DATA.translations[lang]?.exercise_names;
    if (nameTranslations && nameTranslations[nameKey]) {
        return nameTranslations[nameKey];
    }
    const explanations = DQ_DATA.exerciseExplanations[lang] || DQ_DATA.exerciseExplanations['de'];
    return explanations[nameKey] || nameKey;
}

function resetTimerUI() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isCompleting = false;
    remainingTime = totalTime;
    document.getElementById('timer-display').textContent = formatTime(remainingTime);
    const progressFill = document.getElementById('timer-progress-fill');
    if (progressFill) progressFill.style.width = '100%';
    const circleProgress = document.getElementById('timer-circle-progress');
    if (circleProgress) circleProgress.style.strokeDashoffset = '0';

    document.getElementById('timer-start-button').classList.remove('hidden');
    document.getElementById('timer-pause-button').classList.add('hidden');
    document.getElementById('timer-resume-button').classList.add('hidden');
    const doneButton = document.getElementById('timer-done-button');
    doneButton.classList.add('hidden');
    doneButton.disabled = false;
    const doneLabel = doneButton.querySelector('[data-lang-key="timer_done"]');
    if (doneLabel) {
        const lang = DQ_CONFIG.userSettings?.language || 'de';
        doneLabel.textContent = DQ_DATA.translations[lang]?.timer_done || 'Geschafft!';
    }
    document.getElementById('timer-countdown-overlay').classList.add('hidden');
}

function startCountdown() {
    const countdownOverlay = document.getElementById('timer-countdown-overlay');
    const countdownNumber = document.getElementById('timer-countdown-number');

    countdownOverlay.classList.remove('hidden');
    let count = 5;

    countdownNumber.textContent = count;
    countdownNumber.style.animation = 'none';
    void countdownNumber.offsetWidth;
    countdownNumber.style.animation = 'countdownDropDown 0.5s ease-out';

    const countdownInterval = setInterval(() => {
        count--;

        if (count > 0) {
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdownDropDown 0.5s ease-out';
            countdownNumber.textContent = count;
        } else if (count === 0) {
            countdownNumber.textContent = 'GO!';
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdownDropDown 0.5s ease-out';
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.classList.add('hidden');
            startTimer();
        }
    }, 1000);
}

function startTimer() {
    isRunning = true;
    isPaused = false;
    remainingTime = totalTime;

    timerInterval = setInterval(() => {
        if (!isPaused && remainingTime > 0) {
            remainingTime--;
            updateTimerDisplay(remainingTime);
            updateProgressBar(remainingTime);

            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                onTimerFinished();
            }
        }
    }, 1000);

    document.getElementById('timer-start-button').classList.add('hidden');
    document.getElementById('timer-pause-button').classList.remove('hidden');
}

function pauseTimer() {
    isPaused = true;
    showPauseState();
}

function resumeTimer() {
    isPaused = false;
    showResumeState();
}

function onTimerFinished() {
    isRunning = false;
    isPaused = false;

    document.getElementById('timer-pause-button').classList.add('hidden');
    document.getElementById('timer-done-button').classList.remove('hidden');

    document.getElementById('timer-display').textContent = '00:00';
    const progressFill = document.getElementById('timer-progress-fill');
    if (progressFill) progressFill.style.width = '0%';
    const circleProgress = document.getElementById('timer-circle-progress');
    if (circleProgress) {
        const circumference = 2 * Math.PI * 120;
        circleProgress.style.strokeDashoffset = circumference; // Leer bei Ende
    }
}

function updateTimerDisplay(seconds) {
    document.getElementById('timer-display').textContent = formatTime(seconds);
}

function updateProgressBar(seconds) {
    const remainingRatio = seconds / totalTime;
    const progressFill = document.getElementById('timer-progress-fill');
    if (progressFill) progressFill.style.width = (remainingRatio * 100) + '%';
    const circleProgress = document.getElementById('timer-circle-progress');
    if (circleProgress) {
        const circumference = 2 * Math.PI * 120;
        // Kreis zeigt verbleibende Zeit: voll bei Start, leer bei Ende
        circleProgress.style.strokeDashoffset = (circumference * (1 - remainingRatio));
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function showPauseState() {
    document.getElementById('timer-pause-button').classList.add('hidden');
    document.getElementById('timer-resume-button').classList.remove('hidden');
}

function showResumeState() {
    document.getElementById('timer-resume-button').classList.add('hidden');
    document.getElementById('timer-pause-button').classList.remove('hidden');
}

let isCompleting = false;

function closeTimerPopupOnly() {
    const timerPopup = document.getElementById('timer-popup');
    if (!timerPopup || !DQ_UI.popupStack) {
        DQ_UI.hideAllPopups();
        return;
    }

    const stackIndex = DQ_UI.popupStack.indexOf(timerPopup);
    if (stackIndex !== -1) {
        DQ_UI.popupStack.splice(stackIndex, 1);
    }
    timerPopup.classList.remove('show');

    if (DQ_UI.popupStack.length === 0 && DQ_UI.elements?.popupOverlay) {
        setTimeout(() => {
            if (DQ_UI.popupStack.length === 0) {
                DQ_UI.elements.popupOverlay.classList.remove('show');
            }
        }, 400);
    }
}

async function completeExercise() {
    if (isCompleting) return;
    isCompleting = true;
    const doneButton = document.getElementById('timer-done-button');
    const doneLabel = doneButton?.querySelector('[data-lang-key="timer_done"]');
    const previousText = doneLabel?.textContent || '';
    if (doneButton) {
        const lang = DQ_CONFIG.userSettings?.language || 'de';
        doneButton.disabled = true;
        if (doneLabel) doneLabel.textContent = DQ_DATA.translations[lang]?.timer_saving || 'Speichere...';
    }

    try {
        let result = { ok: false };
        if (currentQuestId !== null && currentQuestId !== undefined) {
            result = await DQ_EXERCISES.completeQuest(currentQuestId, { showReward: false });
            if (result?.ok) {
                closeTimerPopupOnly();
                if (result.completed) DQ_EXERCISES.showQuestCompletionReward(result.quest);
            }
        } else if (currentExercise && currentExercise.id) {
            result = await DQ_EXERCISES.completeFreeExercise(currentExercise.id, { showReward: false });
            if (result?.ok) {
                closeTimerPopupOnly();
                DQ_UI.showCustomPopup(`Sehr gut! <span class=\"material-symbols-rounded icon-accent\">thumb_up</span><br>+${result.mana} Mana <span class=\"material-symbols-rounded icon-mana\">auto_awesome</span> | +${result.gold} Gold <span class=\"material-symbols-rounded icon-gold\">paid</span>`);
            }
        }

        if (!result?.ok) {
            isCompleting = false;
            if (doneButton) {
                doneButton.disabled = false;
                if (doneLabel) doneLabel.textContent = previousText || 'Geschafft!';
            }
        }
    } catch (error) {
        console.error('Timer-Abschluss fehlgeschlagen:', error);
        isCompleting = false;
        if (doneButton) {
            doneButton.disabled = false;
            if (doneLabel) doneLabel.textContent = previousText || 'Geschafft!';
        }
        DQ_UI.showCustomPopup('Speichern fehlgeschlagen. Bitte versuche es erneut.', 'penalty');
    }
}

function confirmLeave() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    DQ_UI.hideAllPopups();
}

function showTimerWarningPopup() {
    if (isRunning && !isPaused) {
        DQ_UI.showPopup(document.getElementById('timer-warning-popup'));
    } else {
        confirmLeave();
    }
}

function closeWarningPopup() {
    DQ_UI.hideAllPopups();
}

function initTimerCloseHandler() {
    const timerPopup = document.getElementById('timer-popup');
    if (timerPopup) {
        const dragHandle = timerPopup.querySelector('.popup-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('click', function(e) {
                if (isRunning && !isPaused) {
                    e.preventDefault();
                    e.stopPropagation();
                    showTimerWarningPopup();
                }
            });
        }
    }
}

function initTimerPopup() {
    document.getElementById('timer-start-button').addEventListener('click', startCountdown);
    document.getElementById('timer-pause-button').addEventListener('click', pauseTimer);
    document.getElementById('timer-resume-button').addEventListener('click', resumeTimer);
    document.getElementById('timer-done-button').addEventListener('click', completeExercise);

    document.getElementById('timer-warning-cancel').addEventListener('click', closeWarningPopup);
    document.getElementById('timer-warning-confirm').addEventListener('click', confirmLeave);
}

document.addEventListener('DOMContentLoaded', function() {
    initTimerPopup();
    initTimerCloseHandler();
});
