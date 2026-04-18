Object.assign(DQ_EXERCISES, {
    async renderTrainingPhaseBanner() {
        const banner = DQ_UI.elements.trainingPhaseBanner;
        if (!banner || typeof DQ_TRAINING_SYSTEM === 'undefined') {
            if (banner) {
                banner.hidden = true;
                banner.innerHTML = '';
            }
            return;
        }

        const goal = DQ_CONFIG.userSettings.goal || 'muscle';
        if (['sick', 'restday', 'senior'].includes(goal)) {
            banner.hidden = true;
            banner.innerHTML = '';
            return;
        }

        const plan = DQ_TRAINING_SYSTEM.getPlan(goal);
        const state = await DQ_TRAINING_SYSTEM.getState(goal);
        const context = DQ_TRAINING_SYSTEM.getStageForState(plan, state);
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
        const headerText = DQ_TRAINING_SYSTEM.getPhaseHeaderText(context);
        const summary = DQ_TRAINING_SYSTEM.getStageSummary(goal, context.stage, plan.completionMode, difficulty);
        const questsToday = await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readonly');
            const index = tx.objectStore('daily_quests').index('date');
            index.getAll(DQ_CONFIG.getTodayString()).onsuccess = e => resolve(e.target.result || []);
            tx.onerror = () => resolve([]);
        });
        const isInfinitePhase = context.stageWeeks >= 9999;
        const progress = isInfinitePhase 
            ? Infinity 
            : Math.round(((context.stageWeek + 1) / context.stageWeeks) * 100);
        const phaseWeekText = lang === 'en'
            ? `Week ${context.stageWeek + 1}/${context.stageWeeks}`
            : `Woche ${context.stageWeek + 1}/${context.stageWeeks}`;
        const modeText = plan.completionMode === 'sets'
            ? (lang === 'en' ? 'Sets mode' : 'Satz-Modus')
            : (plan.completionMode === 'log'
                ? (lang === 'en' ? 'Log mode' : 'Log-Modus')
                : (lang === 'en' ? 'Direct mode' : 'Direkt-Modus'));
        const detailText = plan.completionMode === 'sets'
            ? (lang === 'en'
                ? 'This phase builds a stable base with structured set work.'
                : 'Diese Phase legt das Fundament für saubere Sätze und stabile Wiederholungen.')
            : (plan.completionMode === 'log'
                ? (lang === 'en'
                    ? 'Track the full workload with distance and duration.'
                    : 'Erfasse hier die gesamte Belastung mit Distanz und Dauer.')
                : (lang === 'en'
                    ? 'Complete the quests directly to keep the flow simple.'
                    : 'Diese Phase wird direkt abgeschlossen und bleibt bewusst einfach.'));

        banner.hidden = false;
        banner.innerHTML = `
            <div class="training-phase-banner-card">
                <details class="training-phase-details">
                    <summary class="training-phase-summary">
                        <span>${headerText}</span>
                    </summary>
                    <div class="training-phase-details-body">
                        <p class="training-phase-detail-text">${detailText}</p>
                        <div class="training-phase-banner-count">${lang === 'en' ? 'Progress' : 'Fortschritt'}: ${progress === Infinity ? '∞' : `${progress}%`}</div>
                        <div class="training-phase-meta-grid">
                            <div class="training-phase-meta-item">
                                <span>${lang === 'en' ? 'Load' : 'Belastung'}</span>
                                <strong>${summary}</strong>
                            </div>
                            <div class="training-phase-meta-item">
                                <span>${lang === 'en' ? 'Phase' : 'Phasenstand'}</span>
                                <strong>${phaseWeekText} · ${modeText}</strong>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        `;
    },

    renderQuests() {
        const db = DQ_DB.db;
        if (!db) return;
        const store = db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests');
        const questList = DQ_UI.elements.questList;
        questList.innerHTML = '';
        const lang = DQ_CONFIG.userSettings.language || 'de';

        // Restday-Box Logik überarbeitet
        const mainQuestSection = document.getElementById('daily-quest-container');
        const existingRestdayBox = mainQuestSection?.querySelector('.restday-info-box');
        if (existingRestdayBox) {
            existingRestdayBox.remove();
        }

        // Prüfe ob heute ein Rest Day ist
        const isRestDay = this.checkIfRestDay();
        this.renderTrainingPhaseBanner();

        store.index('date').getAll(DQ_CONFIG.getTodayString()).onsuccess = e => {
            const questsToday = e.target.result || [];
            const hasEquipment = DQ_CONFIG.userSettings.hasEquipment !== false;
            const templates = Object.values(DQ_DATA.exercisePool).flat();
            const visibleQuests = hasEquipment
                ? questsToday
                : questsToday.filter(quest => !templates.find(ex => ex.nameKey === quest.nameKey)?.needsEquipment);

            if (questsToday.length === 0) {
                if (isRestDay && DQ_DATA.translations[lang]?.restday_info_box) {
                    const box = document.createElement('div');
                    box.className = 'restday-info-box';
                    box.innerHTML = DQ_DATA.translations[lang].restday_info_box;
                    questList.insertAdjacentElement('afterend', box);
                }
                return;
            }
            visibleQuests.forEach(quest => {
                const card = document.createElement('div');
                const cardClasses = [
                    'card',
                    'exercise-card',
                    quest.completed ? 'completed' : '',
                    quest.canComplete ? 'ready' : ''
                ].filter(Boolean).join(' ');
                card.className = cardClasses;
                card.dataset.questId = quest.questId;

                const targetDisplay = typeof DQ_TRAINING_SYSTEM !== 'undefined' && DQ_TRAINING_SYSTEM.formatQuestTarget
                    ? DQ_TRAINING_SYSTEM.formatQuestTarget(quest)
                    : this.formatTargetDisplay(quest.type, quest.target);

                const translatedName = (DQ_DATA.translations[lang].exercise_names[quest.nameKey] || quest.nameKey);
                const isFocusQuest = quest.type === 'focus';
                const buttonAction = isFocusQuest ? 'start-focus' : 'complete';
                const isSetQuest = quest.completionMode === 'sets' && Array.isArray(quest.setProgress) && quest.setPlan;
                const totalSets = Math.max(1, quest.setPlan?.sets || quest.setProgress?.length || 1);
                const doneSets = isSetQuest ? quest.setProgress.filter(Boolean).length : 0;
                const isAllSetsComplete = isSetQuest && doneSets === totalSets;
                const progressText = `<span class="set-counter">${doneSets}</span>/${totalSets}`;
                const fallbackActionLabel = typeof DQ_TRAINING_SYSTEM !== 'undefined' ? DQ_TRAINING_SYSTEM.getQuestActionLabel(quest) : 'OK';
                const buttonText = isFocusQuest
                    ? (DQ_DATA.translations[lang].start_task_button || 'Los')
                    : (isSetQuest ? progressText : fallbackActionLabel);
                const buttonDisabled = quest.completed;

                card.innerHTML = `
                    <div class="quest-info">
                        <h2>${translatedName}</h2>
                        ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                    </div>
                    <div class="exercise-card-actions">
                        <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                        <button class="action-button complete-button-small${isAllSetsComplete ? ' set-completed' : ''}" data-action="${buttonAction}" aria-label="Absolvieren" ${buttonDisabled ? 'disabled' : ''}>
                            ${quest.completed ? '<span class="material-symbols-rounded">check</span>' : buttonText}
                        </button>
                    </div>
                `;
                questList.appendChild(card);
            });
            
            // Füge Rest Day Info Box nach den Quests hinzu, wenn es ein Rest Day ist
            if (isRestDay) {
                const box = document.createElement('div');
                box.className = 'restday-info-box';
                box.innerHTML = DQ_DATA.translations[lang].restday_info_box;
                
                // Füge die Box nach der Quest-Liste ein
                questList.insertAdjacentElement('afterend', box);
            }
        };
    },

    async openEnduranceEntryPopup(questId) {
        this.pendingEnduranceQuestId = questId;
        const fields = DQ_UI.elements;
        if (fields.enduranceDistanceInput) fields.enduranceDistanceInput.value = '';
        if (fields.enduranceDurationInput) fields.enduranceDurationInput.value = '';
        if (fields.enduranceNotesInput) fields.enduranceNotesInput.value = '';
        
        const quest = await this.getQuestById(questId);
        const notesItem = document.getElementById('endurance-notes-item');
        if (notesItem) {
            const showNotes = quest?.nameKey?.includes('jog') || quest?.nameKey?.includes('walk') || quest?.nameKey?.includes('run') || quest?.nameKey?.includes('spazier');
            notesItem.style.display = showNotes ? 'flex' : 'none';
        }
        
        DQ_UI.showPopup(fields.enduranceEntryPopup);
    },

    closeEndurancePopup() {
        this.pendingEnduranceQuestId = null;
        if (DQ_UI.elements.enduranceEntryPopup) {
            DQ_UI.hideTopPopup();
        }
    },

    async saveEnduranceEntry() {
        const questId = this.pendingEnduranceQuestId;
        if (!questId) return;

        const payload = {
            distance: parseFloat(DQ_UI.elements.enduranceDistanceInput?.value) || 0,
            duration: parseInt(DQ_UI.elements.enduranceDurationInput?.value, 10) || 0,
            notes: DQ_UI.elements.enduranceNotesInput?.value?.trim() || '',
            age: DQ_CONFIG.userSettings.age ?? null
        };

        try {
            await DQ_TRAINING_SYSTEM.saveEnduranceLog(questId, payload);
            this.closeEndurancePopup();
            await this.finalizeQuestCompletion(questId);
        } catch (error) {
            console.error('Fehler beim Speichern der Ausdauer-Daten:', error);
            DQ_UI.showCustomPopup('Ausdauer-Eintrag konnte nicht gespeichert werden.', 'penalty');
        } finally {
            this.pendingEnduranceQuestId = null;
        }
    },

    async finalizeQuestCompletion(questId) {
        try {
            const updatedChar = await DQ_CONFIG.performQuestCompletion(questId);

            const quest = await new Promise(resolve => {
                DQ_DB.db.transaction('daily_quests', 'readonly').objectStore('daily_quests').get(questId).onsuccess = e => resolve(e.target.result);
            });

            if (quest) {
                DQ_UI.showCustomPopup(`Sehr gut! <span class="material-symbols-rounded icon-accent">thumb_up</span><br>+${quest.manaReward} Mana <span class="material-symbols-rounded icon-mana">auto_awesome</span> | +${quest.goldReward} Gold <span class="material-symbols-rounded icon-gold">paid</span>`);
            }

            DQ_CONFIG.checkStreakCompletion();
            this.renderQuests();
            DQ_CHARACTER_MAIN.renderPage();
            DQ_ACHIEVEMENTS.checkAllAchievements(updatedChar);
        } catch (error) {
            console.error('Quest-Abschluss fehlgeschlagen (UI-Ebene):', error);
            DQ_UI.showCustomPopup('Speichern fehlgeschlagen. Bitte versuche es erneut.', 'penalty');
        }
    },

    async completeQuest(questId) {
        const quest = await new Promise(resolve => {
            DQ_DB.db.transaction('daily_quests', 'readonly').objectStore('daily_quests').get(questId).onsuccess = e => resolve(e.target.result);
        });
        if (!quest) return;

        if (quest.completionMode === 'sets') {
            const button = document.querySelector(`[data-quest-id="${questId}"] .complete-button-small`);
            if (button) {
                button.classList.add('animating');
            }
            
            const updatedQuest = await DQ_TRAINING_SYSTEM.advanceSetProgress(questId);
            if (!updatedQuest) return;

            if (updatedQuest.canComplete) {
                await this.finalizeQuestCompletion(questId);
            } else {
                setTimeout(() => this.renderQuests(), 300);
            }
            return;
        }

        if (quest.completionMode === 'log') {
            await this.openEnduranceEntryPopup(questId);
            return;
        }

        await this.finalizeQuestCompletion(questId);
    },

    showQuestInfo(questId) {
        DQ_DB.db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').get(questId).onsuccess = (e) => {
            const quest = e.target.result;
            if (!quest) return;
            this.renderExerciseInfoPopup(quest, true);
        };
    },

    /**
     * ZENTRALE FUNKTION FÜR DAS ÜBUNGS-INFO-POPUP
     * Wird sowohl für Daily Quests als auch für Freies Training genutzt.
     */
    renderExerciseInfoPopup(exercise, isQuest) {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const trans = DQ_DATA.translations[lang];
        const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
        const goal = DQ_CONFIG.userSettings.goal || 'muscle';
        const isSeniorMode = goal === 'senior';

        // Finde das Template für Muskelgruppen und Stats
        const template = Object.values(DQ_DATA.exercisePool).flat().find(t => t.nameKey === exercise.nameKey);
        if (!template) return;

        const translatedName = (trans.exercise_names[exercise.nameKey] || exercise.nameKey);
        const explanation = (DQ_DATA.exerciseExplanations[lang][exercise.nameKey] || 'Keine Beschreibung verfügbar.');
        
        // Ziel & Belohnung berechnen
        let targetValue = exercise.target || exercise.baseValue;
        // Bei Quests ist der Target-Wert bereits fest in der DB, bei freiem Training muss er ggf. berechnet werden
        if (!isQuest && exercise.type !== 'check' && exercise.type !== 'link' && exercise.type !== 'focus') {
            targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
        }
        let targetDisplay = this.formatTargetDisplay(exercise.type, targetValue);

        // Belohnungen (bei Quests aus dem Quest-Objekt, sonst berechnet)
        const scaledMana = isQuest ? exercise.manaReward : Math.ceil(exercise.manaReward * (1 + 0.2 * (difficulty - 1)));
        const scaledGold = isQuest ? exercise.goldReward : Math.ceil(exercise.goldReward * (1 + 0.15 * (difficulty - 1)));

        // Finde alle Kategorien (Trainingspläne)
        const categories = [];
        for (const [catName, list] of Object.entries(DQ_DATA.exercisePool)) {
            if (list.some(item => item.nameKey === exercise.nameKey)) {
                categories.push(trans[`filter_${catName}`] || catName);
            }
        }

        // HTML Generierung
        const muscleTags = (template.muscles || []).map(m => `<span class="info-badge muscle-badge">${trans[`muscle_${m}`] || m}</span>`).join('');
        const categoryTags = categories.map(c => `<span class="info-badge cat-badge">${c}</span>`).join('');

        let statsHtml = '';
        if (template.statPoints) {
            statsHtml = Object.entries(template.statPoints).map(([stat, val]) => {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                return `<div class="info-stat-row"><span class="material-symbols-rounded icon-accent" style="font-size:16px;">add_circle</span> ${val} ${statName}</div>`;
            }).join('');
        }
        if (template.directStatGain) {
            statsHtml += Object.entries(template.directStatGain).map(([stat, val]) => {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                return `<div class="info-stat-row"><span class="material-symbols-rounded icon-accent" style="font-size:16px;">bolt</span> ${val} ${statName} (Sofort)</div>`;
            }).join('');
        }

        const content = `
            <div class="enhanced-info-popup">
                <h3 class="info-title">${translatedName}</h3>
                ${isQuest && !isSeniorMode && (exercise.phaseLabel || exercise.phaseSummary) ? `
                    <div class="info-section info-phase-section">
                        <span class="info-section-label">${trans.training_phase_controls_title || 'Phase'}</span>
                        <div class="info-badges-container">
                            ${exercise.phaseLabel ? `<span class="info-badge phase-badge">${exercise.phaseLabel}</span>` : ''}
                            ${exercise.phaseSummary ? `<span class="info-badge phase-badge">${exercise.phaseSummary}</span>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="info-grid">
                    <div class="info-section">
                        <span class="info-section-label">${trans.muscle_groups_label}</span>
                        <div class="info-badges-container">${muscleTags || '-'}</div>
                    </div>

                    <div class="info-section">
                        <span class="info-section-label">${trans.training_plans_label}</span>
                        <div class="info-badges-container">${categoryTags || '-'}</div>
                    </div>

                    <div class="info-section full-width">
                        <span class="info-section-label">${trans.base_stats_label}</span>
                        <div class="info-stats-list">${statsHtml || '-'}</div>
                    </div>
                </div>

                <div class="info-section">
                    <details class="info-details">
                        <summary>${trans.show_instructions}</summary>
                        <div class="info-explanation">${explanation}</div>
                    </details>
                </div>

                <div class="info-footer">
                    ${targetDisplay ? `<div class="info-target"><strong>Ziel:</strong> ${targetDisplay}</div>` : ''}
                    <div style="flex-grow: 1;"></div>
                    <div class="info-reward-wrapper" style="display: flex; align-items: center; gap: 8px;">
                        <span class="info-reward-label">Belohnung:</span>
                        <div class="info-rewards">
                            <span class="material-symbols-rounded icon-mana" style="font-size: 16px;">auto_awesome</span> ${scaledMana} 
                            <span class="material-symbols-rounded icon-gold" style="margin-left:4px; font-size: 16px;">paid</span> ${scaledGold}
                        </div>
                    </div>
                </div>
            </div>
        `;
        DQ_UI.showCustomPopup(content, 'info');
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
            let filteredExercises = this.currentFreeExerciseFilter === 'all' 
                ? allExercises 
                : allExercises.filter(ex => ex.category === this.currentFreeExerciseFilter);

            // --- FILTER: Hanteln ausblenden im Freien Training ---
            if (DQ_CONFIG.userSettings.hasEquipment === false) {
                filteredExercises = filteredExercises.filter(ex => !ex.needsEquipment);
            }

            if (filteredExercises.length === 0) {
                DQ_UI.elements.exerciseList.innerHTML = `<div class="card"><p>Keine Übungen in dieser Kategorie gefunden. <span class="material-symbols-rounded icon-accent" style="vertical-align: middle;">search_off</span></p></div>`;
                return;
            }

            filteredExercises.forEach(exercise => {
                let targetValue = exercise.baseValue;
                if (exercise.type !== 'check' && exercise.type !== 'link' && exercise.type !== 'focus') {
                    targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
                }
                let targetDisplay = this.formatTargetDisplay(exercise.type, targetValue);

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

            DQ_UI.showCustomPopup(`Sehr gut! <span class=\"material-symbols-rounded icon-accent\">thumb_up</span><br>+${scaledMana} Mana <span class=\"material-symbols-rounded icon-mana\">auto_awesome</span> | +${scaledGold} Gold <span class=\"material-symbols-rounded icon-gold\">paid</span>`);
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
            if (!ex) return;
            this.renderExerciseInfoPopup(ex, false);
        };
    },

    displayQuests() {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = '';

        if (this.checkIfRestDay()) {
            this.handleRestDay();
            return; // Beendet die Funktion, da keine weiteren Quests angezeigt werden sollen
        }

        const dailyQuests = this.getDailyQuests();
        dailyQuests.forEach(quest => {
            const card = document.createElement('div');
            card.className = `card exercise-card ${quest.completed ? 'completed' : ''}`;
            card.dataset.questId = quest.questId;

            let targetDisplay = this.formatTargetDisplay(quest.type, quest.target);

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
                        ${quest.completed ? '<span class="material-symbols-rounded">check</span>' : buttonText}
                    </button>
                </div>
            `;
            questList.appendChild(card);
        });
    },

    handleRestDay() {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = ''; // Leert die Liste für den Fall, dass schon etwas drin war

        const restDayCard = document.createElement('div');
        restDayCard.className = 'rest-day-card';

        const icon = document.createElement('div');
        icon.className = 'rest-day-icon';
        icon.innerHTML = '<span class="material-symbols-rounded" style="font-size:48px;">favorite</span>';
        restDayCard.appendChild(icon);

        const title = document.createElement('h3');
        title.textContent = this.getTranslation('rest_day_title');
        restDayCard.appendChild(title);

        const quote = document.createElement('p');
        quote.className = 'rest-day-quote';
        const quotes = this.getTranslation('rest_day_quotes');
        quote.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
        restDayCard.appendChild(quote);

        questList.appendChild(restDayCard); // Fügt die Karte zur Quest-Liste hinzu
    },

    getDailyQuests() {
        const savedQuests = db.get('dailyQuests');
        const allExercises = Object.values(DQ_DATA.exercisePool).flat();
        const lang = DQ_CONFIG.userSettings.language || 'de';

        return savedQuests.map(questId => {
            const quest = allExercises.find(ex => ex.id === questId);
            return quest ? {
                questId: quest.id,
                nameKey: quest.nameKey,
                type: quest.type,
                target: quest.target,
                completed: quest.completed,
                manaReward: quest.manaReward,
                goldReward: quest.goldReward,
                // Füge hier weitere benötigte Felder hinzu
            } : null;
        }).filter(q => q !== null);
    },

    checkIfRestDay() {
        const userGoal = DQ_CONFIG.userSettings.goal || 'muscle';
        if (userGoal === 'sick') {
            return false; // Krankheitstage sind keine Restdays
        }
        
        const dayOfWeek = new Date().getDay();
        const numRestDays = DQ_CONFIG.userSettings.restDays || 0;
        let activeRestDays = [];
        
        switch (parseInt(numRestDays)) {
            case 1: activeRestDays = [0]; break; // Sonntag
            case 2: activeRestDays = [2, 6]; break; // Dienstag, Samstag
            case 3: activeRestDays = [0, 2, 4]; break; // Sonntag, Dienstag, Donnerstag
        }
        
        return activeRestDays.includes(dayOfWeek);
    }
});

