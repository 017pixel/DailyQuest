const DQ_INVENTORY = {

    init(elements) {
        elements.inventoryContainer.addEventListener('click', (event) => this.handleInventoryClick(event));
        elements.equipmentContainer.addEventListener('click', (event) => this.handleEquipmentClick(event));
    },

    renderInventoryPage(char) {
        this.renderEquipment(char);
        this.renderInventory(char);
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
            container.innerHTML = '<div class="card placeholder"><p>Du trägst keine Ausrüstung. Gehe zum Shop! <span class="material-symbols-rounded icon-accent" style="vertical-align: middle;">shopping_cart</span></p></div>';
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
            container.innerHTML = '<div class="card placeholder"><p>Dein Inventar ist leer.</p></div>';
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
        confirmationText.innerHTML = `Möchtest du <strong>${itemToSell.name}</strong> wirklich für <span class="material-symbols-rounded icon-gold" style="vertical-align: middle;">paid</span> ${sellPrice} Gold verkaufen?`;
        
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
                DQ_UI.showCustomPopup(`${soldItemName} verkauft!<br><span class="material-symbols-rounded icon-gold">paid</span> +${sellPrice} Gold`);
                DQ_CHARACTER_MAIN.renderPage();
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
        
        trans.oncomplete = () => DQ_CHARACTER_MAIN.renderPage();

        store.get(1).onsuccess = (e) => {
            let char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            
            const itemToUse = char.inventory[itemIndex];
            if (itemToUse.type !== 'consumable') return;

            char.mana += itemToUse.effect.mana;
            char.inventory.splice(itemIndex, 1); 

            DQ_UI.showCustomPopup(`${itemToUse.name} benutzt!<br>+${itemToUse.effect.mana} Mana <span class=\"material-symbols-rounded icon-mana\">auto_awesome</span>`);

            char = DQ_CONFIG.levelUpCheck(char);

            store.put(char);
        };
    },

    equipItem(itemIndex) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => {
            DQ_CHARACTER_MAIN.renderPage();
            // Update combat cache after equipment change
            this.updateCombatCache();
        };
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            const itemToEquip = char.inventory[itemIndex];
            const slot = itemToEquip.type;
            if (slot === 'weapon') {
                if (char.equipment.weapons.length >= 2) {
                    DQ_UI.showCustomPopup("Du kannst nur 2 Waffen tragen!");
                    return;
                }
                char.equipment.weapons.push(itemToEquip);
            } else if (slot === 'armor') {
                if (char.equipment.armor) {
                    DQ_UI.showCustomPopup("Du trägst bereits eine Rüstung. Lege sie zuerst ab!");
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
        trans.oncomplete = () => {
            DQ_CHARACTER_MAIN.renderPage();
            // Update combat cache after equipment change
            this.updateCombatCache();
        };
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
    },

    updateCombatCache() {
        // Update the cached character data with current equipment stats
        DQ_CONFIG.getCharacter().then(char => {
            if (char) {
                const equipmentStats = this.calculateEquipmentStats(char);
                if (window.__dq_cached_char__) {
                    window.__dq_cached_char__.combat.attack = equipmentStats.angriff || 0;
                    window.__dq_cached_char__.combat.protection = equipmentStats.schutz || 0;
                }
            }
        }).catch(e => console.warn('Failed to update combat cache:', e));
    }
};
