const DQ_CHARACTER_MAIN = {

    init(elements) {
        elements.characterTabSwitcher.addEventListener('click', (event) => this.handleTabClick(event));
    },

    handleTabClick(event) {
        const button = event.target.closest('.tab-button');
        if (!button) return;

        const activeTab = DQ_UI.elements.characterTabSwitcher.querySelector('.active');
        if (activeTab) activeTab.classList.remove('active');
        button.classList.add('active');

        const targetTabId = `character-tab-${button.dataset.tab}`;
        
        document.querySelectorAll('.character-tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === targetTabId);
        });
    },

    async renderPage() {
        const db = DQ_DB.db;
        if (!db) return;

        try {
            const [char, entries] = await Promise.all([
                DQ_CONFIG.getCharacter(),
                new Promise((resolve, reject) => {
                    const tx = db.transaction('weight_entries', 'readonly');
                    const store = tx.objectStore('weight_entries');
                    const request = store.getAll();
                    request.onsuccess = () => {
                        const sorted = request.result.sort((a, b) => new Date(a.time) - new Date(b.time));
                        resolve(sorted);
                    };
                    request.onerror = () => reject(request.error);
                })
            ]);

            if (!char) return;

            // Statischen Header-Teil rendern
            this.renderCharacterSheet(char);
            this.renderCharacterVitals(char);
            DQ_CONFIG.updateStreakDisplay();

            // Inhalte der Tabs rendern
            DQ_STATS.renderStatsPage(char, entries);
            DQ_INVENTORY.renderInventoryPage(char);

        } catch (error) {
            console.error("Fehler beim Rendern der Charakter-Seite:", error);
        }
    },

    renderCharacterSheet(char) {
        const container = document.getElementById('character-sheet-container');
        const manaPercentage = char.manaToNextLevel > 0 ? (char.mana / char.manaToNextLevel) * 100 : 0;
        container.innerHTML = `
            <div class="card">
                <h2>${char.name}</h2>
                <div class="stat"><span class="stat-label">Level:</span><span class="stat-value"><span class="material-symbols-rounded icon-accent" style="vertical-align: middle; margin-right:4px;">star</span>${char.level}</span></div>
                <div class="stat"><span class="stat-label">Mana:</span><span class="stat-value"><span class="material-symbols-rounded icon-mana" style="vertical-align: middle; margin-right:4px;">auto_awesome</span>${char.mana} / ${char.manaToNextLevel}</span></div>
                <div class="mana-bar-container"><div class="mana-bar" style="width: ${manaPercentage}%;"></div></div>
            </div>`;
        
        // Render player label
        DQ_LABELS.renderLabel(char, container);
    },

    renderCharacterVitals(char) {
        const container = document.getElementById('character-vitals-container');
        const equipmentStats = DQ_INVENTORY.calculateEquipmentStats(char);
        container.innerHTML = `
             <div class="card">
                <div class="stat"><span class="stat-label">Gold:</span><span class="stat-value"><span class="material-symbols-rounded icon-gold" style="vertical-align: middle; margin-right:4px;">paid</span>${char.gold}</span></div>
                <div class="stat"><span class="stat-label">Angriff:</span><span class="stat-value"><span class="material-symbols-rounded icon-attack" style="vertical-align: middle; margin-right:4px;">swords</span>${equipmentStats.angriff}</span></div>
                <div class="stat"><span class="stat-label">Schutz:</span><span class="stat-value"><span class="material-symbols-rounded icon-defense" style="vertical-align: middle; margin-right:4px;">shield</span>${equipmentStats.schutz}</span></div>
            </div>`;
    },
};