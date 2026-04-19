const TIMER_WORKER_PATH = '/js/timer-worker.js';

let timerWorker = null;
let currentExercise = null;
let currentQuestId = null;
let totalTime = 0;
let isRunning = false;
let isPaused = false;

function initTimerPopup() {
    timerWorker = new Worker(TIMER_WORKER_PATH);

    timerWorker.onmessage = function(e) {
        const { action, remaining } = e.data;

        switch(action) {
            case 'tick':
                updateTimerDisplay(remaining);
                updateProgressBar(remaining);
                break;
            case 'finished':
                onTimerFinished();
                break;
            case 'paused':
                showPauseState();
                break;
            case 'resumed':
                showResumeState();
                break;
            case 'stopped':
                resetTimerState();
                break;
        }
    };

    document.getElementById('timer-start-button').addEventListener('click', startCountdown);
    document.getElementById('timer-pause-button').addEventListener('click', pauseTimer);
    document.getElementById('timer-resume-button').addEventListener('click', resumeTimer);
    document.getElementById('timer-done-button').addEventListener('click', completeExercise);

    document.getElementById('timer-warning-cancel').addEventListener('click', closeWarningPopup);
    document.getElementById('timer-warning-confirm').addEventListener('click', confirmLeave);
}

function openTimerPopup(exercise, questId = null) {
    currentExercise = exercise;
    currentQuestId = questId;
    totalTime = exercise.baseValue;

    const exerciseName = getExerciseName(exercise.nameKey);
    document.getElementById('timer-exercise-name').textContent = exerciseName;

    isRunning = false;
    isPaused = false;
    resetTimerUI();

    DQ_UI.showPopup(document.getElementById('timer-popup'));
}

function getExerciseName(nameKey) {
    const lang = getCurrentLanguage();
    const translations = DQ_DATA.exerciseExplanations[lang] || DQ_DATA.exerciseExplanations['de'];
    return translations[nameKey] || nameKey;
}

function resetTimerUI() {
    document.getElementById('timer-display').textContent = formatTime(totalTime);
    document.getElementById('timer-progress-fill').style.width = '0%';
    
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
    countdownNumber.style.animation = 'countdownSlideIn 0.5s ease-out';
    
    const countdownInterval = setInterval(() => {
        count--;
        
        if (count > 0) {
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdownSlideIn 0.5s ease-out';
            countdownNumber.textContent = count;
        } else if (count === 0) {
            countdownNumber.textContent = 'GO!';
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdownSlideIn 0.5s ease-out';
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
    
    timerWorker.postMessage({ action: 'start', time: totalTime });
    
    document.getElementById('timer-start-button').classList.add('hidden');
    document.getElementById('timer-pause-button').classList.remove('hidden');
}

function pauseTimer() {
    isPaused = true;
    timerWorker.postMessage({ action: 'pause' });
}

function resumeTimer() {
    isPaused = false;
    timerWorker.postMessage({ action: 'resume' });
}

function onTimerFinished() {
    isRunning = false;
    isPaused = false;
    
    document.getElementById('timer-pause-button').classList.add('hidden');
    document.getElementById('timer-done-button').classList.remove('hidden');
    
    document.getElementById('timer-display').textContent = '00:00';
    document.getElementById('timer-progress-fill').style.width = '100%';
}

function updateTimerDisplay(remaining) {
    document.getElementById('timer-display').textContent = formatTime(remaining);
}

function updateProgressBar(remaining) {
    const elapsed = totalTime - remaining;
    const percentage = (elapsed / totalTime) * 100;
    document.getElementById('timer-progress-fill').style.width = percentage + '%';
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

function resetTimerState() {
    isRunning = false;
    isPaused = false;
}

function completeExercise() {
    if (currentExercise) {
        if (currentQuestId) {
            DQ_EXERCISES.finalizeQuestCompletion(currentQuestId);
        } else if (currentExercise.id) {
            DQ_EXERCISES.completeFreeExercise(currentExercise.id);
        }
    }
    DQ_UI.hidePopup();
}

function confirmLeave() {
    timerWorker.postMessage({ action: 'stop' });
    DQ_UI.hidePopup();
    DQ_UI.hidePopup();
}

function showTimerWarningPopup() {
    if (isRunning && !isPaused) {
        DQ_UI.showPopup(document.getElementById('timer-warning-popup'));
    } else {
        confirmLeave();
    }
}

function closeWarningPopup() {
    DQ_UI.hidePopup();
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

document.addEventListener('DOMContentLoaded', function() {
    initTimerPopup();
    initTimerCloseHandler();
});