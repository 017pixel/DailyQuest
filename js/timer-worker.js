let timerInterval = null;
let remainingTime = 0;
let isPaused = false;

self.onmessage = function(e) {
    const { action, time } = e.data;
    
    switch(action) {
        case 'start':
            startTimer(time);
            break;
        case 'pause':
            pauseTimer();
            break;
        case 'resume':
            resumeTimer();
            break;
        case 'stop':
            stopTimer();
            break;
        case 'getRemaining':
            self.postMessage({ action: 'tick', remaining: remainingTime });
            break;
    }
};

function startTimer(seconds) {
    remainingTime = seconds;
    isPaused = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        if (!isPaused && remainingTime > 0) {
            remainingTime--;
            self.postMessage({ action: 'tick', remaining: remainingTime });
            
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                self.postMessage({ action: 'finished' });
            }
        }
    }, 1000);
    
    self.postMessage({ action: 'tick', remaining: remainingTime });
}

function pauseTimer() {
    isPaused = true;
    self.postMessage({ action: 'paused', remaining: remainingTime });
}

function resumeTimer() {
    isPaused = false;
    self.postMessage({ action: 'resumed', remaining: remainingTime });
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    remainingTime = 0;
    isPaused = false;
    self.postMessage({ action: 'stopped' });
}
