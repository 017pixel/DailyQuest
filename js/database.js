const DQ_DB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            const dbName = 'VibeCodenDB', dbVersion = 9;
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
                if (!db.objectStoreNames.contains('character')) db.createObjectStore('character', { keyPath: 'id' });
                
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
            };
        });
    }
};