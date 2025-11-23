const DQ_VIBE_STATE = {
    state: {},
    
    // WALD-Feature entfernt – keine SHOP_ITEMS mehr

    DEFAULT_STATE: {
        key: 'vibeState',
        sessions: [],
        isSessionActive: false,
        timer: {
            mode: 'pomodoro',
            intervalId: null,
            startTime: 0,
            pomodoroDuration: 25 * 60,
            elapsedSeconds: 0,
        },
        linkedQuest: null,
        currentSessionLabel: null
    },

    async loadState() {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction('vibe_state', 'readwrite');
            const store = tx.objectStore('vibe_state');
            const request = store.get('vibeState');

            tx.oncomplete = () => {
                if (this.state) {
                    this.state.isSessionActive = false;
                    if (this.state.timer) this.state.timer.intervalId = null;
                }
                resolve(this.state);
            };
            tx.onerror = (e) => reject("Fehler beim Laden des Vibe-Zustands: " + e.target.error);

            request.onsuccess = (e) => {
                let loadedState = e.target.result;
                if (!loadedState) {
                    console.log("Kein Vibe-Zustand gefunden, erstelle Standardzustand.");
                    loadedState = { ...this.DEFAULT_STATE };
                    store.put(loadedState); 
                } else {
                    // Migration: entferne Wald-bezogene Felder (unlockedEmojis, selectedEmoji, emoji in Sessions)
                    let migrated = false;
                    if ('unlockedEmojis' in loadedState) { delete loadedState.unlockedEmojis; migrated = true; }
                    if ('selectedEmoji' in loadedState) { delete loadedState.selectedEmoji; migrated = true; }
                    if (Array.isArray(loadedState.sessions)) {
                        loadedState.sessions = loadedState.sessions.map(s => {
                            if (s && 'emoji' in s) { const { emoji, ...rest } = s; migrated = true; return rest; }
                            return s;
                        });
                    }
                    if (migrated) {
                        try { store.put(loadedState); } catch {}
                    }
                }
                this.state = loadedState;
            };
        });
    },

    async saveState() {
        return new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction('vibe_state', 'readwrite');
            const store = tx.objectStore('vibe_state');
            
            const stateToSave = { ...this.state };
            if (stateToSave.timer) {
                delete stateToSave.timer.intervalId;
            }

            const request = store.put(stateToSave);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject("Fehler beim Speichern des Vibe-Zustands: " + e.target.error);
        });
    }
};