const DQ_DB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            // --- VERSION ERHÖHT, UM DAS UPDATE-SKRIPT AUSZULÖSEN ---
            const dbName = 'VibeCodenDB', dbVersion = 14; 
            const request = indexedDB.open(dbName, dbVersion);

            request.onerror = (e) => {
                console.error('DB error:', e.target.errorCode);
                reject(e.target.errorCode);
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const transaction = e.target.transaction;
                
                let charStore;
                if (!db.objectStoreNames.contains('character')) {
                    charStore = db.createObjectStore('character', { keyPath: 'id' });
                } else {
                    charStore = transaction.objectStore('character');
                }
                
                // --- NEUE, EINMALIGE LEVEL-KORREKTUR-LOGIK ---
                charStore.getAll().onsuccess = (event) => {
                    const characters = event.target.result;
                    
                    // Die "Goldene Formel" zur Berechnung des Mana-Bedarfs
                    const getManaForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

                    characters.forEach(char => {
                        const correctManaForCurrentLevel = getManaForLevel(char.level);
                        
                        // Prüft, ob der gespeicherte Mana-Wert signifikant höher ist als er sein sollte.
                        if (char.manaToNextLevel > correctManaForCurrentLevel * 1.05) { // 5% Toleranz für Rundungsfehler
                            console.log(`Korrektur für ${char.name} gestartet. Altes Level: ${char.level}, Falscher Mana-Wert: ${char.manaToNextLevel}`);
                            
                            let trueLevel = char.level;
                            // Findet das "wahre" Level, indem es hochzählt, bis der Mana-Bedarf den falschen Wert übersteigt.
                            while (getManaForLevel(trueLevel) < char.manaToNextLevel) {
                                trueLevel++;
                            }
                            // Das wahre Level ist das Level *davor*.
                            char.level = trueLevel - 1; 
                            // Setzt den Mana-Bedarf auf den korrekten Wert für das neue, höhere Level.
                            char.manaToNextLevel = getManaForLevel(char.level);

                            console.log(`Korrektur abgeschlossen. Neues Level: ${char.level}, Korrekter Mana-Wert: ${char.manaToNextLevel}`);
                        }

                        // Achievement-Migration (bleibt erhalten)
                        if (!char.achievements) char.achievements = {};
                        for (const key in DQ_DATA.achievements) {
                            if (!char.achievements[key]) {
                                char.achievements[key] = { tier: 0, claimable: false };
                            }
                        }
                        if (typeof char.totalGoldEarned === 'undefined') char.totalGoldEarned = char.gold || 0;
                        if (typeof char.totalQuestsCompleted === 'undefined') char.totalQuestsCompleted = 0;
                        if (typeof char.totalItemsPurchased === 'undefined') char.totalItemsPurchased = 0;

                        charStore.put(char);
                    });
                };

                // Restliche DB-Struktur (unverändert)
                if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('shop')) db.createObjectStore('shop', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
                
                if (!db.objectStoreNames.contains('daily_quests')) {
                    const questStore = db.createObjectStore('daily_quests', { keyPath: 'questId', autoIncrement: true });
                    questStore.createIndex('date', 'date', { unique: false });
                } else {
                    const questStore = transaction.objectStore('daily_quests');
                    if (!questStore.indexNames.contains('date')) {
                         questStore.createIndex('date', 'date', { unique: false });
                    }
                }

                if (!db.objectStoreNames.contains('extra_quest')) db.createObjectStore('extra_quest', { keyPath: 'id' });
            };
        });
    }
};