/**
 * @file tutorial_main.js
 * @description Hauptlogik für das Intro-Tutorial
 * Mit Equipment- und Trainingsziel-Auswahl für personalisierte Pläne
 */

const DQ_TUTORIAL_MAIN = {
    currentTextIndex: 0,
    playerName: '',
    hasEquipment: false,
    trainingGoal: '',
    continueButton: null,
    waitingForContinue: false,

    /**
     * Liste der Intro-Texte
     */
    texts: [
        'Willkommen bei DailyQuest, einem System, das dein Leben verändern wird.',
        'Hier geht es um DICH – um deinen Fortschritt, deine Ziele und deine täglichen Siege.',
        'Bevor wir starten: Wie heißt du?'
    ],

    /**
     * Startet das Tutorial
     */
    async start() {
        console.log('Starte Intro-Tutorial');

        // Overlay anzeigen (initial ist es hidden)
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }

        // Pulsierenden Hintergrund anzeigen
        const pulseContainer = document.querySelector('.background-pulse-container');
        if (pulseContainer) {
            pulseContainer.classList.add('visible');
        }

        // Continue-Button erstellen
        this.createContinueButton();

        // Texte durchlaufen
        for (let i = 0; i < this.texts.length; i++) {
            const text = this.texts[i];
            await this.showText(text);

            // Continue-Button anzeigen und warten
            this.showContinueButton();
            await this.waitForContinue();
            this.hideContinueButton();

            await this.hideText();
            await this.delay(500);
        }

        // Nach den Intro-Texten: Namenseingabe
        await this.showNameInput();
    },

    /**
     * Erstellt den Continue-Button
     */
    createContinueButton() {
        if (this.continueButton) return;

        this.continueButton = document.createElement('button');
        this.continueButton.id = 'tutorial-continue-btn';
        this.continueButton.textContent = 'Weiter';
        this.continueButton.classList.add('hidden');

        this.continueButton.addEventListener('click', () => {
            this.waitingForContinue = false;
        });

        document.getElementById('tutorial-overlay').appendChild(this.continueButton);
    },

    /**
     * Zeigt den Continue-Button
     */
    showContinueButton() {
        if (this.continueButton) {
            this.continueButton.classList.remove('hidden');
        }
    },

    /**
     * Versteckt den Continue-Button
     */
    hideContinueButton() {
        if (this.continueButton) {
            this.continueButton.classList.add('hidden');
        }
    },

    /**
     * Wartet auf Button-Klick
     */
    async waitForContinue() {
        this.waitingForContinue = true;
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!this.waitingForContinue) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    },

    /**
     * Zeigt die App-Inhalte an
     */
    showAppContent() {
        const appContainer = document.getElementById('app-container');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');

        if (appContainer) appContainer.style.opacity = '1';
        if (header) header.style.opacity = '1';
        if (nav) nav.style.opacity = '1';
    },

    /**
     * Zeigt einen Text an
     * @param {string} text - Der anzuzeigende Text
     */
    async showText(text) {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;

        container.innerHTML = `<div class="tutorial-text">${text}</div>`;
    },

    /**
     * Blendet den aktuellen Text aus
     */
    async hideText() {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;

        const textElement = container.querySelector('.tutorial-text');
        if (textElement) {
            textElement.classList.add('fade-out');
            await this.delay(800);
            container.innerHTML = '';
        }
    },

    /**
     * Zeigt das Namenseingabe-Feld
     */
    async showNameInput() {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;

        container.innerHTML = `
            <div id="tutorial-name-input-container">
                <input 
                    type="text" 
                    id="tutorial-name-input" 
                    placeholder="Dein Name..." 
                    maxlength="20"
                    autocomplete="off"
                />
                <button id="tutorial-name-submit">Bestätigen</button>
            </div>
        `;

        // Input-Feld Fokus geben
        const input = document.getElementById('tutorial-name-input');
        if (input) {
            setTimeout(() => input.focus(), 300);

            // Enter-Taste zum Bestätigen
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitName();
                }
            });
        }

        // Submit-Button Event
        const submitBtn = document.getElementById('tutorial-name-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitName());
        }
    },

    /**
     * Verarbeitet die Namenseingabe
     */
    async submitName() {
        const input = document.getElementById('tutorial-name-input');
        if (!input) return;

        const name = input.value.trim();

        if (name.length === 0) {
            // Leere Eingabe - Feedback geben
            input.style.borderColor = '#ff6b6b';
            input.placeholder = 'Bitte gib deinen Namen ein';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 1000);
            return;
        }

        this.playerName = name;

        // Namenseingabe ausblenden
        const container = document.getElementById('tutorial-name-input-container');
        if (container) {
            container.classList.add('fade-out');
            await this.delay(800);
        }

        // Equipment-Auswahl anzeigen
        await this.showEquipmentSelection();
    },

    /**
     * Zeigt die Equipment-Auswahl an
     */
    async showEquipmentSelection() {
        const textContainer = document.getElementById('tutorial-text-container');
        if (!textContainer) return;

        await this.showText('Welches Trainings-Equipment hast du zur Verfügung?');
        await this.delay(1000); // Längere Pause damit Text gelesen werden kann

        // Verwende insertAdjacentHTML statt innerHTML += um Flackern zu vermeiden
        const html = `
            <div id="tutorial-equipment-selection" class="tutorial-selection-container">
                <button class="tutorial-choice-btn" data-equipment="true">
                    <span class="material-symbols-rounded" style="font-size: 32px;">fitness_center</span>
                    <span>Hanteln & Langhantel</span>
                    <span class="choice-description">Ich habe Zugang zu Gewichten</span>
                </button>
                <button class="tutorial-choice-btn" data-equipment="false">
                    <span class="material-symbols-rounded" style="font-size: 32px;">self_improvement</span>
                    <span>Kein Equipment</span>
                    <span class="choice-description">Nur Körpergewichtsübungen</span>
                </button>
            </div>
        `;
        textContainer.insertAdjacentHTML('beforeend', html);

        // Event Listener
        const buttons = document.querySelectorAll('[data-equipment]');
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                this.hasEquipment = btn.dataset.equipment === 'true';

                // Ausblenden
                const selection = document.getElementById('tutorial-equipment-selection');
                if (selection) {
                    selection.classList.add('fade-out');
                    await this.delay(800);
                }

                await this.hideText();
                await this.delay(500);

                // Trainingsziel-Auswahl
                await this.showGoalSelection();
            });
        });
    },

    /**
     * Zeigt die Trainingsziel-Auswahl an
     */
    async showGoalSelection() {
        const textContainer = document.getElementById('tutorial-text-container');
        if (!textContainer) return;

        await this.showText('Was ist dein Trainingsziel?');
        await this.delay(1000); // Längere Pause

        const html = `
            <div id="tutorial-goal-selection" class="tutorial-selection-container">
                <button class="tutorial-choice-btn" data-goal="muscle">
                    <span class="material-symbols-rounded" style="font-size: 32px;">exercise</span>
                    <span>Muskelaufbau</span>
                    <span class="choice-description">Kraft und Muskelmasse aufbauen</span>
                </button>
                <button class="tutorial-choice-btn" data-goal="endurance">
                    <span class="material-symbols-rounded" style="font-size: 32px;">directions_run</span>
                    <span>Ausdauer</span>
                    <span class="choice-description">Kondition und Durchhaltevermögen</span>
                </button>
                <button class="tutorial-choice-btn" data-goal="fatloss">
                    <span class="material-symbols-rounded" style="font-size: 32px;">trending_down</span>
                    <span>Abnehmen</span>
                    <span class="choice-description">Gewicht reduzieren und fit werden</span>
                </button>
            </div>
        `;
        textContainer.insertAdjacentHTML('beforeend', html);

        // Event Listener
        const buttons = document.querySelectorAll('[data-goal]');
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                this.trainingGoal = btn.dataset.goal;

                // Ausblenden
                const selection = document.getElementById('tutorial-goal-selection');
                if (selection) {
                    selection.classList.add('fade-out');
                    await this.delay(800);
                }

                await this.hideText();
                await this.delay(500);

                // Charakter mit persönlichen Daten erstellen
                await this.initializeCharacterWithName(this.playerName);

                // Willkommens-Sequenz
                await this.showWelcomeSequence();
            });
        });
    },

    /**
     * Initialisiert Charakter mit Namen und personalisierten Einstellungen
     * @param {string} name - Spielername
     */
    async initializeCharacterWithName(name) {
        return new Promise((resolve, reject) => {
            try {
                // Goal automatisch zuordnen basierend auf Equipment + Trainingsziel
                let finalGoal = 'muscle'; // Default

                if (this.trainingGoal === 'muscle') {
                    // Muskelaufbau
                    finalGoal = this.hasEquipment ? 'muscle' : 'calisthenics';
                } else if (this.trainingGoal === 'endurance') {
                    finalGoal = 'endurance';
                } else if (this.trainingGoal === 'fatloss') {
                    finalGoal = 'fatloss';
                }

                console.log(`Initialisiere Charakter: ${name}, Equipment: ${this.hasEquipment}, Ziel: ${this.trainingGoal} → Goal: ${finalGoal}`);

                if (!DQ_DB.db) {
                    console.error('Datenbank nicht initialisiert');
                    reject(new Error('DB not initialized'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['character', 'settings'], 'readwrite');
                const charStore = tx.objectStore('character');
                const settingsStore = tx.objectStore('settings');

                // 1. Charakter erstellen/aktualisieren
                charStore.get(1).onsuccess = (e) => {
                    let char = e.target.result;
                    if (!char) {
                        // Neuen Charakter erstellen
                        char = {
                            id: 1,
                            name: name,
                            level: 1,
                            mana: 0,
                            manaToNextLevel: 100,
                            gold: 200,
                            stats: {
                                kraft: 5,
                                ausdauer: 5,
                                beweglichkeit: 5,
                                durchhaltevermoegen: 5,
                                willenskraft: 5
                            },
                            statProgress: {
                                kraft: 0,
                                ausdauer: 0,
                                beweglichkeit: 0,
                                durchhaltevermoegen: 0,
                                willenskraft: 0
                            },
                            equipment: {
                                weapons: [],
                                armor: null
                            },
                            inventory: [],
                            combat: {
                                attack: 0,
                                protection: 0,
                                hpMax: 100,
                                hpCurrent: 100
                            }
                        };
                    } else {
                        // Existierenden Charakter aktualisieren
                        char.name = name;
                    }
                    charStore.put(char);
                };

                // 2. Einstellungen speichern (Goal setzen)
                settingsStore.get(1).onsuccess = (e) => {
                    let settings = e.target.result;
                    if (!settings) {
                        settings = {
                            id: 1,
                            goal: finalGoal,
                            difficulty: 2,
                            restDays: 1,
                            language: 'de',
                            theme: 'dark',
                            weightTracking: false
                        };
                    } else {
                        settings.goal = finalGoal;
                    }
                    settingsStore.put(settings);

                    // Update global config immediately
                    if (typeof DQ_CONFIG !== 'undefined') {
                        DQ_CONFIG.userSettings = settings;
                    }
                };

                tx.oncomplete = async () => {
                    console.log('Charakter und Einstellungen erfolgreich gespeichert.');

                    // Optional: Equipment-Status im LocalStorage als Backup
                    try {
                        localStorage.setItem('dq_has_equipment', this.hasEquipment ? '1' : '0');
                        localStorage.setItem('dq_training_goal', this.trainingGoal);
                    } catch (e) {
                        console.warn('LocalStorage Fehler:', e);
                    }

                    // KRITISCH: Daily Quests mit neuem Goal neu generieren!
                    if (typeof generateDailyQuestsIfNeeded === 'function') {
                        console.log(`Generiere Daily Quests für neues Ziel: ${finalGoal}`);
                        await generateDailyQuestsIfNeeded(true);
                    }

                    // UI aktualisieren, damit die Änderungen sofort sichtbar sind
                    if (typeof DQ_EXERCISES !== 'undefined') {
                        console.log('Aktualisiere Übungen basierend auf neuem Ziel...');
                        DQ_EXERCISES.renderQuests();
                        DQ_EXERCISES.renderFreeExercisesPage();
                    }

                    if (typeof DQ_CHARACTER_MAIN !== 'undefined') {
                        DQ_CHARACTER_MAIN.renderPage();
                    }

                    resolve();
                };

                tx.onerror = (e) => {
                    console.error('Fehler beim Speichern in DB:', e);
                    reject(e);
                };

            } catch (error) {
                console.error('Fehler beim Initialisieren des Charakters:', error);
                reject(error);
            }
        });
    },

    /**
     * Zeigt die Willkommens-Sequenz
     */
    async showWelcomeSequence() {
        const welcomeTexts = [
            `Herzlich Willkommen ${this.playerName}, ich bin gespannt, wie unsere Reise verlaufen wird.`,
            'Was jetzt kommen wird, wird dein Leben verändern. Es wird dein Leben produktiver und strukturierter machen!',
            'Das hier, ist DailyQuest:'
        ];

        for (let i = 0; i < welcomeTexts.length; i++) {
            const text = welcomeTexts[i];
            await this.showText(text);

            // Beim letzten Text: 3 Sekunden warten, dann automatisch weiter
            if (i === welcomeTexts.length - 1) {
                await this.delay(3000);
            } else {
                // Bei anderen Texten: Weiter-Button anzeigen
                this.showContinueButton();
                await this.waitForContinue();
                this.hideContinueButton();
            }

            await this.hideText();
            await this.delay(500);
        }

        // App-Reveal starten
        await this.revealApp();
    },

    /**
     * Enthüllt die App mit der Slide-Up Animation
     */
    async revealApp() {
        // App-Inhalte einblenden (aber noch unter dem schwarzen Overlay)
        this.showAppContent();

        // Overlay nach oben gleiten lassen
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.add('reveal');
            await this.delay(1500); // Animation dauert 1.5s
        }

        // Overlay komplett entfernen
        if (overlay) {
            overlay.classList.add('hidden');
        }

        // Pulsierenden Hintergrund ausblenden
        const pulseContainer = document.querySelector('.background-pulse-container');
        if (pulseContainer) {
            pulseContainer.classList.remove('visible');
            // Optional: Nach Animation entfernen
            setTimeout(() => pulseContainer.remove(), 1000);
        }

        // Kurze Pause, damit User die App sieht
        await this.delay(1000);

        // Feature-Tour starten
        await this.startFeatureTour();
    },

    /**
     * Startet die Feature-Tour (ANGEPASST - Startet progressives Tutorial)
     */
    async startFeatureTour() {
        // Intro-Tutorial ist abgeschlossen, markiere es
        await DQ_TUTORIAL_STATE.setTutorialCompleted();

        // Starte das erste progressive Tutorial für die Übungen-Seite
        console.log('Starte progressives Tutorial für Exercises-Seite');

        // Kurze Pause, damit User die App sieht
        await this.delay(1000);

        // Zeige Exercises-Tutorial (erste Seite)
        if (typeof DQ_TUTORIAL_PROGRESSIVE !== 'undefined') {
            await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('exercises');
        }
    },

    /**
     * Hilfsfunktion für Verzögerungen
     * @param {number} ms - Millisekunden
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_MAIN = DQ_TUTORIAL_MAIN;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_MAIN:', e);
}
