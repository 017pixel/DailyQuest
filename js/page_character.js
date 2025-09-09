const DQ_CHARACTER = {
    init(elements) {
        elements.inventoryContainer.addEventListener('click', (event) => this.handleInventoryClick(event));
        elements.equipmentContainer.addEventListener('click', (event) => this.handleEquipmentClick(event));
    },

    handleInventoryClick(event) {
        const button = event.target.closest('button.card-button');
        if (button) {
            const itemIndex = parseInt(button.dataset.inventoryIndex, 10);
            const action = button.dataset.action;
            if (action === 'use') this.useItem(itemIndex);
            else if (action === 'equip') this.equipItem(itemIndex);
            else if (action === 'sell') this.showSellConfirmation('inventory', { index: itemIndex });
        }
    },

    handleEquipmentClick(event) {
        const button = event.target.closest('button.card-button');
        if (button) {
            const action = button.dataset.action;
            const slot = button.dataset.equipSlot;
            const index = parseInt(button.dataset.equipIndex, 10);
            if (action === 'unequip') {
                this.unequipItem(slot, index);
            } else if (action === 'sell') {
                this.showSellConfirmation('equipment', { slot, index });
            }
        }
    },

    renderPage() {
        const db = DQ_DB.db;
        if (!db) return;
        const store = db.transaction(['character'], 'readonly').objectStore('character');
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char) return;
            
            this.renderCharacterSheet(char);
            this.renderCharacterVitals(char);
            this.renderStats(char);
            this.renderEquipment(char);
            this.renderInventory(char);
            
            DQ_CONFIG.updateStreakDisplay();
        };
    },

    renderCharacterSheet(char) {
        const manaPercentage = char.manaToNextLevel > 0 ? (char.mana / char.manaToNextLevel) * 100 : 0;
        DQ_UI.elements.characterSheet.innerHTML = `
            <div class="card">
                <h2>${char.name}</h2>
                <div class="stat"><span class="stat-label">Level:</span><span class="stat-value">🌟 ${char.level}</span></div>
                <div class="stat"><span class="stat-label">Mana:</span><span class="stat-value">✨ ${char.mana} / ${char.manaToNextLevel}</span></div>
                <div class="mana-bar-container"><div class="mana-bar" style="width: ${manaPercentage}%;"></div></div>
            </div>`;
    },

    renderCharacterVitals(char) {
        const equipmentStats = this.calculateEquipmentStats(char);
        DQ_UI.elements.characterVitals.innerHTML = `
             <div class="card">
                <div class="stat"><span class="stat-label">Gold:</span><span class="stat-value">💰 ${char.gold}</span></div>
                <div class="stat"><span class="stat-label">Angriff:</span><span class="stat-value">⚔️ ${equipmentStats.angriff}</span></div>
                <div class="stat"><span class="stat-label">Schutz:</span><span class="stat-value">🛡️ ${equipmentStats.schutz}</span></div>
            </div>`;
    },

    renderStats(char) {
        const canvas = document.getElementById('stats-radar-chart');
        if (canvas) {
            this.createRadarChart(canvas, char.stats);
        }

        const statsListContainer = document.getElementById('stats-list-container');
        statsListContainer.innerHTML = ''; 

        const statsToDisplay = [
            { key: 'kraft', name: 'Kraft', emoji: '💪' },
            { key: 'ausdauer', name: 'Ausdauer', emoji: '🏃‍♂️' },
            { key: 'beweglichkeit', name: 'Beweglichkeit', emoji: '🤸‍♀️' },
            { key: 'durchhaltevermoegen', name: 'Durchhaltevermögen', emoji: '🔋' },
            { key: 'willenskraft', name: 'Willenskraft', emoji: '🧠' }
        ];

        statsToDisplay.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item-text';
            statItem.innerHTML = `
                <span>${stat.name} ${stat.emoji}</span>
                <span>${char.stats[stat.key]}</span>
            `;
            statsListContainer.appendChild(statItem);
        });
    },

    createRadarChart(canvas, stats) {
        const baseSize = 320;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = baseSize * dpr;
        canvas.height = baseSize * dpr;
        canvas.style.width = `${baseSize}px`;
        canvas.style.height = `${baseSize}px`;
        ctx.scale(dpr, dpr);

        const centerX = baseSize / 2;
        const centerY = baseSize / 2;
        const radius = Math.min(centerX, centerY) * 0.75;
        
        const statKeys = ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'];
        const statLabels = ['💪', '🏃‍♂️', '🤸‍♀️', '🔋', '🧠'];
        const numAxes = statKeys.length;

        // --- NEUE DYNAMISCHE BERECHNUNG ---
        const highestStat = Math.max(...Object.values(stats));
        const chartBuffer = 5; // Puffer, damit der höchste Wert nie den Rand berührt
        const baselineMax = 20; // Mindest-Maximalwert für niedriglevelige Charaktere
        const maxStatValue = Math.max(baselineMax, highestStat + chartBuffer);
        // --- ENDE DER NEUEN BERECHNUNG ---

        ctx.clearRect(0, 0, baseSize, baseSize);
        
        const style = getComputedStyle(document.documentElement);
        const gridColor = style.getPropertyValue('--outline-color').trim();
        const labelColor = style.getPropertyValue('--on-surface-color').trim();
        const primaryColor = style.getPropertyValue('--primary-color').trim();
        const primaryColorRgb = style.getPropertyValue('--primary-color-rgb').trim();

        const levels = 4;
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;
            ctx.beginPath();
            ctx.moveTo(centerX + levelRadius * Math.cos(-Math.PI / 2), centerY + levelRadius * Math.sin(-Math.PI / 2));
            for (let i = 1; i <= numAxes; i++) {
                const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
                ctx.lineTo(centerX + levelRadius * Math.cos(angle), centerY + levelRadius * Math.sin(angle));
            }
            ctx.closePath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            ctx.strokeStyle = gridColor;
            ctx.stroke();
        }

        ctx.font = '24px sans-serif';
        ctx.fillStyle = labelColor;
        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            const labelRadius = radius * 1.2;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(statLabels[i], x, y);
        }
        
        ctx.beginPath();
        for (let i = 0; i < numAxes; i++) {
            const statRadius = (stats[statKeys[i]] / maxStatValue) * radius;
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            const x = centerX + statRadius * Math.cos(angle);
            const y = centerY + statRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fillStyle = `rgba(${primaryColorRgb}, 0.5)`;
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    renderEquipment(char) {
        const container = DQ_UI.elements.equipmentContainer;
        container.innerHTML = '';
        let hasEquipment = false;
        
        const createCard = (item, slot, index) => {
            hasEquipment = true;
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="card-actions-wrapper">
                    <button class="card-button secondary-button card-button-no-transform" data-action="sell" data-equip-slot="${slot}" data-equip-index="${index}">Verkaufen</button>
                    <button class="card-button secondary-button card-button-no-transform" data-action="unequip" data-equip-slot="${slot}" data-equip-index="${index || 0}">Ablegen</button>
                </div>`;
            container.appendChild(card);
        };

        char.equipment.weapons.forEach((item, index) => createCard(item, 'weapons', index));
        if (char.equipment.armor) createCard(char.equipment.armor, 'armor', 0);

        if (!hasEquipment) {
            container.innerHTML = '<div class="card placeholder"><p>Du trägst keine Ausrüstung. Gehe zum Shop! 🛒</p></div>';
        }
    },

    renderInventory(char) {
        const container = DQ_UI.elements.inventoryContainer;
        container.innerHTML = '';
        if (char.inventory.length > 0) {
            char.inventory.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                const buttonText = item.type === 'consumable' ? 'Benutzen' : 'Ausrüsten';
                const buttonAction = item.type === 'consumable' ? 'use' : 'equip';
                card.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="card-actions-wrapper">
                        <button class="card-button secondary-button card-button-no-transform" data-action="sell" data-inventory-index="${index}">Verkaufen</button>
                        <button class="card-button secondary-button card-button-no-transform" data-inventory-index="${index}" data-action="${buttonAction}">${buttonText}</button>
                    </div>`;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div class="card placeholder"><p>Dein Inventar ist leer. 🤷‍♂️</p></div>';
        }
    },

    async showSellConfirmation(source, location) {
        const char = await DQ_CONFIG.getCharacter();
        if (!char) return;
        
        let itemToSell;
        if (source === 'inventory') {
            itemToSell = char.inventory[location.index];
        } else { // equipment
            itemToSell = location.slot === 'weapons' ? char.equipment.weapons[location.index] : char.equipment.armor;
        }

        if (!itemToSell || typeof itemToSell.cost === 'undefined') {
            DQ_UI.showCustomPopup("Dieser Gegenstand kann nicht verkauft werden.", 'penalty');
            return;
        }

        const sellPrice = Math.floor(itemToSell.cost * 0.7);
        const confirmationText = document.getElementById('sell-confirmation-text');
        confirmationText.innerHTML = `Möchtest du <strong>${itemToSell.name}</strong> wirklich für 💰 ${sellPrice} Gold verkaufen?`;
        
        DQ_UI.showPopup(document.getElementById('sell-popup'));

        const confirmButton = document.getElementById('confirm-sell-button');
        const cancelButton = document.getElementById('cancel-sell-button');

        const handleConfirm = () => {
            this.sellItem(source, location, sellPrice);
            cleanup();
        };
        const handleCancel = () => {
            DQ_UI.hideTopPopup();
            cleanup();
        };
        const cleanup = () => {
            confirmButton.removeEventListener('click', handleConfirm);
            cancelButton.removeEventListener('click', handleCancel);
        };

        confirmButton.addEventListener('click', handleConfirm, { once: true });
        cancelButton.addEventListener('click', handleCancel, { once: true });
    },

    sellItem(source, location, sellPrice) {
        const tx = DQ_DB.db.transaction('character', 'readwrite');
        const store = tx.objectStore('character');
        store.get(1).onsuccess = e => {
            const char = e.target.result;
            let soldItemName = '';

            if (source === 'inventory') {
                soldItemName = char.inventory[location.index].name;
                char.inventory.splice(location.index, 1);
            } else { // equipment
                if (location.slot === 'weapons') {
                    soldItemName = char.equipment.weapons[location.index].name;
                    char.equipment.weapons.splice(location.index, 1);
                } else {
                    soldItemName = char.equipment.armor.name;
                    char.equipment.armor = null;
                }
            }
            
            char.gold += sellPrice;
            char.totalGoldEarned += sellPrice; // ACHIEVEMENT-FORTSCHRITT
            store.put(char);

            tx.oncomplete = () => {
                DQ_UI.hideAllPopups();
                DQ_UI.showCustomPopup(`${soldItemName} für 💰 ${sellPrice} Gold verkauft!`);
                this.renderPage();
                DQ_SHOP.renderPage();
                DQ_ACHIEVEMENTS.checkAchievement(char, 'gold');
            };
        };
    },

    calculateEquipmentStats(character) {
        let angriff = 0;
        let schutz = 0;
        character.equipment.weapons.forEach(weapon => { angriff += weapon.bonus.angriff || 0; });
        if (character.equipment.armor) { schutz += character.equipment.armor.bonus.schutz || 0; }
        return { angriff, schutz };
    },

    useItem(itemIndex) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => this.renderPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            const itemToUse = char.inventory[itemIndex];
            if (itemToUse.type !== 'consumable') return;
            char.mana += itemToUse.effect.mana;
            DQ_UI.showCustomPopup(`${itemToUse.name} benutzt!\n+${itemToUse.effect.mana} Mana ✨`);
            char.inventory.splice(itemIndex, 1);
            DQ_CONFIG.levelUpCheck(char, store);
        };
    },

    equipItem(itemIndex) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => this.renderPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            const itemToEquip = char.inventory[itemIndex];
            const slot = itemToEquip.type;
            if (slot === 'weapon') {
                if (char.equipment.weapons.length >= 2) {
                    DQ_UI.showCustomPopup("Du kannst nur 2 Waffen tragen! ⚔️⚔️");
                    return;
                }
                char.equipment.weapons.push(itemToEquip);
            } else if (slot === 'armor') {
                if (char.equipment.armor) {
                    DQ_UI.showCustomPopup("Du trägst bereits eine Rüstung. Lege sie zuerst ab! 🛡️");
                    return;
                }
                char.equipment.armor = itemToEquip;
            } else { return; }
            char.inventory.splice(itemIndex, 1);
            store.put(char);
        };
    },

    unequipItem(slot, index) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => this.renderPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            let itemToUnequip = null;
            if (slot === 'weapons') {
                itemToUnequip = char.equipment.weapons[index];
                if (itemToUnequip) char.equipment.weapons.splice(index, 1);
            } else if (slot === 'armor') {
                itemToUnequip = char.equipment.armor;
                if (itemToUnequip) char.equipment.armor = null;
            }
            if (itemToUnequip) {
                char.inventory.push(itemToUnequip);
                store.put(char);
            }
        };
    }
};