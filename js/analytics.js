/**
 * @file analytics.js
 * @description Zentrales Analytics-Modul fuer DailyQuest.
 * Zweck: Speichert Events, Shop-Historie, Extra-Quest-Historie, Level-Ups und woechtenliche Snapshots.
 * Verbindungen: Wird von main.js, page_shop.js, page_extra_quest.js, training_system.js aufgerufen.
 */
const DQ_ANALYTICS = {

    // --- Event Logging ---

    logEvent(type, data) {
        if (!DQ_DB.db) return Promise.resolve();
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['character_events'], 'readwrite');
                const store = tx.objectStore('character_events');
                store.add({
                    timestamp: Date.now(),
                    type,
                    ...data
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch { resolve(); }
        });
    },

    logShopPurchase(item, cost, transactionType = 'buy') {
        if (!DQ_DB.db) return Promise.resolve();
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['shop_history'], 'readwrite');
                const store = tx.objectStore('shop_history');
                store.add({
                    timestamp: Date.now(),
                    itemId: item.id,
                    itemNameKey: item.nameKey || item.name,
                    itemName: item.name,
                    cost,
                    type: transactionType
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch { resolve(); }
        });
    },

    logExtraQuest(quest, durationMinutes = null) {
        if (!DQ_DB.db) return Promise.resolve();
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['extra_quest_history'], 'readwrite');
                const store = tx.objectStore('extra_quest_history');
                store.add({
                    timestamp: Date.now(),
                    nameKey: quest.nameKey,
                    manaReward: quest.manaReward,
                    goldReward: quest.goldReward,
                    completedInMinutes: durationMinutes
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch { resolve(); }
        });
    },

    logLevelUp(fromLevel, toLevel) {
        if (!DQ_DB.db) return Promise.resolve();
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['level_up_history'], 'readwrite');
                const store = tx.objectStore('level_up_history');
                store.add({
                    timestamp: Date.now(),
                    fromLevel,
                    toLevel
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch { resolve(); }
        });
    },

    logQuestCompletion(quest, durationSeconds = null) {
        return this.logEvent('quest_completed', {
            questId: quest.questId,
            nameKey: quest.nameKey,
            goal: quest.goal,
            mana: quest.manaReward,
            gold: quest.goldReward,
            duration: durationSeconds,
            completionMode: quest.completionMode
        });
    },

    logFocusSession(durationMinutes, label) {
        return this.logEvent('focus_session', {
            duration: durationMinutes,
            label: label || 'Unbenannt'
        });
    },

    logEnduranceEntry(distance, duration, power) {
        return this.logEvent('endurance_entry', {
            distance,
            duration,
            power
        });
    },

    logFreeTraining(exerciseNameKey, mana, gold) {
        return this.logEvent('free_training', {
            nameKey: exerciseNameKey,
            mana,
            gold
        });
    },

    // --- Weekly Snapshot ---

    async takeWeeklySnapshot(char) {
        if (!DQ_DB.db || !char) return;
        const today = new Date();
        const weekKey = this._getWeekKey(today);

        // Pruefen ob fuer diese Woche schon ein Snapshot existiert
        const exists = await new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['player_snapshots'], 'readonly');
                const store = tx.objectStore('player_snapshots');
                const index = store.index('date');
                const req = index.getAll(weekKey);
                req.onsuccess = () => resolve(req.result.length > 0);
                req.onerror = () => resolve(true);
            } catch { resolve(true); }
        });

        if (exists) return;

        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['player_snapshots'], 'readwrite');
                const store = tx.objectStore('player_snapshots');
                store.add({
                    date: weekKey,
                    timestamp: Date.now(),
                    level: char.level,
                    mana: char.mana,
                    manaToNextLevel: char.manaToNextLevel,
                    gold: char.gold,
                    totalGoldEarned: char.totalGoldEarned || 0,
                    totalQuestsCompleted: char.totalQuestsCompleted || 0,
                    totalItemsPurchased: char.totalItemsPurchased || 0,
                    stats: { ...char.stats },
                    streak: DQ_CONFIG.getStreakData().streak
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch { resolve(); }
        });
    },

    async maybeTakeSnapshot(char) {
        if (!char) return;
        const lastSnapshot = await this._getLastSnapshotDate();
        const now = new Date();
        const weekKey = this._getWeekKey(now);
        if (lastSnapshot !== weekKey) {
            await this.takeWeeklySnapshot(char);
        }
    },

    _getWeekKey(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNo}`;
    },

    _getLastSnapshotDate() {
        return new Promise(resolve => {
            try {
                const tx = DQ_DB.db.transaction(['player_snapshots'], 'readonly');
                const store = tx.objectStore('player_snapshots');
                const req = store.openCursor(null, 'prev');
                req.onsuccess = () => {
                    const cursor = req.result;
                    resolve(cursor ? cursor.value.date : null);
                };
                req.onerror = () => resolve(null);
            } catch { resolve(null); }
        });
    },

    // --- Data Retrieval for Cards ---

    async getAllData() {
        if (!DQ_DB.db) return null;
        const db = DQ_DB.db;

        const promises = [
            new Promise(res => {
                const tx = db.transaction('training_activity_log', 'readonly');
                const req = tx.objectStore('training_activity_log').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            }),
            new Promise(res => {
                const tx = db.transaction('player_snapshots', 'readonly');
                const req = tx.objectStore('player_snapshots').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            }),
            new Promise(res => {
                const tx = db.transaction('shop_history', 'readonly');
                const req = tx.objectStore('shop_history').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            }),
            new Promise(res => {
                const tx = db.transaction('extra_quest_history', 'readonly');
                const req = tx.objectStore('extra_quest_history').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            }),
            new Promise(res => {
                const tx = db.transaction('level_up_history', 'readonly');
                const req = tx.objectStore('level_up_history').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            }),
            new Promise(res => {
                const tx = db.transaction('character_events', 'readonly');
                const req = tx.objectStore('character_events').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            }),
            new Promise(res => {
                const tx = db.transaction('vibe_state', 'readonly');
                const req = tx.objectStore('vibe_state').get('vibeState');
                req.onsuccess = () => res(req.result || { sessions: [] });
                req.onerror = () => res({ sessions: [] });
            }),
            new Promise(res => {
                const tx = db.transaction('weight_entries', 'readonly');
                const req = tx.objectStore('weight_entries').getAll();
                req.onsuccess = () => res(req.result);
                req.onerror = () => res([]);
            })
        ];

        const [
            activityLog,
            snapshots,
            shopHistory,
            extraQuestHistory,
            levelUpHistory,
            events,
            vibeState,
            weightEntries
        ] = await Promise.all(promises);

        return {
            activityLog,
            snapshots,
            shopHistory,
            extraQuestHistory,
            levelUpHistory,
            events,
            vibeState,
            weightEntries
        };
    }
};

try { window.DQ_ANALYTICS = DQ_ANALYTICS; } catch { }
