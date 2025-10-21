/**
 * @file page_character_labels.js
 * @description Player label system for DailyQuest
 * Calculates and displays personalized player labels based on character stats
 */

const DQ_LABELS = {
    // Configuration parameters
    config: {
        similarityThreshold: 0.1, // 10% difference threshold for combining stats
        minDataPoints: 3, // Minimum data points needed for meaningful analysis
        priorityOrder: ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft']
    },

    // Label definitions with descriptions and colors
    labels: {
        // Single-stat labels
        kraftprotz: {
            name: 'Kraftprotz',
            description: 'Robust und stark bei schweren Übungen',
            color: '#8b5cf6',
            stats: ['kraft']
        },
        marathoner: {
            name: 'Marathoner',
            description: 'Ausdauerstark, lange Sets möglich',
            color: '#4ecdc4',
            stats: ['ausdauer']
        },
        akrobat: {
            name: 'Akrobat',
            description: 'Flink, gute Technik bei Bewegungsübungen',
            color: '#45b7d1',
            stats: ['beweglichkeit']
        },
        stoiker: {
            name: 'Stoiker',
            description: 'Sehr konstante Leistung über Zeit',
            color: '#96ceb4',
            stats: ['durchhaltevermoegen']
        },
        eiserner_wille: {
            name: 'Eiserner Wille',
            description: 'Hoher Fokus, verlässliche Completion-Rate',
            color: '#10b981',
            stats: ['willenskraft']
        },

        // Two-stat combination labels
        tank: {
            name: 'Tank',
            description: 'Stark und belastbar; ideal für schwere Sätze',
            color: '#ff9ff3',
            stats: ['kraft', 'willenskraft']
        },
        powerlaeufer: {
            name: 'Powerläufer',
            description: 'Kraftvoll und ausdauernd zugleich',
            color: '#54a0ff',
            stats: ['kraft', 'ausdauer']
        },
        kraftakrobat: {
            name: 'Kraftakrobat',
            description: 'Stark und technisch beweglich',
            color: '#5f27cd',
            stats: ['kraft', 'beweglichkeit']
        },
        langlaeufer: {
            name: 'Langläufer',
            description: 'Perfekte Ausdauer-Profil',
            color: '#00d2d3',
            stats: ['ausdauer', 'durchhaltevermoegen']
        },
        praezisionskuenstler: {
            name: 'Präzisionskünstler',
            description: 'Kontrolliert & fokussiert',
            color: '#06b6d4',
            stats: ['beweglichkeit', 'willenskraft']
        },
        unermuedlicher: {
            name: 'Unermüdlicher',
            description: 'Hält lange durch, mentale Stärke',
            color: '#2ed573',
            stats: ['durchhaltevermoegen', 'willenskraft']
        },
        sprint_athlet: {
            name: 'Sprint-Athlet',
            description: 'Schnell, dynamisch',
            color: '#3b82f6',
            stats: ['ausdauer', 'beweglichkeit']
        },
        bergbezwinger: {
            name: 'Bergbezwinger',
            description: 'Stabil & ausdauernd unter Last',
            color: '#8b4513',
            stats: ['kraft', 'durchhaltevermoegen']
        },
        konditionshybrid: {
            name: 'Konditionshybrid',
            description: 'Allrounder zwischen Stärke & Kondition',
            color: '#8b5cf6',
            stats: ['ausdauer', 'kraft']
        },
        agiler_stoiker: {
            name: 'Agiler Stoiker',
            description: 'Flexibel & ausdauernd',
            color: '#74b9ff',
            stats: ['beweglichkeit', 'durchhaltevermoegen']
        },
        fokuslaeufer: {
            name: 'Fokusläufer',
            description: 'Sehr diszipliniert bei langen Workouts',
            color: '#a29bfe',
            stats: ['ausdauer', 'willenskraft']
        },
        kraftmeister: {
            name: 'Kraftmeister',
            description: 'Variation von Kraftprotz mit zweiter hoher Eigenschaft',
            color: '#fd79a8',
            stats: ['kraft', 'secondary']
        },
        taktiker: {
            name: 'Taktiker',
            description: 'Strategisch in Übungsauswahl',
            color: '#6c5ce7',
            stats: ['willenskraft', 'beweglichkeit']
        },
        widerstandskuenstler: {
            name: 'Widerstandskünstler',
            description: 'Zäh und kraftvoll',
            color: '#059669',
            stats: ['durchhaltevermoegen', 'kraft']
        },

        // Special cases
        allrounder: {
            name: 'Allrounder',
            description: 'Vielseitig, keine Spezialisierung',
            color: '#636e72',
            stats: ['balanced']
        },
        neuling: {
            name: 'Neuling',
            description: 'Noch nicht genügend Daten für Analyse',
            color: '#b2bec3',
            stats: ['insufficient_data']
        }
    },

    /**
     * Calculate player label based on character stats
     * @param {Object} character - Character object with stats
     * @returns {Object} Label object with name, description, and color
     */
    calculateLabel(character) {
        if (!character || !character.stats) {
            return this.labels.neuling;
        }

        const stats = character.stats;
        const statValues = Object.values(stats);
        const statKeys = Object.keys(stats);

        // Check if we have enough data
        const totalStats = statValues.reduce((sum, val) => sum + val, 0);
        if (totalStats < this.config.minDataPoints * 5) { // 5 base stats
            return this.labels.neuling;
        }

        // Normalize stats (convert to relative percentages)
        const normalizedStats = this.normalizeStats(stats);

        // Find top stats
        const sortedStats = this.getSortedStats(normalizedStats);

        // Check for single dominant stat
        const topStat = sortedStats[0];
        const secondStat = sortedStats[1];
        
        if (topStat.value - secondStat.value > this.config.similarityThreshold) {
            return this.getSingleStatLabel(topStat.key);
        }

        // Check for two-stat combination
        if (topStat.value - sortedStats[2].value > this.config.similarityThreshold) {
            return this.getTwoStatLabel(topStat.key, secondStat.key);
        }

        // Check for three-way tie or more
        if (sortedStats[2].value > topStat.value - this.config.similarityThreshold) {
            return this.labels.allrounder;
        }

        // Default fallback
        return this.labels.allrounder;
    },

    /**
     * Normalize stats to relative percentages
     * @param {Object} stats - Raw stat values
     * @returns {Object} Normalized stats
     */
    normalizeStats(stats) {
        const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
        const normalized = {};
        
        for (const [key, value] of Object.entries(stats)) {
            normalized[key] = total > 0 ? value / total : 0;
        }
        
        return normalized;
    },

    /**
     * Get sorted stats by value (descending)
     * @param {Object} normalizedStats - Normalized stat values
     * @returns {Array} Sorted array of {key, value} objects
     */
    getSortedStats(normalizedStats) {
        return Object.entries(normalizedStats)
            .map(([key, value]) => ({ key, value }))
            .sort((a, b) => b.value - a.value);
    },

    /**
     * Get label for single dominant stat
     * @param {string} statKey - The dominant stat key
     * @returns {Object} Label object
     */
    getSingleStatLabel(statKey) {
        const singleStatLabels = {
            'kraft': 'kraftprotz',
            'ausdauer': 'marathoner',
            'beweglichkeit': 'akrobat',
            'durchhaltevermoegen': 'stoiker',
            'willenskraft': 'eiserner_wille'
        };

        const labelKey = singleStatLabels[statKey];
        return this.labels[labelKey] || this.labels.allrounder;
    },

    /**
     * Get label for two-stat combination
     * @param {string} stat1 - First stat key
     * @param {string} stat2 - Second stat key
     * @returns {Object} Label object
     */
    getTwoStatLabel(stat1, stat2) {
        // Create a sorted combination key for lookup
        const combination = [stat1, stat2].sort();
        const combinationKey = combination.join('_');

        const twoStatLabels = {
            'kraft_willenskraft': 'tank',
            'kraft_ausdauer': 'powerlaeufer',
            'kraft_beweglichkeit': 'kraftakrobat',
            'ausdauer_durchhaltevermoegen': 'langlaeufer',
            'beweglichkeit_willenskraft': 'praezisionskuenstler',
            'durchhaltevermoegen_willenskraft': 'unermuedlicher',
            'ausdauer_beweglichkeit': 'sprint_athlet',
            'kraft_durchhaltevermoegen': 'bergbezwinger',
            'ausdauer_kraft': 'konditionshybrid',
            'beweglichkeit_durchhaltevermoegen': 'agiler_stoiker',
            'ausdauer_willenskraft': 'fokuslaeufer',
            'willenskraft_beweglichkeit': 'taktiker',
            'durchhaltevermoegen_kraft': 'widerstandskuenstler'
        };

        const labelKey = twoStatLabels[combinationKey];
        if (labelKey) {
            return this.labels[labelKey];
        }

        // Special case for Kraftmeister (Kraft + any other high stat)
        if (stat1 === 'kraft' || stat2 === 'kraft') {
            return this.labels.kraftmeister;
        }

        return this.labels.allrounder;
    },

    /**
     * Render the player label UI component
     * @param {Object} character - Character object
     * @param {HTMLElement} container - Container element to render into
     */
    renderLabel(character, container) {
        const label = this.calculateLabel(character);
        
        const labelElement = document.createElement('div');
        labelElement.className = 'player-label';
        labelElement.style.backgroundColor = label.color;
        labelElement.title = label.description;
        
        labelElement.innerHTML = `
            <span class="label-name">${label.name}</span>
        `;

        // Add click handler for detailed info
        labelElement.addEventListener('click', () => {
            this.showLabelInfo(label);
        });

        container.appendChild(labelElement);
    },

    /**
     * Show detailed label information popup
     * @param {Object} label - Label object
     */
    showLabelInfo(label) {
        const popupContent = `
            <h3>${label.name}</h3>
            <p>${label.description}</p>
            <div class="label-stats">
                <strong>Basis-Stats:</strong> ${label.stats.join(', ')}
            </div>
        `;
        
        DQ_UI.showCustomPopup(popupContent);
    }
};
