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

            DQ_UI.elements.freeExerciseFilters.querySelector('.active').classList.remove('active');
            target.classList.add('active');
            this.currentFreeExerciseFilter = target.dataset.filter;
            this.renderFreeExercisesPage();
        }
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
                    const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.nameKey === quest.nameKey);
                    if (exerciseTemplate && exerciseTemplate.type === 'time') {
                        openTimerPopup(exerciseTemplate, questId);
                    }
                }
            } else if (action === 'complete') {
                await this.completeQuest(questId);
            } else if (action === 'start-focus') {
                const quest = await new Promise(res => DQ_DB.db.transaction('daily_quests').objectStore('daily_quests').get(questId).onsuccess = e => res(e.target.result));
                if (quest) {
                    const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.nameKey === quest.nameKey);
                    if (exerciseTemplate && exerciseTemplate.timerDuration) {
                        const labelKey = this.getLabelKeyForExercise(exerciseTemplate.nameKey);
                        DQ_FOKUS_TIMER.prepareSession(exerciseTemplate.timerDuration, { type: 'quest', id: questId, labelKey: labelKey });
                        const focusNavButton = document.querySelector('.nav-button[data-page="page-fokus"]');
                        if (focusNavButton) DQ_UI.handleNavClick(focusNavButton);
                    }
                }
            }
        } else {
            const exerciseId = parseInt(card.dataset.exerciseId, 10);
            if (action === 'info') {
                this.showFreeExerciseInfo(exerciseId);
            } else if (action === 'complete') {
                this.completeFreeExercise(exerciseId);
            } else if (action === 'start-timer') {
                const exercise = await new Promise(res => DQ_DB.db.transaction('exercises').objectStore('exercises').get(exerciseId).onsuccess = e => res(e.target.result));
                if (exercise && exercise.type === 'time') {
                    const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.id === exercise.id);
                    if (exerciseTemplate && exercise.baseValue <= 180) {
                        openTimerPopup(exerciseTemplate, exerciseId);
                    }
                }
            } else if (action === 'start-focus') {
                const exercise = await new Promise(res => DQ_DB.db.transaction('exercises').objectStore('exercises').get(exerciseId).onsuccess = e => res(e.target.result));
                if (exercise) {
                     const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.id === exercise.id);
                     if (exerciseTemplate && exerciseTemplate.timerDuration) {
                        const labelKey = this.getLabelKeyForExercise(exerciseTemplate.nameKey);
                        DQ_FOKUS_TIMER.prepareSession(exerciseTemplate.timerDuration, { type: 'free', id: exerciseId, labelKey: labelKey });
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
            const allExercises = await new Promise((resolve, reject) => {
                const tx = DQ_DB.db.transaction('exercises', 'readonly');
                const store = tx.objectStore('exercises');
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const lang = DQ_CONFIG.userSettings.language || 'de';
            const foundExercise = allExercises.find(ex => {
                const translatedName = (DQ_DATA.translations[lang].exercise_names[ex.nameKey] || ex.nameKey).toLowerCase();
                return translatedName.includes(searchTerm);
            });

            if (foundExercise) {
                DQ_UI.elements.freeExerciseFilters.querySelector('.active').classList.remove('active');
                DQ_UI.elements.freeExerciseFilters.querySelector('[data-filter="all"]').classList.add('active');
                this.currentFreeExerciseFilter = 'all';
                
                this.renderFreeExercisesPage();
                
                setTimeout(() => {
                    const cardToHighlight = document.querySelector(`#exercise-list .exercise-card[data-exercise-id="${foundExercise.id}"]`);
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
};

