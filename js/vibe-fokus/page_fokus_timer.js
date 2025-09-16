const DQ_FOKUS_TIMER = {

    renderTimerScreen() {
        const container = document.getElementById('fokus-tab-fokus');
        container.innerHTML = ''; 

        const state = DQ_VIBE_STATE.state;
        const isPomodoro = state.timer.mode === 'pomodoro';

        let timeToDisplay = 0;
        if (state.isSessionActive) {
            timeToDisplay = state.timer.elapsedSeconds;
        } else {
            timeToDisplay = isPomodoro ? state.timer.pomodoroDuration : 0;
        }
        
        const screen = document.createElement('div');
        screen.className = 'fokus-screen';
        screen.innerHTML = `
            <div class="timer-mode-selector">
                <button class="mode-button ${isPomodoro ? 'active' : ''}" data-mode="pomodoro" data-lang-key="fokus_mode_pomodoro">Pomodoro</button>
                <button class="mode-button ${!isPomodoro ? 'active' : ''}" data-mode="stopwatch" data-lang-key="fokus_mode_stopwatch">Stopuhr</button>
            </div>
            <div class="timer-display">${this.formatTime(timeToDisplay)}</div>
            <div class="motivational-quote"></div>
            <div class="pomodoro-options" style="display: ${isPomodoro ? 'flex' : 'none'}">
                ${[15, 25, 50].map(min => `
                    <button class="time-option ${state.timer.pomodoroDuration === min * 60 ? 'selected' : ''}" data-minutes="${min}">${min} min</button>
                `).join('')}
            </div>
            <button class="start-stop-button" id="start-stop-btn" data-lang-key="${state.isSessionActive ? 'fokus_stop' : 'fokus_start'}">${state.isSessionActive ? 'Stopp' : 'Start'}</button>
        `;
        container.appendChild(screen);

        this.addListeners();
        this.updateMotivationalQuote();
    },

    addListeners() {
        document.getElementById('start-stop-btn')?.addEventListener('click', () => {
            if (DQ_VIBE_STATE.state.isSessionActive) {
                const elapsedMinutes = Math.floor(DQ_VIBE_STATE.state.timer.elapsedSeconds / 60);
                if (DQ_VIBE_STATE.state.timer.mode === 'stopwatch' && elapsedMinutes > 0) {
                    this.completeSession(elapsedMinutes);
                } else {
                    this.stopTimer();
                }
            } else {
                this.startTimer();
            }
        });
        
        document.querySelectorAll('#fokus-tab-fokus .mode-button').forEach(btn => {
            btn.onclick = (e) => {
                if(DQ_VIBE_STATE.state.isSessionActive) return;
                DQ_VIBE_STATE.state.timer.mode = e.target.dataset.mode;
                this.renderTimerScreen();
                DQ_VIBE_STATE.saveState();
            };
        });

        document.querySelectorAll('#fokus-tab-fokus .time-option').forEach(btn => {
            btn.onclick = (e) => {
                if(DQ_VIBE_STATE.state.isSessionActive) return;
                DQ_VIBE_STATE.state.timer.pomodoroDuration = parseInt(e.target.dataset.minutes) * 60;
                this.renderTimerScreen();
                DQ_VIBE_STATE.saveState();
            };
        });
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    startTimer() {
        const state = DQ_VIBE_STATE.state;
        state.isSessionActive = true;
        state.timer.startTime = Date.now();
        state.timer.elapsedSeconds = state.timer.mode === 'pomodoro' ? state.timer.pomodoroDuration : 0;

        this.updateTimerDisplay();
        state.timer.intervalId = setInterval(() => this.updateTimer(), 1000);
        
        document.getElementById('bottom-nav').style.display = 'none';
        this.renderTimerScreen();

        const warningBox = document.getElementById('timer-warning-box');
        if (warningBox) {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            warningBox.querySelector('p').textContent = DQ_DATA.translations[lang].timer_warning_text;
            warningBox.style.display = 'flex';
        }
    },

    stopTimer() {
        const state = DQ_VIBE_STATE.state;
        if (state.timer.intervalId) clearInterval(state.timer.intervalId);
        state.isSessionActive = false;
        state.timer.intervalId = null;
        
        document.getElementById('bottom-nav').style.display = 'flex';
        this.renderTimerScreen();
        DQ_VIBE_STATE.saveState();

        const warningBox = document.getElementById('timer-warning-box');
        if (warningBox) {
            warningBox.style.display = 'none';
        }
    },

    updateTimer() {
        const state = DQ_VIBE_STATE.state;
        if (!state.isSessionActive) return;

        if (state.timer.mode === 'pomodoro') {
            state.timer.elapsedSeconds--;
            if (state.timer.elapsedSeconds <= 0) {
                const minutes = Math.floor(state.timer.pomodoroDuration / 60);
                this.completeSession(minutes);
            }
        } else {
            state.timer.elapsedSeconds++;
        }
        this.updateTimerDisplay();
    },

    updateTimerDisplay() {
        const timerDisplay = document.querySelector('#fokus-tab-fokus .timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(DQ_VIBE_STATE.state.timer.elapsedSeconds);
        }
    },

    updateMotivationalQuote() {
        const quoteEl = document.querySelector('#fokus-tab-fokus .motivational-quote');
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const quotes = {
            de: ["Jeder Schritt zählt.", "Konzentration ist der Schlüssel.", "Bleib dran, du schaffst das!", "Eine Minute nach der anderen.", "Wachstum braucht Zeit und Fokus."],
            en: ["Every step counts.", "Concentration is the key.", "Keep going, you can do it!", "One minute at a time.", "Growth needs time and focus."]
        };
        if (quoteEl) {
            quoteEl.textContent = DQ_VIBE_STATE.state.isSessionActive 
                ? quotes[lang][Math.floor(Math.random() * quotes[lang].length)]
                : '';
        }
    },

    async completeSession(minutes) {
        if (minutes < 1) {
            this.stopTimer();
            return;
        }

        // --- NEUE BELOHNUNGSBERECHNUNG ---
        const goldEarned = minutes * 4;
        const manaEarned = minutes * 2;
        const enduranceGained = Math.floor(minutes / 20);
        
        let plantedEmoji = DQ_VIBE_STATE.state.selectedEmoji === 'random'
            ? DQ_VIBE_STATE.state.unlockedEmojis[Math.floor(Math.random() * DQ_VIBE_STATE.state.unlockedEmojis.length)]
            : DQ_VIBE_STATE.state.selectedEmoji;

        DQ_VIBE_STATE.state.sessions.push({
            date: new Date().toISOString(),
            duration: minutes,
            emoji: plantedEmoji,
        });

        this.stopTimer();

        const tx = DQ_DB.db.transaction('character', 'readwrite');
        const store = tx.objectStore('character');
        const char = await new Promise(res => store.get(1).onsuccess = e => res(e.target.result));
        
        if (char) {
            char.gold += goldEarned;
            char.mana += manaEarned;
            
            if (enduranceGained > 0) {
                // Direkter Stat-Gewinn für Durchhaltevermögen
                const statGainTemplate = { directStatGain: { durchhaltevermoegen: enduranceGained } };
                DQ_CONFIG.processStatGains(char, statGainTemplate);
            }
            
            DQ_CONFIG.levelUpCheck(char);
            store.put(char);
        }

        await DQ_VIBE_STATE.saveState();
        await new Promise(res => tx.oncomplete = res);

        // --- NEUES BELOHNUNGS-POPUP ---
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const popupTitle = DQ_DATA.translations[lang].focus_reward_title;
        let statHtml = '';
        if (enduranceGained > 0) {
            statHtml = `<p><strong>${DQ_DATA.translations[lang].focus_reward_stats}:</strong> +${enduranceGained} Durchhaltevermögen 🔋</p>`;
        }
        const popupContent = `
            <p><strong>${DQ_DATA.translations[lang].focus_reward_time}:</strong> ${minutes} Minuten</p>
            <hr class="stat-separator">
            <p><strong>${DQ_DATA.translations[lang].focus_reward_gold}:</strong> +${goldEarned} 💰</p>
            <p><strong>${DQ_DATA.translations[lang].focus_reward_mana}:</strong> +${manaEarned} ✨</p>
            ${statHtml}
        `;
        DQ_UI.showRewardPopup(popupTitle, popupContent);

        DQ_CHARACTER_MAIN.renderPage();

        if (char) {
            DQ_ACHIEVEMENTS.checkAchievement(char, 'focus_time');
        }
    }
};