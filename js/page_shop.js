const DQ_SHOP = {
    currentShopFilter: 'all',

    init(elements) {
        elements.shopFilters.addEventListener('click', (event) => this.handleFilterClick(event));
        elements.shopItems.addEventListener('click', (event) => this.handleBuyClick(event));
    },

    handleFilterClick(event) {
        const target = event.target;
        if (target.classList.contains('filter-button')) {
            DQ_UI.elements.shopFilters.querySelector('.active').classList.remove('active');
            target.classList.add('active');
            this.currentShopFilter = target.dataset.filter;
            this.renderPage();
        }
    },

    handleBuyClick(event) {
        if (event.target.classList.contains('card-button')) {
            const itemId = parseInt(event.target.dataset.itemId, 10);
            this.buyItem(itemId);
        }
    },

    renderPage() {
        const db = DQ_DB.db;
        if (!db) return;
        const trans = db.transaction(['shop', 'character'], 'readonly');
        const shopStore = trans.objectStore('shop');
        const charStore = trans.objectStore('character');
        
        charStore.get(1).onsuccess = (e) => {
            const character = e.target.result || { gold: 0 }; 
            
            shopStore.getAll().onsuccess = (ev) => {
                DQ_UI.elements.shopItems.innerHTML = '';
                
                const allItems = ev.target.result.filter(item => item && item.id);

                const filteredItems = this.currentShopFilter === 'all' 
                    ? allItems 
                    : allItems.filter(item => item.type === this.currentShopFilter);
                
                if (filteredItems.length === 0) {
                    DQ_UI.elements.shopItems.innerHTML = '<div class="card"><p>Für diese Kategorie gibt es keine Artikel. 텅 빈</p></div>';
                    return;
                }

                filteredItems.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const canAfford = character.gold >= item.cost;
                    card.innerHTML = `<h2>${item.name}</h2><p>${item.description}</p><p>Kosten: 💰 ${item.cost}</p><button class="card-button" data-item-id="${item.id}" ${canAfford ? '' : 'disabled'}>Kaufen</button>`;
                    DQ_UI.elements.shopItems.appendChild(card);
                });
            };
        };
    },

    buyItem(itemId) {
        const trans = DQ_DB.db.transaction(['character', 'shop'], 'readwrite');
        const charStore = trans.objectStore('character');
        const shopStore = trans.objectStore('shop');
        
        let char;

        trans.oncomplete = () => {
            // --- BUGFIX: Korrekter Aufruf ---
            DQ_CHARACTER_MAIN.renderPage();
            this.renderPage();
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