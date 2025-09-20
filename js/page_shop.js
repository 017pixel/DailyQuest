const DQ_SHOP = {
    currentEquipmentFilter: 'all',
    currentPlantFilter: 'all',

    init(elements) {
        elements.shopTabSwitcher.addEventListener('click', (event) => this.handleTabClick(event));
        
        // Event Listener für die beiden Filter-Container
        elements.shopFiltersEquipment.addEventListener('click', (event) => this.handleFilterClick(event, 'equipment'));
        elements.shopFiltersPlants.addEventListener('click', (event) => this.handleFilterClick(event, 'plants'));

        // Event Listener für die beiden Item-Container
        elements.shopItemsEquipment.addEventListener('click', (event) => this.handleBuyEquipmentClick(event));
        elements.shopItemsPlants.addEventListener('click', (event) => this.handleBuyPlantClick(event));
    },

    handleTabClick(event) {
        const button = event.target.closest('.tab-button');
        if (!button || button.classList.contains('active')) return;

        document.querySelector('#shop-tab-switcher .active').classList.remove('active');
        button.classList.add('active');

        document.querySelectorAll('.shop-tab-content').forEach(tab => {
            tab.classList.toggle('active', `shop-tab-${button.dataset.tab}` === tab.id);
        });
        this.renderPage();
    },

    handleFilterClick(event, shopType) {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            const filterContainer = shopType === 'equipment' ? DQ_UI.elements.shopFiltersEquipment : DQ_UI.elements.shopFiltersPlants;
            filterContainer.querySelector('.active').classList.remove('active');
            target.classList.add('active');

            if (shopType === 'equipment') {
                this.currentEquipmentFilter = target.dataset.filter;
                this.renderEquipmentShop();
            } else {
                this.currentPlantFilter = target.dataset.filter;
                this.renderPlantShop();
            }
        }
    },

    handleBuyEquipmentClick(event) {
        if (event.target.classList.contains('card-button')) {
            const itemId = parseInt(event.target.dataset.itemId, 10);
            this.buyEquipmentItem(itemId);
        }
    },

    async handleBuyPlantClick(event) {
        const button = event.target.closest('.card-button');
        if (button && !button.disabled) {
            const emoji = button.dataset.emoji;
            const price = parseInt(button.dataset.price, 10);
            
            const tx = DQ_DB.db.transaction(['character', 'vibe_state'], 'readwrite');
            const charStore = tx.objectStore('character');
            const vibeStore = tx.objectStore('vibe_state');

            const [char, vibeState] = await Promise.all([
                new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result)),
                new Promise(res => vibeStore.get('vibeState').onsuccess = e => res(e.target.result))
            ]);

            if (char.gold >= price && !vibeState.unlockedEmojis.includes(emoji)) {
                char.gold -= price;
                vibeState.unlockedEmojis.push(emoji);
                
                charStore.put(char);
                vibeStore.put(vibeState);

                DQ_VIBE_STATE.state = vibeState; // Lokalen State aktualisieren
                
                await new Promise(res => tx.oncomplete = res);

                DQ_UI.showCustomPopup(`${emoji} gekauft!`);
                this.renderPlantShop();
                DQ_CHARACTER_MAIN.renderPage();
            }
        }
    },

    renderPage() {
        const activeTab = document.querySelector('#shop-tab-switcher .tab-button.active').dataset.tab;
        if (activeTab === 'equipment') {
            this.renderEquipmentShop();
        } else {
            this.renderPlantShop();
        }
    },

    renderEquipmentShop() {
        const db = DQ_DB.db;
        if (!db) return;
        const trans = db.transaction(['shop', 'character'], 'readonly');
        const shopStore = trans.objectStore('shop');
        const charStore = trans.objectStore('character');
        
        charStore.get(1).onsuccess = (e) => {
            const character = e.target.result || { gold: 0 }; 
            
            shopStore.getAll().onsuccess = (ev) => {
                DQ_UI.elements.shopItemsEquipment.innerHTML = '';
                const allItems = ev.target.result.filter(item => item && item.id);
                const filteredItems = this.currentEquipmentFilter === 'all' 
                    ? allItems 
                    : allItems.filter(item => item.type === this.currentEquipmentFilter);
                
                if (filteredItems.length === 0) {
                    DQ_UI.elements.shopItemsEquipment.innerHTML = '<div class="card"><p>Für diese Kategorie gibt es keine Artikel.</p></div>';
                    return;
                }

                filteredItems.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const canAfford = character.gold >= item.cost;
                    card.innerHTML = `<h2>${item.name}</h2><p>${item.description}</p><p>Kosten: 💰 ${item.cost}</p><button class="card-button" data-item-id="${item.id}" ${canAfford ? '' : 'disabled'}>Kaufen</button>`;
                    DQ_UI.elements.shopItemsEquipment.appendChild(card);
                });
            };
        };
    },

    async renderPlantShop() {
        const container = DQ_UI.elements.shopItemsPlants;
        container.innerHTML = '';

        const char = await DQ_CONFIG.getCharacter();
        const vibeState = DQ_VIBE_STATE.state;
        if (!char || !vibeState) return;
        
        const allItems = DQ_VIBE_STATE.SHOP_ITEMS;
        const filteredItems = this.currentPlantFilter === 'all'
            ? allItems
            : allItems.filter(item => item.category === this.currentPlantFilter);

        filteredItems.forEach(item => {
            const isUnlocked = vibeState.unlockedEmojis.includes(item.emoji);
            const canAfford = char.gold >= item.price;
            const lang = DQ_CONFIG.userSettings.language || 'de';

            const card = document.createElement('div');
            card.className = 'card plant-shop-item';
            card.innerHTML = `
                <div class="item-emoji">${item.emoji}</div>
                <h3>${item.name[lang]}</h3>
                <p class="item-price">💰 ${item.price}</p>
                <button class="card-button" data-emoji="${item.emoji}" data-price="${item.price}" ${isUnlocked || !canAfford ? 'disabled' : ''}>
                    ${isUnlocked ? 'FREI' : 'KAUFEN'}
                </button>
            `;
            container.appendChild(card);
        });
    },

    buyEquipmentItem(itemId) {
        const trans = DQ_DB.db.transaction(['character', 'shop'], 'readwrite');
        const charStore = trans.objectStore('character');
        const shopStore = trans.objectStore('shop');
        
        let char;
        trans.oncomplete = () => {
            DQ_CHARACTER_MAIN.renderPage();
            this.renderEquipmentShop();
            if (char) {
                DQ_ACHIEVEMENTS.checkAchievement(char, 'shop');
            }
        };

        Promise.all([
            new Promise(res => charStore.get(1).onsuccess = e => res(e.target.result)), 
            new Promise(res => shopStore.get(itemId).onsuccess = e => res(e.target.result))
        ])
        .then(([character, item]) => {
            char = character;
            if (!char || !item) return;
            if (char.gold < item.cost) {
                DQ_UI.showCustomPopup("Nicht genug Gold! 😥");
                return;
            }
            if (item.type === 'consumable') {
                const consumableCount = char.inventory.filter(invItem => invItem.type === 'consumable').length;
                if (consumableCount >= 5) {
                    DQ_UI.showCustomPopup("Dein Mana-Beutel ist voll! (max. 5) 🎒");
                    return;
                }
            }
            char.gold -= item.cost;
            char.inventory.push(item);
            char.totalItemsPurchased++;
            DQ_UI.showCustomPopup(`${item.name} gekauft! 🛍️`);
            charStore.put(char);
        });
    }
};