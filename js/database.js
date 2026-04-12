/**
 * @file database.js
 * @description Initialisiert und verwaltet die IndexedDB-Datenbank.
 * Zweck: Stellt eine zentrale Schnittstelle für die Datenpersistenz der Anwendung bereit.
 * Wichtige Funktionen: init() initialisiert die Verbindung und führt bei Bedarf Migrationen durch.
 * Verbindungen: Wird von fast allen anderen Modulen genutzt, um Daten zu lesen oder zu schreiben.
 */
const DQ_DB = {
    db: null,
    init: function () {
        return new Promise((resolve, reject) => {
            // --- VERSION ERHÖHT, UM UPDATE FÜR ALLE NUTZER ZU ERZWINGEN ---
            const dbName = 'VibeCodenDB', dbVersion = 27;
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
                const oldVersion = e.oldVersion;

                console.log(`Datenbank-Upgrade wird durchgeführt von Version ${oldVersion} auf ${dbVersion}...`);

                // --- ROBUSTER UPDATE-PROZESS ---
                // Dieser Code stellt sicher, dass alle notwendigen Tabellen existieren.
                // Er wird bei der allerersten Initialisierung und bei jedem Versions-Upgrade ausgeführt.

                if (oldVersion < 21) {
                    console.log("Upgrade-Schritt: Erstelle 'focus_labels' Object Store.");
                    if (!db.objectStoreNames.contains('focus_labels')) {
                        db.createObjectStore('focus_labels', { keyPath: 'id', autoIncrement: true });
                    }
                }

                // Sicherheits-Checks, um sicherzustellen, dass alle Tabellen vorhanden sind.
                if (!db.objectStoreNames.contains('character')) db.createObjectStore('character', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('shop')) db.createObjectStore('shop', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('daily_quests')) {
                    const questStore = db.createObjectStore('daily_quests', { keyPath: 'questId', autoIncrement: true });
                    questStore.createIndex('date', 'date', { unique: false });
                }
                if (!db.objectStoreNames.contains('extra_quest')) db.createObjectStore('extra_quest', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('weight_entries')) {
                    const weightStore = db.createObjectStore('weight_entries', { keyPath: 'id', autoIncrement: true });
                    weightStore.createIndex('date', 'date', { unique: false });
                }
                if (!db.objectStoreNames.contains('vibe_state')) {
                    db.createObjectStore('vibe_state', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('dungeon_progress')) {
                    db.createObjectStore('dungeon_progress', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('tutorial_state')) {
                    db.createObjectStore('tutorial_state', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('tutorial_dynamic_state')) {
                    db.createObjectStore('tutorial_dynamic_state', { keyPath: 'key' });
                }

                console.log("Datenbank-Upgrade abgeschlossen.");
            };
        });
    }
};

// --- DUNGEON PROGRESS HELPERS ---
// Persist global dungeon level progression in IndexedDB, independent of DQ_CONFIG load order
const DQ_DUNGEON_PERSIST = {
    getLevel() {
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['dungeon_progress'], 'readonly');
                const store = tx.objectStore('dungeon_progress');
                const req = store.get('globalLevel');
                req.onsuccess = () => {
                    const row = req.result;
                    resolve((row && typeof row.value === 'number' && row.value > 0) ? row.value : 1);
                };
                req.onerror = () => resolve(1);
            } catch {
                resolve(1);
            }
        });
    },
    incrementLevel() {
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['dungeon_progress'], 'readwrite');
                const store = tx.objectStore('dungeon_progress');
                store.get('globalLevel').onsuccess = (e) => {
                    const current = e.target.result;
                    const nextVal = (current && typeof current.value === 'number') ? current.value + 1 : 1;
                    store.put({ key: 'globalLevel', value: nextVal });
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        });
    },
    // Persist whether a dungeon is currently active (spawned) and should show the chip
    getActiveDungeon() {
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['dungeon_progress'], 'readonly');
                const store = tx.objectStore('dungeon_progress');
                const req = store.get('activeDungeon');
                req.onsuccess = () => {
                    const row = req.result;
                    resolve(!!(row && row.value));
                };
                req.onerror = () => resolve(false);
            } catch { resolve(false); }
        });
    },
    setActiveDungeon(flag) {
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['dungeon_progress'], 'readwrite');
                const store = tx.objectStore('dungeon_progress');
                store.put({ key: 'activeDungeon', value: !!flag });
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch { resolve(); }
        });
    }
};
try { window.DQ_DUNGEON_PERSIST = DQ_DUNGEON_PERSIST; } catch { }
