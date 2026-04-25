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
    const circleProgress = document.getElementById('timer-circle-progress');
    if (circleProgress) circleProgress.style.strokeDashoffset = '0';

    document.getElementById('timer-start-button').classList.remove('hidden');
    document.getElementById('timer-pause-button').classList.add('hidden');
    document.getElementById('timer-resume-button').classList.add('hidden');
    document.getElementById('timer-done-button').classList.add('hidden');
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

function completeExercise() {
    if (isCompleting) return;
    isCompleting = true;
    if (currentQuestId) {
        DQ_EXERCISES.finalizeQuestCompletion(currentQuestId);
    } else if (currentExercise && currentExercise.id) {
        DQ_EXERCISES.completeFreeExercise(currentExercise.id);
    }
    DQ_UI.hideAllPopups();
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