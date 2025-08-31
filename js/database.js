const DQ_DB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            const dbName = 'VibeCodenDB', dbVersion = 13; // Version erhöht für gezieltes Update
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
                
                // --- INTELLIGENTES, EINMALIGES UPDATE FÜR ACHIEVEMENTS ---
                charStore.getAll().onsuccess = (event) => {
                    const characters = event.target.result;
                    characters.forEach(char => {
                        // Resettet NUR die Zähler für die alten Achievements
                        char.totalGoldEarned = char.gold; // Beginnt Zählung ab jetzt
                        char.totalQuestsCompleted = 0;
                        char.totalItemsPurchased = 0;

                        // Erstellt die neue, vollständige Achievement-Struktur
                        char.achievements = {
                            level: { tier: 0, claimable: false },
                            quests: { tier: 0, claimable: false },
                            gold: { tier: 0, claimable: false },
                            shop: { tier: 0, claimable: false },
                            strength: { tier: 0, claimable: false },
                            streak: { tier: 0, claimable: false } // Fügt das neue Achievement hinzu
                        };

                        charStore.put(char);
                    });
                };

                // Restliche DB-Struktur bleibt unberührt
                if (db.objectStoreNames.contains('exercises')) db.deleteObjectStore('exercises');
                db.createObjectStore('exercises', { keyPath: 'id' });

                if (!db.objectStoreNames.contains('shop')) db.createObjectStore('shop', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
                
                if (db.objectStoreNames.contains('daily_quests')) db.deleteObjectStore('daily_quests');
                const questStore = db.createObjectStore('daily_quests', { keyPath: 'questId', autoIncrement: true });
                questStore.createIndex('date', 'date', { unique: false });

                if (!db.objectStoreNames.contains('extra_quest')) {
                    db.createObjectStore('extra_quest', { keyPath: 'id' });
                }

                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('questsGenerated_')) {
                        localStorage.removeItem(key);
                    }
                });
            };
        });
    }
};