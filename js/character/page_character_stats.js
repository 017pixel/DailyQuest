const DQ_STATS = {
    weightChartScrollHandler: null,
    // --- NEU: Farbpalette mit höherem Kontrast ---
    focusChartColorPalette: [
        '#5f8575', // Original
        '#a1dfd5', // Heller, gesättigt
        '#3a5e50', // Dunkler, desaturiert
        '#8bc1b5', // Mittlerer Ton
        '#4d7a69', // Dunklerer Mittelton
        '#c1f0e8', // Sehr hell
        '#559c88', // Gesättigter
        '#2e473f'  // Sehr dunkel
    ],
    colorIndex: 0,

    // Basis-Stats: Reihenfolge, Labels, Icons, Farben (Material Symbols)
    statOrder: ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'],
    statMeta: {
        kraft: { name: 'Kraft', icon: 'fitness_center', color: '#ef4444' },
        ausdauer: { name: 'Ausdauer', icon: 'directions_run', color: '#f59e0b' },
        beweglichkeit: { name: 'Beweglichkeit', icon: 'sports_gymnastics', color: '#3b82f6' },
        durchhaltevermoegen: { name: 'Durchhaltevermögen', icon: 'hourglass_bottom', color: '#a855f7' },
        willenskraft: { name: 'Willenskraft', icon: 'bolt', color: '#10b981' }
    },

    init(elements) {
        elements.addWeightEntryButton.addEventListener('click', () => this.showAddWeightPopup());
    },

    renderStatsPage(char, entries) {
        this.renderStats(char);
        this.renderFocusStats();
        this.renderWeightTracking(char, entries);
    },

    renderStats(char) {
        const canvas = document.getElementById('stats-radar-chart');
        if (canvas) {
            this.createRadarChart(canvas, char.stats);
        }

        const statsListContainer = document.getElementById('stats-list-container');
        statsListContainer.innerHTML = ''; 

        this.statOrder.forEach((key) => {
            const meta = this.statMeta[key];
            const value = (char.stats && typeof char.stats[key] !== 'undefined') ? char.stats[key] : 0;
            const statItem = document.createElement('div');
            statItem.className = 'stat-item-text';
            statItem.innerHTML = `
                <div class="stat-left">
                    <span class="material-symbols-rounded stat-icon" style="color:${meta.color};">${meta.icon}</span>
                    <span class="stat-name">${meta.name}</span>
                </div>
                <span class="stat-value">${value}</span>
            `;
            statsListContainer.appendChild(statItem);
        });
    },

    renderFocusStats() {
        const section = document.getElementById('focus-stats-section');
        const container = document.getElementById('focus-stats-container');
        const vibeState = DQ_VIBE_STATE.state;

        console.log('Rendering focus stats, vibeState:', vibeState);
        section.style.display = 'block';

        const totalMinutes = vibeState.sessions ? vibeState.sessions.reduce((sum, s) => sum + s.duration, 0) : 0;
        const totalSessions = vibeState.sessions ? vibeState.sessions.length : 0;

        const formatMinutes = (mins) => {
            const hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        };

        const lang = DQ_CONFIG.userSettings.language || 'de';
        
        // Gruppiere Sessions nach Label
        const labelData = (vibeState.sessions || []).reduce((acc, session) => {
            const label = session.label || 'Unbenannt';
            if (!acc[label]) {
                acc[label] = { totalMinutes: 0, sessionCount: 0 };
            }
            acc[label].totalMinutes += session.duration;
            acc[label].sessionCount += 1;
            return acc;
        }, {});

        // Sortiere Labels nach Gesamtzeit (absteigend)
        const sortedLabels = Object.entries(labelData).sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes);

        container.innerHTML = `
            <div id="focus-summary-container">
                <div class="focus-summary-item">
                    <span class="label" data-lang-key="focus_total_time">${DQ_DATA.translations[lang].focus_total_time}</span>
                    <span class="value">${formatMinutes(totalMinutes)}</span>
                </div>
                <div class="focus-summary-item">
                    <span class="label" data-lang-key="focus_total_sessions">${DQ_DATA.translations[lang].focus_total_sessions}</span>
                    <span class="value">${totalSessions}</span>
                </div>
            </div>
            <hr class="stat-separator">
            <div id="focus-labels-list">
                ${sortedLabels.length > 0 ? sortedLabels.map(([label, data]) => `
                    <div class="focus-label-item">
                        <span class="name">${label}</span>
                        <span class="time">${formatMinutes(data.totalMinutes)} (${data.sessionCount} Sitzungen)</span>
                    </div>
                `).join('') : `<p style="text-align: center; opacity: 0.7; margin: 16px 0;">Noch keine Fokus-Sitzungen</p>`}
            </div>
        `;
    },

    
    createRadarChart(canvas, stats) {
        const baseSize = 320;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = baseSize * dpr;
        canvas.height = baseSize * dpr;
        canvas.style.width = `${baseSize}px`;
        canvas.style.height = `${baseSize}px`;
        ctx.scale(dpr, dpr);

        const centerX = baseSize / 2;
        const centerY = baseSize / 2;
        const radius = Math.min(centerX, centerY) * 0.75;
        
        const statKeys = this.statOrder;
        const numAxes = statKeys.length;

        const highestStat = Math.max(...Object.values(stats));
        const chartBuffer = 5; 
        const baselineMax = 20; 
        const maxStatValue = Math.max(baselineMax, highestStat + chartBuffer);

        ctx.clearRect(0, 0, baseSize, baseSize);
        
        const style = getComputedStyle(document.documentElement);
        const gridColor = style.getPropertyValue('--outline-color').trim();
        const labelColor = style.getPropertyValue('--on-surface-color').trim();
        const primaryColor = style.getPropertyValue('--primary-color').trim();
        const primaryColorRgb = style.getPropertyValue('--primary-color-rgb').trim();

        const levels = 4;
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;
            ctx.beginPath();
            ctx.moveTo(centerX + levelRadius * Math.cos(-Math.PI / 2), centerY + levelRadius * Math.sin(-Math.PI / 2));
            for (let i = 1; i <= numAxes; i++) {
                const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
                ctx.lineTo(centerX + levelRadius * Math.cos(angle), centerY + levelRadius * Math.sin(angle));
            }
            ctx.closePath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            ctx.strokeStyle = gridColor;
            ctx.stroke();
        }

        // Zeichnen der Text-Labels (ersetzt durch Icon-Overlay)
        this.renderRadarIconLabels(canvas, centerX, centerY, radius, statKeys);
        
        ctx.beginPath();
        for (let i = 0; i < numAxes; i++) {
            const statRadius = (stats[statKeys[i]] / maxStatValue) * radius;
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            const x = centerX + statRadius * Math.cos(angle);
            const y = centerY + statRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fillStyle = `rgba(${primaryColorRgb}, 0.5)`;
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    // Overlay für Radar-Labels mit Icons, damit nichts vom Canvas abgeschnitten wird
    renderRadarIconLabels(canvas, centerX, centerY, radius, statKeys) {
        try {
            const baseSize = 320;
            const parent = canvas.parentElement;
            if (!parent) return;
            // Stelle sicher, dass der Karten-Container als Bezug dient
            // (CSS fügt position:relative zu #character-stats hinzu)
            let layer = document.getElementById('stats-chart-label-layer');
            if (!layer) {
                layer = document.createElement('div');
                layer.id = 'stats-chart-label-layer';
                layer.className = 'chart-label-layer';
                parent.appendChild(layer);
            }
            const parentRect = parent.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            layer.style.position = 'absolute';
            layer.style.left = `${canvasRect.left - parentRect.left}px`;
            layer.style.top = `${canvasRect.top - parentRect.top}px`;
            layer.style.width = `${baseSize}px`;
            layer.style.height = `${baseSize}px`;
            layer.style.pointerEvents = 'none';
            layer.innerHTML = '';

            const iconSize = 28; // muss mit CSS .stat-chart-icon übereinstimmen
            const edgePadding = 2; // kleiner Sicherheitsabstand zum Rand
            const maxLabelRadius = (baseSize / 2) - (iconSize / 2) - edgePadding;
            let labelRadius = radius * 1.08 + 18; // etwas mehr Abstand nach außen
            labelRadius = Math.min(labelRadius, maxLabelRadius); // niemals abschneiden
            const numAxes = statKeys.length;
            for (let i = 0; i < numAxes; i++) {
                const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                const key = statKeys[i];
                const meta = this.statMeta[key];
                const el = document.createElement('span');
                el.className = 'material-symbols-rounded stat-chart-icon';
                el.textContent = meta.icon;
                el.style.position = 'absolute';
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.transform = 'translate(-50%, -50%)';
                el.style.color = meta.color;
                layer.appendChild(el);
            }
        } catch (e) {
            console.error('renderRadarIconLabels error', e);
        }
    },

    renderWeightTracking(char, entries) {
        const section = DQ_UI.elements.weightTrackingSection;
        if (!char.weightTrackingEnabled) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';

        const lang = DQ_CONFIG.userSettings.language || 'de';
        const summaryContainer = document.getElementById('weight-summary-container');
        const listContainer = document.getElementById('weight-entries-list');
        const canvas = document.getElementById('weight-chart');
        
        const latestEntry = entries[entries.length - 1];
        const currentWeight = latestEntry ? latestEntry.weight.toFixed(1) : '-';
        const targetWeight = char.targetWeight ? char.targetWeight.toFixed(1) : '-';

        summaryContainer.innerHTML = `
            <div class="weight-summary-item">
                <span class="label" data-lang-key="current_weight">${DQ_DATA.translations[lang].current_weight}</span>
                <span class="value">${currentWeight} kg</span>
            </div>
            <div class="weight-summary-item">
                <span class="label" data-lang-key="target_weight_display">${DQ_DATA.translations[lang].target_weight_display}</span>
                <span class="value">${targetWeight} kg</span>
            </div>
        `;

        if (entries.length > 0) {
            listContainer.innerHTML = [...entries].reverse().slice(0, 5).map(entry => {
                const dateTime = new Date(entry.time).toLocaleString(lang, { 
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                });
                return `
                    <div class="weight-entry-item">
                        <span class="date">${dateTime}</span>
                        <span class="weight">${entry.weight.toFixed(1)} kg</span>
                    </div>`;
            }).join('');
        } else {
            listContainer.innerHTML = `<p data-lang-key="no_entries">${DQ_DATA.translations[lang].no_entries}</p>`;
        }
        
        this.createWeightChart(canvas, entries, char.targetWeight);
    },

    createWeightChart(canvas, data, targetWeight) {
        const container = document.getElementById('weight-chart-container');
        if (!canvas || !canvas.getContext || container.offsetWidth === 0) {
            return;
        }

        if (this.weightChartScrollHandler) {
            container.removeEventListener('scroll', this.weightChartScrollHandler);
        }

        const pointSpacing = 50;
        const totalWidth = Math.max(container.offsetWidth, data.length * pointSpacing);
        canvas.style.width = `${totalWidth}px`;
        canvas.style.height = `220px`;

        const darkenColor = (colorStr, percent) => {
            let r, g, b;
            if (colorStr.startsWith('#')) {
                const bigint = parseInt(colorStr.slice(1), 16);
                r = (bigint >> 16) & 255; g = (bigint >> 8) & 255; b = bigint & 255;
            } else { return colorStr; }
            const factor = 1 - percent;
            r = Math.round(r * factor); g = Math.round(g * factor); b = Math.round(b * factor);
            return `rgb(${r}, ${g}, ${b})`;
        };

        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalWidth * dpr;
        canvas.height = 220 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const height = 220;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };

        const style = getComputedStyle(document.documentElement);
        const gridColor = style.getPropertyValue('--outline-color').trim();
        const textColor = style.getPropertyValue('--on-surface-color').trim();
        const lineColor = style.getPropertyValue('--primary-color').trim();
        const pointColor = darkenColor(lineColor, 0.2);

        const drawChart = () => {
            const scrollLeft = container.scrollLeft;
            ctx.clearRect(0, 0, totalWidth, height);

            if (data.length === 0) {
                ctx.fillStyle = textColor;
                ctx.textAlign = 'center';
                ctx.font = '12px sans-serif';
                ctx.fillText("Bitte ersten Eintrag hinzufügen, um Diagramm zu starten.", container.offsetWidth / 2, height / 2);
                return;
            }
            
            const weights = data.map(d => Math.min(d.weight, 200));
            const buffer = 2;
            let minWeight = (targetWeight ? Math.min(...weights, targetWeight) : Math.min(...weights)) - buffer;
            let maxWeight = (targetWeight ? Math.max(...weights, targetWeight) : Math.max(...weights)) + buffer;
            minWeight = Math.max(0, minWeight);
            maxWeight = Math.min(200, maxWeight);
            const weightRange = maxWeight - minWeight < 4 ? 4 : maxWeight - minWeight;

            const getX = (index) => padding.left + (index / (data.length - 1 || 1)) * (totalWidth - padding.left - padding.right);
            const getY = (weight) => height - padding.bottom - ((Math.min(weight, 200) - minWeight) / weightRange) * (height - padding.top - padding.bottom);

            ctx.save();
            ctx.translate(-scrollLeft, 0);

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;

            const yGridLines = 5;
            for (let i = 0; i <= yGridLines; i++) {
                const weight = minWeight + (weightRange / yGridLines) * i;
                const y = getY(weight);
                ctx.beginPath();
                ctx.moveTo(padding.left - 5 + scrollLeft, y);
                ctx.lineTo(totalWidth - padding.right + scrollLeft, y);
                ctx.stroke();
            }

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = '11px sans-serif';
            const xGridLines = Math.min(data.length - 1, Math.floor(totalWidth / 70));
            if (data.length > 1) {
                for (let i = 0; i <= xGridLines; i++) {
                    const dataIndex = Math.round(i * (data.length - 1) / xGridLines);
                    const point = data[dataIndex];
                    const x = getX(dataIndex);
                    const date = new Date(point.time);
                    const label = `${date.getDate()}.${date.getMonth() + 1}.`;
                    ctx.fillText(label, x, height - padding.bottom + 15);
                }
            } else if (data.length === 1) {
                 const date = new Date(data[0].time);
                 const label = `${date.getDate()}.${date.getMonth() + 1}.`;
                 ctx.fillText(label, getX(0), height - padding.bottom + 15);
            }
            
            if (targetWeight) {
                const y = getY(targetWeight);
                ctx.beginPath();
                ctx.setLineDash([4, 4]);
                ctx.moveTo(padding.left + scrollLeft, y);
                ctx.lineTo(totalWidth - padding.right + scrollLeft, y);
                ctx.strokeStyle = textColor;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            ctx.moveTo(getX(0), getY(weights[0]));
            if (data.length > 1) {
                weights.forEach((weight, index) => ctx.lineTo(getX(index), getY(weight)));
            }
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.fillStyle = pointColor;
            weights.forEach((weight, index) => {
                ctx.beginPath();
                ctx.arc(getX(index), getY(weight), 2.5, 0, 2 * Math.PI);
                ctx.fill();
            });

            ctx.restore();

            ctx.fillStyle = textColor;
            ctx.textAlign = 'right';
            ctx.font = '11px sans-serif';
            for (let i = 0; i <= yGridLines; i++) {
                const weight = minWeight + (weightRange / yGridLines) * i;
                const y = getY(weight);
                ctx.fillText(Math.round(weight), padding.left - 8 + scrollLeft, y + 4);
            }
        };

        this.weightChartScrollHandler = drawChart;
        container.addEventListener('scroll', this.weightChartScrollHandler);
        drawChart();
        
        // Scroll nur zum neuesten Eintrag, nicht zum absoluten Ende
        if (data.length > 0) {
            const lastEntryIndex = data.length - 1;
            // gleiche Berechnung wie getX im drawChart, aber hier außerhalb
            const lastEntryX = padding.left + ((lastEntryIndex / (data.length - 1 || 1)) * (totalWidth - padding.left - padding.right));
            const scrollToPosition = Math.max(0, lastEntryX - container.offsetWidth / 2);
            container.scrollLeft = Math.min(scrollToPosition, container.scrollWidth - container.offsetWidth);
        }
    },

    showAddWeightPopup() {
        const popup = DQ_UI.elements.addWeightPopup;
        const input = popup.querySelector('#new-weight-input');
        const saveButton = popup.querySelector('#save-weight-button');
        
        input.value = '';

        const handleSave = () => {
            const weight = parseFloat(input.value);
            if (!isNaN(weight) && weight > 0) {
                this.saveWeightEntry(weight);
                cleanup();
            }
        };
        
        const cleanup = () => {
            saveButton.removeEventListener('click', handleSave);
        };

        saveButton.addEventListener('click', handleSave, { once: true });

        DQ_UI.showPopup(popup);
    },

    async saveWeightEntry(weight) {
        const now = new Date();
        const entry = {
            date: now.toISOString().split('T')[0],
            time: now.toISOString(),
            weight: Math.min(weight, 200)
        };

        const tx = DQ_DB.db.transaction('weight_entries', 'readwrite');
        const store = tx.objectStore('weight_entries');
        store.add(entry);

        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
        
        DQ_UI.hideTopPopup();
        DQ_CHARACTER_MAIN.renderPage();
    },
};