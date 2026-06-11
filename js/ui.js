const DQ_UI = {
    elements: {},
    touchStartY: 0,
    popupStack: [],
    hasRolledDungeonSpawn: false,

    init(elements) {
        this.elements = elements;
        this.addEventListeners();
        this.mountDungeonSpawnChipIfNeeded();
        this.setupSettingsOverlay();
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
                if (event.target === event.currentTarget) {
                    this.hideTopPopup();
                }
            });
        });

        this.elements.allPopups.forEach(popup => {
            popup.addEventListener('touchstart', (e) => { this.touchStartY = e.touches[0].clientY; }, { passive: true });
            popup.addEventListener('touchmove', (e) => this.handlePopupTouchMove(e), { passive: true });
            popup.addEventListener('touchend', (e) => this.handlePopupTouchEnd(e));
        });

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
        const targetPageId = button.dataset.page;

        // Extra Quest blockieren wenn deaktiviert
        if (targetPageId === 'page-extra-quest' && DQ_CONFIG.userSettings.extraQuestEnabled === false) {
            const exercisesBtn = document.querySelector('.nav-button[data-page="page-exercises"]');
            if (exercisesBtn) this.handleNavClick(exercisesBtn);
            return;
        }

        const currentActive = document.querySelector('.nav-button.active');
        if (currentActive) currentActive.classList.remove('active');
        button.classList.add('active');
        this.elements.pages.forEach(page => {
            const isTarget = page.id === targetPageId;
            page.classList.toggle('active', isTarget);
            page.hidden = !isTarget;
            if (isTarget) {
                page.style.display = '';
            } else {
                page.style.display = 'none';
            }
        });
        this.updateHeaderTitle(targetPageId);

        switch (targetPageId) {
            case 'page-exercises':
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

        const container = document.getElementById('app-container');
        if (container) {
            container.scrollTop = 0;
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

        // Extra Quest ueberspringen wenn deaktiviert
        if (pageId === 'page-extra-quest' && DQ_CONFIG.userSettings.extraQuestEnabled === false) return;

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
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                popupElement.classList.add('show');
            });
        });
        
        this.popupStack.push(popupElement);
    },

    setupSettingsOverlay() {
        const overlay = document.getElementById('settings-overlay');
        if (!overlay || this._settingsInitialized) return;
        this._settingsInitialized = true;

        this._settingsOverlay = overlay;
        this._settingsSheet = overlay.querySelector('.settings-sheet');
        this._settingsBg = overlay.querySelector('.settings-overlay-bg');
        this._settingsHandle = overlay.querySelector('.settings-swipe-handle');
        this._settingsTeaser = overlay.querySelector('.settings-teaser');
        this._settingsSections = overlay.querySelectorAll('.settings-section');
        this._settingsItems = overlay.querySelectorAll('.settings-item');
        this._settingsShareLoaded = false;

        this._settingsBg.addEventListener('click', () => this.closeSettingsOverlay());

        this._settingsItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.closest('.settings-section');
                if (section) this._toggleSettingsSection(section);
            });
        });

        const copyBtn = document.getElementById('copy-url-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyShareUrl();
            });
        }

        if (this._settingsSheet) {
            this._settingsSheet.addEventListener('touchstart', (e) => {
                this._settingsTouchStartY = e.touches[0].clientY;
            }, { passive: true });

            this._settingsSheet.addEventListener('touchmove', (e) => {
                const deltaY = e.touches[0].clientY - this._settingsTouchStartY;
                if (deltaY > 0 && this._settingsSheet.scrollTop <= 0) {
                    this._settingsSheet.style.transition = 'none';
                    this._settingsSheet.style.transform = `translateY(${deltaY}px)`;
                }
            }, { passive: true });

            this._settingsSheet.addEventListener('touchend', (e) => {
                const deltaY = e.changedTouches[0].clientY - this._settingsTouchStartY;
                this._settingsSheet.style.transition = '';
                this._settingsSheet.style.transform = '';
                if (deltaY > 100 && this._settingsSheet.scrollTop <= 0) {
                    this.closeSettingsOverlay();
                }
            });
        }
    },

    openSettingsOverlay() {
        if (!this._settingsOverlay) {
            this.setupSettingsOverlay();
            if (!this._settingsOverlay) return;
        }
        this._settingsOverlay.classList.add('show');
        this._syncSettingsSheetHeight();
    },

    closeSettingsOverlay() {
        if (!this._settingsOverlay) return;
        this._settingsOverlay.classList.remove('show');
        this._settingsSections.forEach(s => {
            s.classList.remove('open');
            const b = s.querySelector('.settings-section-body');
            if (b) {
                requestAnimationFrame(() => { b.style.maxHeight = '0px'; });
            }
        });
    },

    _closeAllSettingsSections(except) {
        this._settingsSections.forEach(s => {
            if (s === except) return;
            if (s.classList.contains('open')) {
                s.classList.remove('open');
                const b = s.querySelector('.settings-section-body');
                if (b) {
                    requestAnimationFrame(() => { b.style.maxHeight = '0px'; });
                }
            }
        });
    },

    _syncSettingsSheetHeight() {
        if (!this._settingsSheet) return;
        requestAnimationFrame(() => {
            const sections = this._settingsSections;
            const sheet = this._settingsSheet;
            const handle = this._settingsHandle;
            const teaser = this._settingsTeaser;
            let totalH = 0;
            if (handle) totalH += handle.offsetHeight + 14;
            if (teaser) totalH += teaser.offsetHeight + 16;
            sections.forEach(s => {
                const item = s.querySelector('.settings-item');
                const body = s.querySelector('.settings-section-body');
                if (item) totalH += item.offsetHeight;
                totalH += s.classList.contains('open') ? (body ? body.scrollHeight : 0) : 0;
            });
            const minH = window.innerHeight * 0.76;
            const maxH = window.innerHeight * 0.92;
            const targetH = Math.min(Math.max(totalH + 30, minH), maxH);
            sheet.style.maxHeight = targetH + 'px';
        });
    },

    _toggleSettingsSection(section) {
        const body = section.querySelector('.settings-section-body');
        if (!body) return;

        const willOpen = !section.classList.contains('open');

        this._closeAllSettingsSections(willOpen ? section : null);

        if (willOpen) {
            section.classList.add('open');
            requestAnimationFrame(() => { body.style.maxHeight = body.scrollHeight + 'px'; });

            const isShare = section.querySelector('#qr-code-canvas');
            if (isShare && !this._settingsShareLoaded) {
                this._settingsShareLoaded = true;
                this.loadQRCodeLibrary().then(() => {
                    setTimeout(() => {
                        this.generateShareQRCode();
                        body.style.maxHeight = body.scrollHeight + 'px';
                        this._syncSettingsSheetHeight();
                    }, 100);
                });
            }
        } else {
            section.classList.remove('open');
            requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
        }

        this._syncSettingsSheetHeight();
    },

    async loadQRCodeLibrary() {
        if (window.QRCode) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'js/vendor/qrcode.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('QRCode library failed to load'));
            document.head.appendChild(script);
        });
    },

    generateShareQRCode() {
        const container = document.getElementById('qr-code-canvas');
        if (!container || !window.QRCode) return;

        container.innerHTML = '';
        
        const url = 'https://017pixel.github.io/DailyQuest/';
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        
        new QRCode(container, {
            text: url,
            width: 240,
            height: 240,
            margin: 1,
            colorDark: isDark ? '#ffffff' : '#000000',
            colorLight: isDark ? '#1a1a1a' : '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    },

    copyShareUrl() {
        const url = 'https://017pixel.github.io/DailyQuest/';
        navigator.clipboard.writeText(url).then(() => {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const msg = (DQ_DATA.translations[lang]?.share_copied) || 'Link kopiert!';
            this.showCustomPopup(`<p>${msg}</p>`, 'info');
        }).catch(() => {
            const lang = DQ_CONFIG.userSettings.language || 'de';
            const msg = (DQ_DATA.translations[lang]?.share_copied) || 'Link kopiert!';
            this.showCustomPopup(`<p>${msg}</p>`, 'info');
        });
    },

    hideTopPopup() {
        if (this.popupStack.length === 0) return;

        const popupToHide = this.popupStack.pop();
        
        popupToHide.classList.remove('show');

        if (this.popupStack.length === 0) {
            setTimeout(() => {
                this.elements.popupOverlay.classList.remove('show');
            }, 400);
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
        const content = topPopup.querySelector('.popup-content');

        // Nur mitziehen, wenn wir nach unten wischen (deltaY > 0)
        // UND entweder:
        // a) der Content ganz oben ist (scrollTop <= 0)
        // b) oder wir direkt am Handle ziehen (nicht im scrollbaren Content)
        const isAtTop = !content || content.scrollTop <= 0;
        const isDraggingHandle = e.target.classList.contains('popup-drag-handle');

        if (deltaY > 0 && (isAtTop || isDraggingHandle)) {
            topPopup.style.transition = 'none';
            topPopup.style.transform = `translateY(${deltaY}px)`;
        } else {
            // Wenn wir im Content scrollen, darf sich das Popup nicht mitbewegen
            topPopup.style.transform = '';
        }
    },

    handlePopupTouchEnd(e) {
        const topPopup = this.popupStack[this.popupStack.length - 1];
        if (!topPopup) return;

        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        const content = topPopup.querySelector('.popup-content');
        const isAtTop = !content || content.scrollTop <= 0;
        const isDraggingHandle = e.target.classList.contains('popup-drag-handle');

        topPopup.style.transition = '';
        topPopup.style.transform = '';

        // Nur schließen, wenn der Wisch weit genug war UND wir am Top waren
        if (deltaY > 100 && (isAtTop || isDraggingHandle)) {
            this.hideTopPopup();
        }
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
        const theme = DQ_CONFIG.userSettings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        // Status-Bar Farbe dynamisch anpassen
        const metaThemeColor = document.getElementById('meta-theme-color');
        if (metaThemeColor) {
            if (theme === 'light') {
                metaThemeColor.setAttribute('content', '#f5efff');
            } else if (theme === 'oled') {
                metaThemeColor.setAttribute('content', '#010000');
            } else {
                metaThemeColor.setAttribute('content', '#1c1b1f');
            }
        }

        // OLED-Setting nur im Dark/OLED Mode anzeigen
        const oledSettingItem = document.getElementById('oled-setting-item');
        if (oledSettingItem) {
            oledSettingItem.style.display = (theme === 'light') ? 'none' : 'flex';
        }

        // Toggle-Zustände aktualisieren
        if (this.elements.themeToggle) {
            this.elements.themeToggle.checked = (theme === 'light');
        }
        const oledToggle = document.getElementById('oled-toggle');
        if (oledToggle) {
            oledToggle.checked = (theme === 'oled');
        }
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

