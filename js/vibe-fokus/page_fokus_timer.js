const DQ_FOKUS_TIMER = {
    DEFAULT_LABELS: [
        { key: 'focus_label_reading', text: 'Lesen' },
        { key: 'focus_label_learning', text: 'Lernen' },
        { key: 'focus_label_meditating', text: 'Meditieren' }
    ],

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
        
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const screen = document.createElement('div');
        screen.className = 'fokus-screen';
        screen.innerHTML = `
            <div class="timer-mode-selector">
                <button class="mode-button ${isPomodoro ? 'active' : ''}" data-mode="pomodoro" data-lang-key="fokus_mode_timer">${DQ_DATA.translations[lang].fokus_mode_timer}</button>
                <button class="mode-button ${!isPomodoro ? 'active' : ''}" data-mode="stopwatch" data-lang-key="fokus_mode_stopwatch">${DQ_DATA.translations[lang].fokus_mode_stopwatch}</button>
            </div>
            <div class="timer-display">${this.formatTime(timeToDisplay)}</div>
            <div class="motivational-quote"></div>
            <div class="timer-options" style="display: ${isPomodoro ? 'flex' : 'none'}">
                ${[15, 25, 50].map(min => `
                    <button class="time-option ${state.timer.pomodoroDuration === min * 60 ? 'selected' : ''}" data-minutes="${min}">${min} min</button>
                `).join('')}
            </div>
            <button class="start-stop-button" id="start-stop-btn" data-lang-key="${state.isSessionActive ? 'fokus_stop' : 'fokus_start'}">${state.isSessionActive ? DQ_DATA.translations[lang].fokus_stop : DQ_DATA.translations[lang].fokus_start}</button>
        `;
        container.appendChild(screen);

        this.addListeners();
        this.updateMotivationalQuote();
    },

    addListeners() {
        document.getElementById('start-stop-btn')?.addEventListener('click', () => {
            const state = DQ_VIBE_STATE.state;
            if (state.isSessionActive) {
                const elapsedMinutes = Math.floor(state.timer.elapsedSeconds / 60);
                
                // --- KORRIGIERTE LOGIK: Belohnung für Stoppuhr ab 2 Minuten ---
                if (state.timer.mode === 'stopwatch' && elapsedMinutes >= 2) {
                    this.completeSession(elapsedMinutes);
                } else {
                    // Stoppt den Timer (Pomodoro) manuell ohne Belohnung oder die Stoppuhr, wenn die Zeit unter 2 Minuten liegt.
                    this.stopTimer();
                }
            } else {
                this.handleStartClick();
            }
        });
        
        document.querySelectorAll('#fokus-tab-fokus .mode-button').forEach(btn => {
            btn.onclick = (e) => {
                if(DQ_VIBE_STATE.state.isSessionActive) return;
                DQ_VIBE_STATE.state.timer.mode = e.target.dataset.mode;
                DQ_VIBE_STATE.state.linkedQuest = null;
                this.renderTimerScreen();
                DQ_VIBE_STATE.saveState();
            };
        });

        document.querySelectorAll('#fokus-tab-fokus .time-option').forEach(btn => {
            btn.onclick = (e) => {
                if(DQ_VIBE_STATE.state.isSessionActive) return;
                DQ_VIBE_STATE.state.timer.pomodoroDuration = parseInt(e.target.dataset.minutes) * 60;
                DQ_VIBE_STATE.state.linkedQuest = null;
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

    handleStartClick() {
        const state = DQ_VIBE_STATE.state;
        
        if (state.linkedQuest && state.linkedQuest.labelKey) {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const label = DQ_DATA.translations[lang].exercise_names[state.linkedQuest.labelKey] || 'Lernen';
            this._startTimerInternal(label);
        } else {
            this.promptForLabel();
        }
    },

    _startTimerInternal(label) {
        const state = DQ_VIBE_STATE.state;
        state.isSessionActive = true;
        state.currentSessionLabel = label;
        
        state.timer.startTime = Date.now();
        if (state.timer.mode === 'pomodoro') {
            state.timer.endTime = Date.now() + state.timer.pomodoroDuration * 1000;
            state.timer.elapsedSeconds = state.timer.pomodoroDuration;
        } else {
            state.timer.elapsedSeconds = 0;
        }

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
        DQ_VIBE_STATE.saveState();
    },

    stopTimer() {
        const state = DQ_VIBE_STATE.state;
        if (state.timer.intervalId) clearInterval(state.timer.intervalId);
        state.isSessionActive = false;
        state.timer.intervalId = null;
        state.linkedQuest = null;
        state.currentSessionLabel = null;
        state.timer.startTime = 0;
        state.timer.endTime = 0;
        
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
            const remainingMilliseconds = state.timer.endTime - Date.now();
            state.timer.elapsedSeconds = Math.max(0, Math.round(remainingMilliseconds / 1000));
            
            if (state.timer.elapsedSeconds <= 0) {
                const minutes = Math.floor(state.timer.pomodoroDuration / 60);
                this.completeSession(minutes);
            }
        } else { // Stopwatch
            const elapsedMilliseconds = Date.now() - state.timer.startTime;
            state.timer.elapsedSeconds = Math.round(elapsedMilliseconds / 1000);
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
    
    async prepareSession(durationInMinutes, questData) {
        const state = DQ_VIBE_STATE.state;
        state.timer.mode = 'pomodoro';
        state.timer.pomodoroDuration = durationInMinutes * 60;
        state.linkedQuest = questData;
        await DQ_VIBE_STATE.saveState();
        this.renderTimerScreen();
    },

    async completeSession(minutes) {
        const linkedQuest = DQ_VIBE_STATE.state.linkedQuest;
        const sessionLabel = DQ_VIBE_STATE.state.currentSessionLabel;
        
        if (minutes < 2 && !linkedQuest) {
            this.stopTimer();
            return;
        }

        this.stopTimer();

        if (linkedQuest) {
            // Für Quest-Belohnungen wird das generische Popup verwendet, da die Belohnungen variieren
            const { type, id } = linkedQuest;
            if (type === 'quest') await DQ_EXERCISES.completeQuest(id);
            else if (type === 'free') await DQ_EXERCISES.completeFreeExercise(id);
            return;
        }

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
            label: sessionLabel
        });

        const tx = DQ_DB.db.transaction('character', 'readwrite');
        const store = tx.objectStore('character');
        const char = await new Promise(res => store.get(1).onsuccess = e => res(e.target.result));
        
        if (char) {
            char.gold += goldEarned;
            char.mana += manaEarned;
            char.totalGoldEarned += goldEarned;
            
            if (enduranceGained > 0) {
                char.stats.durchhaltevermoegen += enduranceGained;
            }
            
            DQ_CONFIG.levelUpCheck(char);
            store.put(char);
        }

        await DQ_VIBE_STATE.saveState();
        await new Promise(res => tx.oncomplete = res);

        // --- NEU: Ruft das spezifische Fokus-Popup auf ---
        DQ_UI.showFocusRewardPopup({
            minutes: minutes,
            gold: goldEarned,
            mana: manaEarned,
            statGains: { durchhaltevermoegen: enduranceGained }
        });

        DQ_CHARACTER_MAIN.renderPage();

        if (char) {
            DQ_ACHIEVEMENTS.checkAchievement(char, 'focus_time');
            DQ_ACHIEVEMENTS.checkAchievement(char, 'gold');
        }
    },

    async promptForLabel() {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const popup = document.getElementById('focus-label-popup');
        const list = document.getElementById('focus-label-list');
        list.innerHTML = '';

        const tx = DQ_DB.db.transaction('focus_labels', 'readonly');
        const customLabels = await new Promise(res => tx.objectStore('focus_labels').getAll().onsuccess = e => res(e.target.result));

        this.DEFAULT_LABELS.forEach(labelInfo => {
            const item = document.createElement('div');
            item.className = 'label-list-item';
            const translatedLabel = DQ_DATA.translations[lang][labelInfo.key] || labelInfo.text;
            item.innerHTML = `<span class="label-text">${translatedLabel}</span>`;
            item.onclick = () => {
                DQ_UI.hideTopPopup();
                this._startTimerInternal(translatedLabel);
            };
            list.appendChild(item);
        });

        customLabels.forEach(label => {
            const item = document.createElement('div');
            item.className = 'label-list-item';
            item.innerHTML = `
                <span class="label-text">${label.name}</span>
                <button class="delete-label-button" data-id="${label.id}">×</button>
            `;
            item.querySelector('.label-text').onclick = () => {
                DQ_UI.hideTopPopup();
                this._startTimerInternal(label.name);
            };
            item.querySelector('.delete-label-button').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Möchtest du das Label "${label.name}" wirklich löschen?`)) {
                    await this.deleteLabel(label.id);
                    this.promptForLabel(); // Re-render the list
                }
            };
            list.appendChild(item);
        });

        document.getElementById('add-new-label-button').onclick = () => {
            DQ_UI.hideTopPopup();
            this.promptForNewLabel();
        };

        DQ_UI.showPopup(popup);
    },

    async deleteLabel(id) {
        const tx = DQ_DB.db.transaction('focus_labels', 'readwrite');
        await new Promise(res => tx.objectStore('focus_labels').delete(id).onsuccess = res);
    },

    promptForNewLabel() {
        const popup = document.getElementById('new-focus-label-popup');
        const input = document.getElementById('new-focus-label-input');
        const saveButton = document.getElementById('save-new-label-button');
        input.value = '';

        const saveHandler = async () => {
            const newLabelName = input.value.trim();
            if (newLabelName) {
                const tx = DQ_DB.db.transaction('focus_labels', 'readwrite');
                await new Promise(res => tx.objectStore('focus_labels').add({ name: newLabelName }).onsuccess = res);
                DQ_UI.hideTopPopup();
                this.promptForLabel();
            }
        };

        saveButton.onclick = saveHandler;
        DQ_UI.showPopup(popup);
    }
};