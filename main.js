const DQ_CONFIG = {
    userSettings: {},
    dailyCheckInterval: null,

    getTodayString() { return new Date().toISOString().split('T')[0]; },
    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    },

    getStreakData() {
        const data = localStorage.getItem('streakData');
        if (!data) return { streak: 0, lastDate: null };
        try { return JSON.parse(data); } catch { return { streak: 0, lastDate: null }; }
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

    async checkStatIncrease(char) {
        const STAT_INCREASE_THRESHOLD = 5;
        char.completedExercises = (char.completedExercises || 0) + 1;

        if (char.completedExercises >= STAT_INCREASE_THRESHOLD) {
            const statKeys = Object.keys(char.stats);
            const randomStatKey = statKeys[Math.floor(Math.random() * statKeys.length)];
            char.stats[randomStatKey]++;
            char.completedExercises -= STAT_INCREASE_THRESHOLD;

            const lang = this.userSettings.language || 'de';
            const title = DQ_DATA.translations[lang].stat_increase_title;
            let text = DQ_DATA.translations[lang].stat_increase_text;
            text = text.replace('{statName}', randomStatKey.charAt(0).toUpperCase() + randomStatKey.slice(1));

            setTimeout(() => {
                DQ_UI.showCustomPopup(`<h3>${title}</h3><p>${text}</p>`);
            }, 800);
        }
        return char;
    },

    levelUpCheck(char) {
        let leveledUp = false;
        while (char.mana >= char.manaToNextLevel) {
            leveledUp = true;
            char.level++;
            char.mana -= char.manaToNextLevel;
            char.manaToNextLevel = Math.floor(char.manaToNextLevel * 1.5);
        }
        if (leveledUp) {
            setTimeout(() => DQ_UI.showCustomPopup(`LEVEL UP! 🚀 Du bist jetzt Level ${char.level}!`), 600);
        }
        return char;
    },

    checkStreakCompletion() {
        const todayStr = this.getTodayString();
        DQ_DB.db.transaction(['daily_quests'], 'readonly').objectStore('daily_quests').index('date').getAll(todayStr).onsuccess = (e) => {
            const quests = e.target.result;
            if (quests.length > 0 && quests.every(q => q.completed)) {
                let { streak, lastDate } = this.getStreakData();
                if (lastDate !== todayStr) {
                    streak = (lastDate === this.getYesterdayString()) ? streak + 1 : 1;
                    this.setStreakData(streak, todayStr);
                    this.updateStreakDisplay();
                }
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM-Elemente sammeln ---
    const elements = {
        pages: document.querySelectorAll('.page'),
        navButtons: document.querySelectorAll('.nav-button'),
        headerTitle: document.getElementById('header-title'),
        questList: document.getElementById('quest-list'),
        exerciseList: document.getElementById('exercise-list'),
        freeExerciseFilters: document.getElementById('free-exercise-filters'),
        characterSheet: document.getElementById('character-sheet'),
        characterVitals: document.getElementById('character-vitals'),
        equipmentContainer: document.getElementById('equipment-container'),
        inventoryContainer: document.getElementById('inventory-container'),
        shopItems: document.getElementById('shop-items'),
        shopFilters: document.getElementById('shop-filters'),
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
        pageExercises: document.getElementById('page-exercises'),
        extraQuestInactiveView: document.getElementById('extra-quest-inactive'),
        extraQuestActiveView: document.getElementById('extra-quest-active'),
        startExtraQuestButton: document.getElementById('start-extra-quest-button'),
        completeExtraQuestButton: document.getElementById('complete-extra-quest-button'),
        extraQuestTask: document.getElementById('extra-quest-task'),
        extraQuestCountdown: document.getElementById('extra-quest-countdown'),
        countdownProgressBar: document.getElementById('countdown-progress-bar'),
    };
    elements.allPopups = [elements.infoPopup, elements.notificationPopup, elements.settingsPopup, elements.sellPopup];

    // --- Module initialisieren ---
    await DQ_DB.init();
    DQ_UI.init(elements);
    DQ_CHARACTER.init(elements);
    DQ_EXERCISES.init(elements);
    DQ_SHOP.init(elements);
    DQ_EXTRA.init(elements);

    // --- Event Listeners für Einstellungen etc. ---
    addSettingsListeners(elements);
    
    // --- App starten ---
    loadInitialData();

    async function loadInitialData() {
        await loadSettings();
        await initializeCharacter();
        await generateDailyQuests();
        DQ_EXERCISES.renderQuests();
        initializeFreeExercises();
        initializeShop();
        DQ_EXTRA.renderExtraQuestPage();
        startDailyCheckTimer();
    }

    function addSettingsListeners(elements) {
        elements.languageSelect.addEventListener('change', (e) => saveSetting('language', e.target.value));
        elements.themeToggle.addEventListener('change', (e) => saveSetting('theme', e.target.checked ? 'light' : 'dark'));
        elements.characterNameInput.addEventListener('change', (e) => saveSetting('name', e.target.value));
        elements.difficultySlider.addEventListener('input', (e) => { elements.difficultyValue.textContent = e.target.value });
        elements.difficultySlider.addEventListener('change', async (e) => {
            await saveSetting('difficulty', parseInt(e.target.value, 10));
            await generateDailyQuests(true);
        });
        elements.goalSelect.addEventListener('change', async (e) => {
            await saveSetting('goal', e.target.value);
            await generateDailyQuests(true);
        });
        elements.restdaysSelect.addEventListener('change', async (e) => {
            await saveSetting('restDays', parseInt(e.target.value, 10));
            await generateDailyQuests(true);
        });
        elements.exportDataButton.addEventListener('click', exportData);
        elements.importDataInput.addEventListener('change', importData);
    }

    function saveSetting(key, value) {
        return new Promise(resolve => {
            if (key === 'name') {
                const tx = DQ_DB.db.transaction(['character'], 'readwrite');
                tx.objectStore('character').get(1).onsuccess = (e) => {
                    const char = e.target.result;
                    if (char) {
                        char.name = value || "Unknown Hunter";
                        tx.objectStore('character').put(char);
                    }
                };
                tx.oncomplete = () => {
                    DQ_CHARACTER.renderPage();
                    resolve();
                }
            } else {
                DQ_CONFIG.userSettings[key] = value;
                const tx = DQ_DB.db.transaction(['settings'], 'readwrite');
                tx.objectStore('settings').put(DQ_CONFIG.userSettings);
                tx.oncomplete = () => {
                    if (key === 'language') DQ_UI.applyTranslations();
                    if (key === 'theme') DQ_UI.applyTheme();
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
                DQ_UI.applyTranslations();
                resolve();
            };
            tx.onerror = () => resolve();
        });
    }

    function updateSettingsUI() {
        elements.languageSelect.value = DQ_CONFIG.userSettings.language || 'de';
        elements.themeToggle.checked = (DQ_CONFIG.userSettings.theme === 'light');
        elements.difficultySlider.value = DQ_CONFIG.userSettings.difficulty || 3;
        elements.difficultyValue.textContent = DQ_CONFIG.userSettings.difficulty || 3;
        elements.goalSelect.value = DQ_CONFIG.userSettings.goal || 'muscle';
        elements.restdaysSelect.value = DQ_CONFIG.userSettings.restDays || 2;
        
        DQ_DB.db.transaction('character', 'readonly').objectStore('character').get(1).onsuccess = e => {
            if(e.target.result) {
                elements.characterNameInput.value = e.target.result.name;
            }
        };
    }

    function generateDailyQuests(force = false) {
        return new Promise(resolve => {
            const today = DQ_CONFIG.getTodayString();
            const tx = DQ_DB.db.transaction(['daily_quests'], 'readwrite');
            const store = tx.objectStore('daily_quests');
            const index = store.index('date');
            
            index.getAll(today).onsuccess = e => {
                if (e.target.result.length > 0 && !force) {
                    resolve();
                    return;
                }
                
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => {
                    let goal = DQ_CONFIG.userSettings.goal || 'muscle';
                    
                    if (goal !== 'sick') {
                        const dayOfWeek = new Date().getDay();
                        const numRestDays = DQ_CONFIG.userSettings.restDays || 0;
                        let activeRestDays = [];

                        switch (numRestDays) {
                            case 1: activeRestDays = [4]; break;
                            case 2: activeRestDays = [2, 6]; break;
                            case 3: activeRestDays = [0, 2, 4]; break;
                        }
                        if (activeRestDays.includes(dayOfWeek)) {
                            goal = 'restday';
                        }
                    }

                    const pool = [...(DQ_DATA.exercisePool[goal] || DQ_DATA.exercisePool['muscle'])];
                    
                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [pool[i], pool[j]] = [pool[j], pool[i]];
                    }

                    // KORREKTUR: Anzahl der Quests auf 6 geändert
                    const newQuests = pool.slice(0, 6).filter(Boolean);
                    if (newQuests.length === 0) {
                        resolve();
                        return;
                    }
                    
                    const difficulty = DQ_CONFIG.userSettings.difficulty || 3;
                    newQuests.forEach(questTemplate => {
                        let targetValue = questTemplate.baseValue;
                        if(questTemplate.type !== 'check' && questTemplate.type !== 'link') {
                            targetValue = Math.ceil(questTemplate.baseValue + (questTemplate.baseValue * 0.4 * (difficulty - 1)));
                        }

                        const quest = {
                            date: today,
                            nameKey: questTemplate.nameKey,
                            type: questTemplate.type,
                            target: targetValue,
                            manaReward: Math.ceil(questTemplate.mana * (1 + 0.2 * (difficulty - 1))),
                            goldReward: Math.ceil(questTemplate.gold * (1 + 0.15 * (difficulty - 1))),
                            completed: false,
                        };
                        store.add(quest);
                    });
                };
            };
            tx.oncomplete = () => {
                DQ_EXERCISES.renderQuests();
                resolve();
            }
            tx.onerror = () => resolve();
        });
    }

    function initializeCharacter() {
        return new Promise(resolve => {
            const transaction = DQ_DB.db.transaction(['character'], 'readwrite');
            const store = transaction.objectStore('character');
            store.get(1).onsuccess = (e) => {
                if (!e.target.result) {
                    store.add({ id: 1, name: 'Unknown Hunter', level: 1, mana: 0, manaToNextLevel: 100, gold: 200, stats: { kraft: 5, ausdauer: 5, beweglichkeit: 5, durchhaltevermoegen: 5, willenskraft: 5 }, equipment: { weapons: [], armor: null }, inventory: [], completedExercises: 0 });
                }
            };
            transaction.oncomplete = () => {
                DQ_CHARACTER.renderPage();
                resolve();
            };
        });
    }

    function initializeFreeExercises() {
        const defaultExercises = [
            { id: 1, nameKey: 'push_ups_narrow', type: 'reps', baseValue: 12, manaReward: 20, goldReward: 5, category: 'muscle' },
            { id: 2, nameKey: 'weighted_squats', type: 'reps', baseValue: 15, manaReward: 15, goldReward: 3, category: 'muscle' },
            { id: 3, nameKey: 'dumbbell_rows', type: 'reps', baseValue: 10, manaReward: 22, goldReward: 7, category: 'muscle' },
            { id: 4, nameKey: 'bicep_curls', type: 'reps', baseValue: 10, manaReward: 18, goldReward: 5, category: 'muscle' },
            { id: 5, nameKey: 'jumping_jacks', type: 'time', baseValue: 60, manaReward: 25, goldReward: 7, category: 'endurance' },
            { id: 6, nameKey: 'general_workout', type: 'check', baseValue: 1, manaReward: 50, goldReward: 50, category: 'muscle' },
            { id: 7, nameKey: 'pinterest_workout', type: 'link', baseValue: 1, manaReward: 60, goldReward: 20, category: 'kraft_abnehmen', url: 'https://pin.it/4DkPZ9zHx' },
            { id: 8, nameKey: 'plank', type: 'time', baseValue: 30, manaReward: 18, goldReward: 5, category: 'kraft_abnehmen' },
            { id: 9, nameKey: 'situps', type: 'reps', baseValue: 20, manaReward: 15, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 10, nameKey: 'knee_push_ups', type: 'reps', baseValue: 15, manaReward: 12, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 11, nameKey: 'tricep_dips_chair', type: 'reps', baseValue: 12, manaReward: 14, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 12, nameKey: 'lunges', type: 'reps', baseValue: 16, manaReward: 15, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 13, nameKey: 'sumo_squats', type: 'reps', baseValue: 15, manaReward: 15, goldReward: 4, category: 'kraft_abnehmen' },
            { id: 14, nameKey: 'glute_bridges', type: 'reps', baseValue: 18, manaReward: 12, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 15, nameKey: 'tricep_extensions', type: 'reps', baseValue: 12, manaReward: 13, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 16, nameKey: 'side_plank', type: 'time', baseValue: 20, manaReward: 13, goldReward: 3, category: 'kraft_abnehmen' },
            { id: 17, nameKey: 'burpees', type: 'reps', baseValue: 10, manaReward: 18, goldReward: 5, category: 'endurance' },
            { id: 18, nameKey: 'mountain_climbers', type: 'time', baseValue: 30, manaReward: 15, goldReward: 4, category: 'fatloss' },
            { id: 19, nameKey: 'jump_squats', type: 'reps', baseValue: 12, manaReward: 15, goldReward: 4, category: 'fatloss' },
            { id: 20, nameKey: 'high_knees', type: 'time', baseValue: 40, manaReward: 12, goldReward: 3, category: 'endurance' },
            { id: 21, nameKey: 'stretch_10min', type: 'check', baseValue: 1, manaReward: 10, goldReward: 5, category: 'restday' },
            { id: 22, nameKey: 'walk_30min', type: 'check', baseValue: 1, manaReward: 15, goldReward: 5, category: 'restday' }
        ];

        const transaction = DQ_DB.db.transaction(['exercises'], 'readwrite');
        const store = transaction.objectStore('exercises');
        store.count().onsuccess = (e) => {
            if (e.target.result !== defaultExercises.length) {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => defaultExercises.forEach(ex => store.add(ex));
            }
        };
        transaction.oncomplete = () => DQ_EXERCISES.renderFreeExercisesPage();
    }

    function initializeShop() {
        const transaction = DQ_DB.db.transaction(['shop'], 'readwrite');
        const store = transaction.objectStore('shop');
        store.count().onsuccess = (e) => {
            if (e.target.result === 0) {
                const newShopItems = [ { id: 101, name: 'Trainings-Schwert 🗡️', description: '+5 Angriff ⚔️', cost: 100, type: 'weapon', bonus: { angriff: 5 } }, { id: 102, name: 'Stahl-Klinge 🔪', description: '+15 Angriff ⚔️', cost: 400, type: 'weapon', bonus: { angriff: 15 } }, { id: 103, name: 'Ninja-Sterne ✨', description: '+25 Angriff ⚔️', cost: 850, type: 'weapon', bonus: { angriff: 25 } }, { id: 104, name: 'Meister-Hantel 💪', description: 'Legendär. +40 Angriff ⚔️', cost: 1500, type: 'weapon', bonus: { angriff: 40 } }, { id: 105, name: 'Magier-Stab 🪄', description: 'Episch. +60 Angriff ⚔️', cost: 2500, type: 'weapon', bonus: { angriff: 60 } }, { id: 201, name: 'Leder-Bandagen 🩹', description: '+5 Schutz 🛡️', cost: 100, type: 'armor', bonus: { schutz: 5 } }, { id: 202, name: 'Kettenhemd ⛓️', description: '+15 Schutz 🛡️', cost: 400, type: 'armor', bonus: { schutz: 15 } }, { id: 203, name: 'Spiegel-Schild 💎', description: '+25 Schutz 🛡️', cost: 850, type: 'armor', bonus: { schutz: 25 } }, { id: 204, name: 'Titan-Panzer 🦾', description: 'Legendär. +40 Schutz 🛡️', cost: 1500, type: 'armor', bonus: { schutz: 40 } }, { id: 205, name: 'Drachenhaut-Robe 🐉', description: 'Episch. +60 Schutz 🛡️', cost: 2500, type: 'armor', bonus: { schutz: 60 } }, { id: 301, name: 'Kleiner Mana-Stein 🔹', description: 'Stellt 50 Mana wieder her.', cost: 80, type: 'consumable', effect: { mana: 50 } }, { id: 302, name: 'Mittlerer Mana-Stein 🔸', description: 'Stellt 250 Mana wieder her.', cost: 350, type: 'consumable', effect: { mana: 250 } }, { id: 303, name: 'Großer Mana-Stein 💠', description: 'Stellt 1000 Mana wieder her.', cost: 1200, type: 'consumable', effect: { mana: 1000 } }
                ];
                newShopItems.forEach(item => store.add(item));
            }
        };
        transaction.oncomplete = () => DQ_SHOP.renderPage();
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
        const tx = DQ_DB.db.transaction(['extra_quest', 'character'], 'readwrite');
        const extraQuestStore = tx.objectStore('extra_quest');
        const charStore = tx.objectStore('character');
        
        let char = await new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result));
        let charModified = false;
        let penaltyApplied = false;

        const { lastDate } = DQ_CONFIG.getStreakData();
        if (lastDate) {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const lastDateObj = new Date(lastDate); lastDateObj.setHours(0, 0, 0, 0);
            const diffDays = Math.round((today - lastDateObj) / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                DQ_CONFIG.setStreakData(0, null);
                if (char.level > 1) {
                    char.level -= (diffDays - 1);
                    if (char.level < 1) char.level = 1;
                    Object.keys(char.stats).forEach(key => char.stats[key] = Math.max(1, char.stats[key] - 1));
                    charModified = true;
                    penaltyApplied = true;
                }
                if (penaltyApplied) {
                    const lang = DQ_CONFIG.userSettings.language || 'de';
                    DQ_UI.showCustomPopup(`<h3>${DQ_DATA.translations[lang].penalty_title}</h3><p>${DQ_DATA.translations[lang].penalty_text}</p>`, 'penalty');
                }
            }
        }

        const extraQuest = await new Promise(res => extraQuestStore.get(1).onsuccess = e => res(e.target.result));
        if (extraQuest && new Date(extraQuest.deadline) < new Date() && !extraQuest.completed) {
            if (char.level > 1) char.level -= 1;
            char.gold = Math.max(0, char.gold - 150);
            Object.keys(char.stats).forEach(key => char.stats[key] = Math.max(1, char.stats[key] - (key === 'willenskraft' ? 3 : 1)));
            charModified = true;
            if (!penaltyApplied) {
                const lang = DQ_CONFIG.userSettings.language || 'de';
                DQ_UI.showCustomPopup(`<h3>${DQ_DATA.translations[lang].extra_penalty_title}</h3><p>${DQ_DATA.translations[lang].extra_penalty_text}</p>`, 'penalty');
            }
            await new Promise(res => extraQuestStore.delete(1).onsuccess = res);
        }

        if (charModified) {
            await new Promise(res => charStore.put(char).onsuccess = res);
        }

        tx.oncomplete = async () => {
            await generateDailyQuests(true);
            DQ_CHARACTER.renderPage();
            DQ_EXTRA.renderExtraQuestPage();
            DQ_CONFIG.updateStreakDisplay();
        };
    }

    async function exportData() {
        if (!DQ_DB.db) return;
        try {
            const dataToExport = {};
            const storeNames = Array.from(DQ_DB.db.objectStoreNames);
            const transaction = DQ_DB.db.transaction(storeNames, 'readonly');
            const promises = storeNames.map(storeName => new Promise((resolve, reject) => {
                const request = transaction.objectStore(storeName).getAll();
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
            DQ_UI.showCustomPopup("Daten erfolgreich exportiert! 💾");
        } catch (error) {
            console.error("Export failed:", error);
            DQ_UI.showCustomPopup(`Datenexport fehlgeschlagen: ${error.message}`, 'penalty');
        }
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm("WARNUNG: Dies wird alle Ihre aktuellen Daten überschreiben und die Seite neu laden. Sind Sie sicher?")) {
            elements.importDataInput.value = '';
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
                const transaction = DQ_DB.db.transaction(storeNames, 'readwrite');
                transaction.oncomplete = () => {
                    alert("Daten erfolgreich importiert! Die App wird jetzt neu geladen.");
                    location.reload();
                };
                transaction.onerror = (event) => { throw new Error("Fehler beim Schreiben in die Datenbank: " + event.target.error); };

                for (const storeName of storeNames) {
                    await new Promise((resolve, reject) => {
                        const req = transaction.objectStore(storeName).clear();
                        req.onsuccess = resolve;
                        req.onerror = () => reject(req.error);
                    });
                    if (data[storeName]) {
                        for (const item of data[storeName]) {
                           await new Promise((resolve, reject) => {
                                const req = transaction.objectStore(storeName).put(item);
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
                elements.importDataInput.value = '';
            }
        };
        reader.readAsText(file);
    }
});