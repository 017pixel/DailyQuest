const DQ_DB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            const dbName = 'VibeCodenDB', dbVersion = 10;
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
                
                charStore.getAll().onsuccess = (event) => {
                    const characters = event.target.result;
                    characters.forEach(char => {
                        if (!char.statProgress) {
                            char.statProgress = { kraft: 0, ausdauer: 0, beweglichkeit: 0, durchhaltevermoegen: 0, willenskraft: 0 };
                        }
                        if (char.completedExercises) {
                            delete char.completedExercises;
                        }
                        charStore.put(char);
                    });
                };

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

                // --- BUGFIX HIER ---
                // Lösche alle alten Quest-Generierungs-Flags, um eine Neugenerierung zu erzwingen.
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('questsGenerated_')) {
                        localStorage.removeItem(key);
                    }
                });
            };
        });
    }
};