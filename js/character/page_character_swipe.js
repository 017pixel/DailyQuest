/**
 * @file page_character_swipe.js
 * @description Swipe-System fuer die Character Stats Karten.
 * Zweck: Ermoeglicht horizontales Swipen zwischen Statistik-Karten.
 * Verbindungen: Wird von page_character_main.js initialisiert.
 */
const DQ_SWIPE = {

    container: null,
    track: null,
    dotsContainer: null,
    cards: [],
    currentIndex: 0,

    // Touch/Maus State
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTranslate: 0,
    cardWidth: 0,

    init() {
        this.container = document.getElementById('stats-carousel-container');
        this.track = document.getElementById('stats-carousel-track');
        this.dotsContainer = document.getElementById('stats-carousel-dots');
        if (!this.container || !this.track) return;

        this._bindEvents();
        this._updateCards();
        this._updateDimensions();
        this._renderDots();
        this._goToIndex(0, false);

        window.addEventListener('resize', () => {
            this._updateDimensions();
            this._goToIndex(this.currentIndex, false);
        });
    },

    refresh() {
        this._updateCards();
        this._updateDimensions();
        this._renderDots();
        // Sicherstellen dass currentIndex noch gueltig ist
        if (this.currentIndex >= this.cards.length) {
            this.currentIndex = Math.max(0, this.cards.length - 1);
        }
        this._goToIndex(this.currentIndex, false);
    },

    _updateCards() {
        // Nur sichtbare Karten beruecksichtigen
        this.cards = Array.from(this.track.querySelectorAll('.stats-card')).filter(card => {
            return card.style.display !== 'none';
        });
    },

    _updateDimensions() {
        if (this.cards.length > 0) {
            this.cardWidth = this.cards[0].offsetWidth;
        }
    },

    _bindEvents() {
        // Touch Events
        this.container.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: true });
        this.container.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: true });
        this.container.addEventListener('touchend', (e) => this._onTouchEnd(e));
        this.container.addEventListener('touchcancel', (e) => this._onTouchEnd(e));

        // Mouse Events
        this.container.addEventListener('mousedown', (e) => this._onMouseDown(e));
        window.addEventListener('mousemove', (e) => this._onMouseMove(e));
        window.addEventListener('mouseup', (e) => this._onMouseUp(e));

        // Prevent text selection during drag
        this.container.addEventListener('selectstart', (e) => {
            if (this.isDragging) e.preventDefault();
        });
    },

    _onTouchStart(e) {
        if (this.cards.length <= 1) return;
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.currentX = this.startX;
        this.startTranslate = -this.currentIndex * this.cardWidth;
        this.track.style.transition = 'none';
    },

    _onTouchMove(e) {
        if (!this.isDragging) return;
        this.currentX = e.touches[0].clientX;
        const deltaX = this.currentX - this.startX;
        const translate = this.startTranslate + deltaX;
        this.track.style.transform = `translateX(${translate}px)`;
    },

    _onTouchEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        const deltaX = this.currentX - this.startX;
        this._handleSwipeEnd(deltaX);
    },

    _onMouseDown(e) {
        if (e.button !== 0) return; // Nur linke Maustaste
        if (this.cards.length <= 1) return;
        this.isDragging = true;
        this.startX = e.clientX;
        this.currentX = this.startX;
        this.startTranslate = -this.currentIndex * this.cardWidth;
        this.track.style.transition = 'none';
        this.container.classList.add('grabbing');
        e.preventDefault();
    },

    _onMouseMove(e) {
        if (!this.isDragging) return;
        this.currentX = e.clientX;
        const deltaX = this.currentX - this.startX;
        const translate = this.startTranslate + deltaX;
        this.track.style.transform = `translateX(${translate}px)`;
    },

    _onMouseUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.container.classList.remove('grabbing');
        const deltaX = this.currentX - this.startX;
        this._handleSwipeEnd(deltaX);
    },

    _handleSwipeEnd(deltaX) {
        const threshold = this.cardWidth * 0.25; // 25% der Kartenbreite als Threshold
        this.track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        if (deltaX < -threshold && this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
        } else if (deltaX > threshold && this.currentIndex > 0) {
            this.currentIndex--;
        }

        this._goToIndex(this.currentIndex);
    },

    _goToIndex(index, animate = true) {
        if (index < 0 || index >= this.cards.length) return;
        this.currentIndex = index;
        if (!animate) {
            this.track.style.transition = 'none';
        } else {
            this.track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        const translate = -index * this.cardWidth;
        this.track.style.transform = `translateX(${translate}px)`;
        this._updateDots();

        // Lazy-Rendering: Karte rendern wenn sie sichtbar wird
        this._triggerCardRender(this.cards[index]);
    },

    _renderDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.innerHTML = '';

        this.cards.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', `Karte ${index + 1}`);
            dot.addEventListener('click', () => this._goToIndex(index));
            this.dotsContainer.appendChild(dot);
        });

        this._updateDots();
    },

    _updateDots() {
        if (!this.dotsContainer) return;
        const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    },

    _triggerCardRender(cardElement) {
        // Dispatch ein Custom Event damit Karten ihre Daten laden koennen
        const cardType = cardElement.dataset.card;
        cardElement.dispatchEvent(new CustomEvent('cardvisible', {
            detail: { cardType, index: this.currentIndex },
            bubbles: true
        }));
    }
};

try { window.DQ_SWIPE = DQ_SWIPE; } catch { }
