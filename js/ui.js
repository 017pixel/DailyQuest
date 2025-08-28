const DQ_UI = {
    elements: {},
    touchStartY: 0,
    currentPopup: null,

    init(elements) {
        this.elements = elements;
        this.addEventListeners();
    },

    addEventListeners() {
        this.elements.navButtons.forEach(button => {
            button.addEventListener('click', () => this.handleNavClick(button));
        });

        this.elements.popupOverlay.addEventListener('click', () => this.hidePopups());
        this.elements.allPopups.forEach(popup => {
            popup.addEventListener('touchstart', (e) => { this.touchStartY = e.touches[0].clientY; }, { passive: true });
            popup.addEventListener('touchmove', (e) => this.handlePopupTouchMove(e), { passive: true });
            popup.addEventListener('touchend', (e) => this.handlePopupTouchEnd(e));
        });

        this.elements.settingsButton.addEventListener('click', () => this.showPopup(this.elements.settingsPopup));
    },

    handleNavClick(button) {
        const currentActive = document.querySelector('.nav-button.active');
        if (currentActive) currentActive.classList.remove('active');
        button.classList.add('active');
        const targetPageId = button.dataset.page;
        this.elements.pages.forEach(page => page.classList.toggle('active', page.id === targetPageId));
        this.updateHeaderTitle(targetPageId);
    },

    updateHeaderTitle(pageId) {
        const lang = DQ_CONFIG.userSettings.language || 'de';
        let key = 'exercises';
        if (pageId === 'page-character') key = 'character';
        if (pageId === 'page-shop') key = 'shop';
        if (pageId === 'page-extra-quest') key = 'extra_quest_nav';
        this.elements.headerTitle.textContent = (DQ_DATA.translations[lang] && DQ_DATA.translations[lang][key]) || DQ_DATA.translations['de'][key];
    },

    showPopup(popupElement) {
        this.currentPopup = popupElement;
        this.elements.popupOverlay.classList.add('show');
        this.currentPopup.classList.add('show');
    },

    hidePopups() {
        if (!this.currentPopup) return;
        this.elements.popupOverlay.classList.remove('show');
        this.currentPopup.classList.remove('show');
        this.currentPopup = null;
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
                    if (this.currentPopup === this.elements.notificationPopup && this.elements.notificationPopup.classList.contains('show')) this.hidePopups();
                }, 3000);
            }
        }
    },

    handlePopupTouchMove(e) {
        if (!this.currentPopup) return;
        const deltaY = e.touches[0].clientY - this.touchStartY;
        if (deltaY > 0) {
            this.currentPopup.style.transition = 'none';
            this.currentPopup.style.transform = `translateY(${deltaY}px)`;
        }
    },

    handlePopupTouchEnd(e) {
        if (!this.currentPopup) return;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        this.currentPopup.style.transition = '';
        this.currentPopup.style.transform = '';
        if (deltaY > 100) this.hidePopups();
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
        DQ_EXERCISES.renderQuests();
        DQ_EXERCISES.renderFreeExercisesPage();
        DQ_EXTRA.renderExtraQuestPage();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', DQ_CONFIG.userSettings.theme || 'dark');
        this.elements.themeToggle.checked = (DQ_CONFIG.userSettings.theme === 'light');
    }
};