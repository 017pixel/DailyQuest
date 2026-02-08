/**
 * @file tutorial_state.js
 * @description Verwaltet den Tutorial-Status in IndexedDB
 * Speichert, ob das Tutorial bereits abgespielt wurde
 */

const DQ_TUTORIAL_STATE = {
    /**
     * Prüft, ob das Tutorial bereits abgespielt wurde
     * @returns {Promise<boolean>} true wenn Tutorial bereits abgeschlossen
     */
    async hasCompletedTutorial() {
        return new Promise((resolve, reject) => {
            try {
                if (!DQ_DB.db) {
                    console.warn('Datenbank noch nicht bereit für Tutorial-Check');
                    reject(new Error('DB not initialized'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readonly');
                const store = tx.objectStore('tutorial_state');
                const request = store.get('completed');

                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        // Wenn ein Eintrag existiert (true oder false), respektiere ihn
                        resolve(result.value === true);
                    } else {
                        // Nur wenn gar kein Eintrag existiert, prüfe auf Legacy User
                        this.checkAndMigrateLegacyUser().then(isLegacy => {
                            resolve(isLegacy);
                        });
                    }
                };

                request.onerror = () => {
                    console.error('Fehler beim Lesen des Tutorial-Status');
                    resolve(false);
                };
            } catch (error) {
                console.error('Fehler bei hasCompletedTutorial:', error);
                resolve(false);
            }
        });

    },

    /**
     * Prüft auf Legacy-User (User die die App schon nutzen) und markiert das Tutorial als fertig
     */
    async checkAndMigrateLegacyUser() {
        return new Promise((resolve) => {
            if (!DQ_DB.db) { resolve(false); return; }

            // Check 1: Character Level > 1
            const tx = DQ_DB.db.transaction(['character'], 'readonly');
            const store = tx.objectStore('character');
            const req = store.get(1);

            req.onsuccess = async () => {
                const char = req.result;
                // Wenn Level > 1 oder XP > 0 oder Gold != 200 (Startwert) -> Legacy User
                if (char && (char.level > 1 || char.xp > 0 || char.gold !== 200)) {
                    console.log('Legacy User erkannt (Character Stats) - Markiere Tutorial als fertig');
                    await this.setTutorialCompleted();
                    // Auch alle Features als gesehen markieren
                    const features = ['exercises', 'dailyQuests', 'fokus', 'character', 'stats', 'streak', 'shop', 'inventory', 'extraQuest', 'installApp'];
                    for (const f of features) {
                        await this.markFeatureAsSeen(f);
                    }
                    resolve(true);
                } else {
                    resolve(false);
                }
            };

            req.onerror = () => resolve(false);
        });
    },

    /**
     * Markiert das Tutorial als abgeschlossen
     * @returns {Promise<void>}
     */
    async setTutorialCompleted() {
        return new Promise((resolve, reject) => {
            try {
                if (!DQ_DB.db) {
                    reject(new Error('Datenbank nicht initialisiert'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readwrite');
                const store = tx.objectStore('tutorial_state');

                store.put({
                    key: 'completed',
                    value: true,
                    timestamp: Date.now()
                });

                tx.oncomplete = () => {
                    console.log('Tutorial als abgeschlossen markiert');
                    resolve();
                };

                tx.onerror = (event) => {
                    console.error('Fehler beim Speichern des Tutorial-Status:', event);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Fehler bei setTutorialCompleted:', error);
                reject(error);
            }
        });
    },

    /**
     * Setzt den Tutorial-Status zurück (für Testing)
     * @returns {Promise<void>}
     */
    async resetTutorial() {
        return new Promise((resolve, reject) => {
            try {
                if (!DQ_DB.db) {
                    reject(new Error('Datenbank nicht initialisiert'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readwrite');
                const store = tx.objectStore('tutorial_state');

                // Setze completed auf false statt es zu löschen,
                // damit die Legacy-Migration nicht erneut triggert
                store.put({
                    key: 'completed',
                    value: false,
                    timestamp: Date.now()
                });
                store.delete('features');

                // Auch LocalStorage-Backups bereinigen
                try {
                    localStorage.removeItem('dq_has_equipment');
                    localStorage.removeItem('dq_training_goal');
                } catch (e) {
                    console.warn('Fehler beim Bereinigen des LocalStorage:', e);
                }

                tx.oncomplete = () => {
                    console.log('Tutorial-Status zurückgesetzt');
                    resolve();
                };

                tx.onerror = (event) => {
                    console.error('Fehler beim Zurücksetzen des Tutorial-Status:', event);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Fehler bei resetTutorial:', error);
                reject(error);
            }
        });
    },

    /**
     * Prüft, ob ein bestimmtes Feature bereits im Tutorial erklärt wurde
     * @param {string} featureName - Name des Features (z.B. 'exercises', 'dailyQuests', etc.)
     * @returns {Promise<boolean>} true wenn Feature bereits erklärt wurde
     */
    async hasSeenFeature(featureName) {
        return new Promise((resolve) => {
            try {
                if (!DQ_DB.db) {
                    resolve(false);
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readonly');
                const store = tx.objectStore('tutorial_state');
                const request = store.get('features');

                request.onsuccess = () => {
                    const result = request.result;
                    if (!result || !result.value) {
                        resolve(false);
                        return;
                    }
                    resolve(result.value[featureName] === true);
                };

                request.onerror = () => {
                    console.error('Fehler beim Lesen des Feature-Status');
                    resolve(false);
                };
            } catch (error) {
                console.error('Fehler bei hasSeenFeature:', error);
                resolve(false);
            }
        });
    },

    /**
     * Markiert ein Feature als erklärt
     * @param {string} featureName - Name des Features
     * @returns {Promise<void>}
     */
    async markFeatureAsSeen(featureName) {
        return new Promise((resolve, reject) => {
            try {
                if (!DQ_DB.db) {
                    reject(new Error('Datenbank nicht initialisiert'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readwrite');
                const store = tx.objectStore('tutorial_state');

                // Erst die aktuellen Features laden
                const getRequest = store.get('features');

                getRequest.onsuccess = () => {
                    let features = getRequest.result?.value || {};
                    features[featureName] = true;

                    store.put({
                        key: 'features',
                        value: features,
                        timestamp: Date.now()
                    });
                };

                tx.oncomplete = () => {
                    console.log(`Feature '${featureName}' als gesehen markiert`);
                    resolve();
                };

                tx.onerror = (event) => {
                    console.error('Fehler beim Markieren des Features:', event);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Fehler bei markFeatureAsSeen:', error);
                reject(error);
            }
        });
    }
};

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_STATE = DQ_TUTORIAL_STATE;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_STATE:', e);
}
