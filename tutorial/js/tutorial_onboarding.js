Object.assign(DQ_TUTORIAL_MAIN, {
    async showPreNameWelcome() {
        this.showText('Willkommen bei DailyQuest.');
        this.showContinueButton('Starten');
        await this.waitForContinue();
        this.hideContinueButton();
        await this.hideText();
        await this.delay(250);
    },

    updateAgePrompt(container) {
        const note = container.querySelector('#tutorial-age-note');
        const normalLink = container.querySelector('#tutorial-normal-mode-link');
        const seniorActive = this.age >= 60 && !this.seniorModeOptOut;

        if (seniorActive) {
            note.textContent = 'Beim Fortfahren wird der Rentnermodus aktiviert.';
            note.classList.remove('hidden');
            normalLink.classList.remove('hidden');
        } else if (this.age >= 60 && this.seniorModeOptOut) {
            note.textContent = 'Normaler Modus gewählt. Den Rentnermodus kannst du später in den Einstellungen aktivieren.';
            note.classList.remove('hidden');
            normalLink.classList.add('hidden');
        } else {
            note.classList.add('hidden');
            normalLink.classList.add('hidden');
        }

        this.updateContinueButtonLabel();
    },

    async showAuthDuringTutorial() {
        // Auth-Screen anzeigen wenn noch keine Entscheidung getroffen wurde
        if (typeof DQ_SUPABASE !== 'undefined' && !localStorage.getItem('dq_auth_decision_made')) {
            console.log('Zeige Auth-Screen waehrend Tutorial...');

            // WICHTIG: Speichere Intro-Zustand fuer E-Mail-Redirect-Fall
            // Wenn sich der User registriert und E-Mail bestaetigen muss,
            // gehen die Intro-Daten sonst beim Reload verloren
            // Bug L Fix: trainingPlanType + customPlanId mit-sichern,
            // damit nach E-Mail-Bestaetigung der KI-Plan wieder aktiviert wird.
            try {
                const introState = {
                    playerName: this.playerName,
                    age: this.age,
                    hasEquipment: this.hasEquipment,
                    trainingGoal: this.trainingGoal,
                    trainingPlanType: this.trainingPlanType || 'predefined',
                    customPlanId: (typeof this.customPlanId === 'number') ? this.customPlanId : null,
                    seniorMode: this.seniorMode,
                    seniorModeOptOut: this.seniorModeOptOut,
                    savedAt: Date.now()
                };
                localStorage.setItem('dq_intro_state', JSON.stringify(introState));
            } catch (e) {
                console.warn('Fehler beim Speichern des Intro-Zustands:', e);
            }

            DQ_SUPABASE.showAuthScreen('intro');
            await DQ_SUPABASE.waitForAuthDecision();

            // Auth-Screen wurde geschlossen, Entscheidung wurde getroffen
            console.log('Auth-Entscheidung waehrend Tutorial getroffen.');
        }
    },

    async showAgeSelection() {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;

        container.innerHTML = `
            <div id="tutorial-age-input-container" class="tutorial-panel">
                <div class="tutorial-age-row">
                    <span class="tutorial-age-label">Wie alt bist du?</span>
                    <strong id="tutorial-age-value">${this.age}</strong>
                </div>
                <input type="range" id="tutorial-age-slider" min="1" max="100" step="1" value="${this.age}">
                <p class="tutorial-age-help">Das hilft uns, Training und Erklärungen passend zu machen.</p>
                <div id="tutorial-age-note" class="tutorial-age-note hidden"></div>
                <button type="button" id="tutorial-normal-mode-link" class="tutorial-normal-mode-link hidden">Normal weiter machen</button>
            </div>
        `;

        const slider = container.querySelector('#tutorial-age-slider');
        const valueLabel = container.querySelector('#tutorial-age-value');
        const normalLink = container.querySelector('#tutorial-normal-mode-link');

        const updateAge = () => {
            this.age = parseInt(slider.value, 10) || 34;
            if (this.age < 60) {
                this.seniorModeOptOut = false;
            }
            valueLabel.textContent = String(this.age);
            this.updateAgePrompt(container);
        };

        slider.addEventListener('input', updateAge);
        normalLink.addEventListener('click', () => {
            this.seniorModeOptOut = true;
            this.updateAgePrompt(container);
        });

        updateAge();
        this.showContinueButton();
        await this.waitForContinue();
        this.hideContinueButton();
        this.seniorMode = this.age >= 60 && !this.seniorModeOptOut;
        await this.hidePanel('tutorial-panel');

        await this.runIntroSequence();

        if (this.seniorMode) {
            // Auth-Screen fuer Senior Mode VOR Charakter-Erstellung
            await this.showAuthDuringTutorial();
            await this.initializeCharacterWithName(this.playerName);
            await this.showWelcomeSequence();
            return;
        }

        await this.showEquipmentSelection();
    },
    getIntroTexts() {
        if (this.seniorMode) {
            return [
                'Wir halten es jetzt einfach: klare Schritte, wenig Ablenkung.',
                'Du bekommst sanfte Übungen, die gut erklärt und leicht nachvollziehbar sind.'
            ];
        }

        return [
            'Willkommen bei DailyQuest.',
            'Jetzt legen wir deinen Start klar und einfach fest.',
            'Danach bauen wir deinen Trainingsplan auf.'
        ];
    },

    getWelcomeTexts() {
        if (this.seniorMode) {
            return [
                `Willkommen ${this.playerName}. Wir starten langsam und klar.`,
                'Dein Plan nutzt Stuhlübungen, sanfte Dehnungen und leichte Bewegung.',
                'DailyQuest begleitet dich dabei Schritt für Schritt.'
            ];
        }

        return [
            `Herzlich willkommen ${this.playerName}, ich bin gespannt, wie unsere Reise verlaufen wird.`,
            'Was jetzt kommt, macht dein Training und deinen Alltag klarer und strukturierter.',
            'Das hier ist DailyQuest:'
        ];
    },

    async runIntroSequence() {
        const texts = this.getIntroTexts();

        for (let i = 0; i < texts.length; i++) {
            this.showText(texts[i]);
            this.showContinueButton('Weiter');
            await this.waitForContinue();
            this.hideContinueButton();
            await this.hideText();
            await this.delay(350);
        }
    },

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

        const input = document.getElementById('tutorial-name-input');
        if (input) {
            setTimeout(() => input.focus(), 250);
            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.submitName();
            });
        }

        const submitBtn = document.getElementById('tutorial-name-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitName());
        }
    },

    async submitName() {
        const input = document.getElementById('tutorial-name-input');
        if (!input) return;

        const name = input.value.trim();
        if (name.length === 0) {
            input.style.borderColor = '#ff6b6b';
            input.placeholder = 'Bitte gib deinen Namen ein';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 1000);
            return;
        }

        this.playerName = name;

        const container = document.getElementById('tutorial-name-input-container');
        if (container) {
            container.classList.add('fade-out');
            await this.delay(600);
        }

        await this.showAgeSelection();
    },

    async showEquipmentSelection() {
        const textContainer = document.getElementById('tutorial-text-container');
        if (!textContainer) return;

        this.showText('Welches Trainings-Equipment hast du zur Verfügung?');
        await this.delay(600);

        textContainer.insertAdjacentHTML('beforeend', `
            <div id="tutorial-equipment-selection" class="tutorial-selection-container">
                <button class="tutorial-choice-btn" data-equipment="true">
                    <span class="material-symbols-rounded">fitness_center</span>
                    <span>Hanteln & Langhantel</span>
                    <span class="choice-description">Ich habe Zugang zu Gewichten</span>
                </button>
                <button class="tutorial-choice-btn" data-equipment="false">
                    <span class="material-symbols-rounded">self_improvement</span>
                    <span>Kein Equipment</span>
                    <span class="choice-description">Nur Körpergewichtsübungen</span>
                </button>
            </div>
        `);

        const buttons = document.querySelectorAll('[data-equipment]');
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                this.hasEquipment = btn.dataset.equipment === 'true';
                const selection = document.getElementById('tutorial-equipment-selection');
                if (selection) {
                    selection.classList.add('fade-out');
                    await this.delay(500);
                }

                await this.hideText();
                await this.delay(250);
                await this.showTrainingPlanSelection();
            });
        });
    },

    /**
     * Bug G Fix: Umbenannt von showGoalSelection zu showTrainingPlanSelection
     * (Plan-spec), mit showGoalSelection als Deprecated-Alias fuer Backward-Compat.
     */
    async showTrainingPlanSelection() {
        const textContainer = document.getElementById('tutorial-text-container');
        if (!textContainer) return;

        this.showText('Was ist dein Trainingsziel?');
        await this.delay(600);

        textContainer.insertAdjacentHTML('beforeend', `
            <div id="tutorial-goal-selection" class="tutorial-selection-container tutorial-plan-selection">
                <button class="tutorial-choice-btn tutorial-plan-choice" data-preset="kraft">
                    <span class="material-symbols-rounded" aria-hidden="true">fitness_center</span>
                    <span>Kraft &amp; Muskelaufbau</span>
                    <span class="choice-description">Staerke, Masse, Hanteln</span>
                </button>
                <button class="tutorial-choice-btn tutorial-plan-choice" data-preset="ausdauer">
                    <span class="material-symbols-rounded" aria-hidden="true">directions_run</span>
                    <span>Ausdauer &amp; Cardio</span>
                    <span class="choice-description">Kondition, Laufen, HIIT</span>
                </button>
                <button class="tutorial-choice-btn tutorial-plan-choice" data-preset="abnehmen">
                    <span class="material-symbols-rounded" aria-hidden="true">local_fire_department</span>
                    <span>Gewicht verlieren</span>
                    <span class="choice-description">Fatburn, Diet, Cardio</span>
                </button>
                <button class="tutorial-choice-btn tutorial-plan-choice" data-preset="custom" aria-expanded="false">
                    <span class="material-symbols-rounded" aria-hidden="true">edit</span>
                    <span>Custom: Eigener Plan</span>
                    <span class="choice-description">Beschreibe dein Ziel</span>
                </button>
                <div id="tutorial-custom-input" class="tutorial-custom-plan-field hidden">
                    <label for="tutorial-plan-prompt">Eigene Beschreibung</label>
                    <input type="text" id="tutorial-plan-prompt" class="tutorial-input"
                        placeholder="z.B. starke Beine und mehr Flexibilitaet"
                        maxlength="200" autocomplete="off">
                    <small>Mindestens 3 Zeichen. Beispiel: gelenkschonend, ohne Equipment, Fokus Beine.</small>
                </div>
                <button id="tutorial-plan-generate" class="tutorial-plan-generate hidden" disabled>Plan generieren</button>
                <div id="tutorial-plan-loading" class="tutorial-plan-loading hidden">
                    <span class="material-symbols-rounded" aria-hidden="true">progress_activity</span>
                    <p>KI erstellt deinen Plan...</p>
                </div>
            </div>
        `);

        const customBtn = document.querySelector('[data-preset="custom"]');
        const customInput = document.getElementById('tutorial-custom-input');
        const generateBtn = document.getElementById('tutorial-plan-generate');
        const promptInput = document.getElementById('tutorial-plan-prompt');
        const loadingDiv = document.getElementById('tutorial-plan-loading');
        const selectionDiv = document.getElementById('tutorial-goal-selection');

        customBtn.addEventListener('click', () => {
            selectionDiv.querySelectorAll('.tutorial-plan-choice').forEach(btn => btn.classList.remove('selected'));
            customBtn.classList.add('selected');
            customBtn.setAttribute('aria-expanded', 'true');
            generateBtn.classList.remove('hidden');
            customInput.classList.remove('hidden');
            generateBtn.disabled = (promptInput.value.trim().length < 3);
            setTimeout(() => promptInput.focus(), 80);
        });

        promptInput.addEventListener('input', () => {
            generateBtn.disabled = promptInput.value.trim().length < 3;
        });

        selectionDiv.querySelectorAll('[data-preset]').forEach(btn => {
            if (btn.dataset.preset === 'custom') return;
            btn.addEventListener('click', async () => {
                selectionDiv.querySelectorAll('.tutorial-plan-choice').forEach(item => item.classList.remove('selected'));
                btn.classList.add('selected');
                await this.handleTutorialPlanSelection(btn.dataset.preset, null, selectionDiv, loadingDiv);
            });
        });

        generateBtn.addEventListener('click', async () => {
            const prompt = promptInput.value.trim();
            if (prompt.length < 3) return;
            await this.handleTutorialPlanSelection('custom', prompt, selectionDiv, loadingDiv);
        });
    },

    async handleTutorialPlanSelection(preset, customPrompt, selectionDiv, loadingDiv) {
        const goalFromPreset = preset === 'kraft' ? 'muscle'
            : preset === 'ausdauer' ? 'endurance'
                : preset === 'abnehmen' ? 'fatloss' : 'muscle';

        if (selectionDiv) {
            selectionDiv.classList.add('fade-out');
            await this.delay(300);
            Array.from(selectionDiv.children).forEach(child => {
                if (child !== loadingDiv) child.classList.add('hidden');
            });
            selectionDiv.classList.remove('fade-out');
        }
        if (loadingDiv) loadingDiv.classList.remove('hidden');

        try {
            if (typeof DQ_MISTRAL === 'undefined' || !DQ_SUPABASE || !DQ_SUPABASE.client) {
                throw new Error('KI-Modul oder Supabase nicht verfuegbar');
            }
            const userContext = {
                age: this.age || null,
                hasEquipment: this.hasEquipment !== false,
                difficulty: 3,
                restDays: 2
            };
            const result = await DQ_MISTRAL.generateAndSavePlan(customPrompt || preset, userContext, {
                timeoutMs: 30000,
                skipIncrement: true
            });
            if (result.success) {
                this.trainingPlanType = 'custom';
                this.customPlanId = result.planId;
                this.trainingGoal = goalFromPreset;
            } else {
                throw new Error(result.error || 'Generierung fehlgeschlagen');
            }
        } catch (e) {
            console.error('Tutorial plan generation error:', e);
            if (loadingDiv) loadingDiv.classList.add('hidden');
            DQ_UI.showCustomPopup(
                '<h3>Standardplan aktiviert</h3><p>Die KI-Erstellung hat gerade nicht geklappt. Du startest trotzdem sicher und kannst spaeter in den Einstellungen neu generieren.</p>',
                'info'
            );
            await this.delay(1500);
            this.trainingPlanType = 'predefined';
            this.customPlanId = null;
            this.trainingGoal = goalFromPreset;
        }

        if (loadingDiv) loadingDiv.classList.add('hidden');
        await this.hideText();
        await this.delay(250);

        await this.showAuthDuringTutorial();
        await this.initializeCharacterWithName(this.playerName);
        await this.showWelcomeSequence();
    },

    /**
     * @deprecated Use showTrainingPlanSelection()
     */
    async showGoalSelection() {
        return this.showTrainingPlanSelection();
    },

    async initializeCharacterWithName(name) {
        return new Promise((resolve, reject) => {
            try {
                let finalGoal = 'muscle';
                if (this.seniorMode) {
                    finalGoal = 'senior';
                    this.hasEquipment = false;
                } else if (this.trainingGoal === 'senior') {
                    finalGoal = 'senior';
                } else if (this.trainingGoal === 'muscle') {
                    finalGoal = this.hasEquipment ? 'muscle' : 'calisthenics';
                } else if (this.trainingGoal === 'endurance') {
                    finalGoal = 'endurance';
                } else if (this.trainingGoal === 'fatloss') {
                    finalGoal = 'fatloss';
                }

                if (!DQ_DB.db) {
                    reject(new Error('DB not initialized'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['character', 'settings'], 'readwrite');
                const charStore = tx.objectStore('character');
                const settingsStore = tx.objectStore('settings');

                charStore.get(1).onsuccess = e => {
                    let char = e.target.result;
                    if (!char) {
                        char = {
                            id: 1,
                            name,
                            level: 1,
                            mana: 0,
                            manaToNextLevel: 100,
                            gold: 200,
                            age: this.age,
                            ageBand: typeof DQ_TRAINING_SYSTEM !== 'undefined' ? DQ_TRAINING_SYSTEM.getAgeBand(this.age) : 'unknown',
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
                            manaStones: 0,
                            weightTrackingEnabled: true,
                            targetWeight: null,
                            weightDirection: 'lose',
                            combat: {
                                attack: 0,
                                protection: 0,
                                hpMax: 100,
                                hpCurrent: 100
                            },
                            achievements: {
                                level: { tier: 0, claimable: false },
                                quests: { tier: 0, claimable: false },
                                gold: { tier: 0, claimable: false },
                                shop: { tier: 0, claimable: false },
                                strength: { tier: 0, claimable: false },
                                streak: { tier: 0, claimable: false }
                            },
                            totalGoldEarned: 200,
                            totalQuestsCompleted: 0,
                            totalItemsPurchased: 0
                        };
                    } else {
                        char.name = name;
                        char.age = this.age;
                        char.ageBand = typeof DQ_TRAINING_SYSTEM !== 'undefined' ? DQ_TRAINING_SYSTEM.getAgeBand(this.age) : 'unknown';
                    }
                    charStore.put(char);
                };

                settingsStore.get(1).onsuccess = e => {
                    let settings = e.target.result;
                    if (!settings) {
                        settings = {
                            id: 1,
                            goal: finalGoal,
                            difficulty: 2,
                            restDays: 1,
                            language: 'de',
                            theme: 'dark',
                            weightTrackingEnabled: true,
                            hasEquipment: this.hasEquipment,
                            age: this.age,
                            planType: this.trainingPlanType || 'predefined',
                            customPlanId: this.customPlanId || null
                        };
                    } else {
                        settings.goal = finalGoal;
                        settings.hasEquipment = this.hasEquipment;
                        settings.age = this.age;
                        if (typeof settings.weightTrackingEnabled !== 'boolean') {
                            settings.weightTrackingEnabled = true;
                        }
                        if (this.trainingPlanType === 'custom' && this.customPlanId) {
                            settings.planType = 'custom';
                            settings.customPlanId = this.customPlanId;
                        }
                    }
                    settingsStore.put(settings);
                    if (typeof DQ_CONFIG !== 'undefined') {
                        DQ_CONFIG.userSettings = settings;
                    }
                };

                tx.oncomplete = async () => {
                    try {
                        localStorage.setItem('dq_has_equipment', this.hasEquipment ? '1' : '0');
                        localStorage.setItem('dq_training_goal', this.trainingGoal || finalGoal);
                        localStorage.setItem('dq_character_age', String(this.age || ''));
                    } catch (e) {
                        console.warn('LocalStorage Fehler:', e);
                    }

                    if (typeof generateDailyQuestsIfNeeded === 'function') {
                        await generateDailyQuestsIfNeeded(true);
                    }

                    if (typeof DQ_EXERCISES !== 'undefined') {
                        DQ_EXERCISES.renderQuests();
                        DQ_EXERCISES.renderFreeExercisesPage();
                    }

                    if (typeof DQ_CHARACTER_MAIN !== 'undefined') {
                        DQ_CHARACTER_MAIN.renderPage();
                    }

                    // NEU: Tutorial-Daten sofort zu Supabase syncen
                    if (typeof DQ_SUPABASE !== 'undefined') {
                        await DQ_SUPABASE.syncToSupabase();
                    }

                    resolve();
                };

                tx.onerror = e => {
                    console.error('Fehler beim Speichern in DB:', e);
                    reject(e);
                };
            } catch (error) {
                console.error('Fehler beim Initialisieren des Charakters:', error);
                reject(error);
            }
        });
    },

    async showWelcomeSequence() {
        const welcomeTexts = this.getWelcomeTexts();

        for (let i = 0; i < welcomeTexts.length; i++) {
            this.showText(welcomeTexts[i]);

            if (i === welcomeTexts.length - 1) {
                await this.delay(this.seniorMode ? 1800 : 2500);
            } else {
                this.showContinueButton('Weiter');
                await this.waitForContinue();
                this.hideContinueButton();
            }

            await this.hideText();
            await this.delay(300);
        }

        await this.revealApp();
    },

    async revealApp() {
        this.showAppContent();

        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.add('reveal');
            await this.delay(1500);
            overlay.classList.add('hidden');
        }

        const pulseContainer = document.querySelector('.background-pulse-container');
        if (pulseContainer) {
            pulseContainer.classList.remove('visible');
            setTimeout(() => pulseContainer.remove(), 1000);
        }

        await this.delay(500);
        await this.startFeatureTour();
    },

    async startFeatureTour() {
        try {
            await DQ_TUTORIAL_STATE.setTutorialCompleted();
            await this.delay(500);
            if (typeof DQ_TUTORIAL_PROGRESSIVE !== 'undefined') {
                await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('exercises');
            }
        } finally {
            window.DQ_TUTORIAL_IN_PROGRESS = false;
        }
    },
});


