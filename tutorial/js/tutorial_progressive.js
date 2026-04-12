/**
 * @file tutorial_progressive.js
 * @description Progressives Tutorial-System für DailyQuest
 * Zeigt Feature-Erklärungen beim ersten Besuch einer Seite/Funktion
 */

const DQ_TUTORIAL_PROGRESSIVE = {
    isShowing: false,
    currentFeature: null,

    /**
     * Definiert alle Tutorial-Schritte für jedes Feature
     * Kurze, emotionale Erklärungen mit Fokus auf Motivation
     */
    featureGuides: {
        // Übungen-Seite: Erste Erklärung nach dem Intro
        exercises: {
            name: 'Übungen',
            steps: [
                {
                    text: 'Willkommen auf deiner Übersichtsseite!',
                    highlight: null,
                    position: 'center'
                },
                {
                    text: 'Hier findest du deine täglichen Herausforderungen. Jeden Tag neue Aufgaben, die dich stärker machen!',
                    highlight: '#daily-quest-container',
                    position: 'bottom'
                },
                {
                    text: 'WICHTIG: Schließe ALLE Daily Quests bis Mitternacht ab - sonst verlierst du ein Level und deine Streak wird zurückgesetzt!',
                    highlight: null,
                    position: 'center'
                },
                {
                    text: 'Tipp: Installiere DailyQuest als App für das beste Erlebnis!',
                    highlight: null,
                    position: 'center'
                },
                {
                    // Text wird dynamisch basierend auf OS gesetzt
                    text: 'iOS: Tippe auf "Teilen" und dann "Zum Home-Bildschirm". Android: Tippe auf das Menü und "Zum Startbildschirm hinzufügen".',
                    highlight: null,
                    position: 'bottom'
                }
            ]
        },

        // Daily Quests
        dailyQuests: {
            name: 'Daily Quests',
            steps: [
                {
                    text: 'Deine Daily Quests sind dein täglicher Weg zum Erfolg. Schließe sie ab, um Mana, Gold und Stats zu verdienen!',
                    highlight: '#quest-list',
                    position: 'bottom'
                }
            ]
        },

        // Freies Training
        freeTraining: {
            name: 'Freies Training',
            steps: [
                {
                    text: 'Willst du mehr machen? Hier findest du zusätzliche Übungen für freies Training!',
                    highlight: '#free-training-container',
                    position: 'top'
                }
            ]
        },

        // Fokus-Seite
        fokus: {
            name: 'Fokus',
            steps: [
                {
                    text: 'Fokus ist der Schlüssel zum Erfolg! Nutze den Timer, um konzentriert zu arbeiten oder zu lernen.',
                    highlight: '#fokus-tab-fokus',
                    position: 'center'
                },
                {
                    text: 'Je länger du fokussiert bleibst, desto mehr Belohnungen erhältst du!',
                    highlight: null,
                    position: 'center'
                }
            ]
        },

        // Character-Seite - ERWEITERT
        character: {
            name: 'Character',
            steps: [
                {
                    text: 'Das bist DU! Dein Charakter repräsentiert deinen Fortschritt und deine Stärke.',
                    highlight: '#character-sheet-container',
                    position: 'bottom'
                },
                {
                    text: 'Dein Level steigt mit jeder abgeschlossenen Quest. Aber pass auf - unvollständige Tage kosten dich ein Level!',
                    highlight: '#character-vitals-container',
                    position: 'bottom'
                }
            ]
        },

        // Basis Stats - SEPARATES Tutorial
        stats: {
            name: 'Stats',
            steps: [
                {
                    text: 'Deine Basis-Stats zeigen deine körperliche und mentale Entwicklung!',
                    highlight: '#character-stats',
                    position: 'top'
                },
                {
                    text: 'Kraft, Ausdauer, Beweglichkeit, Durchhaltevermögen und Willenskraft - jede Quest verbessert spezifische Stats.',
                    highlight: '#stats-radar-chart',
                    position: 'top'
                },
                {
                    text: 'Höhere Stats machen dich stärker in Dungeons und schalten neue Möglichkeiten frei!',
                    highlight: null,
                    position: 'center'
                }
            ]
        },

        // Streak - SEPARATES Tutorial
        streak: {
            name: 'Streak',
            steps: [
                {
                    text: 'Deine Streak zeigt, wie viele Tage am Stück du ALLE Daily Quests abgeschlossen hast!',
                    highlight: '#streak-box',
                    position: 'bottom'
                },
                {
                    text: 'Eine hohe Streak ist ein Zeichen echter Disziplin. Verpass keinen Tag - die Streak wird bei unvollständigen Tagen zurückgesetzt!',
                    highlight: null,
                    position: 'center'
                }
            ]
        },

        // Shop
        shop: {
            name: 'Shop',
            steps: [
                {
                    text: 'Willkommen im Shop! Nutze dein Gold, um mächtige Ausrüstung zu kaufen.',
                    highlight: '#shop-items-equipment',
                    position: 'top'
                },
                {
                    text: 'Bessere Waffen und Rüstungen helfen dir in Dungeons! Investiere weise!',
                    highlight: null,
                    position: 'center'
                }
            ]
        },

        // Inventar
        inventory: {
            name: 'Inventar',
            steps: [
                {
                    text: 'Hier siehst du deine gesammelte Ausrüstung. Rüste dich aus, um stärker zu werden!',
                    highlight: '#character-tab-inventory',
                    position: 'top'
                }
            ]
        },

        // Extra Quest
        extraQuest: {
            name: 'Extra Quest',
            steps: [
                {
                    text: 'Bereit für eine echte Herausforderung? Extra Quests sind hart, aber die Belohnungen sind RIESIG!',
                    highlight: '#extra-quest-container',
                    position: 'top'
                },
                {
                    text: 'Achtung: Bei Scheitern drohen Strafen. Nur für die Mutigen!',
                    highlight: '.penalty-card',
                    position: 'top'
                }
            ]
        },



        // Dungeon - PRE (Vor dem Betreten)
        dungeon_pre: {
            name: 'Dungeon',
            steps: [
                {
                    text: 'ACHTUNG! Ein Dungeon ist erschienen! Monster bedrohen deinen Fortschritt!',
                    highlight: null,
                    position: 'center'
                },
                {
                    text: 'Dungeons spawnen zufällig (5% Chance). Wenn du sie besiegst, erhältst du großartige Belohnungen!',
                    highlight: null,
                    position: 'center'
                }
            ]
        },

        // Dungeon - COMBAT (Im Dungeon)
        dungeon_combat: {
            name: 'Kampf',
            steps: [
                {
                    text: 'Du bist im Dungeon! Hier kämpfst du gegen Monster.',
                    highlight: '.dungeon-monster-card',
                    position: 'bottom'
                },
                {
                    text: 'Nutze deine Übungen, um Schaden zu machen. Gib ein, wie viele Wiederholungen du schaffst.',
                    highlight: '.dungeon-actions',
                    position: 'top'
                },
                {
                    text: 'Sieg = Belohnungen. Niederlage = HP-Verlust. Viel Glück!',
                    highlight: '.dungeon-player-status',
                    position: 'top'
                }
            ]
        },

        // Dungeon - WIN (Sieg)
        dungeon_win: {
            name: 'Sieg',
            steps: [
                {
                    text: 'Fantastisch! Du hast das Monster besiegt und Belohnungen erhalten!',
                    highlight: null,
                    position: 'center'
                },
                {
                    text: 'Das war das komplette Tutorial. Du bist bereit für deine Reise!',
                    highlight: null,
                }
            ]
        }
    },

    /**
     * Zeigt das Tutorial für ein Feature an
     * @param {string} featureName - Name des Features aus featureGuides
     */
    async showFeatureTutorial(featureName) {
        // Prüfen, ob Feature bereits erklärt wurde
        const hasSeenIt = await DQ_TUTORIAL_STATE.hasSeenFeature(featureName);
        if (hasSeenIt) {
            console.log(`Tutorial für '${featureName}' wurde bereits angezeigt`);
            return;
        }

        // Prüfen, ob Tutorial-Daten vorhanden sind
        const guide = this.featureGuides[featureName];
        if (!guide) {
            console.warn(`Keine Tutorial-Daten für Feature '${featureName}' gefunden`);
            return;
        }

        // Tutorial starten
        console.log(`Starte Tutorial für '${featureName}'`);
        this.currentFeature = featureName;
        this.isShowing = true;

        // Schritte durchlaufen
        for (let i = 0; i < guide.steps.length; i++) {
            const step = guide.steps[i];
            await this.showStep(step, i, guide.steps.length);
        }

        // Feature als gesehen markieren
        await DQ_TUTORIAL_STATE.markFeatureAsSeen(featureName);

        this.isShowing = false;
        this.currentFeature = null;

        // OS Detection für Install-Text im Exercises Tutorial
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const exercisesGuide = this.featureGuides.exercises;
        if (exercisesGuide && exercisesGuide.steps[4]) {
            if (isIOS) {
                exercisesGuide.steps[4].text = 'iOS: Tippe unten auf "Teilen" <span class="material-symbols-rounded" style="vertical-align:middle">ios_share</span> und dann auf "Zum Home-Bildschirm".';
            } else {
                exercisesGuide.steps[4].text = 'Android: Tippe oben rechts auf das Menü <span class="material-symbols-rounded" style="vertical-align:middle">more_vert</span> und wähle "Zum Startbildschirm zufügen".';
            }
        }
    },

    /**
     * Zeigt einen einzelnen Tutorial-Schritt
     * @param {Object} step - Schritt-Daten
     * @param {number} currentIndex - Aktueller Index
     * @param {number} totalSteps - Gesamtanzahl der Schritte
     */
    async showStep(step, currentIndex, totalSteps) {
        return new Promise((resolve) => {
            // UI erstellen
            this.createStepUI(step, currentIndex, totalSteps, resolve);
        });
    },

    /**
     * Erstellt die UI für einen Tutorial-Schritt
     * @param {Object} step - Schritt-Daten
     * @param {number} currentIndex - Aktueller Index
     * @param {number} totalSteps - Gesamtanzahl
     * @param {Function} onComplete - Callback nach Abschluss
     */
    createStepUI(step, currentIndex, totalSteps, onComplete) {
        // Overlay für Dimming
        let overlay = document.getElementById('tutorial-progressive-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tutorial-progressive-overlay';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');

        // Tooltip erstellen
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.innerHTML = `
            <div class="tutorial-tooltip-content">
                <p class="tutorial-tooltip-text">${step.text}</p>
                <div class="tutorial-tooltip-footer">
                    <span class="tutorial-step-indicator">${currentIndex + 1}/${totalSteps}</span>
                    <button class="tutorial-next-btn">
                        ${currentIndex === totalSteps - 1 ? 'Verstanden!' : 'Weiter'}
                    </button>
                </div>
            </div>
        `;

        // Position berechnen
        if (step.highlight) {
            const targetElement = document.querySelector(step.highlight);
            if (targetElement) {
                // Spotlight auf Element
                this.addSpotlight(targetElement);

                // Tooltip positionieren
                this.positionTooltip(tooltip, targetElement, step.position);
            } else {
                // Fallback: Center
                tooltip.classList.add('center');
            }
        } else {
            // Kein Highlight - zentriert anzeigen
            tooltip.classList.add('center');
        }

        document.body.appendChild(tooltip);

        // Animation einblenden
        setTimeout(() => tooltip.classList.add('show'), 50);

        // Event Listener für Next-Button
        const nextBtn = tooltip.querySelector('.tutorial-next-btn');
        nextBtn.addEventListener('click', () => {
            this.closeStep(tooltip, overlay, onComplete);
        });

        // Optional: Auto-dismiss nach 10 Sekunden für den letzten Schritt
        if (currentIndex === totalSteps - 1) {
            setTimeout(() => {
                if (tooltip.parentElement) {
                    this.closeStep(tooltip, overlay, onComplete);
                }
            }, 10000);
        }
    },

    /**
     * Fügt Spotlight-Effekt zu einem Element hinzu
     * @param {HTMLElement} element - Ziel-Element
     */
    addSpotlight(element) {
        // Entferne alten Spotlight
        this.removeSpotlight();

        element.classList.add('tutorial-spotlight');
        element.style.position = 'relative';
        element.style.zIndex = '9999997';
    },

    /**
     * Entfernt Spotlight-Effekt
     */
    removeSpotlight() {
        const spotlights = document.querySelectorAll('.tutorial-spotlight');
        spotlights.forEach(el => {
            el.classList.remove('tutorial-spotlight');
            el.style.zIndex = '';
        });
    },

    /**
     * Positioniert Tooltip relativ zu einem Element - mit Viewport-Check
     * @param {HTMLElement} tooltip - Tooltip-Element
     * @param {HTMLElement} target - Ziel-Element
     * @param {string} position - Position ('top', 'bottom', 'center')
     */
    positionTooltip(tooltip, target, position) {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 360;
        const viewportHeight = window.innerHeight;

        tooltip.style.position = 'fixed';
        tooltip.style.maxWidth = tooltipWidth + 'px';

        if (position === 'bottom') {
            const spaceBelow = viewportHeight - rect.bottom;

            // Wenn nicht genug Platz unten (min 200px), versuche oben
            if (spaceBelow < 200) {
                if (rect.top > 200) {
                    // Platz oben vorhanden
                    tooltip.style.bottom = (viewportHeight - rect.top + 20) + 'px';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    tooltip.style.top = 'auto';
                } else {
                    // Kein Platz - zentriert
                    tooltip.classList.add('center');
                }
            } else {
                // Genug Platz unten
                tooltip.style.top = (rect.bottom + 20) + 'px';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.bottom = 'auto';
            }
        } else if (position === 'top') {
            const spaceAbove = rect.top;

            // Wenn nicht genug Platz oben, versuche unten
            if (spaceAbove < 200) {
                if ((viewportHeight - rect.bottom) > 200) {
                    // Platz unten vorhanden
                    tooltip.style.top = (rect.bottom + 20) + 'px';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    tooltip.style.bottom = 'auto';
                } else {
                    // Kein Platz - zentriert
                    tooltip.classList.add('center');
                }
            } else {
                // Genug Platz oben
                tooltip.style.bottom = (viewportHeight - rect.top + 20) + 'px';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.top = 'auto';
            }
        } else {
            // Center
            tooltip.classList.add('center');
        }
    },

    /**
     * Schließt einen Tutorial-Schritt
     * @param {HTMLElement} tooltip - Tooltip-Element
     * @param {HTMLElement} overlay - Overlay-Element
     * @param {Function} onComplete - Callback
     */
    closeStep(tooltip, overlay, onComplete) {
        // Ausblenden
        tooltip.classList.remove('show');

        setTimeout(() => {
            // Entfernen
            if (tooltip.parentElement) {
                tooltip.remove();
            }

            // Spotlight entfernen
            this.removeSpotlight();

            // Overlay deaktivieren
            overlay.classList.remove('active');

            // Callback
            onComplete();
        }, 300);
    },

    /**
     * Manueller Trigger für Dungeon-Tutorial (wird von außen aufgerufen)
     */
    async showDungeonTutorial() {
        await this.showFeatureTutorial('dungeon');
    }
};

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_PROGRESSIVE = DQ_TUTORIAL_PROGRESSIVE;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_PROGRESSIVE:', e);
}
