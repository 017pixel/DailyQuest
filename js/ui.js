const DQ_UI = {
    elements: {},
    touchStartY: 0,
    popupStack: [],
    hasRolledDungeonSpawn: false,

    init(elements) {
        this.elements = elements;
        this.addEventListeners();
        this.mountDungeonSpawnChipIfNeeded();
    },

    addEventListeners() {
        this.elements.navButtons.forEach(button => {
            button.addEventListener('click', () => this.handleNavClick(button));
        });

        this.elements.popupOverlay.addEventListener('click', () => this.hideTopPopup());

        this.elements.allPopups.forEach(popup => {
            popup.addEventListener('click', (event) => {
                if (this.popupStack.length > 1 && event.currentTarget === this.popupStack[this.popupStack.length - 2]) {
                    this.hideTopPopup();
                }
            });
        });

        this.elements.allPopups.forEach(popup => {
            popup.addEventListener('touchstart', (e) => { this.touchStartY = e.touches[0].clientY; }, { passive: true });
            popup.addEventListener('touchmove', (e) => this.handlePopupTouchMove(e), { passive: true });
            popup.addEventListener('touchend', (e) => this.handlePopupTouchEnd(e));
        });

        this.elements.settingsButton.addEventListener('click', () => this.showPopup(this.elements.settingsPopup));

        this.elements.achievementsButton.addEventListener('click', async () => {
            try {
                await DQ_ACHIEVEMENTS.renderAchievementsList();
                this.showPopup(this.elements.achievementsPopup);
            } catch (error) {
                console.error('Fehler beim Rendern der Erfolge:', error);
                DQ_UI.showCustomPopup('Fehler beim Laden der Erfolge. Bitte versuche es erneut.', 'penalty');
            }
        });

        // --- NEU: Event Listener für den Schließen-Button des Fokus-Popups ---
        this.elements.closeFocusRewardPopupButton.addEventListener('click', () => this.hideTopPopup());
    },

    handleNavClick(button) {
        const currentActive = document.querySelector('.nav-button.active');
        if (currentActive) currentActive.classList.remove('active');
        button.classList.add('active');
        const targetPageId = button.dataset.page;
        this.elements.pages.forEach(page => page.classList.toggle('active', page.id === targetPageId));
        this.updateHeaderTitle(targetPageId);

        switch (targetPageId) {
            case 'page-exercises':
                // Scroll-Position beim Öffnen zurücksetzen, damit Hero voll sichtbar ist
                const container = document.getElementById('app-container');
                if (container) container.scrollTo({ top: 0, behavior: 'instant' });
                DQ_EXERCISES.renderQuests();
                DQ_EXERCISES.renderFreeExercisesPage();
                break;
            case 'page-fokus':
                DQ_FOKUS_MAIN.renderPage();
                break;
            case 'page-character':
                DQ_CHARACTER_MAIN.renderPage();
                break;
            case 'page-shop':
                DQ_SHOP.renderPage();
                break;
            case 'page-extra-quest':
                DQ_EXTRA.renderExtraQuestPage();
                break;
        }
        // Beim Seitenwechsel ggf. Dungeon-Spawn-Chip erneut montieren (z.B. nach Niederlage)
        this.mountDungeonSpawnChipIfNeeded();

        // Progressives Tutorial: Zeige Feature-Erklärung beim ersten Besuch
        this.checkAndShowProgressiveTutorial(targetPageId);
    },

    /**
     * Prüft und zeigt das progressive Tutorial für eine Seite an
     * @param {string} pageId - ID der aktuellen Seite
     */
    async checkAndShowProgressiveTutorial(pageId) {
        // Nur wenn das Progressive Tutorial verfügbar ist
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;

        // Mapping von Page-IDs zu Feature-Namen
        const pageToFeatureMap = {
            'page-exercises': 'exercises',
            'page-fokus': 'fokus',
            'page-character': 'character',
            'page-shop': 'shop',
            'page-extra-quest': 'extraQuest'
        };

        const featureName = pageToFeatureMap[pageId];
        if (!featureName) return;

        // Tutorial mit kleiner Verzögerung anzeigen, damit die Seite geladen ist
        setTimeout(async () => {
            await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial(featureName);
        }, 300);
    },

    updateHeaderTitle(pageId) {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        let key = 'exercises';
        if (pageId === 'page-fokus') key = 'fokus_page_title';
        if (pageId === 'page-character') key = 'character';
        if (pageId === 'page-shop') key = 'shop';
        if (pageId === 'page-extra-quest') key = 'extra_quest_nav';
        this.elements.headerTitle.textContent = (DQ_DATA.translations[lang] && DQ_DATA.translations[lang][key]) || DQ_DATA.translations['de'][key];
    },

    showPopup(popupElement) {
        if (this.popupStack.includes(popupElement)) return;

        this.elements.popupOverlay.classList.add('show');
        popupElement.classList.add('show');
        this.popupStack.push(popupElement);
    },

    hideTopPopup() {
        if (this.popupStack.length === 0) return;

        const popupToHide = this.popupStack.pop();
        popupToHide.classList.remove('show');

        if (this.popupStack.length === 0) {
            this.elements.popupOverlay.classList.remove('show');
        }
    },

    hideAllPopups() {
        while (this.popupStack.length > 0) {
            this.hideTopPopup();
        }
    },

    showCustomPopup(content, type = 'notification') {
        this.elements.infoPopup.classList.remove('penalty');
        this.elements.notificationPopup.classList.remove('penalty');

        if (type === 'info') {
            this.elements.infoPopupContent.innerHTML = content;
            this.showPopup(this.elements.infoPopup);
        } else {
            if (type === 'penalty') {
                this.elements.notificationPopup.classList.add('penalty');
            }
            this.elements.notificationPopupContent.innerHTML = content.replace(/\n/g, '<br>');
            this.showPopup(this.elements.notificationPopup);

            if (type !== 'penalty') {
                setTimeout(() => {
                    const topPopup = this.popupStack[this.popupStack.length - 1];
                    if (topPopup === this.elements.notificationPopup && topPopup.classList.contains('show')) {
                        this.hideTopPopup();
                    }
                }, 3000);
            }
        }
    },

    showRewardPopup(title, content) {
        this.elements.rewardPopupTitle.innerHTML = title;
        this.elements.rewardPopupContent.innerHTML = content;
        this.showPopup(this.elements.rewardPopup);
    },

    // --- NEU: Funktion zum Anzeigen des spezifischen Fokus-Belohnungs-Popups ---
    showFocusRewardPopup(rewards) {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        this.elements.focusRewardMinutes.textContent = `${rewards.minutes} ${DQ_DATA.translations[lang].focus_reward_time || 'Minuten'}`;
        this.elements.focusRewardGold.innerHTML = `+${rewards.gold}`;
        this.elements.focusRewardMana.innerHTML = `+${rewards.mana}`;

        const statsContainer = this.elements.focusRewardStatsContainer;
        statsContainer.innerHTML = '';
        if (rewards.statGains && rewards.statGains.durchhaltevermoegen > 0) {
            const statText = `+${rewards.statGains.durchhaltevermoegen} Durchhaltevermögen`;
            statsContainer.innerHTML = `<p>${statText}</p>`;
        }

        this.showPopup(this.elements.focusRewardPopup);
    },

    handlePopupTouchMove(e) {
        const topPopup = this.popupStack[this.popupStack.length - 1];
        if (!topPopup) return;
        const deltaY = e.touches[0].clientY - this.touchStartY;
        if (deltaY > 0) {
            topPopup.style.transition = 'none';
            topPopup.style.transform = `translateY(${deltaY}px)`;
        }
    },

    handlePopupTouchEnd(e) {
        const topPopup = this.popupStack[this.popupStack.length - 1];
        if (!topPopup) return;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        topPopup.style.transition = '';
        topPopup.style.transform = '';
        if (deltaY > 100) this.hideTopPopup();
    },

    applyTranslations() {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (DQ_DATA.translations[lang] && DQ_DATA.translations[lang][key]) {
                el.textContent = DQ_DATA.translations[lang][key];
            }
        });
        const activePageId = document.querySelector('.page.active').id;
        this.updateHeaderTitle(activePageId);
        DQ_EXTRA.renderExtraQuestPage();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', DQ_CONFIG.userSettings.theme || 'dark');
        this.elements.themeToggle.checked = (DQ_CONFIG.userSettings.theme === 'light');
    },

    // --- DUNGEON: Floating spawn chip with 5% spawn probability and persistence ---
    async mountDungeonSpawnChipIfNeeded() {
        try {
            if (document.getElementById('dungeon-spawn-chip')) return;
            let isActive = false;

            // Im Tutorial-Modus: Immer aktiv
            if (window.DQ_TUTORIAL_IN_PROGRESS) {
                isActive = true;
            } else {
                // Bei jedem App-Start: Status zurücksetzen und neu würfeln (nur einmal)
                if (!this.hasRolledDungeonSpawn) {
                    this.hasRolledDungeonSpawn = true;
                    // Alten Status zurücksetzen
                    try { await DQ_DUNGEON_PERSIST.setActiveDungeon(false); } catch { }
                    // 5% Wahrscheinlichkeit beim App-Start
                    if (Math.random() < 0.05) {
                        try { await DQ_DUNGEON_PERSIST.setActiveDungeon(true); isActive = true; } catch { }
                    }
                } else {
                    // Wenn bereits gewürfelt wurde, aktuellen Status aus DB lesen
                    try {
                        if (typeof DQ_DUNGEON_PERSIST !== 'undefined' && DQ_DUNGEON_PERSIST.getActiveDungeon) {
                            isActive = await DQ_DUNGEON_PERSIST.getActiveDungeon();
                        }
                    } catch { }
                }
            }
            if (!isActive) return;

            const chip = document.createElement('div');
            chip.id = 'dungeon-spawn-chip';
            chip.className = 'dungeon-spawn-chip';
            chip.innerHTML = `
                <span class="material-symbols-rounded chip-icon" style="font-size:20px;">location_on</span>
                <span class="chip-text">Dungeon erschienen</span>
                <span class="chip-action">Los!</span>
            `;
            chip.addEventListener('click', async () => {
                // Tutorial Check: Erstes Mal Dungeon?
                if (typeof DQ_TUTORIAL_PROGRESSIVE !== 'undefined') {
                    const hasSeenPre = await DQ_TUTORIAL_STATE.hasSeenFeature('dungeon_pre');
                    if (!hasSeenPre) {
                        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('dungeon_pre');
                    }
                }

                if (typeof DQ_DUNGEON_MAIN !== 'undefined' && DQ_DUNGEON_MAIN && DQ_DUNGEON_MAIN.open) {
                    try { chip.remove(); } catch { }
                    DQ_DUNGEON_MAIN.open();
                } else {
                    const navBtn = document.querySelector('.nav-button[data-page="page-exercises"]');
                    if (navBtn) DQ_UI.handleNavClick(navBtn);
                    DQ_UI.showCustomPopup('Dungeon lädt...', 'info');
                    let tries = 0;
                    const t = setInterval(() => {
                        tries++;
                        if (typeof DQ_DUNGEON_MAIN !== 'undefined' && DQ_DUNGEON_MAIN && DQ_DUNGEON_MAIN.open) {
                            clearInterval(t);
                            try { chip.remove(); } catch { }
                            DQ_DUNGEON_MAIN.open();
                        } else if (tries > 20) {
                            clearInterval(t);
                        }
                    }, 100);
                }
            });
            document.body.appendChild(chip);
        } catch (e) {
            console.error('Dungeon spawn chip error:', e);
        }
    },

    // Dungeon popup config helpers (Phase 5)
    getDungeonAlwaysPopup() {
        try {
            const v = localStorage.getItem('dq_dungeon_always_popup');
            if (v === null) return true; // default: beta on
            return v === '1';
        } catch { return true; }
    },
    setDungeonAlwaysPopup(flag) {
        try { localStorage.setItem('dq_dungeon_always_popup', flag ? '1' : '0'); } catch { }
    },
    getDungeonSpawnProbability() {
        try {
            const v = parseFloat(localStorage.getItem('dq_dungeon_spawn_prob'));
            if (isNaN(v)) return 0.2;
            return Math.max(0, Math.min(1, v));
        } catch { return 0.2; }
    },
    setDungeonSpawnProbability(prob) {
        try { localStorage.setItem('dq_dungeon_spawn_prob', String(prob)); } catch { }
    }
};