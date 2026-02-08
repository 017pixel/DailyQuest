const DQ_SHOP = {
    currentEquipmentFilter: 'all',

    init(elements) {
        // Optional: Tab-Switcher existiert weiterhin mit nur einem Tab
        elements.shopTabSwitcher?.addEventListener('click', (event) => this.handleTabClick(event));
        elements.shopFiltersEquipment.addEventListener('click', (event) => this.handleFilterClick(event, 'equipment'));
        elements.shopItemsEquipment.addEventListener('click', (event) => this.handleBuyEquipmentClick(event));
    },

    handleTabClick(event) {
        const button = event.target.closest('.tab-button');
        if (!button || button.classList.contains('active')) return;
        document.querySelector('#shop-tab-switcher .active')?.classList.remove('active');
        button.classList.add('active');
        this.renderPage();
    },

    handleFilterClick(event) {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            const filterContainer = DQ_UI.elements.shopFiltersEquipment;
            filterContainer.querySelector('.active')?.classList.remove('active');
            target.classList.add('active');
            this.currentEquipmentFilter = target.dataset.filter;
            this.renderEquipmentShop();
        }
    },

    handleBuyEquipmentClick(event) {
        if (event.target.classList.contains('card-button')) {
            const itemId = parseInt(event.target.dataset.itemId, 10);
            this.buyEquipmentItem(itemId);
        }
    },

    renderPage() {
        this.renderEquipmentShop();
    },

    renderEquipmentShop() {
        const db = DQ_DB.db;
        if (!db) return;
        const trans = db.transaction(['shop', 'character'], 'readonly');
        const shopStore = trans.objectStore('shop');
        const charStore = trans.objectStore('character');
        const emojiRegex = (() => {
            try {
                return /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
            } catch {
                return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu;
            }
        })();
        const cleanName = (value) => (typeof value === 'string' ? value.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim() : value);
        
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
                    const icon = item.iconSymbol ? `<span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 6px;">${item.iconSymbol}</span>` : '';
                    const displayName = cleanName(item.name);
                    card.innerHTML = `<h2>${icon}${displayName}</h2><p>${item.description}</p><p class=\"item-price\"><span class=\"label\">Kosten:</span><span class=\"material-symbols-rounded icon-gold\">paid</span><span>${item.cost}</span></p><button class=\"card-button\" data-item-id=\"${item.id}\" ${canAfford ? '' : 'disabled'}>Kaufen</button>`;
                    DQ_UI.elements.shopItemsEquipment.appendChild(card);
                });
            };
        };
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
                DQ_UI.showCustomPopup("Nicht genug Gold!");
                return;
            }
            if (item.type === 'consumable') {
                const consumableCount = char.inventory.filter(invItem => invItem.type === 'consumable').length;
                if (consumableCount >= 5) {
                    DQ_UI.showCustomPopup("Dein Mana-Beutel ist voll! (max. 5)");
                    return;
                }
            }
            if (item.type === 'streak_freeze') {
                const freezeCount = char.inventory.filter(invItem => invItem.type === 'streak_freeze').length;
                if (freezeCount >= 2) {
                    DQ_UI.showCustomPopup("Du kannst maximal 2 Streak Freezes besitzen!");
                    return;
                }
            }
            char.gold -= item.cost;
            char.inventory.push(item);
            char.totalItemsPurchased++;
            DQ_UI.showCustomPopup(`${item.name} gekauft!`);
            charStore.put(char);
        });
    }
};
