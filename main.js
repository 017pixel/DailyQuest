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
        const loadFactor = Math.max(0.5, Math.min(3, exercise.loadFactor || 1));

        const mainStatThresholds = { 1: 5.5, 2: 5, 3: 4.5, 4: 4, 5: 3.5 };
        const willpowerThresholds = { 1: 4.5, 2: 4, 3: 3.5, 4: 3, 5: 2.5 };

        if (exercise.directStatGain) {
            for (const stat in exercise.directStatGain) {
                const rawGain = exercise.directStatGain[stat];
                const gain = (stat === 'durchhaltevermoegen' ? rawGain * durchhalteMultiplier : rawGain) * loadFactor;
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
                const points = (stat === 'durchhaltevermoegen' ? rawPoints * durchhalteMultiplier : rawPoints) * loadFactor;
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
        // Level 20 beim Mana-Cap – ab Level 20 bleibt das Mana-Requirement konstant
        const MAX_MANA_LEVEL_CAP = 20;
        const getManaForLevel = (level) => Math.floor(100 * Math.pow(1.5, Math.min(level, MAX_MANA_LEVEL_CAP) - 1));


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
                let quest = null;

                tx.oncomplete = () => {
                    console.log('Transaktion erfolgreich abgeschlossen. Quest & Charakter gespeichert.');
                    if (typeof DQ_TRAINING_SYSTEM !== 'undefined' && quest) {
                        DQ_TRAINING_SYSTEM.recordQuestActivity(quest, { age: finalCharState?.age ?? null }).catch(() => { });
                    }
                    resolve(finalCharState);
                };
                tx.onerror = (event) => {
                    console.error("Transaktion zum Quest-Abschluss fehlgeschlagen:", event.target.error);
                    reject(event.target.error);
                };

                const questRequest = questStore.get(questId);
                questRequest.onsuccess = () => {
                    quest = questRequest.result;
                    if (!quest || quest.completed) {
                        tx.abort();
                        return reject(new Error("Quest bereits abgeschlossen oder nicht gefunden."));
                    }

                    if (quest.completionMode === 'sets' && (!Array.isArray(quest.setProgress) || !quest.setProgress.length || !quest.setProgress.every(Boolean))) {
                        tx.abort();
                        return reject(new Error('Alle Sets müssen abgeschlossen sein.'));
                    }

                    if (quest.completionMode === 'log' && !quest.enduranceLog) {
                        tx.abort();
                        return reject(new Error('Ausdauer-Daten müssen zuerst eingetragen werden.'));
                    }

                    const charRequest = charStore.get(1);
                    charRequest.onsuccess = () => {
                        let char = charRequest.result;
                        if (!char) {
                            tx.abort();
                            return reject(new Error("Charakter nicht gefunden."));
                        }

                        const exerciseTemplate = Object.values(DQ_DATA.exercisePool).flat().find(ex => ex.nameKey === quest.nameKey);
                        const effectiveExerciseTemplate = exerciseTemplate ? {
                            ...exerciseTemplate,
                            loadFactor: quest.loadFactor || 1
                        } : null;

                        quest.completed = true;
                        char.mana += quest.manaReward;
                        char.gold += quest.goldReward;
                        char.totalGoldEarned += quest.goldReward;
                        char.totalQuestsCompleted++;

                        char = this.processStatGains(char, effectiveExerciseTemplate);
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

const APP_VERSION = '2.5.4';
const APP_UPDATE_FLAG_KEY = 'dq_seen_app_version';

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
            trainingPhaseBanner: document.getElementById('training-phase-banner'),
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
            characterAgeInput: document.getElementById('character-age-input'),
            equipmentToggle: document.getElementById('equipment-toggle'),
            phaseRepeatButton: document.getElementById('phase-repeat-button'),
            phaseSkipButton: document.getElementById('phase-skip-button'),
            phaseExtendButton: document.getElementById('phase-extend-button'),
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
            enduranceEntryPopup: document.getElementById('endurance-entry-popup'),
            enduranceDistanceInput: document.getElementById('endurance-distance-input'),
            enduranceDurationInput: document.getElementById('endurance-duration-input'),
            endurancePowerInput: document.getElementById('endurance-power-input'),
            enduranceNotesInput: document.getElementById('endurance-notes-input'),
            enduranceEntrySaveButton: document.getElementById('endurance-entry-save-button'),
            enduranceEntryCancelButton: document.getElementById('endurance-entry-cancel-button'),

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

        if (DQ_CONFIG.pendingUpdateNotice) {
            await showUpdateNotice();
            DQ_CONFIG.pendingUpdateNotice = false;
        }

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
    await handlePostUpdateMigration();
    const char = await initializeCharacter();
    await DQ_VIBE_STATE.loadState();
    await populateInitialDataIfNeeded(); // NEUER ZENTRALER AUFRUF
    await migrateItemNames(); // Migration für Namensänderungen
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
            { id: 201, name: 'Leder-Bandagen', description: '+5 Schutz', cost: 100, type: 'armor', bonus: { schutz: 5 } }, { id: 202, name: 'Kettenhemd', description: '+15 Schutz', cost: 400, type: 'armor', bonus: { schutz: 15 } }, { id: 203, name: 'Spiegel-Schild', description: '+25 Schutz', cost: 850, type: 'armor', bonus: { schutz: 25 } }, { id: 204, 'name': 'Titan-Panzer', description: 'Legendär. +40 Schutz', cost: 1500, type: 'armor', bonus: { schutz: 40 } }, { id: 205, name: 'Drachenrobe', description: 'Episch. +60 Schutz', cost: 2500, type: 'armor', bonus: { schutz: 60 } }, { id: 206, name: 'Runen-Weste', description: 'Mythisch. +85 Schutz', cost: 4000, type: 'armor', bonus: { schutz: 85 } }, { id: 207, name: 'Kristall-Harnisch', description: 'Unzerbrechlich. +120 Schutz', cost: 6500, type: 'armor', bonus: { schutz: 120 } }, { id: 208, name: 'Götter-Aura', description: 'Göttlich. +175 Schutz', cost: 10000, type: 'armor', bonus: { schutz: 175 } },
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


async function migrateItemNames() {
    const db = DQ_DB.db;
    if (!db) return;

    const migrations = [
        { id: 205, oldName: 'Drachenhaut-Robe', newName: 'Drachenrobe' },
        { id: 208, oldName: 'Unverwundbarkeits-Aura', newName: 'Götter-Aura' }
    ];

    const tx = db.transaction(['shop', 'character'], 'readwrite');
    const shopStore = tx.objectStore('shop');
    const charStore = tx.objectStore('character');

    const emojiRegex = (() => {
        try {
            return /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
        } catch {
            return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu;
        }
    })();
    const stripEmojis = (value) => {
        if (typeof value !== 'string') return value;
        return value.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim();
    };

    // 1. Shop-Items aktualisieren
    shopStore.getAll().onsuccess = (e) => {
        const items = e.target.result;
        if (items) {
            items.forEach(item => {
                let changed = false;
                
                // Bekannte Namensänderungen
                const migration = migrations.find(m => m.id === item.id);
                if (migration && item.name === migration.oldName) {
                    item.name = migration.newName;
                    changed = true;
                }

                // Emojis aus Namen entfernen
                const cleanedName = stripEmojis(item.name);
                if (cleanedName !== item.name) {
                    item.name = cleanedName;
                    changed = true;
                }

                if (changed) {
                    shopStore.put(item);
                    console.log(`Shop-Item ${item.id} aktualisiert/migriert.`);
                }
            });
        }
    };

    // 2. Charakter-Inventar und Ausrüstung aktualisieren
    charStore.get(1).onsuccess = (e) => {
        const char = e.target.result;
        if (!char) return;

        let changed = false;

        const cleanItem = (item) => {
            let itemChanged = false;
            // Bekannte Namensänderungen
            const migration = migrations.find(m => m.id === item.id);
            if (migration && item.name === migration.oldName) {
                item.name = migration.newName;
                itemChanged = true;
            }
            // Emojis entfernen
            const cleanedName = stripEmojis(item.name);
            if (cleanedName !== item.name) {
                item.name = cleanedName;
                itemChanged = true;
            }
            return itemChanged;
        };

        // Inventar prüfen
        if (char.inventory && Array.isArray(char.inventory)) {
            char.inventory.forEach(item => {
                if (cleanItem(item)) changed = true;
            });
        }

        // Ausrüstung prüfen
        if (char.equipment) {
            if (char.equipment.armor && cleanItem(char.equipment.armor)) changed = true;
            if (char.equipment.weapons && Array.isArray(char.equipment.weapons)) {
                char.equipment.weapons.forEach(weapon => {
                    if (cleanItem(weapon)) changed = true;
                });
            }
        }

        if (changed) {
            charStore.put(char);
            console.log('Charakter-Items (Inventar/Ausrüstung) von Emojis befreit/migriert.');
        }
    };

    return new Promise(res => tx.oncomplete = res);
}


function updateDifficultySliderStyle(slider) {
    const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const trackColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-container-high').trim();
    slider.style.background = `linear-gradient(to right, ${primaryColor} ${percentage}%, ${trackColor} ${percentage}%)`;
}

function addSettingsListeners(elements) {
    let restDaysRefreshRunning = false;
    const handleRestDaysChange = async (value) => {
        if (restDaysRefreshRunning) return;
        restDaysRefreshRunning = true;
        try {
            await saveSetting('restDays', value);
            await generateDailyQuestsIfNeeded(true);
            DQ_EXERCISES.renderQuests();
        } finally {
            restDaysRefreshRunning = false;
        }
    };

    elements.settingsButton.addEventListener('click', () => {
        updateSettingsUI();
    });

    elements.languageSelect.addEventListener('change', (e) => saveSetting('language', e.target.value));
    // Light-Theme Toggle: Wenn ausgeschaltet, auf dark (nicht oled) zurück
    elements.themeToggle.addEventListener('change', (e) => {
        saveSetting('theme', e.target.checked ? 'light' : 'dark');
        // OLED-Toggle zurücksetzen wenn auf light
        const oledToggle = document.getElementById('oled-toggle');
        if (oledToggle && e.target.checked) oledToggle.checked = false;
    });
    // OLED Toggle
    const oledToggle = document.getElementById('oled-toggle');
    if (oledToggle) {
        oledToggle.addEventListener('change', (e) => {
            saveSetting('theme', e.target.checked ? 'oled' : 'dark');
        });
    }
    elements.characterNameInput.addEventListener('change', (e) => saveSetting('name', e.target.value));
    if (elements.characterAgeInput) {
        elements.characterAgeInput.addEventListener('change', (e) => saveSetting('age', parseInt(e.target.value, 10) || null));
    }

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

    elements.restdaysSelect.addEventListener('change', (e) => {
        handleRestDaysChange(parseInt(e.target.value, 10));
    });
    elements.restdaysSelect.addEventListener('input', (e) => {
        handleRestDaysChange(parseInt(e.target.value, 10));
    });

    elements.equipmentToggle.addEventListener('change', async (e) => {
        await saveSetting('hasEquipment', e.target.checked);
        await generateDailyQuestsIfNeeded(true);
        DQ_EXERCISES.renderQuests();
    });

    if (elements.phaseRepeatButton) {
        elements.phaseRepeatButton.addEventListener('click', async () => {
            await DQ_TRAINING_SYSTEM.applyPhaseAction(DQ_CONFIG.userSettings.goal || 'muscle', 'repeat');
            await generateDailyQuestsIfNeeded(true);
            DQ_EXERCISES.renderQuests();
            DQ_UI.showCustomPopup(`<h3>${DQ_TRAINING_SYSTEM.t('training_phase', 'Phase')}</h3><p>${DQ_TRAINING_SYSTEM.t('phase_action_repeat_success', 'Phase erfolgreich wiederholt.')}</p>`, 'info');
        });
    }
    if (elements.phaseSkipButton) {
        elements.phaseSkipButton.addEventListener('click', async () => {
            await DQ_TRAINING_SYSTEM.applyPhaseAction(DQ_CONFIG.userSettings.goal || 'muscle', 'skip');
            await generateDailyQuestsIfNeeded(true);
            DQ_EXERCISES.renderQuests();
            DQ_UI.showCustomPopup(`<h3>${DQ_TRAINING_SYSTEM.t('training_phase', 'Phase')}</h3><p>${DQ_TRAINING_SYSTEM.t('phase_action_skip_success', 'Phase erfolgreich übersprungen.')}</p>`, 'info');
        });
    }
    if (elements.phaseExtendButton) {
        elements.phaseExtendButton.addEventListener('click', async () => {
            await DQ_TRAINING_SYSTEM.applyPhaseAction(DQ_CONFIG.userSettings.goal || 'muscle', 'extend');
            await generateDailyQuestsIfNeeded(true);
            DQ_EXERCISES.renderQuests();
            DQ_UI.showCustomPopup(`<h3>${DQ_TRAINING_SYSTEM.t('training_phase', 'Phase')}</h3><p>${DQ_TRAINING_SYSTEM.t('phase_action_extend_success', 'Phase erfolgreich verlängert.')}</p>`, 'info');
        });
    }

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
    const lang = DQ_CONFIG.userSettings.language || 'de';
    const trans = DQ_DATA.translations[lang] || DQ_DATA.translations.de;
    const content = `
        <div class="training-reset-message">
            <h3>${trans.restart_training_title || 'Einen Neuanfang beginnen'}</h3>
            <p>${trans.restart_training_warning || 'Dabei gehen dein Tutorial-Fortschritt und der Intro-Status verloren.'}</p>
            <p>${trans.restart_training_notice || 'Deine eigentlichen Spieldaten bleiben erhalten.'}</p>
            <div class="popup-actions">
                <button type="button" id="reset-tutorial-confirm-button" class="card-button">${trans.restart_training_confirm || 'Neuanfang beginnen'}</button>
            </div>
        </div>
    `;

    DQ_UI.showCustomPopup(content, 'info');

    const confirmButton = document.getElementById('reset-tutorial-confirm-button');
    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            try {
                console.log('Setze Tutorial-Status zurück...');
                if (typeof DQ_TUTORIAL_STATE !== 'undefined') {
                    await DQ_TUTORIAL_STATE.resetTutorial();
                }
                if (typeof DQ_TUTORIAL_PROGRESSIVE !== 'undefined' && typeof DQ_TUTORIAL_PROGRESSIVE.resetRuntimeState === 'function') {
                    DQ_TUTORIAL_PROGRESSIVE.resetRuntimeState();
                }
                if (typeof DQ_TUTORIAL_MAIN !== 'undefined' && typeof DQ_TUTORIAL_MAIN.resetRuntimeState === 'function') {
                    DQ_TUTORIAL_MAIN.resetRuntimeState();
                }
                DQ_UI.hideAllPopups();
                const url = new URL(window.location.href);
                url.searchParams.set('tutorial_reset', Date.now().toString());
                window.location.replace(url.toString());
            } catch (error) {
                console.error('Fehler beim Zurücksetzen des Tutorials:', error);
                DQ_UI.showCustomPopup('Fehler beim Zurücksetzen. Bitte versuche es erneut.', 'penalty');
            }
        }, { once: true });
    }
}

try {
    window.resetTutorialAndIntro = resetTutorialAndIntro;
} catch (e) {
    console.error('Fehler beim Exportieren von resetTutorialAndIntro:', e);
}

function getUpdateNoticePages(trans) {
    return [
        {
            title: trans.update_notice_page1_title,
            body: trans.update_notice_page1_body,
            points: [trans.update_notice_page1_point1, trans.update_notice_page1_point2]
        },
        {
            title: trans.update_notice_page2_title,
            body: trans.update_notice_page2_body,
            points: [trans.update_notice_page2_point1, trans.update_notice_page2_point2]
        },
        {
            title: trans.update_notice_page3_title,
            body: trans.update_notice_page3_body,
            points: [trans.update_notice_page3_point1, trans.update_notice_page3_point2]
        }
    ];
}

async function showUpdateNotice() {
    const lang = DQ_CONFIG.userSettings.language || 'de';
    const trans = DQ_DATA.translations[lang] || DQ_DATA.translations.de;
    const pages = getUpdateNoticePages(trans);
    let pageIndex = 0;

    const render = () => {
        const page = pages[pageIndex];
        const content = `
            <div class="training-reset-message update-notice-box">
                <h3>${trans.update_notice_title}</h3>
                <p>${trans.update_notice_step_label || 'Seite'} ${pageIndex + 1}/3</p>
                <h4>${page.title}</h4>
                <p>${page.body}</p>
                <ul>
                    ${page.points.map(point => `<li>${point}</li>`).join('')}
                </ul>
                <div class="popup-actions">
                    <button type="button" id="update-notice-prev-button" class="card-button secondary-button"${pageIndex === 0 ? ' disabled' : ''}>${trans.update_notice_prev}</button>
                    <button type="button" id="update-notice-next-button" class="card-button">${pageIndex === pages.length - 1 ? trans.update_notice_finish : trans.update_notice_next}</button>
                </div>
            </div>
        `;

        DQ_UI.showCustomPopup(content, 'info');

        const prevButton = document.getElementById('update-notice-prev-button');
        const nextButton = document.getElementById('update-notice-next-button');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (pageIndex > 0) {
                    pageIndex--;
                    render();
                }
            }, { once: true });
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (pageIndex < pages.length - 1) {
                    pageIndex++;
                    render();
                } else {
                    DQ_UI.hideAllPopups();
                }
            }, { once: true });
        }
    };

    render();
}
function saveSetting(key, value) {
    return new Promise(resolve => {
        const characterSettings = ['name', 'age', 'weightTrackingEnabled', 'targetWeight', 'weightDirection'];

        if (characterSettings.includes(key)) {
            const tx = DQ_DB.db.transaction(['character'], 'readwrite');
            const store = tx.objectStore('character');
            store.get(1).onsuccess = (e) => {
                const char = e.target.result;
                if (char) {
                    if (key === 'name') {
                        char.name = value || "Unknown Hunter";
                    } else if (key === 'age') {
                        char.age = Number.isFinite(value) ? value : null;
                        char.ageBand = typeof DQ_TRAINING_SYSTEM !== 'undefined' ? DQ_TRAINING_SYSTEM.getAgeBand(char.age) : 'unknown';
                        DQ_CONFIG.userSettings.age = char.age;
                    } else {
                        char[key] = value;
                    }
                    store.put(char);
                }
            };
            tx.oncomplete = () => {
                if (key === 'name' || key === 'age' || key === 'weightTrackingEnabled') {
                    DQ_CHARACTER_MAIN.renderPage();
                }
                if (key === 'age') {
                    const settingsTx = DQ_DB.db.transaction(['settings'], 'readwrite');
                    settingsTx.objectStore('settings').put(DQ_CONFIG.userSettings);
                    settingsTx.oncomplete = () => {
                        updateSettingsUI();
                        resolve();
                    };
                    settingsTx.onerror = () => {
                        updateSettingsUI();
                        resolve();
                    };
                    return;
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
                if (key === 'difficulty' || key === 'hasEquipment') DQ_EXERCISES.renderFreeExercisesPage();
                if (key === 'goal' || key === 'difficulty' || key === 'hasEquipment' || key === 'restDays') {
                    updateSettingsUI();
                    DQ_EXERCISES.renderTrainingPhaseBanner();
                }
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
                DQ_CONFIG.userSettings = { id: 1, language: 'de', theme: 'dark', difficulty: 3, goal: 'muscle', restDays: 2, hasEquipment: true, weightTrackingEnabled: true, age: null };
                tx.objectStore('settings').add(DQ_CONFIG.userSettings);
            }
            if (typeof DQ_TRAINING_SYSTEM !== 'undefined') {
                DQ_CONFIG.userSettings.goal = DQ_TRAINING_SYSTEM.normalizeGoal(DQ_CONFIG.userSettings.goal || 'muscle');
            }
            DQ_CONFIG.userSettings.language = DQ_CONFIG.userSettings.language || 'de';
            DQ_CONFIG.userSettings.theme = DQ_CONFIG.userSettings.theme || 'dark';
            DQ_CONFIG.userSettings.difficulty = Math.max(1, Math.min(5, Number(DQ_CONFIG.userSettings.difficulty) || 3));
            DQ_CONFIG.userSettings.restDays = [0, 1, 2, 3].includes(Number(DQ_CONFIG.userSettings.restDays)) ? Number(DQ_CONFIG.userSettings.restDays) : 2;
            DQ_CONFIG.userSettings.hasEquipment = DQ_CONFIG.userSettings.hasEquipment !== false;
            if (typeof DQ_CONFIG.userSettings.age !== 'number') {
                DQ_CONFIG.userSettings.age = null;
            }
            if (typeof DQ_CONFIG.userSettings.weightTrackingEnabled !== 'boolean') {
                DQ_CONFIG.userSettings.weightTrackingEnabled = true;
            }
            tx.objectStore('settings').put(DQ_CONFIG.userSettings);
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
    elements.restdaysSelect.value = String(DQ_CONFIG.userSettings.restDays ?? 2);
    
    // Default zu true, wenn nicht gesetzt
    elements.equipmentToggle.checked = DQ_CONFIG.userSettings.hasEquipment !== false;

    DQ_DB.db.transaction('character', 'readonly').objectStore('character').get(1).onsuccess = e => {
        if (e.target.result) {
            const char = e.target.result;
            if (elements.characterNameInput) {
                elements.characterNameInput.value = char.name || '';
            }
            if (elements.characterAgeInput) {
                const age = typeof char.age === 'number' ? char.age : DQ_CONFIG.userSettings.age;
                elements.characterAgeInput.value = typeof age === 'number' ? String(age) : '';
            }
            elements.weightTrackingToggle.checked = !!char.weightTrackingEnabled;
            elements.targetWeightInput.value = char.targetWeight || '';
            elements.weightDirectionSelect.value = char.weightDirection || 'lose';
            elements.weightTrackingOptions.style.display = char.weightTrackingEnabled ? 'block' : 'none';
        }
    };

    const isPhaseGoal = !['sick', 'restday'].includes(DQ_CONFIG.userSettings.goal || 'muscle');
    if (elements.phaseRepeatButton) elements.phaseRepeatButton.disabled = !isPhaseGoal;
    if (elements.phaseSkipButton) elements.phaseSkipButton.disabled = !isPhaseGoal;
    if (elements.phaseExtendButton) elements.phaseExtendButton.disabled = !isPhaseGoal;

    updateDifficultySliderStyle(elements.difficultySlider);
}

async function handlePostUpdateMigration() {
    const tutorialCompleted = await DQ_TUTORIAL_STATE.hasCompletedTutorial();
    const seenVersion = localStorage.getItem(APP_UPDATE_FLAG_KEY);
    if (!tutorialCompleted || seenVersion === APP_VERSION) {
        if (!seenVersion) localStorage.setItem(APP_UPDATE_FLAG_KEY, APP_VERSION);
        return;
    }

    const goal = DQ_CONFIG.userSettings.goal || 'muscle';
    if (!['sick', 'restday'].includes(goal) && typeof DQ_TRAINING_SYSTEM !== 'undefined') {
        await DQ_TRAINING_SYSTEM.resetPhaseState(goal);
        DQ_CONFIG.forceQuestRefresh = true;
    }

    DQ_CONFIG.pendingUpdateNotice = true;
    localStorage.setItem(APP_UPDATE_FLAG_KEY, APP_VERSION);
}

async function generateDailyQuestsIfNeeded(forceRegenerate = false) {
    const todayStr = DQ_CONFIG.getTodayString();
    let goal = DQ_CONFIG.userSettings.goal || 'muscle';
    const hasEquipment = DQ_CONFIG.userSettings.hasEquipment !== false;

    if (goal !== 'sick') {
        const dayOfWeek = new Date().getDay();
        const numRestDays = DQ_CONFIG.userSettings.restDays || 0;
        let activeRestDays = [];
        switch (parseInt(numRestDays, 10)) {
            case 1: activeRestDays = [0]; break;
            case 2: activeRestDays = [2, 6]; break;
            case 3: activeRestDays = [0, 2, 4]; break;
        }
        if (activeRestDays.includes(dayOfWeek)) {
            goal = 'restday';
            console.log('Heute ist ein Rest Day! Generiere Erholungs-Quests.');
        }
    }

    const questsToday = await new Promise((resolve, reject) => {
        const tx = DQ_DB.db.transaction(['daily_quests'], 'readonly');
        const index = tx.objectStore('daily_quests').index('date');
        const request = index.getAll(todayStr);
        request.onsuccess = e => resolve(e.target.result || []);
        request.onerror = e => reject(e.target.error);
    });
    const hasCompletedToday = questsToday.some(q => q.completed);

    const goalExercises = Object.values(DQ_DATA.exercisePool).flat();
    const questNeedsEquipment = quest => {
        const template = goalExercises.find(ex => ex.nameKey === quest.nameKey);
        return !!template?.needsEquipment;
    };

    if (!hasCompletedToday && !hasEquipment && questsToday.some(questNeedsEquipment)) {
        forceRegenerate = true;
    }
    const hasDuplicateQuests = new Set(questsToday.map(q => q.nameKey)).size !== questsToday.length;
    if (!hasCompletedToday && hasDuplicateQuests) {
        forceRegenerate = true;
    }

    const hasLegacyEnduranceTargets = goal === 'endurance' && questsToday.some(q => q.completionMode === 'log' && !q.targetLabel);
    const needsTrainingRefresh = goal !== 'restday' && goal !== 'sick'
        && (questsToday.some(q => !q.completionMode || typeof q.phaseIndex !== 'number') || hasLegacyEnduranceTargets);
    if (!hasCompletedToday && needsTrainingRefresh && !forceRegenerate) {
        forceRegenerate = true;
    }

    if (questsToday.length > 0 && !forceRegenerate) {
        const allTemplates = Object.values(DQ_DATA.exercisePool).flat();
        let changed = false;
        const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
        const store = tx.objectStore('daily_quests');

        for (const quest of questsToday) {
            const template = allTemplates.find(t => t.nameKey === quest.nameKey);
            if (template && !quest.bonusInfoSynced) {
                const loadFactor = quest.loadFactor || 1;
                quest.manaReward = Math.ceil(template.mana * loadFactor);
                quest.goldReward = Math.ceil(template.gold * loadFactor);
                quest.bonusInfoSynced = true;
                store.put(quest);
                changed = true;
            }
        }

        await new Promise(resolve => {
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });

        if (changed) console.log('Bestehende Daily Quests wurden mit neuen Belohnungen/Daten synchronisiert.');
        return;
    }

    if (questsToday.length > 0 && forceRegenerate) {
        console.log('Erzwinge Neugenerierung: Lösche alte Quests für heute...');
        await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            questsToday.forEach(q => store.delete(q.questId));
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
    }

    if (goal === 'restday' || goal === 'sick') {
        console.log(`Generiere neue Quests für das Ziel: ${goal}`);
        const blockedQuestNameKeys = (typeof DQ_TRAINING_SYSTEM !== 'undefined' && Array.isArray(DQ_TRAINING_SYSTEM.blockedQuestNameKeys))
            ? DQ_TRAINING_SYSTEM.blockedQuestNameKeys
            : ['jump_rope'];
        const blockedSet = new Set(blockedQuestNameKeys);
        let pool = [...(DQ_DATA.exercisePool[goal] || DQ_DATA.exercisePool.muscle)]
            .filter(ex => !blockedSet.has(ex.nameKey));

        if (!hasEquipment) {
            pool = pool.filter(ex => !ex.needsEquipment);
        }

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const targetQuestCount = 5;
        const questCount = Math.min(targetQuestCount, pool.length);
        const newQuests = [];
        for (let i = 0; i < questCount; i++) {
            const template = pool[i];
            if (template) newQuests.push(template);
        }
        const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
        const questsToSave = newQuests.map(questTemplate => {
            let targetValue = questTemplate.baseValue;
            if (questTemplate.type !== 'check' && questTemplate.type !== 'link' && questTemplate.type !== 'focus') {
                targetValue = Math.ceil(questTemplate.baseValue + (questTemplate.baseValue * 0.4 * (difficulty - 1)));
            }
            return {
                date: todayStr,
                nameKey: questTemplate.nameKey,
                type: questTemplate.type,
                target: targetValue,
                manaReward: Math.ceil(questTemplate.mana * (1 + 0.2 * (difficulty - 1))),
                goldReward: Math.ceil(questTemplate.gold * (1 + 0.15 * (difficulty - 1))),
                completed: false,
                goal: goal,
                completionMode: 'tap',
                setProgress: []
            };
        });

        await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            questsToSave.forEach(quest => store.add(quest));
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
    } else {
        if (typeof DQ_TRAINING_SYSTEM === 'undefined') {
            throw new Error('DQ_TRAINING_SYSTEM fehlt');
        }

        const result = await DQ_TRAINING_SYSTEM.getTodayQuestSet(forceRegenerate);
        console.log(`Generiere neue Quests für das Ziel: ${result.goal}`);

        await new Promise(resolve => {
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            result.quests.forEach(quest => store.add(quest));
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
    }

    console.log('Neue Quests erfolgreich generiert und gespeichert.');
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
                    age: null, ageBand: 'unknown',
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
            } else {
                if (typeof char.age !== 'number') char.age = null;
                if (!char.ageBand) char.ageBand = 'unknown';
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
        await generateDailyQuestsIfNeeded(DQ_CONFIG.forceQuestRefresh === true);
        DQ_CONFIG.forceQuestRefresh = false;
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
            DQ_CONFIG.forceQuestRefresh = false;
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
            window.DQ_TUTORIAL_IN_PROGRESS = false;

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
        window.DQ_TUTORIAL_IN_PROGRESS = false;
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



