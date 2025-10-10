const DQ_VIBE_STATE = {
    state: {},
    
    // --- KONSTANTEN ---
    SHOP_ITEMS: [
        { emoji: '🌲', price: 0, name: { de: 'Nadelbaum', en: 'Conifer' }, category: 'forest' },
        { emoji: '🍄', price: 0, name: { de: 'Pilz', en: 'Mushroom' }, category: 'forest' },
        { emoji: '🌳', price: 100, name: { de: 'Laubbaum', en: 'Deciduous Tree' }, category: 'forest' },
        { emoji: '🌿', price: 120, name: { de: 'Kraut', en: 'Herb' }, category: 'forest' },
        { emoji: '☘️', price: 150, name: { de: 'Klee', en: 'Shamrock' }, category: 'forest' },
        { emoji: '🍁', price: 250, name: { de: 'Ahorn', en: 'Maple' }, category: 'forest' },
        { emoji: '🌸', price: 200, name: { de: 'Kirschblüte', en: 'Cherry Blossom' }, category: 'garden' },
        { emoji: '🌷', price: 220, name: { de: 'Tulpe', en: 'Tulip' }, category: 'garden' },
        { emoji: '🌹', price: 300, name: { de: 'Rose', en: 'Rose' }, category: 'garden' },
        { emoji: '🌻', price: 350, name: { de: 'Sonnenblume', en: 'Sunflower' }, category: 'garden' },
        { emoji: '🐛', price: 150, name: { de: 'Raupe', en: 'Bug' }, category: 'creatures' },
        { emoji: '🐌', price: 180, name: { de: 'Schnecke', en: 'Snail' }, category: 'creatures' },
        { emoji: '🦋', price: 600, name: { de: 'Schmetterling', en: 'Butterfly' }, category: 'creatures' },
        { emoji: '🦄', price: 7500, name: { de: 'Einhorn', en: 'Unicorn' }, category: 'special' },
        { emoji: '🐉', price: 10000, name: { de: 'Drache', en: 'Dragon' }, category: 'special' },
        { emoji: '💎', price: 12000, name: { de: 'Diamant', en: 'Gem Stone' }, category: 'special' },
    ],

    DEFAULT_STATE: {
        key: 'vibeState',
        unlockedEmojis: ['🌲', '🍄'],
        sessions: [],
        isSessionActive: false,
        timer: {
            mode: 'pomodoro',
            intervalId: null,
            startTime: 0,
            pomodoroDuration: 25 * 60,
            elapsedSeconds: 0,
        },
        selectedEmoji: '🌲',
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