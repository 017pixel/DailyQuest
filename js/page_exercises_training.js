Object.assign(DQ_EXERCISES, {
    prettifyExerciseName(nameKey) {
        const raw = String(nameKey || '')
            .replace(/^custom_ai_(rest_)?fill_\d+$/i, '')
            .replace(/^custom_+/i, '')
            .replace(/_\d+$/g, '')
            .trim();
        if (!raw) return 'Training';

        const known = {
            standing_calf_raises: 'Wadenheben stehend',
            calf_raises: 'Wadenheben',
            standing_side_bends: 'Seitbeugen stehend',
            progressive_walking: 'Zuegiges Gehen',
            standing_arm_raises: 'Armheben stehend',
            standing_bicycle_crunch: 'Bicycle Crunches stehend',
            hamstring_curls: 'Beinbeuger-Curls',
            standing_hamstring_curls: 'Beinbeuger-Curls stehend',
            active_recovery: 'Aktive Erholung'
        };
        if (known[raw]) return known[raw];

        return raw
            .split('_')
            .filter(Boolean)
            .map(part => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    },

    resolveExerciseName(exercise, lang) {
        const customName = String(exercise?.customDisplayName || '').trim();
        if (customName && !/^custom_/.test(customName.toLowerCase()) && !customName.includes('_')) {
            return customName;
        }
        const nameKey = exercise?.nameKey || '';
        return DQ_DATA.translations[lang].exercise_names[nameKey] || this.prettifyExerciseName(nameKey);
    },

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

        // TÃ¤gliche Quests laden fÃ¼r Fortschrittsberechnung
        const questsToday = await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readonly');
            const index = tx.objectStore('daily_quests').index('date');
            index.getAll(DQ_CONFIG.getTodayString()).onsuccess = e => resolve(e.target.result || []);
            tx.onerror = () => resolve([]);
        });

        // TÃ¤glicher Fortschritt: abgeschlossene Quests / Gesamt-Quests
        const totalQuests = questsToday.length;
        const completedQuests = questsToday.filter(q => q.completed).length;
        const dailyProgress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

        // Phasen-Info
        const isInfinitePhase = context.stageWeeks >= 9999;
        const phaseWeekText = lang === 'en'
            ? `Week ${context.stageWeek + 1}/${context.stageWeeks}`
            : `Woche ${context.stageWeek + 1}/${context.stageWeeks}`;
        const modeText = plan.completionMode === 'sets'
            ? (lang === 'en' ? 'Sets mode' : 'Satz-Modus')
            : (plan.completionMode === 'log'
                ? (lang === 'en' ? 'Log mode' : 'Log-Modus')
                : (lang === 'en' ? 'Direct mode' : 'Direkt-Modus'));
        const detailText = this.getPhaseDescription(context.stage?.labelKey, plan.completionMode, lang);

        // Phase Nummer extrahieren (z.B. "Phase 1" aus dem headerText)
        const phaseMatch = headerText.match(/\d+/);
        const phaseNumber = phaseMatch ? phaseMatch[0] : '?';
        const pillText = lang === 'en' ? `Phase ${phaseNumber}` : `Phase ${phaseNumber}`;

        banner.hidden = false;
        banner.innerHTML = `<button class="phase-mini-pill" aria-label="${lang === 'en' ? 'Show phase details' : 'Phasendetails anzeigen'}">${pillText}</button>`;

        // Click-Handler fÃ¼r Mini-Pille
        const pill = banner.querySelector('.phase-mini-pill');
        if (pill) {
            pill.addEventListener('click', () => {
                const popupTitle = document.getElementById('phase-info-title');
                const popupBody = document.getElementById('phase-info-body');
                const popup = document.getElementById('phase-info-popup');

                if (popupTitle && popupBody && popup) {
                    popupTitle.textContent = headerText;
                    popupBody.innerHTML = `
                        <div class="phase-info-section">
                            <div class="phase-info-section-title">${lang === 'en' ? 'Description' : 'Beschreibung'}</div>
                            <div class="phase-info-section-value" style="font-size:14px;font-weight:400;opacity:0.9;">${detailText}</div>
                        </div>
                        <div class="phase-info-section">
                            <div class="phase-info-section-title">${lang === 'en' ? 'Daily Progress' : 'Täglicher Fortschritt'}</div>
                            <div class="phase-info-section-value">${completedQuests} / ${totalQuests} ${lang === 'en' ? 'completed' : 'abgeschlossen'}</div>
                            <div class="phase-info-progress-bar">
                                <div class="phase-info-progress-fill" style="width: ${dailyProgress}%"></div>
                            </div>
                        </div>
                        <div class="phase-info-daily-stats">
                            <div class="phase-info-stat">
                                <div class="phase-info-stat-label">${lang === 'en' ? 'Load' : 'Belastung'}</div>
                                <div class="phase-info-stat-value">${summary}</div>
                            </div>
                            <div class="phase-info-stat">
                                <div class="phase-info-stat-label">${lang === 'en' ? 'Phase' : 'Phasenstand'}</div>
                                <div class="phase-info-stat-value">${phaseWeekText}</div>
                            </div>
                        </div>
                        <div class="phase-info-section">
                            <div class="phase-info-section-title">${lang === 'en' ? 'Mode' : 'Modus'}</div>
                            <div class="phase-info-section-value">${modeText}</div>
                        </div>
                    `;
                    DQ_UI.showPopup(popup);
                }
            });
        }
    },

    getPhaseDescription(labelKey, completionMode, lang) {
        const de = lang === 'de';
        const setsDesc = {
            phase_foundation: de ? 'Fokus auf saubere Technik mit moderaten Wiederholungen. Das Fundament für alles Weitere.' : 'Focus on clean technique with moderate reps. The foundation for everything to come.',
            phase_progress: de ? 'Die Wiederholungszahl wird erhöht. Die Muskulatur passt sich der steigenden Belastung an.' : 'Rep count increases. Muscles adapt to rising load.',
            phase_volume: de ? 'Höhere Wiederholungen für mehr Muskelausdauer. Das Volumen steigt spürbar.' : 'Higher reps for more muscular endurance. Volume increases noticeably.',
            phase_sets_up: de ? 'Jetzt steigt die Satzzahl bei moderaten Wiederholungen. Die Intensität nimmt zu.' : 'Set count rises with moderate reps. Intensity increases.',
            phase_sets_more: de ? 'Noch mehr Sätze – die Belastung erreicht ein hohes Niveau. Jetzt zahlt sich die Grundlage aus.' : 'Even more sets – load reaches a high level. The foundation pays off now.',
            phase_peak: de ? 'Höchstbelastung mit maximalen Sätzen und Wiederholungen. Die Spitzenphase.' : 'Peak load with maximum sets and reps. The peak phase.',
            phase_endgame: de ? 'Endgame – dauerhafte Höchstleistung. Dieses Niveau wird gehalten.' : 'Endgame – sustained peak performance. This level is maintained.'
        };
        const enduranceDesc = {
            phase_endurance_base: de ? 'Grundlagen-Ausdauer mit kurzen Distanzen und moderater Belastung.' : 'Base endurance with short distances and moderate load.',
            phase_endurance_build: de ? 'Aufbau-Phase – Distanz und Dauer werden gesteigert.' : 'Build phase – distance and duration increase.',
            phase_endurance_volume: de ? 'Doppelte Sätze, längere Einheiten. Das Ausdauer-Volumen wächst.' : 'Double sets, longer sessions. Endurance volume grows.',
            phase_endurance_peak: de ? 'Peak-Phase – maximale Distanz und Dauer. Die Ausdauer-Spitze.' : 'Peak phase – maximum distance and duration. The endurance peak.',
            phase_endurance_endgame: de ? 'Dauerhafte Ausdauer-Spitzenleistung auf höchstem Niveau.' : 'Sustained peak endurance performance at the highest level.'
        };

        if (completionMode === 'log') {
            return enduranceDesc[labelKey] || (de ? 'Ausdauer-Training mit individuell angepasster Belastung.' : 'Endurance training with individually adjusted load.');
        }
        return setsDesc[labelKey] || (de ? 'Strukturiertes Training mit angepassten Sätzen und Wiederholungen.' : 'Structured training with adjusted sets and reps.');
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
            const isPlaceholderQuest = quest => /^custom_ai_(rest_)?fill_\d+$/i.test(String(quest?.nameKey || ''));
            const visibleQuests = (hasEquipment
                ? questsToday
                : questsToday.filter(quest => !templates.find(ex => ex.nameKey === quest.nameKey)?.needsEquipment))
                .filter(quest => !isPlaceholderQuest(quest));

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

                const translatedName = this.resolveExerciseName(quest, lang);
                const isFocusQuest = quest.type === 'focus';
                const isTimeQuest = quest.type === 'time' && quest.target <= 180;
                const buttonAction = isFocusQuest ? 'start-focus' : (isTimeQuest ? 'start-timer' : 'complete');
                const isSetQuest = quest.completionMode === 'sets' && Array.isArray(quest.setProgress) && quest.setPlan;
                const totalSets = Math.max(1, quest.setPlan?.sets || quest.setProgress?.length || 1);
                const doneSets = isSetQuest ? quest.setProgress.filter(Boolean).length : 0;
                const isAllSetsComplete = isSetQuest && doneSets === totalSets;
                const progressText = `<span class="set-counter">${doneSets}</span>/${totalSets}`;
                const fallbackActionLabel = typeof DQ_TRAINING_SYSTEM !== 'undefined' ? DQ_TRAINING_SYSTEM.getQuestActionLabel(quest) : 'OK';
                const buttonText = isFocusQuest
                    ? (DQ_DATA.translations[lang].start_task_button || 'Los')
                    : (isTimeQuest
                        ? (DQ_DATA.translations[lang].timer_start_button || 'Los')
                        : (isSetQuest ? progressText : fallbackActionLabel));
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

    async getQuestById(questId) {
        return new Promise(resolve => {
            DQ_DB.db.transaction('daily_quests', 'readonly')
                .objectStore('daily_quests')
                .get(questId).onsuccess = e => resolve(e.target.result);
        });
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
            const card = document.querySelector(`[data-quest-id="${questId}"]`);
            const button = card?.querySelector('.complete-button-small');
            if (!button) return;

            const updatedQuest = await DQ_TRAINING_SYSTEM.advanceSetProgress(questId);
            if (!updatedQuest) return;

            if (updatedQuest.canComplete) {
                await this.finalizeQuestCompletion(questId);
                return;
            }

            // Direkte Animation statt komplettem Re-render
            const doneSets = updatedQuest.setProgress.filter(Boolean).length;
            const totalSets = updatedQuest.setPlan?.sets || updatedQuest.setProgress?.length || 1;
            const counterEl = button.querySelector('.set-counter');

            if (counterEl) {
                counterEl.classList.add('slide-out');
                setTimeout(() => {
                    counterEl.textContent = doneSets;
                    counterEl.classList.remove('slide-out');
                    counterEl.classList.add('slide-in');
                    setTimeout(() => counterEl.classList.remove('slide-in'), 350);
                }, 300);
            } else {
                button.innerHTML = `<span class="set-counter slide-in">${doneSets}</span>/${totalSets}`;
            }

            // Button-Status aktualisieren
            if (doneSets === totalSets) {
                button.classList.add('set-completed');
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

        const template = Object.values(DQ_DATA.exercisePool).flat().find(t => t.nameKey === exercise.nameKey) || {
            nameKey: exercise.nameKey,
            muscles: exercise.muscles || [],
            statPoints: exercise.statPoints || null,
            directStatGain: exercise.directStatGain || null,
            mana: exercise.manaReward || 1,
            gold: exercise.goldReward || 1
        };

        const translatedName = this.resolveExerciseName(exercise, lang);
        const explanation = exercise.customDescription || DQ_DATA.exerciseExplanations[lang][exercise.nameKey] || 'Keine Beschreibung verfügbar.';

        // Ziel-Anzeige: Quest mit setPlan zeigt Sets-Info, sonst formatTargetDisplay
        let targetDisplay = '';
        if (isQuest && DQ_TRAINING_SYSTEM) {
            targetDisplay = DQ_TRAINING_SYSTEM.formatQuestTarget(exercise) || '';
        } else if (!isQuest && exercise.type !== 'check' && exercise.type !== 'link' && exercise.type !== 'focus') {
            const targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
            targetDisplay = this.formatTargetDisplay(exercise.type, targetValue);
        }

        // Belohnungen
        const scaledMana = isQuest
            ? (exercise.manaReward || template.mana || 1)
            : Math.ceil((template.mana || 1) * (1 + 0.2 * (difficulty - 1)));
        const scaledGold = isQuest
            ? (exercise.goldReward || template.gold || 1)
            : Math.ceil((template.gold || 1) * (1 + 0.15 * (difficulty - 1)));

        // Kategorien (Trainingspläne)
        const categories = [];
        for (const [catName, list] of Object.entries(DQ_DATA.exercisePool)) {
            if (list.some(item => item.nameKey === exercise.nameKey)) {
                categories.push(trans[`filter_${catName}`] || catName);
            }
        }

        // Badges
        const muscleTags = (template.muscles || []).map(m => `<span class="info-badge muscle-badge">${trans[`muscle_${m}`] || m}</span>`).join('') || '<span class="info-badge">—</span>';
        const categoryTags = categories.map(c => `<span class="info-badge cat-badge">${c}</span>`).join('') || '<span class="info-badge">—</span>';

        // Phase-Info (nur für Quests)
        const phaseInfo = (isQuest && !isSeniorMode && exercise.phaseSummary)
            ? `<span class="info-badge phase-badge">${exercise.phaseSummary}</span>`
            : '<span class="info-badge">—</span>';

        // Stat-Boni
        let statsHtml = '';
        if (template.statPoints) {
            statsHtml = Object.entries(template.statPoints).map(([stat, val]) => {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                return `<span class="info-stat-row"><span class="material-symbols-rounded" style="font-size:14px;">add_circle</span>${val} ${statName}</span>`;
            }).join('');
        }
        if (template.directStatGain) {
            statsHtml += Object.entries(template.directStatGain).map(([stat, val]) => {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                return `<span class="info-stat-row"><span class="material-symbols-rounded" style="font-size:14px;">bolt</span>${val} ${statName}</span>`;
            }).join('');
        }
        if (!statsHtml) statsHtml = '<span class="info-badge">—</span>';

        const content = `
            <div class="enhanced-info-popup">
                <h3 class="info-title">${translatedName}</h3>

                <details class="info-instruction-box" open>
                    <summary>${trans.show_instructions}</summary>
                    <div class="info-instruction-text">${explanation}</div>
                </details>

                <div class="info-summary-table">
                    <div class="info-summary-cell">
                        <span class="info-summary-label">Phase</span>
                        <div class="info-summary-value">${phaseInfo}</div>
                    </div>
                    <div class="info-summary-cell">
                        <span class="info-summary-label">${trans.muscle_groups_label}</span>
                        <div class="info-summary-value">${muscleTags}</div>
                    </div>
                    <div class="info-summary-cell">
                        <span class="info-summary-label">${trans.training_plans_label}</span>
                        <div class="info-summary-value">${categoryTags}</div>
                    </div>
                    <div class="info-summary-cell">
                        <span class="info-summary-label">${trans.base_stats_label}</span>
                        <div class="info-summary-value" style="flex-direction:column;">${statsHtml}</div>
                    </div>
                </div>

                <div class="info-footer">
                    ${targetDisplay ? `<div class="info-target"><strong>Ziel:</strong> ${targetDisplay}</div>` : ''}
                    <div>
                        <span class="info-reward-label">Belohnung:</span>
                        <span class="info-rewards">
                            <span class="material-symbols-rounded icon-mana" style="font-size:16px;">auto_awesome</span>${scaledMana}
                            <span class="material-symbols-rounded icon-gold" style="margin-left:4px;font-size:16px;">paid</span>${scaledGold}
                        </span>
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
                const isTimeExercise = exercise.type === 'time' && targetValue <= 180;
                const buttonAction = isFocusExercise ? 'start-focus' : (isTimeExercise ? 'start-timer' : 'complete');
                const buttonText = isFocusExercise 
                    ? (DQ_DATA.translations[lang].start_task_button || 'Los')
                    : (isTimeExercise ? (DQ_DATA.translations[lang].timer_start_button || 'Los') : 'OK');

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
        // --- ANTI-SPAM: Max 3 Abschluesse in 30 Sekunden ---
        if (!this._freeTrainingCompletions) {
            this._freeTrainingCompletions = [];
        }
        const now = Date.now();
        // Alte Eintraege (>30s) entfernen
        this._freeTrainingCompletions = this._freeTrainingCompletions.filter(ts => now - ts < 30000);
        if (this._freeTrainingCompletions.length >= 3) {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const msg = lang === 'de'
                ? 'Du machst Uebungen ganz schnell. Sicher, dass du sie auch alle machst?'
                : 'You are completing exercises very fast. Are you sure you are actually doing them?';
            DQ_UI.showCustomPopup(msg, 'penalty');
            return;
        }
        this._freeTrainingCompletions.push(now);

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

            if (typeof DQ_ANALYTICS !== 'undefined' && exerciseTemplate) {
                DQ_ANALYTICS.logFreeTraining(exerciseTemplate.nameKey, scaledMana, scaledGold);
            }

            charStore.put(char);

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = (event) => reject(event.target.error);
            });
            if (typeof DQ_SUPABASE !== 'undefined') DQ_SUPABASE.triggerSync();

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

            const translatedName = this.resolveExerciseName(quest, lang);
            
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
