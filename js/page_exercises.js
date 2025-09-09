const DQ_EXERCISES = {
    currentFreeExerciseFilter: 'all',

    init(elements) {
        elements.pageExercises.addEventListener('click', (event) => this.handleExerciseClick(event));
        elements.freeExerciseFilters.addEventListener('click', (event) => this.handleFilterClick(event));
    },

    handleFilterClick(event) {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            DQ_UI.elements.freeExerciseFilters.querySelector('.active').classList.remove('active');
            target.classList.add('active');
            this.currentFreeExerciseFilter = target.dataset.filter;
            this.renderFreeExercisesPage();
        }
    },

    handleExerciseClick(event) {
        const button = event.target.closest('button');
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
            }
        } else {
            const exerciseId = parseInt(card.dataset.exerciseId, 10);
            if (action === 'info') {
                this.showFreeExerciseInfo(exerciseId);
            } else if (action === 'complete') {
                this.completeFreeExercise(exerciseId);
            }
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

                card.innerHTML = `
                    <div class="quest-info">
                        <h2>${translatedName}</h2>
                        ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                    </div>
                    <div class="exercise-card-actions">
                        <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                        <button class="action-button complete-button-small" data-action="complete" aria-label="Absolvieren" ${quest.completed ? 'disabled' : ''}>
                            ${quest.completed ? '✅' : 'OK'}
                        </button>
                    </div>
                `;
                questList.appendChild(card);
            });
        };
    },

    async completeQuest(questId) {
        const db = DQ_DB.db;
        const tx = db.transaction(['daily_quests', 'character'], 'readwrite');
        const questStore = tx.objectStore('daily_quests');
        const charStore = tx.objectStore('character');

        const quest = await new Promise(resolve => questStore.get(questId).onsuccess = e => resolve(e.target.result));
        if (quest.completed) return;

        const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.nameKey === quest.nameKey);
        if (exerciseTemplate && exerciseTemplate.type === 'link') {
            window.open(exerciseTemplate.url, '_blank');
        }

        quest.completed = true;
        questStore.put(quest);

        let char = await new Promise(resolve => charStore.get(1).onsuccess = e => resolve(e.target.result));
        char.mana += quest.manaReward;
        char.gold += quest.goldReward;
        
        // ACHIEVEMENT-FORTSCHRITT
        char.totalGoldEarned += quest.goldReward;
        char.totalQuestsCompleted++;

        DQ_UI.showCustomPopup(`Sehr gut! 💪\n+${quest.manaReward} Mana ✨ | +${quest.goldReward} Gold 💰`);
        
        char = await DQ_CONFIG.processStatGains(char, exerciseTemplate);
        char = DQ_CONFIG.levelUpCheck(char, charStore); // Pass store for potential updates
        
        // charStore.put(char) wird in levelUpCheck oder am Ende der Transaktion behandelt

        tx.oncomplete = () => {
            DQ_CONFIG.checkStreakCompletion();
            this.renderQuests();
            DQ_CHARACTER.renderPage();
            DQ_ACHIEVEMENTS.checkAllAchievements(char); // Alle Achievements prüfen
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
                if (exercise.type !== 'check' && exercise.type !== 'link') {
                    targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
                }
                let targetDisplay = '';
                if (exercise.type === 'reps') targetDisplay = `${targetValue} Reps`;
                else if (exercise.type === 'time') targetDisplay = `${targetValue} Sek.`;

                const translatedName = (DQ_DATA.translations[lang].exercise_names[exercise.nameKey] || exercise.nameKey);

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
                        <button class="action-button complete-button-small" data-action="complete" aria-label="Absolvieren">OK</button>
                    </div>
                `;
                DQ_UI.elements.exerciseList.appendChild(card);
            });
        };
    },
    
    async completeFreeExercise(exerciseId) {
        const db = DQ_DB.db;
        const tx = db.transaction(['exercises', 'character'], 'readwrite');
        const exStore = tx.objectStore('exercises');
        const charStore = tx.objectStore('character');

        const exercise = await new Promise(res => exStore.get(exerciseId).onsuccess = e => res(e.target.result));
        if (exercise.type === 'link') {
            window.open(exercise.url, '_blank');
        }
        
        const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
        const scaledMana = Math.ceil(exercise.manaReward * (1 + 0.2 * (difficulty - 1)));
        const scaledGold = Math.ceil(exercise.goldReward * (1 + 0.15 * (difficulty - 1)));

        let char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));
        char.mana += scaledMana;
        char.gold += scaledGold;
        char.totalGoldEarned += scaledGold; // ACHIEVEMENT-FORTSCHRITT

        DQ_UI.showCustomPopup(`Sehr gut! 💪\n+${scaledMana} Mana ✨ | +${scaledGold} Gold 💰`);
        
        const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.nameKey === exercise.nameKey);
        char = await DQ_CONFIG.processStatGains(char, exerciseTemplate);
        char = DQ_CONFIG.levelUpCheck(char, charStore);
        
        // charStore.put(char) wird in levelUpCheck oder am Ende der Transaktion behandelt

        tx.oncomplete = () => {
            DQ_CHARACTER.renderPage();
            DQ_ACHIEVEMENTS.checkAchievement(char, 'gold'); // Nur Gold-Achievement prüfen
        };
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
            if (ex.type !== 'check' && ex.type !== 'link') {
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
