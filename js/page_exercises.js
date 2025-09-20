const DQ_EXERCISES = {
    currentFreeExerciseFilter: 'all',

    init(elements) {
        elements.pageExercises.addEventListener('click', (event) => this.handleExerciseClick(event));
        elements.freeExerciseFilters.addEventListener('click', (event) => this.handleFilterClick(event));
        elements.searchExerciseButton.addEventListener('click', () => this.openSearchPopup());
        elements.searchExerciseConfirmButton.addEventListener('click', () => this.executeSearch());
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
            } else if (action === 'complete') {
                this.completeQuest(questId);
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

    renderQuests() {
        const db = DQ_DB.db;
        if (!db) return;
        const store = db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests');
        const questList = DQ_UI.elements.questList;
        questList.innerHTML = '';
        const lang = DQ_CONFIG.userSettings.language || 'de';

        store.index('date').getAll(DQ_CONFIG.getTodayString()).onsuccess = e => {
            const questsToday = e.target.result;
            if (questsToday.length === 0) {
                questList.innerHTML = `<div class="card"><p>Keine Quests für heute. Genieße den Tag oder starte ein freies Training! 🌴</p></div>`;
                return;
            }
            questsToday.forEach(quest => {
                const card = document.createElement('div');
                card.className = `card exercise-card ${quest.completed ? 'completed' : ''}`;
                card.dataset.questId = quest.questId;

                let targetDisplay = '';
                if(quest.type === 'reps') targetDisplay = `${quest.target} Reps`;
                else if(quest.type === 'time') targetDisplay = `${quest.target} Sek.`;

                const translatedName = (DQ_DATA.translations[lang].exercise_names[quest.nameKey] || quest.nameKey);
                
                const isFocusQuest = quest.type === 'focus';
                const buttonAction = isFocusQuest ? 'start-focus' : 'complete';
                const buttonText = isFocusQuest ? (DQ_DATA.translations[lang].start_task_button || 'Los') : 'OK';

                card.innerHTML = `
                    <div class="quest-info">
                        <h2>${translatedName}</h2>
                        ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                    </div>
                    <div class="exercise-card-actions">
                        <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                        <button class="action-button complete-button-small" data-action="${buttonAction}" aria-label="Absolvieren" ${quest.completed ? 'disabled' : ''}>
                            ${quest.completed ? '✅' : buttonText}
                        </button>
                    </div>
                `;
                questList.appendChild(card);
            });
        };
    },

    async completeQuest(questId) {
        try {
            const updatedChar = await DQ_CONFIG.performQuestCompletion(questId);

            const quest = await new Promise(resolve => {
                 DQ_DB.db.transaction('daily_quests', 'readonly').objectStore('daily_quests').get(questId).onsuccess = e => resolve(e.target.result);
            });

            if (quest) {
                 DQ_UI.showCustomPopup(`Sehr gut! 💪\n+${quest.manaReward} Mana ✨ | +${quest.goldReward} Gold 💰`);
            }
            
            DQ_CONFIG.checkStreakCompletion();
            
            this.renderQuests();
            DQ_CHARACTER_MAIN.renderPage();
            DQ_ACHIEVEMENTS.checkAllAchievements(updatedChar);

        } catch (error) {
            console.error("Quest-Abschluss fehlgeschlagen (UI-Ebene):", error);
            DQ_UI.showCustomPopup("Speichern fehlgeschlagen. Bitte versuche es erneut.", 'penalty');
        }
    },

    showQuestInfo(questId) {
        DQ_DB.db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').get(questId).onsuccess = (e) => {
            const quest = e.target.result;
            if (!quest) return;
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const translatedName = (DQ_DATA.translations[lang].exercise_names[quest.nameKey] || quest.nameKey);
            const explanation = (DQ_DATA.exerciseExplanations[lang][quest.nameKey] || 'Keine Beschreibung verfügbar.');
            const showInstructionsText = DQ_DATA.translations[lang].show_instructions || "Show Instructions";
            
            const content = `
                <h3>${translatedName}</h3>
                <details>
                    <summary>${showInstructionsText}</summary>
                    <p>${explanation}</p>
                </details>
                <p><strong>Belohnung:</strong> ${quest.manaReward} Mana ✨, ${quest.goldReward} Gold 💰</p>
            `;
            DQ_UI.showCustomPopup(content, 'info');
        };
    },

    renderFreeExercisesPage() {
        const db = DQ_DB.db;
        if (!db) return;
        const store = db.transaction(['exercises'], 'readonly').objectStore('exercises');
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
        store.getAll().onsuccess = (e) => {
            DQ_UI.elements.exerciseList.innerHTML = '';
            const allExercises = e.target.result;
            const filteredExercises = this.currentFreeExerciseFilter === 'all' 
                ? allExercises 
                : allExercises.filter(ex => ex.category === this.currentFreeExerciseFilter);

            if (filteredExercises.length === 0) {
                DQ_UI.elements.exerciseList.innerHTML = `<div class="card"><p>Keine Übungen in dieser Kategorie gefunden. 🤷‍♂️</p></div>`;
                return;
            }

            filteredExercises.forEach(exercise => {
                let targetValue = exercise.baseValue;
                if (exercise.type !== 'check' && exercise.type !== 'link' && exercise.type !== 'focus') {
                    targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
                }
                let targetDisplay = '';
                if (exercise.type === 'reps') targetDisplay = `${targetValue} Reps`;
                else if (exercise.type === 'time') targetDisplay = `${targetValue} Sek.`;

                const translatedName = (DQ_DATA.translations[lang].exercise_names[exercise.nameKey] || exercise.nameKey);
                
                const isFocusExercise = exercise.type === 'focus';
                const buttonAction = isFocusExercise ? 'start-focus' : 'complete';
                const buttonText = isFocusExercise ? (DQ_DATA.translations[lang].start_task_button || 'Los') : 'OK';

                const card = document.createElement('div');
                card.className = 'card exercise-card';
                card.dataset.exerciseId = exercise.id;
                card.innerHTML = `
                    <div class="quest-info">
                        <h2>${translatedName}</h2>
                        ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                    </div>
                    <div class="exercise-card-actions">
                        <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                        <button class="action-button complete-button-small" data-action="${buttonAction}" aria-label="Absolvieren">${buttonText}</button>
                    </div>
                `;
                DQ_UI.elements.exerciseList.appendChild(card);
            });
        };
    },
    
    async completeFreeExercise(exerciseId) {
        try {
            const db = DQ_DB.db;
            const tx = db.transaction(['exercises', 'character'], 'readwrite');
            const exStore = tx.objectStore('exercises');
            const charStore = tx.objectStore('character');

            const exercise = await new Promise(res => exStore.get(exerciseId).onsuccess = e => res(e.target.result));
            if (exercise.type === 'link') {
                window.open(exercise.url, '_blank');
            }
            
            let char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));

            const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
            const scaledMana = Math.ceil(exercise.manaReward * (1 + 0.2 * (difficulty - 1)));
            const scaledGold = Math.ceil(exercise.goldReward * (1 + 0.15 * (difficulty - 1)));

            char.mana += scaledMana;
            char.gold += scaledGold;
            char.totalGoldEarned += scaledGold;

            const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.id === exercise.id);
            char = DQ_CONFIG.processStatGains(char, exerciseTemplate);
            char = DQ_CONFIG.levelUpCheck(char);
            
            charStore.put(char);

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = (event) => reject(event.target.error);
            });

            DQ_UI.showCustomPopup(`Sehr gut! 💪\n+${scaledMana} Mana ✨ | +${scaledGold} Gold 💰`);
            DQ_CHARACTER_MAIN.renderPage();
            DQ_ACHIEVEMENTS.checkAllAchievements(char);
            
        } catch (error) {
            console.error("Speichern des freien Trainings fehlgeschlagen:", error);
            DQ_UI.showCustomPopup("Speichern fehlgeschlagen. Bitte versuche es erneut.", 'penalty');
        }
    },

    showFreeExerciseInfo(exerciseId) {
        DQ_DB.db.transaction(['exercises'], 'readonly').objectStore('exercises').get(exerciseId).onsuccess = (e) => {
            const ex = e.target.result;
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const translatedName = (DQ_DATA.translations[lang].exercise_names[ex.nameKey] || ex.nameKey);
            const explanation = (DQ_DATA.exerciseExplanations[lang][ex.nameKey] || 'Keine Beschreibung verfügbar.');
            const showInstructionsText = DQ_DATA.translations[lang].show_instructions || "Show Instructions";
            const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
            let targetValue = ex.baseValue;
            if (ex.type !== 'check' && ex.type !== 'link' && ex.type !== 'focus') {
                targetValue = Math.ceil(ex.baseValue + (ex.baseValue * 0.4 * (difficulty - 1)));
            }
            let targetDisplay = '';
            if (ex.type === 'reps') targetDisplay = `${targetValue} Reps`;
            else if (ex.type === 'time') targetDisplay = `${targetValue} Sek.`;

            const scaledMana = Math.ceil(ex.manaReward * (1 + 0.2 * (difficulty - 1)));
            const scaledGold = Math.ceil(ex.goldReward * (1 + 0.15 * (difficulty - 1)));

            const content = `
                <h3>${translatedName}</h3>
                <details>
                    <summary>${showInstructionsText}</summary>
                    <p>${explanation}</p>
                </details>
                ${targetDisplay ? `<p><strong>Ziel:</strong> ${targetDisplay}</p>` : ''}
                <p><strong>Belohnung (skaliert mit Schwierigkeit):</strong> ca. ${scaledMana} Mana ✨, ${scaledGold} Gold 💰</p>
            `;
            DQ_UI.showCustomPopup(content, 'info');
        };
    }
};