const DQ_FOKUS_FOREST = {

    emojiToIcon(emoji) {
        switch (emoji) {
            case '🌲':
            case '🌳':
            case '🍁':
                return 'forest';
            case '🌿':
            case '☘️':
                return 'eco';
            case '🍄':
                return 'compost';
            case '🌸':
            case '🌷':
            case '🌹':
                return 'local_florist';
            case '🌻':
                return 'wb_sunny';
            case '🐛':
                return 'bug_report';
            case '🐌':
                return 'pest_control';
            case '🦋':
                return 'emoji_nature';
            case '🦄':
                return 'auto_awesome';
            case '🐉':
                return 'local_fire_department';
            case '💎':
                return 'diamond';
            default:
                return 'eco';
        }
    },

    renderForestScreen() {
        const container = document.getElementById('fokus-tab-wald');
        // === KORREKTUR: Container wird hier geleert ===
        container.innerHTML = '';

        const state = DQ_VIBE_STATE.state;
        const lang = DQ_CONFIG.userSettings.language || 'de';

        let selected = state.selectedEmoji;
        let emojiToDisplay = '<span class="material-symbols-rounded">casino</span>';
        let emojiName = DQ_DATA.translations[lang].widget_random_name || 'Zufällig';
        let plantedCount = state.sessions.length;

        if (selected !== 'random') {
            const item = DQ_VIBE_STATE.SHOP_ITEMS.find(i => i.emoji === selected);
            if(item) {
                emojiToDisplay = `<span class="material-symbols-rounded">${this.emojiToIcon(item.emoji)}</span>`;
                emojiName = item.name[lang];
                plantedCount = state.sessions.filter(s => s.emoji === selected).length;
            }
        }

        container.innerHTML = `
            <div class="forest-screen">
                ${state.sessions.map(session => {
                    const top = Math.random() * 85; 
                    const left = Math.random() * 90;
                    return `<span class=\"planted-emoji\" style=\"top: ${top}%; left: ${left}%;\"><span class=\"material-symbols-rounded\">${this.emojiToIcon(session.emoji)}</span></span>`
                }).join('')}
            </div>
            <div id="plant-next-widget">
                <div style="width: 100%; display: flex; flex-direction: column;">
                    <h3 class="widget-header" data-lang-key="widget_header">Pflanze als Nächstes:</h3>
                    <div class="widget-body">
                        <div class="widget-emoji">${emojiToDisplay}</div>
                        <div class="widget-details">
                            <div class="widget-name">${emojiName}</div>
                            <div class="widget-count" data-lang-key="widget_planted">Gepflanzt: ${plantedCount}</div>
                        </div>
                        <div class="widget-change-indicator">›</div>
                    </div>
                </div>
            </div>`;
        
        document.getElementById('plant-next-widget').onclick = () => this.showEmojiSelectionPopup();
    },

    showEmojiSelectionPopup() {
        const popup = document.getElementById('emoji-selection-popup');
        const grid = document.getElementById('emoji-grid-container');
        grid.innerHTML = '';
        const state = DQ_VIBE_STATE.state;

        const options = ['random', ...state.unlockedEmojis];
        options.forEach(emoji => {
            const item = document.createElement('div');
            item.className = 'card emoji-selection-item';
            item.dataset.emoji = emoji;
            const iconName = emoji === 'random' ? 'casino' : this.emojiToIcon(emoji);
            item.innerHTML = `<span class="material-symbols-rounded">${iconName}</span>`;
            if (state.selectedEmoji === emoji) {
                item.classList.add('selected');
            }
            item.onclick = async () => {
                state.selectedEmoji = emoji;
                await DQ_VIBE_STATE.saveState();
                this.renderForestScreen();
                DQ_UI.hideTopPopup();
            };
            grid.appendChild(item);
        });
        DQ_UI.showPopup(popup);
    }
};