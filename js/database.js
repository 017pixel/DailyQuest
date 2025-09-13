const DQ_DB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            // --- VERSION ERHÖHT, UM MIGRATION ZU ERZWINGEN ---
            const dbName = 'VibeCodenDB', dbVersion = 18; 
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
                // Die aktuelle Version ist die, zu der wir migrieren.
                const currentVersion = 18; 
                
                let charStore;
                if (!db.objectStoreNames.contains('character')) {
                    charStore = db.createObjectStore('character', { keyPath: 'id' });
                } else {
                    charStore = transaction.objectStore('character');
                }
                
                // Diese Logik wird nun für jeden Benutzer mit einer älteren DB-Version ausgeführt.
                charStore.getAll().onsuccess = (event) => {
                    const characters = event.target.result;
                    
                    const getManaForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

                    characters.forEach(char => {
                        // Prüfen, ob eine Migration für diesen Charakter notwendig ist
                        if (!char.migrationVersion || char.migrationVersion < currentVersion) {
                            console.log(`Starte Migration für Charakter ${char.name} auf Version ${currentVersion}...`);
                            
                            // Mana-Korrektur-Logik (bleibt erhalten)
                            const correctManaForCurrentLevel = getManaForLevel(char.level);
                            if (char.manaToNextLevel > correctManaForCurrentLevel * 1.05) {
                                let trueLevel = char.level;
                                while (getManaForLevel(trueLevel) < char.manaToNextLevel) {
                                    trueLevel++;
                                }
                                char.level = trueLevel - 1; 
                                char.manaToNextLevel = getManaForLevel(char.level);
                                console.log(`Level korrigiert auf: ${char.level}`);
                            }

                            // Robuste Achievement-Initialisierung
                            if (!char.achievements) char.achievements = {};
                            for (const key in DQ_DATA.achievements) {
                                if (!char.achievements[key]) {
                                    char.achievements[key] = { tier: 0, claimable: false };
                                    console.log(`Fehlendes Achievement '${key}' für ${char.name} hinzugefügt.`);
                                }
                            }
                            
                            // Initialisierung der Zähler (bleibt erhalten)
                            if (typeof char.totalGoldEarned === 'undefined') char.totalGoldEarned = char.gold || 0;
                            if (typeof char.totalQuestsCompleted === 'undefined') char.totalQuestsCompleted = 0;
                            if (typeof char.totalItemsPurchased === 'undefined') char.totalItemsPurchased = 0;

                            // --- NEU: Migration für Gewichts-Tracking ---
                            if (typeof char.weightTrackingEnabled === 'undefined') {
                                char.weightTrackingEnabled = true;
                            }
                            if (typeof char.targetWeight === 'undefined') {
                                char.targetWeight = null;
                            }
                            if (typeof char.weightDirection === 'undefined') {
                                char.weightDirection = 'lose';
                            }

                            // Setze die neue Migrationsversion für den Charakter
                            char.migrationVersion = currentVersion;
                            
                            console.log(`Migration für ${char.name} auf Version ${currentVersion} abgeschlossen.`);
                            charStore.put(char);
                        }
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

                // --- NEU: ObjectStore für Gewichtseinträge ---
                if (!db.objectStoreNames.contains('weight_entries')) {
                    const weightStore = db.createObjectStore('weight_entries', { keyPath: 'id', autoIncrement: true });
                    weightStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }
};