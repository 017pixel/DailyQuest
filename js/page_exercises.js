const DQ_EXERCISES = {
    currentFreeExerciseFilter: 'all',
    pendingEnduranceQuestId: null,

    init(elements) {
        elements.pageExercises.addEventListener('click', (event) => this.handleExerciseClick(event));
        elements.freeExerciseFilters.addEventListener('click', (event) => this.handleFilterClick(event));
        elements.searchExerciseButton.addEventListener('click', () => this.openSearchPopup());
        elements.searchExerciseConfirmButton.addEventListener('click', () => this.executeSearch());
        if (elements.enduranceEntrySaveButton) {
            elements.enduranceEntrySaveButton.addEventListener('click', () => this.saveEnduranceEntry());
        }
        if (elements.enduranceEntryCancelButton) {
            elements.enduranceEntryCancelButton.addEventListener('click', () => this.closeEndurancePopup());
        }

        // Smooth Scroll für Reveal-Handle
        const revealBtn = document.getElementById('reveal-free-training');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => {
                const freeTraining = document.getElementById('free-training-container');
                if (!freeTraining) return;
                const container = document.getElementById('app-container');
                const top = freeTraining.offsetTop - 12; // leichter Offset
                container.scrollTo({ top, behavior: 'smooth' });
            });
        }
    },

    handleFilterClick(event) {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            if (target.id === 'search-exercise-button') return;

            this.setFreeExerciseFilter(target.dataset.filter);
        }
    },

    setFreeExerciseFilter(filter) {
        const next = filter || 'all';
        const active = DQ_UI.elements.freeExerciseFilters.querySelector('.active');
        if (active) active.classList.remove('active');
        const button = DQ_UI.elements.freeExerciseFilters.querySelector(`[data-filter="${next}"]`);
        if (button) button.classList.add('active');
        this.currentFreeExerciseFilter = next;
        this.renderFreeExercisesPage();
    },

    async handleExerciseClick(event) {
        const button = event.target.closest('button.action-button');
        if (!button) return;
        const card = button.closest('.exercise-card');
        if (!card) return;

        const action = button.dataset.action;
        const isQuest = card.parentElement.id === 'quest-list';

        if (isQuest) {
            const questId = parseInt(card.dataset.questId, 10);
            if (action === 'info') {
                this.showQuestInfo(questId);
            } else if (action === 'start-timer') {
                const quest = await new Promise(res => DQ_DB.db.transaction('daily_quests').objectStore('daily_quests').get(questId).onsuccess = e => res(e.target.result));
                if (quest) {
                    const exerciseTemplate = await DQ_TRAINING_SYSTEM.getTemplateByNameKey(quest.nameKey);
                    if (exerciseTemplate && exerciseTemplate.type === 'time') {
                        // quest.target ist bereits die skalierte Zeit
                        const questExercise = { ...exerciseTemplate, baseValue: quest.target, target: quest.target };
                        this.showTimerPopup(questExercise, questId);
                    }
                }
            } else if (action === 'complete') {
                await this.completeQuest(questId);
            } else if (action === 'start-focus') {
                const quest = await new Promise(res => DQ_DB.db.transaction('daily_quests').objectStore('daily_quests').get(questId).onsuccess = e => res(e.target.result));
                if (quest) {
                    const exerciseTemplate = await DQ_TRAINING_SYSTEM.getTemplateByNameKey(quest.nameKey);
                    if (exerciseTemplate && exerciseTemplate.timerDuration) {
                        const labelKey = this.getLabelKeyForExercise(exerciseTemplate.nameKey);
                        DQ_FOKUS_TIMER.prepareSession(exerciseTemplate.timerDuration, { type: 'quest', id: questId, labelKey: labelKey });
                        const focusNavButton = document.querySelector('.nav-button[data-page="page-fokus"]');
                        if (focusNavButton) DQ_UI.handleNavClick(focusNavButton);
                    }
                }
            }
        } else {
            const exerciseId = card.dataset.exerciseId;
            if (action === 'info') {
                this.showFreeExerciseInfo(exerciseId);
            } else if (action === 'complete') {
                this.completeFreeExercise(exerciseId);
            } else if (action === 'start-timer') {
                const exercise = await DQ_WGER.getById(exerciseId);
                if (exercise && exercise.type === 'time') {
                    if (exercise.baseValue <= 180) {
                        const difficulty = DQ_CONFIG.userSettings?.difficulty || 3;
                        const scaledTime = Math.ceil(exercise.baseValue * (1 + 0.4 * (difficulty - 1)));
                        const scaledExercise = { ...exercise, baseValue: scaledTime };
                        this.showTimerPopup(scaledExercise, exerciseId);
                    }
                }
            } else if (action === 'start-focus') {
                const exercise = await DQ_WGER.getById(exerciseId);
                if (exercise) {
                     if (exercise.timerDuration) {
                        const labelKey = this.getLabelKeyForExercise(exercise.nameKey);
                        DQ_FOKUS_TIMER.prepareSession(exercise.timerDuration, { type: 'free', id: exerciseId, labelKey: labelKey });
                        const focusNavButton = document.querySelector('.nav-button[data-page="page-fokus"]');
                        if (focusNavButton) DQ_UI.handleNavClick(focusNavButton);
                     }
                }
            }
        }
    },

    getLabelKeyForExercise(nameKey) {
        const keyMap = {
            read_15pages: 'focus_label_reading',
            read_for_school: 'focus_label_reading',
            learn_something: 'focus_label_learning',
            learn_new_skill: 'focus_label_learning',
            learn_language: 'focus_label_learning',
            learn_math: 'focus_label_learning',
            learn_science: 'focus_label_learning'
        };
        return keyMap[nameKey] || 'focus_label_learning';
    },

    openSearchPopup() {
        const popup = DQ_UI.elements.searchExercisePopup;
        const input = DQ_UI.elements.searchExerciseInput;
        const errorMsg = DQ_UI.elements.searchExerciseError;
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const infoBoxP = popup.querySelector('[data-lang-key="search_exercise_info"]');
        if (infoBoxP) {
            infoBoxP.textContent = DQ_DATA.translations[lang].search_exercise_info;
        }

        input.value = '';
        errorMsg.textContent = '';
        DQ_UI.showPopup(popup);
        
        setTimeout(() => input.focus(), 400); 
    },

    async executeSearch() {
        const input = DQ_UI.elements.searchExerciseInput;
        const errorMsg = DQ_UI.elements.searchExerciseError;
        const searchTerm = input.value.trim().toLowerCase();
        
        input.blur();

        if (!searchTerm) {
            DQ_UI.hideTopPopup();
            return;
        }

        try {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            if (typeof DQ_WGER !== 'undefined') DQ_WGER.searchTerm = searchTerm;
            this.setFreeExerciseFilter('all');
            const result = typeof DQ_WGER !== 'undefined'
                ? await DQ_WGER.queryExercises({ category: 'all', search: searchTerm, limit: 1 })
                : { items: [] };
            const foundExercise = result.items[0] || null;

            if (foundExercise) {
                setTimeout(() => {
                    const cardToHighlight = document.querySelector(`#exercise-list .exercise-card[data-exercise-id="${CSS.escape(String(foundExercise.id))}"]`);
                    if (cardToHighlight) {
                        cardToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        cardToHighlight.classList.add('highlight');
                        setTimeout(() => cardToHighlight.classList.remove('highlight'), 2000);
                    }
                }, 100);

                errorMsg.textContent = '';
                DQ_UI.hideTopPopup();
            } else {
                errorMsg.textContent = DQ_DATA.translations[lang].search_exercise_not_found;
            }
        } catch (error) {
            console.error("Fehler bei der Übungssuche:", error);
            errorMsg.textContent = "Ein Fehler ist aufgetreten.";
        }
    },

    formatTargetDisplay(type, value) {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const repsLabel = (DQ_DATA.translations[lang] && DQ_DATA.translations[lang].reps_label) || 'Reps';
        const secondsLabel = lang === 'en' ? 'sec.' : 'Sek.';
        if (type === 'reps') return `${value} ${repsLabel}`;
        if (type === 'time') {
            if (value >= 60) {
                const minutes = Math.floor(value / 60);
                const seconds = value % 60;
                if (seconds === 0) return `${minutes} min`;
                return `${minutes}m ${seconds}s`;
            }
            return `${value} ${secondsLabel}`;
        }
        return '';
    },

    // DIRECT TIMER POPUP - keine externe Abhaengigkeit!
    showTimerPopup(exercise, questId) {
        const popup = document.getElementById('timer-popup');
        if (!popup) return;

        const lang = DQ_CONFIG.userSettings?.language || 'de';
        const translatedName = typeof DQ_WGER !== 'undefined'
            ? DQ_WGER.getDisplayName(exercise, lang)
            : (DQ_DATA.translations[lang]?.exercise_names?.[exercise.nameKey] || exercise.nameKey);
        document.getElementById('timer-exercise-name').textContent = translatedName;
        document.getElementById('timer-display').textContent = this.formatTargetDisplay(exercise.type, exercise.baseValue);
        document.getElementById('timer-progress-fill').style.width = '100%';
        document.getElementById('timer-circle-progress').style.strokeDashoffset = '0';

        document.getElementById('timer-start-button').classList.remove('hidden');
        document.getElementById('timer-pause-button').classList.add('hidden');
        document.getElementById('timer-resume-button').classList.add('hidden');
        document.getElementById('timer-done-button').classList.add('hidden');
        document.getElementById('timer-countdown-overlay').classList.add('hidden');

        // Timer state
        let timerInterval = null;
        let totalTime = exercise.baseValue;
        let remainingTime = totalTime;
        let isPaused = false;
        const circleCircumference = 2 * Math.PI * 120; // radius = 120

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        }

        function updateTimerUI() {
            const remainingRatio = remainingTime / totalTime;
            document.getElementById('timer-display').textContent = formatTime(remainingTime);
            document.getElementById('timer-progress-fill').style.width = (remainingRatio * 100) + '%';
            document.getElementById('timer-circle-progress').style.strokeDashoffset = (circleCircumference * (1 - remainingRatio));
        }

        // Button handlers
        document.getElementById('timer-start-button').onclick = function() {
            let count = 5;
            const overlay = document.getElementById('timer-countdown-overlay');
            const num = document.getElementById('timer-countdown-number');
            overlay.classList.remove('hidden');
            num.textContent = count;

            const countdown = setInterval(function() {
                count--;
                if (count > 0) {
                    num.textContent = count;
                } else if (count === 0) {
                    num.textContent = 'GO!';
                } else {
                    clearInterval(countdown);
                    overlay.classList.add('hidden');
                    // Start timer
                    isPaused = false;
                    timerInterval = setInterval(function() {
                        if (!isPaused && remainingTime > 0) {
                            remainingTime--;
                            updateTimerUI();
                            if (remainingTime <= 0) {
                                clearInterval(timerInterval);
                                timerInterval = null;
                                document.getElementById('timer-pause-button').classList.add('hidden');
                                document.getElementById('timer-resume-button').classList.add('hidden');
                                document.getElementById('timer-done-button').classList.remove('hidden');
                                document.getElementById('timer-display').textContent = '00:00';
                                document.getElementById('timer-progress-fill').style.width = '0%';
                                document.getElementById('timer-circle-progress').style.strokeDashoffset = circleCircumference;
                            }
                        }
                    }, 1000);
                    document.getElementById('timer-start-button').classList.add('hidden');
                    document.getElementById('timer-pause-button').classList.remove('hidden');
                }
            }, 1000);
        };

        document.getElementById('timer-pause-button').onclick = function() {
            isPaused = true;
            document.getElementById('timer-pause-button').classList.add('hidden');
            document.getElementById('timer-resume-button').classList.remove('hidden');
        };

        document.getElementById('timer-resume-button').onclick = function() {
            isPaused = false;
            document.getElementById('timer-resume-button').classList.add('hidden');
            document.getElementById('timer-pause-button').classList.remove('hidden');
        };

        let isCompleting = false;
        document.getElementById('timer-done-button').onclick = function() {
            if (isCompleting) return;
            isCompleting = true;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            if (questId) {
                this.completeQuest(questId);
            } else {
                this.completeFreeExercise(exercise.id);
            }
            DQ_UI.hideAllPopups();
        }.bind(this);

        document.getElementById('timer-warning-cancel').onclick = function() {
            DQ_UI.hideAllPopups();
        };
        document.getElementById('timer-warning-confirm').onclick = function() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            DQ_UI.hideAllPopups();
        };

        DQ_UI.showPopup(popup);
    },
};
