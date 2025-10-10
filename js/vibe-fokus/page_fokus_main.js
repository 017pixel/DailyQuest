const DQ_FOKUS_MAIN = {
    
    init(elements) {
        elements.fokusTabSwitcher.addEventListener('click', (event) => this.handleTabClick(event));
    },

    // --- KORRIGIERTE LOGIK ---
    // Diese Funktion prüft, welcher Tab aktiv ist, und rendert NUR dessen Inhalt.
    async renderPage() {
        const activeTabButton = document.querySelector('#fokus-tab-switcher .tab-button.active');
        const activeTab = activeTabButton ? activeTabButton.dataset.tab : 'fokus';

        // Rendere gezielt nur den Inhalt für den aktiven Tab.
        if (activeTab === 'fokus') {
            DQ_FOKUS_TIMER.renderTimerScreen();
        } else {
            DQ_FOKUS_FOREST.renderForestScreen();
        }
    },
    
    // --- KORRIGIERTE LOGIK ---
    // Diese Funktion schaltet die Klassen um UND ruft dann die Render-Funktion auf,
    // um den korrekten Inhalt in den jetzt sichtbaren Container zu laden.
    handleTabClick(event) {
        const button = event.target.closest('.tab-button');
        if (!button || button.classList.contains('active')) return;

        // Alten aktiven Button und Tab-Inhalt deaktivieren
        const activeTabButton = document.querySelector('#fokus-tab-switcher .tab-button.active');
        if (activeTabButton) activeTabButton.classList.remove('active');
        
        const activeContent = document.querySelector('.fokus-tab-content.active');
        if (activeContent) activeContent.classList.remove('active');
        
        // Neuen Button und den dazugehörigen Tab-Inhalt aktivieren
        button.classList.add('active');
        const targetTabId = `fokus-tab-${button.dataset.tab}`;
        const targetContent = document.getElementById(targetTabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // Rendere den Inhalt für den neu ausgewählten Tab.
        this.renderPage();
    },
};