/**
 * @file tutorial_main.js
 * @description Hauptlogik für das Intro-Tutorial
 * Altersabfrage, Seniorenmodus und personalisierte Auswahl für das Starttraining
 */

const DQ_TUTORIAL_MAIN = {
    playerName: '',
    age: 34,
    hasEquipment: false,
    trainingGoal: '',
    seniorMode: false,
    seniorModeOptOut: false,
    continueButton: null,
    waitingForContinue: false,

    resetFlowState() {
        this.playerName = '';
        this.age = 34;
        this.hasEquipment = false;
        this.trainingGoal = '';
        this.seniorMode = false;
        this.seniorModeOptOut = false;
        this.waitingForContinue = false;
    },

    resetRuntimeState() {
        this.resetFlowState();
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
        const pulseContainer = document.querySelector('.background-pulse-container');
        if (pulseContainer) pulseContainer.classList.remove('visible');
        const textContainer = document.getElementById('tutorial-text-container');
        if (textContainer) textContainer.innerHTML = '';
        if (this.continueButton) this.continueButton.classList.add('hidden');
    },

    async start() {
        console.log('Starte Intro-Tutorial');
        this.resetFlowState();
        window.DQ_TUTORIAL_IN_PROGRESS = true;

        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.remove('hidden');

        const pulseContainer = document.querySelector('.background-pulse-container');
        if (pulseContainer) pulseContainer.classList.add('visible');

        this.createContinueButton();
        await this.showPreNameWelcome();
        await this.showNameInput();
    },

    createContinueButton() {
        if (this.continueButton) return;

        this.continueButton = document.getElementById('tutorial-continue-btn');
        if (!this.continueButton) {
            this.continueButton = document.createElement('button');
            this.continueButton.id = 'tutorial-continue-btn';
            document.getElementById('tutorial-overlay')?.appendChild(this.continueButton);
        }

        this.continueButton.addEventListener('click', () => {
            this.waitingForContinue = false;
        });
    },

    updateContinueButtonLabel() {
        if (!this.continueButton) return;
        const label = this.age >= 60 && !this.seniorModeOptOut ? 'Rentnermodus aktivieren' : 'Weiter';
        this.continueButton.textContent = label;
    },

    showContinueButton(label) {
        if (!this.continueButton) return;
        this.continueButton.textContent = label || (this.age >= 60 && !this.seniorModeOptOut ? 'Rentnermodus aktivieren' : 'Weiter');
        this.continueButton.classList.remove('hidden');
    },

    hideContinueButton() {
        if (this.continueButton) {
            this.continueButton.classList.add('hidden');
        }
    },

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

    showAppContent() {
        const appContainer = document.getElementById('app-container');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');

        if (appContainer) appContainer.style.opacity = '1';
        if (header) header.style.opacity = '1';
        if (nav) nav.style.opacity = '1';
    },

    showText(text) {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;
        container.innerHTML = `<div class="tutorial-text">${text}</div>`;
    },

    async hideText() {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;

        const textElement = container.querySelector('.tutorial-text');
        if (textElement) {
            textElement.classList.add('fade-out');
            await this.delay(700);
            container.innerHTML = '';
        }
    },

    async hidePanel(className) {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;
        const panel = container.querySelector(`.${className}`);
        if (panel) {
            panel.classList.add('fade-out');
            await this.delay(650);
            container.innerHTML = '';
        }
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

try {
    window.DQ_TUTORIAL_MAIN = DQ_TUTORIAL_MAIN;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_MAIN:', e);
}

