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
        if (!exercise) return 'Training';
        if (typeof DQ_WGER !== 'undefined') {
            if (DQ_WGER.isWgerId(exercise.id)) {
                const name = DQ_WGER.getDisplayName(exercise, lang);
                if (name && name !== 'Training') return name;
                if (exercise.nameDe || exercise.nameEn) return (lang === 'en' ? exercise.nameEn : exercise.nameDe) || exercise.nameEn || exercise.nameDe;
            }
            if (DQ_WGER.isWgerNameKey(exercise.nameKey) || exercise.source === 'wger') {
                const name = DQ_WGER.getDisplayName(exercise, lang);
                if (name && name !== 'Training' && !name.startsWith('wger_')) return name;
            }
        }
        const customName = String(exercise?.customDisplayName || '').trim();
        if (customName && !/^custom_/.test(customName.toLowerCase()) && !customName.includes('_')) {
            return customName;
        }
        const nameKey = exercise?.nameKey || '';
        if (nameKey && DQ_DATA.translations[lang]?.exercise_names?.[nameKey]) {
            return DQ_DATA.translations[lang].exercise_names[nameKey];
        }
        return this.prettifyExerciseName(nameKey);
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

        if (completionMode === 'log' || String(labelKey || '').startsWith('phase_endurance_')) {
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
            const questAvailable = quest => {
                if (typeof DQ_TRAINING_SYSTEM !== 'undefined' && typeof DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment === 'function') {
                    return DQ_TRAINING_SYSTEM.isExerciseAllowedByEquipment(quest, DQ_CONFIG.userSettings || {});
                }
                return DQ_CONFIG.userSettings.hasEquipment !== false || quest.needsEquipment !== true;
            };
            const isPlaceholderQuest = quest => /^custom_ai_(rest_)?fill_\d+$/i.test(String(quest?.nameKey || ''));
            const visibleQuests = questsToday
                .filter(questAvailable)
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
                const isTimerQuest = quest.completionMode === 'timer' || (quest.type === 'time' && quest.target <= 180);
                const buttonAction = isFocusQuest ? 'start-focus' : (isTimerQuest ? 'start-timer' : 'complete');
                const isSetQuest = quest.completionMode === 'sets' && Array.isArray(quest.setProgress) && quest.setPlan;
                const totalSets = Math.max(1, quest.setPlan?.sets || quest.setProgress?.length || 1);
                const doneSets = isSetQuest ? quest.setProgress.filter(Boolean).length : 0;
                const isAllSetsComplete = isSetQuest && doneSets === totalSets;
                const progressText = `<span class="set-counter">${doneSets}</span>/${totalSets}`;
                const fallbackActionLabel = typeof DQ_TRAINING_SYSTEM !== 'undefined' ? DQ_TRAINING_SYSTEM.getQuestActionLabel(quest) : 'OK';
                const buttonText = isFocusQuest
                    ? (DQ_DATA.translations[lang].start_task_button || 'Los')
                    : (isSetQuest
                        ? progressText
                        : (isTimerQuest ? (DQ_DATA.translations[lang].timer_start_button || 'Los') : fallbackActionLabel));
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

    showQuestCompletionReward(quest) {
        if (!quest) return;
        const manaReward = DQ_CONFIG.toFiniteNumber ? DQ_CONFIG.toFiniteNumber(quest.manaReward, 0) : (Number(quest.manaReward) || 0);
        const goldReward = DQ_CONFIG.toFiniteNumber ? DQ_CONFIG.toFiniteNumber(quest.goldReward, 0) : (Number(quest.goldReward) || 0);
        DQ_UI.showCustomPopup(`Sehr gut! <span class="material-symbols-rounded icon-accent">thumb_up</span><br>+${manaReward} Mana <span class="material-symbols-rounded icon-mana">auto_awesome</span> | +${goldReward} Gold <span class="material-symbols-rounded icon-gold">paid</span>`);
    },

    async finalizeQuestCompletion(questId, options = {}) {
        const showReward = options.showReward !== false;
        try {
            const updatedChar = await DQ_CONFIG.performQuestCompletion(questId);

            const quest = await new Promise(resolve => {
                DQ_DB.db.transaction('daily_quests', 'readonly').objectStore('daily_quests').get(questId).onsuccess = e => resolve(e.target.result);
            });

            if (quest && showReward) {
                this.showQuestCompletionReward(quest);
            }

            DQ_CONFIG.checkStreakCompletion();
            this.renderQuests();
            DQ_CHARACTER_MAIN.renderPage();
            DQ_ACHIEVEMENTS.checkAllAchievements(updatedChar);
            return { ok: true, quest, char: updatedChar };
        } catch (error) {
            console.error('Quest-Abschluss fehlgeschlagen (UI-Ebene):', error);
            DQ_UI.showCustomPopup('Speichern fehlgeschlagen. Bitte versuche es erneut.', 'penalty');
            return { ok: false, error };
        }
    },

    async completeQuest(questId, options = {}) {
        const quest = await new Promise(resolve => {
            DQ_DB.db.transaction('daily_quests', 'readonly').objectStore('daily_quests').get(questId).onsuccess = e => resolve(e.target.result);
        });
        if (!quest) return { ok: false, completed: false, error: new Error('Quest nicht gefunden.') };

        if (quest.completionMode === 'sets') {
            const card = document.querySelector(`[data-quest-id="${questId}"]`);
            const button = card?.querySelector('.complete-button-small');

            const updatedQuest = await DQ_TRAINING_SYSTEM.advanceSetProgress(questId);
            if (!updatedQuest) return { ok: false, completed: false, error: new Error('Satzfortschritt konnte nicht gespeichert werden.') };

            const doneSets = updatedQuest.setProgress.filter(Boolean).length;
            const totalSets = updatedQuest.setPlan?.sets || updatedQuest.setProgress?.length || 1;

            if (updatedQuest.canComplete) {
                const result = await this.finalizeQuestCompletion(questId, options);
                return { ...result, completed: result.ok === true, doneSets, totalSets };
            }

            // Direkte Animation statt komplettem Re-render
            const counterEl = button?.querySelector('.set-counter');

            if (counterEl) {
                counterEl.classList.add('slide-out');
                setTimeout(() => {
                    counterEl.textContent = doneSets;
                    counterEl.classList.remove('slide-out');
                    counterEl.classList.add('slide-in');
                    setTimeout(() => counterEl.classList.remove('slide-in'), 350);
                }, 300);
            } else if (button) {
                button.innerHTML = `<span class="set-counter slide-in">${doneSets}</span>/${totalSets}`;
            }

            // Button-Status aktualisieren
            if (button && doneSets === totalSets) {
                button.classList.add('set-completed');
            }
            return { ok: true, completed: false, quest: updatedQuest, doneSets, totalSets };
        }

        const result = await this.finalizeQuestCompletion(questId, options);
        return { ...result, completed: result.ok === true };
    },

    showQuestInfo(questId) {
        DQ_DB.db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').get(questId).onsuccess = async (e) => {
            const quest = e.target.result;
            if (!quest) return;
            if ((quest.source === 'wger' || DQ_WGER.isWgerNameKey(quest.nameKey)) && !quest.descriptionDe && !quest.descriptionEn) {
                try {
                    const full = await DQ_WGER.getById(quest.wgerId || `wger:${quest.nameKey.replace('wger_', '')}`);
                    if (full) {
                        quest.descriptionDe = full.descriptionDe || quest.descriptionDe || null;
                        quest.descriptionEn = full.descriptionEn || quest.descriptionEn || null;
                    }
                } catch (_) {}
            }
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
        const template = Object.values(DQ_DATA.exercisePool).flat().find(t => t.nameKey === exercise.nameKey) || {
            nameKey: exercise.nameKey,
            muscles: exercise.muscles || [],
            musclesSecondary: exercise.musclesSecondary || [],
            statPoints: exercise.statPoints || null,
            directStatGain: exercise.directStatGain || null,
            mana: exercise.manaReward || exercise.mana || 1,
            gold: exercise.goldReward || exercise.gold || 1,
            source: exercise.source,
            imageUrl: exercise.imageUrl,
            imageThumbMd: exercise.imageThumbMd,
            category: exercise.category,
            license: exercise.license,
            licenseUrl: exercise.licenseUrl,
            licenseAuthor: exercise.licenseAuthor
        };

        const translatedName = this.resolveExerciseName(exercise, lang);

        let explanation = '';
        let explanationLabel = trans.show_instructions;
        if (typeof DQ_WGER !== 'undefined' && (exercise.source === 'wger' || DQ_WGER.isWgerNameKey(exercise.nameKey))) {
            const deDesc = exercise.descriptionDe || template.descriptionDe || DQ_WGER.getDescription(exercise, 'de');
            const enDesc = exercise.descriptionEn || template.descriptionEn || DQ_WGER.getDescription(exercise, 'en');
            if (lang === 'de' && deDesc) {
                explanation = deDesc;
            } else if (lang === 'en' && enDesc) {
                explanation = enDesc;
            } else if (lang === 'de' && enDesc) {
                explanation = enDesc;
                explanationLabel = lang === 'de' ? 'Anleitung (Englisch)' : 'Instructions (English)';
            } else {
                explanation = deDesc || enDesc;
            }
        } else {
            explanation = exercise.customDescription || DQ_DATA.exerciseExplanations[lang][exercise.nameKey] || '';
        }

        const hasExplanation = !!explanation.trim();

        let targetDisplay = '';
        if (isQuest && DQ_TRAINING_SYSTEM) {
            targetDisplay = DQ_TRAINING_SYSTEM.formatQuestTarget(exercise) || '';
        } else if (!isQuest && exercise.type !== 'check' && exercise.type !== 'link' && exercise.type !== 'focus') {
            const targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
            targetDisplay = this.formatTargetDisplay(exercise.type, targetValue);
        }

        const scaledMana = isQuest
            ? (exercise.manaReward || template.mana || 1)
            : Math.ceil((template.mana || 1) * (1 + 0.2 * (difficulty - 1)));
        const scaledGold = isQuest
            ? (exercise.goldReward || template.gold || 1)
            : Math.ceil((template.gold || 1) * (1 + 0.15 * (difficulty - 1)));

        const categories = template.category ? [template.category] : [];
        for (const [catName, list] of Object.entries(DQ_DATA.exercisePool)) {
            if (list.some(item => item.nameKey === exercise.nameKey)) {
                categories.push(trans[`filter_${catName}`] || catName);
            }
        }

        const primaryMuscles = template.muscles || [];
        const secondaryMuscles = template.musclesSecondary || [];
        const muscleLabel = (m) => {
            if (typeof DQ_WGER !== 'undefined' && Number.isFinite(Number(m))) return DQ_WGER.getMuscleName(Number(m), lang);
            return trans[`muscle_${m}`] || m;
        };
        const muscleTags = primaryMuscles.map(m => `<span class="info-badge muscle-badge primary">${muscleLabel(m)}</span>`)
            .concat(secondaryMuscles.map(m => `<span class="info-badge muscle-badge secondary">${muscleLabel(m)}</span>`))
            .join('') || '<span class="info-badge">Allgemein</span>';
        const categoryTags = categories.map(c => `<span class="info-badge cat-badge">${c}</span>`).join('') || '<span class="info-badge">Allgemein</span>';

        const phaseInfo = (isQuest && exercise.phaseSummary)
            ? `<span class="info-badge phase-badge">${exercise.phaseSummary}</span>`
            : '<span class="info-badge">Frei</span>';

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

        const image = exercise.imageThumbMd || exercise.imageUrl || template.imageThumbMd || template.imageUrl || '';
        const videos = exercise.videos || template.videos || [];
        const hasVideo = videos.length > 0;
        const hasImage = !!image;

        const hasMedia = hasImage || hasVideo;

        const muscleAliases = {
            '1': ['biceps', 'arms'],
            '2': ['shoulders'],
            '3': ['serratus', 'core'],
            '4': ['chest'],
            '5': ['triceps', 'arms'],
            '6': ['abs', 'core'],
            '7': ['calves', 'legs'],
            '8': ['glutes'],
            '9': ['traps', 'back'],
            '10': ['quads', 'legs'],
            '11': ['hamstrings', 'legs'],
            '12': ['lats', 'back'],
            '13': ['brachialis', 'biceps', 'arms'],
            '14': ['obliques', 'abs', 'core', 'side'],
            '15': ['soleus', 'calves', 'legs']
        };
        const normalizeMuscleKeys = (muscles) => new Set(muscles.flatMap((muscle) => {
            const key = String(muscle).trim().toLowerCase();
            return [key, ...(muscleAliases[key] || [])];
        }));
        const primaryMuscleKeys = normalizeMuscleKeys(primaryMuscles);
        const secondaryMuscleKeys = normalizeMuscleKeys(secondaryMuscles);
        const muscleAreaState = (keys) => {
            if (keys.some(key => primaryMuscleKeys.has(key))) return 'is-active';
            if (keys.some(key => secondaryMuscleKeys.has(key))) return 'is-secondary';
            return '';
        };
        const muscleAreaClass = (keys) => `muscle-zone ${muscleAreaState(keys)}`;
        const muscleFigure = `
            <div class="muscle-silhouette" aria-label="Trainierte Muskelbereiche">
                <svg class="muscle-map" viewBox="0 0 320 246" role="img" aria-hidden="true">
                    <g class="muscle-figure front" transform="translate(28 10)">
                        <circle class="body-base" cx="65" cy="18" r="15"></circle>
                        <path class="body-base" d="M48 39 C54 31 76 31 82 39 L88 88 C90 104 82 120 76 133 L54 133 C48 120 40 104 42 88 Z"></path>
                        <path class="body-base" d="M44 44 C28 50 22 72 19 102 C18 113 30 115 33 105 C36 83 41 67 50 57 Z"></path>
                        <path class="body-base" d="M86 44 C102 50 108 72 111 102 C112 113 100 115 97 105 C94 83 89 67 80 57 Z"></path>
                        <path class="body-base" d="M54 132 C48 154 43 183 41 216 C41 228 56 228 58 217 L65 154 L72 217 C74 228 89 228 89 216 C87 183 82 154 76 132 Z"></path>
                        <path class="${muscleAreaClass(['shoulders', 'full_body'])}" d="M43 42 C50 33 60 36 63 44 C56 47 50 51 45 58 C41 55 39 49 43 42 Z"></path>
                        <path class="${muscleAreaClass(['shoulders', 'full_body'])}" d="M87 42 C80 33 70 36 67 44 C74 47 80 51 85 58 C89 55 91 49 87 42 Z"></path>
                        <path class="${muscleAreaClass(['chest', 'full_body'])}" d="M48 48 C55 42 63 44 64 55 L64 74 C54 73 48 65 46 55 Z"></path>
                        <path class="${muscleAreaClass(['chest', 'full_body'])}" d="M82 48 C75 42 67 44 66 55 L66 74 C76 73 82 65 84 55 Z"></path>
                        <path class="${muscleAreaClass(['abs', 'core', 'obliques', 'side', 'full_body'])}" d="M54 76 L76 76 C79 91 77 110 72 126 L58 126 C53 110 51 91 54 76 Z"></path>
                        <path class="${muscleAreaClass(['biceps', 'triceps', 'arms', 'full_body'])}" d="M36 59 C27 70 25 89 26 104 C32 106 37 103 38 97 C39 84 42 73 48 61 Z"></path>
                        <path class="${muscleAreaClass(['biceps', 'triceps', 'arms', 'full_body'])}" d="M94 59 C103 70 105 89 104 104 C98 106 93 103 92 97 C91 84 88 73 82 61 Z"></path>
                        <path class="${muscleAreaClass(['quads', 'legs', 'full_body'])}" d="M54 136 L64 136 L62 190 L48 190 C49 169 51 151 54 136 Z"></path>
                        <path class="${muscleAreaClass(['quads', 'legs', 'full_body'])}" d="M76 136 L66 136 L68 190 L82 190 C81 169 79 151 76 136 Z"></path>
                        <path class="${muscleAreaClass(['calves', 'soleus', 'legs', 'full_body'])}" d="M48 193 L62 193 L58 223 C56 229 45 228 45 220 Z"></path>
                        <path class="${muscleAreaClass(['calves', 'soleus', 'legs', 'full_body'])}" d="M82 193 L68 193 L72 223 C74 229 85 228 85 220 Z"></path>
                    </g>
                    <g class="muscle-figure back" transform="translate(176 10)">
                        <circle class="body-base" cx="65" cy="18" r="15"></circle>
                        <path class="body-base" d="M48 39 C54 31 76 31 82 39 L88 88 C90 104 82 120 76 133 L54 133 C48 120 40 104 42 88 Z"></path>
                        <path class="body-base" d="M44 44 C28 50 22 72 19 102 C18 113 30 115 33 105 C36 83 41 67 50 57 Z"></path>
                        <path class="body-base" d="M86 44 C102 50 108 72 111 102 C112 113 100 115 97 105 C94 83 89 67 80 57 Z"></path>
                        <path class="body-base" d="M54 132 C48 154 43 183 41 216 C41 228 56 228 58 217 L65 154 L72 217 C74 228 89 228 89 216 C87 183 82 154 76 132 Z"></path>
                        <path class="${muscleAreaClass(['traps', 'back', 'shoulders', 'full_body'])}" d="M50 39 L80 39 L73 58 L65 64 L57 58 Z"></path>
                        <path class="${muscleAreaClass(['lats', 'back', 'full_body'])}" d="M48 57 C57 64 61 78 61 99 L51 122 C44 104 41 82 48 57 Z"></path>
                        <path class="${muscleAreaClass(['lats', 'back', 'full_body'])}" d="M82 57 C73 64 69 78 69 99 L79 122 C86 104 89 82 82 57 Z"></path>
                        <path class="${muscleAreaClass(['triceps', 'arms', 'full_body'])}" d="M35 61 C28 74 26 90 27 104 C33 106 38 103 39 96 C40 83 43 72 49 60 Z"></path>
                        <path class="${muscleAreaClass(['triceps', 'arms', 'full_body'])}" d="M95 61 C102 74 104 90 103 104 C97 106 92 103 91 96 C90 83 87 72 81 60 Z"></path>
                        <path class="${muscleAreaClass(['glutes', 'full_body'])}" d="M52 125 C59 120 65 124 65 134 L65 154 C54 153 48 143 52 125 Z"></path>
                        <path class="${muscleAreaClass(['glutes', 'full_body'])}" d="M78 125 C71 120 65 124 65 134 L65 154 C76 153 82 143 78 125 Z"></path>
                        <path class="${muscleAreaClass(['hamstrings', 'legs', 'full_body'])}" d="M53 154 L64 154 L62 190 L48 190 C49 174 50 163 53 154 Z"></path>
                        <path class="${muscleAreaClass(['hamstrings', 'legs', 'full_body'])}" d="M77 154 L66 154 L68 190 L82 190 C81 174 80 163 77 154 Z"></path>
                        <path class="${muscleAreaClass(['calves', 'soleus', 'legs', 'full_body'])}" d="M48 193 L62 193 L58 223 C56 229 45 228 45 220 Z"></path>
                        <path class="${muscleAreaClass(['calves', 'soleus', 'legs', 'full_body'])}" d="M82 193 L68 193 L72 223 C74 229 85 228 85 220 Z"></path>
                    </g>
                    <text class="muscle-map-label" x="93" y="242">Front</text>
                    <text class="muscle-map-label" x="241" y="242">Back</text>
                </svg>
            </div>
        `;
        const license = exercise.license || template.license;
        const licenseUrl = exercise.licenseUrl || template.licenseUrl || 'https://creativecommons.org/licenses/by-sa/4.0/';
        const attribution = (exercise.source === 'wger' || template.source === 'wger')
            ? `<div class="info-attribution">Daten: <a href="https://wger.de" target="_blank" rel="noopener">wger.de</a>${license ? `, <a href="${licenseUrl}" target="_blank" rel="noopener">${license}</a>` : ''}</div>`
            : '';

        const instructionBlock = hasExplanation
            ? (hasMedia
                ? `<details class="info-instruction-box">
                        <summary>${explanationLabel}</summary>
                        <div class="info-instruction-text">${explanation}</div>
                    </details>`
                : `<details class="info-instruction-box" open>
                        <summary>${explanationLabel}</summary>
                        <div class="info-instruction-text">${explanation}</div>
                    </details>`)
            : `<div class="info-instruction-box info-instruction-empty">
                    <span class="material-symbols-rounded" style="font-size:18px;opacity:0.5;">description</span>
                    <span>Keine Anleitung verfuegbar.</span>
                </div>`;

        let mediaFrame = '';
        if (hasMedia) {
            let parts = '';
            if (image) {
                parts += `<div class="info-media-frame-img-wrap">
                    <img class="info-exercise-image info-exercise-image-clickable" src="${image}" alt="${translatedName}" loading="lazy">
                    <button class="info-image-fullscreen-btn" aria-label="Vollbild">
                        <span class="material-symbols-rounded">fullscreen</span>
                    </button>
                </div>`;
            }
            if (hasVideo) {
                const mainVideo = videos.find(v => v.isMain) || videos[0];
                if (mainVideo.url) {
                    parts += `<video class="info-exercise-video" controls src="${mainVideo.url}" style="width:100%;border-radius:8px;margin-top:8px;"></video>`;
                } else if (mainVideo.embed) {
                    parts += `<div class="info-exercise-placeholder"><span class="material-symbols-rounded">play_circle</span></div>`;
                }
            }
            mediaFrame = `<div class="info-media-frame">${parts}</div>`;
        }

        const content = `
            <div class="enhanced-info-popup">
                ${mediaFrame}
                <h3 class="info-title">${translatedName}</h3>

                ${instructionBlock}

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

                ${muscleFigure}

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
                ${attribution}
            </div>
        `;
        DQ_UI.showCustomPopup(content, 'info');

        const img = document.querySelector('.info-exercise-image-clickable');
        if (img) {
            const openFs = () => this.openFullscreenImage(img.src, translatedName);
            img.addEventListener('click', openFs);
            const fsBtn = img.parentElement.querySelector('.info-image-fullscreen-btn');
            if (fsBtn) fsBtn.addEventListener('click', (e) => { e.stopPropagation(); openFs(); });
        }
    },

    openFullscreenImage(src, alt) {
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-image-overlay';
        overlay.innerHTML = `
            <button class="fullscreen-image-close" aria-label="Schliessen">
                <span class="material-symbols-rounded">close</span>
            </button>
            <img class="fullscreen-image-content" src="${src}" alt="${alt}">
        `;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        overlay.querySelector('.fullscreen-image-close').addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('open'));
    },

    async renderFreeExercisesPage() {
        if (typeof DQ_WGER === 'undefined') return;
        const list = DQ_UI.elements.exerciseList;
        if (!list) return;

        this.freeTrainingOffset = 0;
        this.freeTrainingHasMore = true;
        this.freeTrainingLoading = false;
        list.innerHTML = '';
        const sentinel = document.getElementById('lazy-load-sentinel');
        if (sentinel) sentinel.hidden = false;

        if (this.freeTrainingObserver) {
            this.freeTrainingObserver.disconnect();
            this.freeTrainingObserver = null;
        }

        await this.loadNextFreeExerciseBatch();

        if (sentinel) {
            this.freeTrainingObserver = new IntersectionObserver(entries => {
                if (entries[0]?.isIntersecting) this.loadNextFreeExerciseBatch();
            }, { rootMargin: '240px 0px' });
            this.freeTrainingObserver.observe(sentinel);
        }
    },

    async loadNextFreeExerciseBatch() {
        if (this.freeTrainingLoading || this.freeTrainingHasMore === false || typeof DQ_WGER === 'undefined') return;
        const list = DQ_UI.elements.exerciseList;
        const sentinel = document.getElementById('lazy-load-sentinel');
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
        const limit = 30;

        this.freeTrainingLoading = true;
        const result = await DQ_WGER.queryExercises({
            category: this.currentFreeExerciseFilter || 'all',
            search: DQ_WGER.searchTerm || '',
            equipment: 'all',
            muscle: 'all',
            hasEquipment: DQ_CONFIG.userSettings.hasEquipment !== false,
            offset: this.freeTrainingOffset || 0,
            limit
        });

        if ((this.freeTrainingOffset || 0) === 0 && result.items.length === 0) {
            list.innerHTML = `<div class="card free-training-empty"><p>Keine Uebungen gefunden. Die wger-Datenbank wird bei der naechsten Internetverbindung geladen.</p></div>`;
        }

        const fragment = document.createDocumentFragment();
        result.items.forEach(exercise => {
            let targetValue = exercise.baseValue;
            if (exercise.type !== 'check' && exercise.type !== 'link' && exercise.type !== 'focus') {
                targetValue = Math.ceil(exercise.baseValue + (exercise.baseValue * 0.4 * (difficulty - 1)));
            }
            const targetDisplay = this.formatTargetDisplay(exercise.type, targetValue);
            const translatedName = this.resolveExerciseName(exercise, lang);
            const isFocusExercise = exercise.type === 'focus';
            const isTimeExercise = exercise.type === 'time' && targetValue <= 180;
            const buttonAction = isFocusExercise ? 'start-focus' : (isTimeExercise ? 'start-timer' : 'complete');
            const buttonText = isFocusExercise
                ? (DQ_DATA.translations[lang].start_task_button || 'Los')
                : (isTimeExercise ? (DQ_DATA.translations[lang].timer_start_button || 'Los') : 'OK');

            const card = document.createElement('div');
            card.className = 'card exercise-card';
            card.dataset.exerciseId = exercise.id;
            card.dataset.exerciseSource = exercise.source || (DQ_WGER.isWgerId(exercise.id) ? 'wger' : 'local');
            card.innerHTML = `
                <div class="quest-info">
                    <h2>${DQ_WGER.escapeHtml(translatedName)}</h2>
                    ${targetDisplay ? `<p class="quest-target">${targetDisplay}</p>` : ''}
                </div>
                <div class="exercise-card-actions">
                    <button class="action-button info-button-small" data-action="info" aria-label="Info">?</button>
                    <button class="action-button complete-button-small" data-action="${buttonAction}" aria-label="Absolvieren">${buttonText}</button>
                </div>
            `;
            fragment.appendChild(card);
        });

        requestAnimationFrame(() => list.appendChild(fragment));
        this.freeTrainingOffset = (this.freeTrainingOffset || 0) + result.items.length;
        this.freeTrainingHasMore = result.hasMore;
        if (sentinel) sentinel.hidden = !result.hasMore;
        this.freeTrainingLoading = false;
    },

    async completeFreeExercise(exerciseId, options = {}) {
        const showReward = options.showReward !== false;
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
            const exercise = await DQ_WGER.getById(exerciseId);
            if (!exercise) throw new Error('Exercise not found');
            if (exercise.type === 'link') {
                window.open(exercise.url, '_blank');
            }

            let char = await new Promise((resolve, reject) => {
                const tx = DQ_DB.db.transaction(['character'], 'readonly');
                tx.objectStore('character').get(1).onsuccess = e => resolve(e.target.result);
                tx.onerror = event => reject(event.target.error);
            });
            if (!char) throw new Error('Character not found');

            const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
            const baseMana = exercise.manaReward ?? exercise.mana ?? 1;
            const baseGold = exercise.goldReward ?? exercise.gold ?? 1;
            const scaledMana = Math.ceil(baseMana * (1 + 0.2 * (difficulty - 1)));
            const scaledGold = Math.ceil(baseGold * (1 + 0.15 * (difficulty - 1)));

            if (typeof DQ_CONFIG.normalizeCharacterNumbers === 'function') {
                DQ_CONFIG.normalizeCharacterNumbers(char);
            }
            char.mana += scaledMana;
            char.gold += scaledGold;
            char.totalGoldEarned += scaledGold;

            const exerciseTemplate = exercise;
            char = DQ_CONFIG.processStatGains(char, exerciseTemplate);
            char = DQ_CONFIG.levelUpCheck(char);
            if (typeof DQ_CONFIG.normalizeCharacterNumbers === 'function') {
                DQ_CONFIG.normalizeCharacterNumbers(char);
            }

            if (typeof DQ_ANALYTICS !== 'undefined' && exerciseTemplate) {
                DQ_ANALYTICS.logFreeTraining(exerciseTemplate.nameKey, scaledMana, scaledGold);
            }

            const tx = DQ_DB.db.transaction(['character'], 'readwrite');
            const charStore = tx.objectStore('character');
            charStore.put(char);

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = (event) => reject(event.target.error);
            });
            localStorage.setItem('dq_last_local_update', String(Date.now()));
            if (typeof DQ_SUPABASE !== 'undefined') DQ_SUPABASE.triggerSync();

            if (showReward) {
                DQ_UI.showCustomPopup(`Sehr gut! <span class=\"material-symbols-rounded icon-accent\">thumb_up</span><br>+${scaledMana} Mana <span class=\"material-symbols-rounded icon-mana\">auto_awesome</span> | +${scaledGold} Gold <span class=\"material-symbols-rounded icon-gold\">paid</span>`);
            }
            DQ_CHARACTER_MAIN.renderPage();
            DQ_ACHIEVEMENTS.checkAllAchievements(char);
            return { ok: true, mana: scaledMana, gold: scaledGold, char };
            
        } catch (error) {
            console.error("Speichern des freien Trainings fehlgeschlagen:", error);
            DQ_UI.showCustomPopup("Speichern fehlgeschlagen. Bitte versuche es erneut.", 'penalty');
            return { ok: false, error };
        }
    },

    async showFreeExerciseInfo(exerciseId) {
        const ex = await DQ_WGER.getById(exerciseId);
        if (!ex) return;
        this.renderExerciseInfoPopup(ex, false);
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
