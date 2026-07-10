/**
 * Zentrale Export-/Restore-Logik fuer lokale Backups und Cloud-Snapshots.
 * Das flache DQ1-Format bleibt fuer DailyQuest-Next kompatibel.
 */
const DQ_BACKUP = {
    FORMAT_VERSION: 1,

    getLocalDateString(date = new Date()) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    createExport(storeData, options = {}) {
        const suppliedTime = options.now && typeof options.now.getTime === 'function' ? options.now.getTime() : NaN;
        const now = Number.isFinite(suppliedTime) ? new Date(suppliedTime) : new Date();
        const streakData = options.streakData || { streak: 0, lastDate: null };
        return {
            ...storeData,
            backupMeta: {
                schemaVersion: this.FORMAT_VERSION,
                source: 'DailyQuest',
                appVersion: options.appVersion || null,
                exportedAt: now.toISOString(),
                exportedLocalDate: this.getLocalDateString(now)
            },
            streakData: {
                streak: Math.max(0, Math.floor(Number(streakData.streak) || 0)),
                lastDate: typeof streakData.lastDate === 'string' ? streakData.lastDate : null
            }
        };
    },

    extractStores(raw) {
        if (raw?.state?.stores && typeof raw.state.stores === 'object') return raw.state.stores;
        if (raw?.stores && typeof raw.stores === 'object') return raw.stores;
        if (raw?.indexedDb && typeof raw.indexedDb === 'object') return raw.indexedDb;
        return raw;
    },

    prepareRestore(raw, options = {}) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Ungueltige Backup-Datei.');
        }

        const sourceStores = this.extractStores(raw);
        if (!sourceStores || typeof sourceStores !== 'object') {
            throw new Error('Backup enthaelt keine Datenbankdaten.');
        }

        const stores = {};
        for (const [name, value] of Object.entries(sourceStores)) {
            if (Array.isArray(value)) stores[name] = value.slice();
        }

        if (!Array.isArray(stores.character) || !stores.character.some(item => item && typeof item === 'object')) {
            throw new Error('Backup enthaelt keinen Charakter.');
        }
        if (!Array.isArray(stores.settings) || !stores.settings.some(item => item && typeof item === 'object')) {
            throw new Error('Backup enthaelt keine Einstellungen.');
        }

        const suppliedTime = options.now && typeof options.now.getTime === 'function' ? options.now.getTime() : NaN;
        const now = Number.isFinite(suppliedTime) ? new Date(suppliedTime) : new Date();
        const today = options.today || this.getLocalDateString(now);
        const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterday = options.yesterday || this.getLocalDateString(yesterdayDate);

        if (Array.isArray(stores.extra_quest)) {
            stores.extra_quest = stores.extra_quest.filter(quest => {
                if (!quest || quest.completed || !quest.deadline) return true;
                const deadline = new Date(quest.deadline).getTime();
                return !Number.isFinite(deadline) || deadline >= now.getTime();
            });
        }

        const sourceStreak = options.streakData || raw.streakData || raw.streak_data || {};
        const streak = Math.max(0, Math.floor(Number(sourceStreak.streak) || 0));
        let lastDate = typeof sourceStreak.lastDate === 'string' ? sourceStreak.lastDate : null;
        if (streak > 0) {
            lastDate = lastDate === today ? today : yesterday;
        } else {
            lastDate = null;
        }

        return {
            stores,
            streakData: { streak, lastDate },
            lastPenaltyCheck: today,
            backupMeta: raw.backupMeta || raw.meta || null
        };
    },

    applyLocalState(prepared, appVersion) {
        localStorage.setItem('streakData', JSON.stringify(prepared.streakData));
        localStorage.setItem('lastPenaltyCheck', prepared.lastPenaltyCheck);
        if (appVersion) localStorage.setItem('dq_seen_app_version', appVersion);
        localStorage.setItem('dq_last_local_update', String(Date.now()));
        localStorage.removeItem('dq_sync_conflict');
        localStorage.removeItem('dq_cloud_updated_at');
    },

    async exportIndexedDB(db) {
        if (!db) return {};
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readonly');
        const results = await Promise.all(storeNames.map(storeName => new Promise((resolve, reject) => {
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve({ name: storeName, data: request.result });
            request.onerror = () => reject(request.error || new Error(`Store ${storeName} konnte nicht exportiert werden.`));
        })));
        return Object.fromEntries(results.map(result => [result.name, result.data]));
    },

    restoreIndexedDB(db, stores) {
        if (!db) return Promise.reject(new Error('Datenbank ist nicht bereit.'));
        const storeNames = Array.from(db.objectStoreNames);
        return new Promise((resolve, reject) => {
            let settled = false;
            const finishReject = error => {
                if (settled) return;
                settled = true;
                reject(error && typeof error.message === 'string' ? error : new Error('Backup konnte nicht importiert werden.'));
            };

            let tx;
            try {
                tx = db.transaction(storeNames, 'readwrite');
                tx.oncomplete = () => {
                    if (settled) return;
                    settled = true;
                    resolve();
                };
                tx.onerror = () => finishReject(tx.error || new Error('Import-Transaktion fehlgeschlagen.'));
                tx.onabort = () => finishReject(tx.error || new Error('Import-Transaktion wurde abgebrochen.'));

                for (const storeName of storeNames) {
                    const store = tx.objectStore(storeName);
                    store.clear();
                    const records = Array.isArray(stores[storeName]) ? stores[storeName] : [];
                    records.forEach(record => store.put(record));
                }
            } catch (error) {
                try { tx?.abort(); } catch (_) { /* Transaktion ist bereits beendet. */ }
                finishReject(error);
            }
        });
    }
};

try { window.DQ_BACKUP = DQ_BACKUP; } catch (_) { /* Node-Testumgebung */ }
if (typeof module !== 'undefined' && module.exports) module.exports = DQ_BACKUP;
