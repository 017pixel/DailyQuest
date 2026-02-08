const DQ_CONFIG = {
    userSettings: {},
    dailyCheckInterval: null,

    getTodayString() { return new Date().toISOString().split('T')[0]; },
    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    },

    getCharacter() {
        return new Promise(resolve => {
            if (!DQ_DB.db) resolve(null);
            const tx = DQ_DB.db.transaction('character', 'readonly');
            tx.objectStore('character').get(1).onsuccess = e => resolve(e.target.result);
            tx.onerror = () => resolve(null);
        });
    },

    getStreakData() {
        const data = localStorage.getItem('streakData');
        if (!data) return { streak: 0, lastDate: null };
        try { return JSON.parse(data); } catch { return { aname: 'Unknown Hunter', level: 1, mana: 0, manaToNextLevel: 100, gold: 200, stats: { kraft: 5, ausdauer: 5, beweglichkeit: 5, durchhaltevermoegen: 5, willenskraft: 5 }, statProgress: { kraft: 0, ausdauer: 0, beweglichkeit: 0, durchhaltevermoegen: 0, willenskraft: 0 }, equipment: { weapons: [], armor: null }, inventory: [] }; }
    },
    setStreakData(streak, lastDate) {
        localStorage.setItem('streakData', JSON.stringify({ streak, lastDate }));
    },
    updateStreakDisplay() {
        const streakBox = document.getElementById('streak-value');
        if (!streakBox) return;
        const { streak } = this.getStreakData();
        streakBox.textContent = streak;
    },

    processStatGains(char, exercise) {
        if (!exercise) return char;

        const lang = this.userSettings.language || 'de';
        const difficulty = this.userSettings.difficulty || 3;
        const durchhalteMultiplier = 0.5;

        const mainStatThresholds = { 1: 5.5, 2: 5, 3: 4.5, 4: 4, 5: 3.5 };
        const willpowerThresholds = { 1: 4.5, 2: 4, 3: 3.5, 4: 3, 5: 2.5 };

        if (exercise.directStatGain) {
            for (const stat in exercise.directStatGain) {
                const rawGain = exercise.directStatGain[stat];
                const gain = stat === 'durchhaltevermoegen' ? rawGain * durchhalteMultiplier : rawGain;
                char.stats[stat] += gain;
                const title = DQ_DATA.translations[lang].stat_increase_title;
                let text = DQ_DATA.translations[lang].stat_increase_text.replace('{statName}', stat);
                setTimeout(() => DQ_UI.showCustomPopup(`<h3>${title}</h3><p>${text}</p>`), 800);
            }
        }

        if (exercise.statPoints) {
            if (!char.statProgress) {
                char.statProgress = { kraft: 0, ausdauer: 0, beweglichkeit: 0, durchhaltevermoegen: 0, willenskraft: 0 };
            }

            for (const stat in exercise.statPoints) {
                const rawPoints = exercise.statPoints[stat];
                const points = stat === 'durchhaltevermoegen' ? rawPoints * durchhalteMultiplier : rawPoints;
                char.statProgress[stat] = (char.statProgress[stat] || 0) + points;

                const isWillpower = (stat === 'willenskraft');
                const threshold = isWillpower ? willpowerThresholds[difficulty] : mainStatThresholds[difficulty];

                if (char.statProgress[stat] >= threshold) {
                    char.stats[stat]++;
                    char.statProgress[stat] -= threshold;

                    const title = DQ_DATA.translations[lang].stat_increase_title;
                    let text = DQ_DATA.translations[lang].stat_increase_text.replace('{statName}', stat);
                    setTimeout(() => DQ_UI.showCustomPopup(`<h3>${title}</h3><p>${text}</p>`), 800);
                }
            }
        }

        return char;
    },

    levelUpCheck(char) {
        const getManaForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

        let leveledUp = false;
        while (char.mana >= char.manaToNextLevel) {
            const manaNeededForThisLevel = char.manaToNextLevel;
            char.mana -= manaNeededForThisLevel;
            char.level++;
            char.manaToNextLevel = getManaForLevel(char.level);
            leveledUp = true;
            console.log(`LEVEL UP! New Level: ${char.level}. Mana remaining: ${char.mana}. Next level needs: ${char.manaToNextLevel}`);
        }

        if (leveledUp) {
            setTimeout(() => DQ_UI.showCustomPopup(`LEVEL UP! <span class=\"material-symbols-rounded icon-accent\">rocket_launch</span> Du bist jetzt Level ${char.level}!`), 600);
        }

        return char;
    },

    applyDungeonResult(result) {
        // result: { outcome: 'win'|'loss', rewards?, finalPlayerHp }
        return new Promise((resolve, reject) => {
            try {
                const tx = DQ_DB.db.transaction(['character'], 'readwrite');
                const store = tx.objectStore('character');
                store.get(1).onsuccess = (e) => {
                    const char = e.target.result;
                    if (!char) { tx.abort(); return reject(new Error('Charakter nicht gefunden')); }

                    // Update HP persistently
                    if (!char.combat) char.combat = { attack: 0, protection: 0, hpMax: 100, hpCurrent: 100 };
                    char.combat.hpCurrent = Math.max(0, Math.min(char.combat.hpMax || 100, result.finalPlayerHp || char.combat.hpCurrent));

                    if (result.outcome === 'win' && result.rewards) {
                        char.mana += (result.rewards.xp || 0);

                        // Add mana stones as consumable items to inventory
                        const stonesToAdd = result.rewards.manaStones || 0;
                        if (stonesToAdd > 0) {
                            // Check current consumable count in inventory
                            const currentConsumables = char.inventory.filter(item => item.type === 'consumable').length;
                            const maxConsumables = 5;
                            const availableSlots = Math.max(0, maxConsumables - currentConsumables);

                            if (availableSlots <= 0) {
                                setTimeout(() => DQ_UI.showCustomPopup('Deine Tasche ist voll – du konntest die Mana-Steine nicht aufsammeln.'), 300);
                            } else {
                                const gain = Math.min(stonesToAdd, availableSlots);
                                // Create mana stone items and add to inventory (Mittlerer Mana-Stein)
                                for (let i = 0; i < gain; i++) {
                                    const manaStoneItem = {
                                        id: Date.now() + i, // Unique ID
                                        name: 'Mittlerer Mana-Stein',
                                        description: 'Stellt 250 Mana wieder her.',
                                        type: 'consumable',
                                        effect: { mana: 250 },
                                        cost: 280 // Same as shop price
                                    };
                                    char.inventory.push(manaStoneItem);
                                }
                                if (gain < stonesToAdd) {
                                    setTimeout(() => DQ_UI.showCustomPopup('Deine Tasche ist voll – einige Mana-Steine konnten nicht aufgesammelt werden.'), 300);
                                }
                            }
                        }
                        DQ_CONFIG.levelUpCheck(char);
                    }

                    store.put(char);
                };
                tx.oncomplete = () => resolve();
                tx.onerror = (ev) => reject(ev.target.error);
            } catch (e) {
                reject(e);
            }
        });
    },

    checkStreakCompletion() {
        const todayStr = this.getTodayString();
        const yesterdayStr = this.getYesterdayString();

        DQ_DB.db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').index('date').getAll(todayStr).onsuccess = (e) => {
            const quests = e.target.result;
            if (quests.length > 0 && quests.every(q => q.completed)) {
                let { streak, lastDate } = this.getStreakData();

                if (lastDate !== todayStr) {
                    streak = (lastDate === yesterdayStr) ? streak + 1 : 1;
                    this.setStreakData(streak, todayStr);
                    console.log(`Streak für heute vergeben: ${streak}.`);
                    DQ_UI.showCustomPopup(`Tages-Streak erhöht auf ${streak}!`);
                    this.updateStreakDisplay();
                }
            }
        };
    },

    async performQuestCompletion(questId) {
        await navigator.locks.request('quest-completion-lock', async () => {
            return new Promise((resolve, reject) => {
                const db = DQ_DB.db;
                const tx = db.transaction(['daily_quests', 'character'], 'readwrite');
                const questStore = tx.objectStore('daily_quests');
                const charStore = tx.objectStore('character');
                let finalCharState;

                tx.oncomplete = () => {
                    console.log('Transaktion erfolgreich abgeschlossen. Quest & Charakter gespeichert.');
                    resolve(finalCharState);
                };
                tx.onerror = (event) => {
                    console.error("Transaktion zum Quest-Abschluss fehlgeschlagen:", event.target.error);
                    reject(event.target.error);
                };

                const questRequest = questStore.get(questId);
                questRequest.onsuccess = () => {
                    const quest = questRequest.result;
                    if (!quest || quest.completed) {
                        tx.abort();
                        return reject(new Error("Quest bereits abgeschlossen oder nicht gefunden."));
                    }

                    const charRequest = charStore.get(1);
                    charRequest.onsuccess = () => {
                        let char = charRequest.result;
                        if (!char) {
                            tx.abort();
                            return reject(new Error("Charakter nicht gefunden."));
                        }

                        const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.nameKey === quest.nameKey);

                        quest.completed = true;
                        char.mana += quest.manaReward;
                        char.gold += quest.goldReward;
                        char.totalGoldEarned += quest.goldReward;
                        char.totalQuestsCompleted++;

                        char = this.processStatGains(char, exerciseTemplate);
                        char = this.levelUpCheck(char);

                        finalCharState = char;

                        questStore.put(quest);
                        charStore.put(char);
                    };
                };
            });
        });
    }
};

async function initializeApp() {
    try {
        console.log('Starting DailyQuest Initialization...');

        const elements = {
            pages: document.querySelectorAll('.page'),
            navButtons: document.querySelectorAll('.nav-button'),
            headerTitle: document.getElementById('header-title'),
            questList: document.getElementById('quest-list'),
            exerciseList: document.getElementById('exercise-list'),
            freeExerciseFilters: document.getElementById('free-exercise-filters'),
            characterSheetContainer: document.getElementById('character-sheet-container'),
            characterVitalsContainer: document.getElementById('character-vitals-container'),
            characterTabSwitcher: document.getElementById('character-tab-switcher'),
            equipmentContainer: document.getElementById('equipment-container'),
            inventoryContainer: document.getElementById('inventory-container'),
            shopTabSwitcher: document.getElementById('shop-tab-switcher'),
            shopFiltersEquipment: document.getElementById('shop-filters-equipment'),
            shopItemsEquipment: document.getElementById('shop-items-equipment'),
            popupOverlay: document.getElementById('popup-overlay'),
            infoPopup: document.getElementById('info-popup'),
            infoPopupContent: document.getElementById('info-popup-content'),
            notificationPopup: document.getElementById('notification-popup'),
            notificationPopupContent: document.getElementById('notification-popup-content'),
            settingsPopup: document.getElementById('settings-popup'),
            sellPopup: document.getElementById('sell-popup'),
            settingsButton: document.getElementById('settings-button'),
            languageSelect: document.getElementById('language-select'),
            themeToggle: document.getElementById('theme-toggle'),
            difficultySlider: document.getElementById('difficulty-slider'),
            difficultyValue: document.getElementById('difficulty-value'),
            goalSelect: document.getElementById('goal-select'),
            restdaysSelect: document.getElementById('restdays-select'),
            characterNameInput: document.getElementById('character-name-input'),
            exportDataButton: document.getElementById('export-data-button'),
            importDataInput: document.getElementById('import-data-input'),
            resetTutorialButton: document.getElementById('reset-tutorial-button'),
            pageExercises: document.getElementById('page-exercises'),
            extraQuestInactiveView: document.getElementById('extra-quest-inactive'),
            extraQuestActiveView: document.getElementById('extra-quest-active'),
            startExtraQuestButton: document.getElementById('start-extra-quest-button'),
            completeExtraQuestButton: document.getElementById('complete-extra-quest-button'),
            extraQuestTask: document.getElementById('extra-quest-task'),
            extraQuestCountdown: document.getElementById('extra-quest-countdown'),
            countdownProgressBar: document.getElementById('countdown-progress-bar'),
            achievementsButton: document.getElementById('achievements-button'),
            achievementsPopup: document.getElementById('achievements-popup'),
            achievementInfoPopup: document.getElementById('achievement-info-popup'),
            rewardPopup: document.getElementById('reward-popup'),
            rewardPopupTitle: document.getElementById('reward-popup-title'),
            rewardPopupContent: document.getElementById('reward-popup-content'),
            criticalErrorFallback: document.getElementById('critical-error-fallback'),
            weightTrackingToggle: document.getElementById('weight-tracking-toggle'),
            targetWeightInput: document.getElementById('target-weight-input'),
            weightDirectionSelect: document.getElementById('weight-direction-select'),
            weightTrackingSection: document.getElementById('weight-tracking-section'),
            addWeightEntryButton: document.getElementById('add-weight-entry-button'),
            addWeightPopup: document.getElementById('add-weight-popup'),
            weightTrackingOptions: document.getElementById('weight-tracking-options'),
            deleteWeightDataButton: document.getElementById('delete-weight-data-button'),
            searchExerciseButton: document.getElementById('search-exercise-button'),
            searchExercisePopup: document.getElementById('search-exercise-popup'),
            searchExerciseInput: document.getElementById('search-exercise-input'),
            searchExerciseConfirmButton: document.getElementById('search-exercise-confirm-button'),
            searchExerciseError: document.getElementById('search-exercise-error'),

            focusLabelPopup: document.getElementById('focus-label-popup'),
            newFocusLabelPopup: document.getElementById('new-focus-label-popup'),
            // --- NEU: Elemente für das Fokus-Belohnungs-Popup ---
            focusRewardPopup: document.getElementById('focus-reward-popup'),
            closeFocusRewardPopupButton: document.getElementById('close-focus-reward-popup-btn'),
            focusRewardMinutes: document.getElementById('focus-reward-minutes'),
            focusRewardGold: document.getElementById('focus-reward-gold'),
            focusRewardMana: document.getElementById('focus-reward-mana'),
            focusRewardStatsContainer: document.getElementById('focus-reward-stats-container')
        };
        elements.allPopups = Array.from(document.querySelectorAll('.popup'));

        await DQ_DB.init();

        DQ_UI.init(elements);
        DQ_CHARACTER_MAIN.init(elements);
        DQ_STATS.init(elements);
        DQ_INVENTORY.init(elements);
        DQ_EXERCISES.init(elements);
        DQ_SHOP.init(elements);
        DQ_EXTRA.init(elements);
        DQ_ACHIEVEMENTS.init(elements);
        DQ_FOKUS_MAIN.init(elements);

        // Cache den Charakterzustand grob für Combat (Sync Zugriff)
        try {
            const char = await DQ_CONFIG.getCharacter();
            if (char) {
                // Calculate equipment stats
                const equipmentStats = DQ_INVENTORY.calculateEquipmentStats(char);
                const combat = {
                    attack: equipmentStats.angriff || 0,
                    protection: equipmentStats.schutz || 0,
                    hpMax: (char.combat && typeof char.combat.hpMax === 'number') ? char.combat.hpMax : 100,
                    hpCurrent: (char.combat && typeof char.combat.hpCurrent === 'number') ? char.combat.hpCurrent : 100
                };
                window.__dq_cached_char__ = { combat };
            }
        } catch (e) { console.warn('Combat cache init failed', e); }

        addSettingsListeners(elements);

        await loadInitialData();

        DQ_UI.applyTranslations();

        DQ_EXERCISES.renderQuests();
        DQ_EXERCISES.renderFreeExercisesPage();

        console.log('All initializations complete. App is ready.');
        window.appReady = true;

        // Tutorial-Check: Prüfen ob Tutorial bereits abgespielt wurde
        await checkAndStartTutorial();

    } catch (error) {
        console.error("Ein kritischer Fehler ist während der App-Initialisierung aufgetreten:", error);
        const fallback = document.getElementById('critical-error-fallback');
        if (fallback) {
            fallback.classList.add('visible');
        }
    }
}

async function loadInitialData() {
    await loadSettings();
    const char = await initializeCharacter();
    await DQ_VIBE_STATE.loadState();
    await populateInitialDataIfNeeded(); // NEUER ZENTRALER AUFRUF
    await checkForPenaltyAndReset();
    if (char) {
        await DQ_ACHIEVEMENTS.checkAllAchievements(char);
    }
    startDailyCheckTimer();
}

async function populateInitialDataIfNeeded() {
    const tx = DQ_DB.db.transaction(['exercises', 'shop'], 'readwrite');
    const exerciseStore = tx.objectStore('exercises');
    const shopStore = tx.objectStore('shop');

    const exerciseCount = await new Promise(res => exerciseStore.count().onsuccess = e => res(e.target.result));
    if (exerciseCount === 0) {
        console.log("Datenbank für 'Freies Training' ist leer. Fülle sie...");
        const allExercises = Object.entries(DQ_DATA.exercisePool).flatMap(([category, exercises]) =>
            exercises.map(ex => ({
                id: ex.id, nameKey: ex.nameKey, type: ex.type, baseValue: ex.baseValue,
                manaReward: ex.mana, goldReward: ex.gold, category: category
            }))
        );
        allExercises.forEach(ex => { if (ex.id) exerciseStore.add(ex); });
    } else {
        // Check for new exercises and add them if they don't exist
        console.log("Überprüfe auf neue Übungen...");
        const allExercises = Object.entries(DQ_DATA.exercisePool).flatMap(([category, exercises]) =>
            exercises.map(ex => ({
                id: ex.id, nameKey: ex.nameKey, type: ex.type, baseValue: ex.baseValue,
                manaReward: ex.mana, goldReward: ex.gold, category: category
            }))
        );

        for (const exercise of allExercises) {
            if (exercise.id) {
                try {
                    await new Promise((resolve, reject) => {
                        const request = exerciseStore.get(exercise.id);
                        request.onsuccess = () => {
                            if (!request.result) {
                                // Exercise doesn't exist, add it
                                exerciseStore.add(exercise);
                                console.log(`Neue Übung hinzugefügt: ${exercise.nameKey}`);
                            }
                            resolve();
                        };
                        request.onerror = reject;
                    });
                } catch (error) {
                    console.error(`Fehler beim Hinzufügen der Übung ${exercise.nameKey}:`, error);
                }
            }
        }
    }

    const shopCount = await new Promise(res => shopStore.count().onsuccess = e => res(e.target.result));
    if (shopCount === 0) {
        console.log("Datenbank für 'Shop' ist leer. Fülle sie...");
        const newShopItems = [
            { id: 101, name: 'Trainings-Schwert', description: '+5 Angriff', cost: 100, type: 'weapon', bonus: { angriff: 5 } }, { id: 102, name: 'Stahl-Klinge', description: '+15 Angriff', cost: 400, type: 'weapon', bonus: { angriff: 15 } }, { id: 103, name: 'Ninja-Sterne', description: '+25 Angriff', cost: 850, type: 'weapon', bonus: { angriff: 25 } }, { id: 104, name: 'Meister-Hantel', description: 'Legendär. +40 Angriff', cost: 1500, type: 'weapon', bonus: { angriff: 40 } }, { id: 105, name: 'Magier-Stab', description: 'Episch. +60 Angriff', cost: 2500, type: 'weapon', bonus: { angriff: 60 } }, { id: 106, name: 'Himmels-Speer', description: 'Mythisch. +85 Angriff', cost: 4000, type: 'weapon', bonus: { angriff: 85 } }, { id: 107, name: 'Dämonen-Klinge', description: 'Verflucht. +120 Angriff', cost: 6500, type: 'weapon', bonus: { angriff: 120 } }, { id: 108, name: 'Götter-Hammer', description: 'Göttlich. +175 Angriff', cost: 10000, type: 'weapon', bonus: { angriff: 175 } },
            { id: 201, name: 'Leder-Bandagen', description: '+5 Schutz', cost: 100, type: 'armor', bonus: { schutz: 5 } }, { id: 202, name: 'Kettenhemd', description: '+15 Schutz', cost: 400, type: 'armor', bonus: { schutz: 15 } }, { id: 203, name: 'Spiegel-Schild', description: '+25 Schutz', cost: 850, type: 'armor', bonus: { schutz: 25 } }, { id: 204, 'name': 'Titan-Panzer', description: 'Legendär. +40 Schutz', cost: 1500, type: 'armor', bonus: { schutz: 40 } }, { id: 205, name: 'Drachenhaut-Robe', description: 'Episch. +60 Schutz', cost: 2500, type: 'armor', bonus: { schutz: 60 } }, { id: 206, name: 'Runen-Weste', description: 'Mythisch. +85 Schutz', cost: 4000, type: 'armor', bonus: { schutz: 85 } }, { id: 207, name: 'Kristall-Harnisch', description: 'Unzerbrechlich. +120 Schutz', cost: 6500, type: 'armor', bonus: { schutz: 120 } }, { id: 208, name: 'Unverwundbarkeits-Aura', description: 'Göttlich. +175 Schutz', cost: 10000, type: 'armor', bonus: { schutz: 175 } },
            { id: 301, name: 'Kleiner Mana-Stein', description: 'Stellt 50 Mana wieder her.', cost: 65, type: 'consumable', effect: { mana: 50 } }, { id: 302, name: 'Mittlerer Mana-Stein', description: 'Stellt 250 Mana wieder her.', cost: 280, type: 'consumable', effect: { mana: 250 } }, { id: 303, name: 'Großer Mana-Stein', description: 'Stellt 1000 Mana wieder her.', cost: 960, type: 'consumable', effect: { mana: 1000 } }
        ];
        newShopItems.forEach(item => shopStore.add(item));
    }

    shopStore.put({
        id: 401,
        name: 'Streak Freeze',
        description: 'Rettet deine Streak einmal, wenn du einen Tag verpasst.',
        cost: 3000,
        type: 'streak_freeze',
        iconSymbol: 'ac_unit'
    });

    return new Promise(res => tx.oncomplete = res);
}


function updateDifficultySliderStyle(slider) {
    const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const trackColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-container-high').trim();
    slider.style.background = `linear-gradient(to right, ${primaryColor} ${percentage}%, ${trackColor} ${percentage}%)`;
}

function addSettingsListeners(elements) {
    elements.settingsButton.addEventListener('click', () => {
        updateSettingsUI();
    });

    elements.languageSelect.addEventListener('change', (e) => saveSetting('language', e.target.value));
    elements.themeToggle.addEventListener('change', (e) => saveSetting('theme', e.target.checked ? 'light' : 'dark'));
    elements.characterNameInput.addEventListener('change', (e) => saveSetting('name', e.target.value));

    elements.difficultySlider.addEventListener('input', (e) => {
        elements.difficultyValue.textContent = e.target.value;
        updateDifficultySliderStyle(e.target);
    });

    elements.difficultySlider.addEventListener('change', async (e) => {
        await saveSetting('difficulty', parseInt(e.target.value, 10));
        await generateDailyQuestsIfNeeded(true);
        DQ_EXERCISES.renderQuests();
    });

    elements.goalSelect.addEventListener('change', async (e) => {
        await saveSetting('goal', e.target.value);
        await generateDailyQuestsIfNeeded(true);
        DQ_EXERCISES.renderQuests();
    });

    elements.restdaysSelect.addEventListener('change', async (e) => {
        await saveSetting('restDays', parseInt(e.target.value, 10));
        await generateDailyQuestsIfNeeded(true);
        DQ_EXERCISES.renderQuests();
    });

    elements.weightTrackingToggle.addEventListener('change', (e) => {
        saveSetting('weightTrackingEnabled', e.target.checked);
        elements.weightTrackingOptions.style.display = e.target.checked ? 'block' : 'none';
    });
    elements.targetWeightInput.addEventListener('change', (e) => saveSetting('targetWeight', parseFloat(e.target.value) || null));
    elements.weightDirectionSelect.addEventListener('change', (e) => saveSetting('weightDirection', e.target.value));
    elements.deleteWeightDataButton.addEventListener('click', deleteWeightData);

    elements.exportDataButton.addEventListener('click', exportData);
    elements.importDataInput.addEventListener('change', importData);
    elements.resetTutorialButton.addEventListener('click', resetTutorialAndIntro);
}

async function deleteWeightData() {
    if (!confirm("Bist du sicher, dass du alle deine Gewichtseinträge unwiderruflich löschen möchtest?")) {
        return;
    }

    try {
        const tx = DQ_DB.db.transaction('weight_entries', 'readwrite');
        const store = tx.objectStore('weight_entries');
        store.clear();
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
        DQ_UI.showCustomPopup("Alle Gewichtsdaten wurden gelöscht.");
        DQ_CHARACTER_MAIN.renderPage();
    } catch (error) {
        console.error("Fehler beim Löschen der Gewichtsdaten:", error);
        DQ_UI.showCustomPopup("Löschen fehlgeschlagen.", 'penalty');
    }
}

async function resetTutorialAndIntro() {
    if (!confirm("Möchtest du das Intro und Tutorial wirklich neu starten? Dies löscht nur den Tutorial-Fortschritt, nicht deine Spieldaten.")) {
        return;
    }

    try {
        console.log('Setze Tutorial-Status zurück...');

        // Tutorial-State in IndexedDB zurücksetzen
        if (typeof DQ_TUTORIAL_STATE !== 'undefined') {
            await DQ_TUTORIAL_STATE.resetTutorial();
        }

        DQ_UI.showCustomPopup('Tutorial wurde zurückgesetzt. Die App wird nun neu geladen.');

        // Kurze Verzögerung damit Popup sichtbar ist
        setTimeout(() => {
            // Seite neu laden um Tutorial zu starten
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('Fehler beim Zurücksetzen des Tutorials:', error);
        DQ_UI.showCustomPopup('Fehler beim Zurücksetzen. Bitte versuche es erneut.', 'penalty');
    }
}

function saveSetting(key, value) {
    return new Promise(resolve => {
        const characterSettings = ['name', 'weightTrackingEnabled', 'targetWeight', 'weightDirection'];

        if (characterSettings.includes(key)) {
            const tx = DQ_DB.db.transaction(['character'], 'readwrite');
            const store = tx.objectStore('character');
            store.get(1).onsuccess = (e) => {
                const char = e.target.result;
                if (char) {
                    if (key === 'name') {
                        char.name = value || "Unknown Hunter";
                    } else {
                        char[key] = value;
                    }
                    store.put(char);
                }
            };
            tx.oncomplete = () => {
                if (key === 'name' || key === 'weightTrackingEnabled') {
                    DQ_CHARACTER_MAIN.renderPage();
                }
                resolve();
            };
        } else {
            DQ_CONFIG.userSettings[key] = value;
            const tx = DQ_DB.db.transaction(['settings'], 'readwrite');
            tx.objectStore('settings').put(DQ_CONFIG.userSettings);
            tx.oncomplete = () => {
                if (key === 'language') {
                    DQ_UI.applyTranslations();
                    DQ_EXERCISES.renderQuests();
                    DQ_EXERCISES.renderFreeExercisesPage();
                }
                if (key === 'theme') {
                    DQ_UI.applyTheme();
                    const difficultySlider = document.getElementById('difficulty-slider');
                    if (difficultySlider) {
                        setTimeout(() => updateDifficultySliderStyle(difficultySlider), 50);
                    }
                }
                if (key === 'difficulty') DQ_EXERCISES.renderFreeExercisesPage();
                resolve();
            };
        }
    });
}

function loadSettings() {
    return new Promise(resolve => {
        const tx = DQ_DB.db.transaction(['settings'], 'readwrite');
        tx.objectStore('settings').get(1).onsuccess = (e) => {
            if (e.target.result) {
                DQ_CONFIG.userSettings = e.target.result;
            } else {
                DQ_CONFIG.userSettings = { id: 1, language: 'de', theme: 'dark', difficulty: 3, goal: 'muscle', restDays: 2 };
                tx.objectStore('settings').add(DQ_CONFIG.userSettings);
            }
            updateSettingsUI();
            DQ_UI.applyTheme();
            resolve();
        };
        tx.onerror = () => resolve();
    });
}

function updateSettingsUI() {
    const elements = DQ_UI.elements;
    elements.languageSelect.value = DQ_CONFIG.userSettings.language || 'de';
    elements.themeToggle.checked = (DQ_CONFIG.userSettings.theme === 'light');
    elements.difficultySlider.value = DQ_CONFIG.userSettings.difficulty || 3;
    elements.difficultyValue.textContent = DQ_CONFIG.userSettings.difficulty || 3;
    elements.goalSelect.value = DQ_CONFIG.userSettings.goal || 'muscle';
    elements.restdaysSelect.value = DQ_CONFIG.userSettings.restDays || 2;

    updateDifficultySliderStyle(elements.difficultySlider);

    DQ_DB.db.transaction('character', 'readonly').objectStore('character').get(1).onsuccess = e => {
        if (e.target.result) {
            const char = e.target.result;
            elements.characterNameInput.value = char.name;
            elements.weightTrackingToggle.checked = char.weightTrackingEnabled;
            elements.targetWeightInput.value = char.targetWeight || '';
            elements.weightDirectionSelect.value = char.weightDirection || 'lose';
            elements.weightTrackingOptions.style.display = char.weightTrackingEnabled ? 'block' : 'none';
        }
    };
}

async function generateDailyQuestsIfNeeded(forceRegenerate = false) {
    const todayStr = DQ_CONFIG.getTodayString();
    const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
    const store = tx.objectStore('daily_quests');
    const index = store.index('date');

    const questsToday = await new Promise(res => index.getAll(todayStr).onsuccess = e => res(e.target.result));

    if (questsToday.length > 0 && !forceRegenerate) {
        return;
    }

    if (questsToday.length > 0 && forceRegenerate) {
        console.log("Erzwinge Neugenerierung: Lösche alte Quests für heute...");
        await Promise.all(questsToday.map(q => new Promise(res => store.delete(q.questId).onsuccess = res)));
    }

    let goal = DQ_CONFIG.userSettings.goal || 'muscle';
    if (goal !== 'sick') {
        const dayOfWeek = new Date().getDay();
        const numRestDays = DQ_CONFIG.userSettings.restDays || 0;
        let activeRestDays = [];
        switch (parseInt(numRestDays)) {
            case 1: activeRestDays = [0]; break;
            case 2: activeRestDays = [2, 6]; break;
            case 3: activeRestDays = [0, 2, 4]; break;
        }
        if (activeRestDays.includes(dayOfWeek)) {
            goal = 'restday';
            console.log("Heute ist ein Rest Day! Generiere Erholungs-Quests.");
        }
    }

    console.log(`Generiere neue Quests für das Ziel: ${goal}`);
    const pool = [...(DQ_DATA.exercisePool[goal] || DQ_DATA.exercisePool['muscle'])];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const questCount = (goal === 'restday' || goal === 'sick') ? 5 : 6;
    const newQuests = pool.slice(0, questCount).filter(Boolean);

    const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
    newQuests.forEach(questTemplate => {
        let targetValue = questTemplate.baseValue;
        if (questTemplate.type !== 'check' && questTemplate.type !== 'link' && questTemplate.type !== 'focus') {
            targetValue = Math.ceil(questTemplate.baseValue + (questTemplate.baseValue * 0.4 * (difficulty - 1)));
        }
        const quest = {
            date: todayStr, nameKey: questTemplate.nameKey, type: questTemplate.type, target: targetValue,
            manaReward: Math.ceil(questTemplate.mana * (1 + 0.2 * (difficulty - 1))),
            goldReward: Math.ceil(questTemplate.gold * (1 + 0.15 * (difficulty - 1))),
            completed: false, goal: goal
        };
        store.add(quest);
    });

    return new Promise(resolve => {
        tx.oncomplete = () => {
            console.log("Neue Quests erfolgreich generiert und gespeichert.");
            resolve();
        };
        tx.onerror = (e) => {
            console.error("Fehler bei der Quest-Generierungstransaktion:", e.target.error);
            resolve();
        };
    });
}

function initializeCharacter() {
    return new Promise(resolve => {
        const tx = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = tx.objectStore('character');
        let char;
        store.get(1).onsuccess = (e) => {
            char = e.target.result;
            if (!char) {
                char = {
                    id: 1, name: 'Unknown Hunter', level: 1, mana: 0, manaToNextLevel: 100, gold: 200,
                    stats: { kraft: 5, ausdauer: 5, beweglichkeit: 5, durchhaltevermoegen: 5, willenskraft: 5 },
                    statProgress: { kraft: 0, ausdauer: 0, beweglichkeit: 0, durchhaltevermoegen: 0, willenskraft: 0 },
                    equipment: { weapons: [], armor: null }, inventory: [],
                    manaStones: 0,
                    weightTrackingEnabled: true,
                    targetWeight: null,
                    weightDirection: 'lose',
                    combat: { attack: 0, protection: 0, hpMax: 100, hpCurrent: 100 },
                    achievements: {
                        level: { tier: 0, claimable: false }, quests: { tier: 0, claimable: false },
                        gold: { tier: 0, claimable: false }, shop: { tier: 0, claimable: false },
                        strength: { tier: 0, claimable: false },
                        streak: { tier: 0, claimable: false }
                    },
                    totalGoldEarned: 200, totalQuestsCompleted: 0, totalItemsPurchased: 0
                };
                store.add(char);
            }
            tx.oncomplete = () => {
                DQ_CHARACTER_MAIN.renderPage();
                resolve(char);
            };
        };
    });
}

function startDailyCheckTimer() {
    if (DQ_CONFIG.dailyCheckInterval) clearInterval(DQ_CONFIG.dailyCheckInterval);
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const msUntilMidnight = tomorrow - now;
    setTimeout(() => {
        checkForPenaltyAndReset();
        DQ_CONFIG.dailyCheckInterval = setInterval(checkForPenaltyAndReset, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

async function checkForPenaltyAndReset() {
    const todayStr = DQ_CONFIG.getTodayString();
    const lastCheck = localStorage.getItem('lastPenaltyCheck');
    if (lastCheck === todayStr) {
        console.log("Tägliche Prüfung für heute bereits abgeschlossen. Überspringe...");
        await generateDailyQuestsIfNeeded();
        return;
    }
    localStorage.setItem('lastPenaltyCheck', todayStr);
    console.log("Starte tägliche Prüfung für Strafen und Resets...");

    return new Promise(async (resolve) => {
        const tx = DQ_DB.db.transaction(['extra_quest', 'character', 'daily_quests'], 'readwrite');

        tx.onerror = () => {
            console.error("Fehler bei der täglichen Prüfungs-Transaktion.");
            resolve();
        };

        const extraQuestStore = tx.objectStore('extra_quest');
        const charStore = tx.objectStore('character');
        const questStore = tx.objectStore('daily_quests');
        let char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const oldDateStr = twoDaysAgo.toISOString().split('T')[0];
        const keyRange = IDBKeyRange.upperBound(oldDateStr);
        questStore.index('date').openKeyCursor(keyRange).onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                questStore.delete(cursor.primaryKey);
                cursor.continue();
            }
        };


        if (!char) {
            tx.oncomplete = async () => {
                await generateDailyQuestsIfNeeded();
                resolve();
            }
            return;
        }

        const getManaForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
        let charModified = false;
        let penaltyReason = null;

        const yesterdayStr = DQ_CONFIG.getYesterdayString();
        const yesterdaysQuests = await new Promise(res => questStore.index('date').getAll(yesterdayStr).onsuccess = e => res(e.target.result));

        if (yesterdaysQuests.length > 0 && !yesterdaysQuests.every(q => q.completed)) {
            const freezeIndex = Array.isArray(char.inventory)
                ? char.inventory.findIndex(invItem => invItem && invItem.type === 'streak_freeze')
                : -1;

            if (freezeIndex !== -1) {
                char.inventory.splice(freezeIndex, 1);
                charModified = true;
                const { streak } = DQ_CONFIG.getStreakData();
                if (typeof streak === 'number' && streak > 0) {
                    DQ_CONFIG.setStreakData(streak, yesterdayStr);
                }

                penaltyReason = 'freeze';
            } else {
                DQ_CONFIG.setStreakData(0, null);
                if (char.level > 1) {
                    char.level -= 1;
                    char.manaToNextLevel = getManaForLevel(char.level);
                    charModified = true;
                }
                penaltyReason = 'daily';
            }
        }

        const extraQuest = await new Promise(res => extraQuestStore.get(1).onsuccess = e => res(e.target.result));
        if (extraQuest && new Date(extraQuest.deadline) < new Date() && !extraQuest.completed) {
            if (char.level > 1) char.level -= 1;
            char.manaToNextLevel = getManaForLevel(char.level);
            char.gold = Math.max(0, char.gold - 150);
            Object.keys(char.stats).forEach(key => char.stats[key] = Math.max(1, char.stats[key] - (key === 'willenskraft' ? 3 : 1)));
            charModified = true;
            penaltyReason = 'extra';
            await new Promise(res => extraQuestStore.delete(1).onsuccess = res);
        }

        if (charModified) {
            await new Promise(res => charStore.put(char).onsuccess = res);
        }

        tx.oncomplete = async () => {
            if (penaltyReason) {
                const lang = DQ_CONFIG.userSettings.language || 'de';
                if (penaltyReason === 'daily') {
                    DQ_UI.showCustomPopup(`<h3>${DQ_DATA.translations[lang].penalty_title}</h3><p>${DQ_DATA.translations[lang].penalty_text}</p>`, 'penalty');
                } else if (penaltyReason === 'freeze') {
                    const title = DQ_DATA.translations[lang].streak_freeze_saved_title || 'Streak gerettet';
                    const text = DQ_DATA.translations[lang].streak_freeze_saved_text || 'Ein Streak Freeze hat deine Streak vor dem Verlust bewahrt.';
                    DQ_UI.showCustomPopup(`<h3>${title}</h3><p><span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 6px;">ac_unit</span>${text}</p>`);
                } else if (penaltyReason === 'extra') {
                    DQ_UI.showCustomPopup(`<h3>${DQ_DATA.translations[lang].extra_penalty_title}</h3><p>${DQ_DATA.translations[lang].extra_penalty_text}</p>`, 'penalty');
                }
            }

            await generateDailyQuestsIfNeeded(true);
            DQ_CHARACTER_MAIN.renderPage();
            DQ_EXTRA.renderExtraQuestPage();
            DQ_CONFIG.updateStreakDisplay();
            resolve();
        };
    });
}

async function exportData() {
    if (!DQ_DB.db) return;
    try {
        const dataToExport = {};
        const storeNames = Array.from(DQ_DB.db.objectStoreNames);
        const tx = DQ_DB.db.transaction(storeNames, 'readonly');
        const promises = storeNames.map(storeName => new Promise((resolve, reject) => {
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve({ name: storeName, data: request.result });
            request.onerror = (event) => reject(new Error(`Error exporting ${storeName}: ${event.target.error}`));
        }));
        const results = await Promise.all(promises);
        results.forEach(result => dataToExport[result.name] = result.data);
        dataToExport.streakData = DQ_CONFIG.getStreakData();

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dailyquest-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        DQ_UI.showCustomPopup("Daten erfolgreich exportiert!");
    } catch (error) {
        console.error("Export failed:", error);
        DQ_UI.showCustomPopup(`Datenexport fehlgeschlagen: ${error.message}`, 'penalty');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("WARNUNG: Dies wird alle Ihre aktuellen Daten überschreiben und die Seite neu laden. Sind Sie sicher?")) {
        DQ_UI.elements.importDataInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.character || !data.settings) throw new Error("Ungültige Backup-Datei.");

            if (data.streakData) {
                let { streak, lastDate } = data.streakData;
                if (streak > 0 && !lastDate) lastDate = DQ_CONFIG.getYesterdayString();
                DQ_CONFIG.setStreakData(streak, lastDate);
            } else {
                localStorage.removeItem('streakData');
            }

            const storeNames = Array.from(DQ_DB.db.objectStoreNames);
            const tx = DQ_DB.db.transaction(storeNames, 'readwrite');
            tx.oncomplete = () => {
                alert("Daten erfolgreich importiert! Die App wird jetzt neu geladen.");
                location.reload();
            };
            tx.onerror = (event) => { throw new Error("Fehler beim Schreiben in die Datenbank: " + event.target.error); };

            for (const storeName of storeNames) {
                await new Promise((resolve, reject) => {
                    const req = tx.objectStore(storeName).clear();
                    req.onsuccess = resolve;
                    req.onerror = () => reject(req.error);
                });
                if (data[storeName]) {
                    for (const item of data[storeName]) {
                        await new Promise((resolve, reject) => {
                            const req = tx.objectStore(storeName).put(item);
                            req.onsuccess = resolve;
                            req.onerror = () => reject(req.error);
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Import failed:", error);
            alert("Import fehlgeschlagen: " + error.message);
        } finally {
            DQ_UI.elements.importDataInput.value = '';
        }
    };
    reader.readAsText(file);
}

/**
 * Prüft ob das Tutorial bereits abgespielt wurde und startet es falls nötig
 */
async function checkAndStartTutorial() {
    try {
        // Prüfen ob Tutorial bereits abgeschlossen wurde
        const tutorialCompleted = await DQ_TUTORIAL_STATE.hasCompletedTutorial();

        if (!tutorialCompleted) {
            console.log('Tutorial wurde noch nicht abgeschlossen - starte Tutorial');
            // Tutorial starten
            await DQ_TUTORIAL_MAIN.start();
        } else {
            console.log('Tutorial wurde bereits abgeschlossen');

            // STARKER FIX: Overlay komplett aus DOM entfernen
            const overlay = document.getElementById('tutorial-overlay');
            if (overlay) {
                overlay.remove(); // Komplett entfernen, nicht nur verstecken
                console.log('Tutorial-Overlay wurde entfernt (bereits abgeschlossen)');
            }

            // FIX: Auch den pulsierenden Hintergrund entfernen
            const pulseContainer = document.querySelector('.background-pulse-container');
            if (pulseContainer) {
                pulseContainer.remove();
                console.log('Pulse-Container wurde entfernt (bereits abgeschlossen)');
            }

            // WICHTIG: App-Inhalt sichtbar machen, da er standardmäßig opacity: 0 hat
            if (typeof DQ_TUTORIAL_MAIN !== 'undefined' && typeof DQ_TUTORIAL_MAIN.showAppContent === 'function') {
                DQ_TUTORIAL_MAIN.showAppContent();
                console.log('App-Content wurde sichtbar gemacht.');
            } else {
                // Fallback falls DQ_TUTORIAL_MAIN nicht verfügbar ist
                document.getElementById('app-container').style.opacity = '1';
                document.getElementById('app-header').style.opacity = '1';
                document.getElementById('bottom-nav').style.opacity = '1';
            }
        }
    } catch (error) {
        console.error('Fehler beim Tutorial-Check:', error);
        // Bei Fehler: Tutorial nicht starten, App normal weiterlaufen lassen
        // Aber Overlay trotzdem entfernen
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.remove();
        }
        const pulseContainer = document.querySelector('.background-pulse-container');
        if (pulseContainer) {
            pulseContainer.remove();
        }
        // Auch bei Fehler App sichtbar machen
        document.getElementById('app-container').style.opacity = '1';
        document.getElementById('app-header').style.opacity = '1';
        document.getElementById('bottom-nav').style.opacity = '1';
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
