const DQ_STATS = {
    weightChartScrollHandler: null,

    init(elements) {
        elements.addWeightEntryButton.addEventListener('click', () => this.showAddWeightPopup());
    },

    renderStatsPage(char, entries) {
        this.renderStats(char);
        this.renderFocusStats(); // NEUER AUFRUF
        this.renderWeightTracking(char, entries);
    },

    renderStats(char) {
        const canvas = document.getElementById('stats-radar-chart');
        if (canvas) {
            this.createRadarChart(canvas, char.stats);
        }

        const statsListContainer = document.getElementById('stats-list-container');
        statsListContainer.innerHTML = ''; 

        const statsToDisplay = [
            { key: 'kraft', name: 'Kraft', emoji: '💪' },
            { key: 'ausdauer', name: 'Ausdauer', emoji: '🏃‍♂️' },
            { key: 'beweglichkeit', name: 'Beweglichkeit', emoji: '🤸‍♀️' },
            { key: 'durchhaltevermoegen', name: 'Durchhaltevermögen', emoji: '🔋' },
            { key: 'willenskraft', name: 'Willenskraft', emoji: '🧠' }
        ];

        statsToDisplay.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item-text';
            statItem.innerHTML = `
                <span>${stat.name} ${stat.emoji}</span>
                <span>${char.stats[stat.key]}</span>
            `;
            statsListContainer.appendChild(statItem);
        });
    },

    // --- NEUE FUNKTION ---
    renderFocusStats() {
        const section = document.getElementById('focus-stats-section');
        const container = document.getElementById('focus-stats-container');
        const vibeState = DQ_VIBE_STATE.state;

        if (!vibeState || !vibeState.sessions || vibeState.sessions.length === 0) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';

        const totalMinutes = vibeState.sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalSessions = vibeState.sessions.length;

        const formatMinutes = (mins) => {
            const hours = Math.floor(mins / 60);
            const minutes = mins % 60;
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        };

        const lang = DQ_CONFIG.userSettings.language || 'de';
        container.innerHTML = `
            <div class="stat-item-text">
                <span data-lang-key="focus_total_time">${DQ_DATA.translations[lang].focus_total_time}</span>
                <span>${formatMinutes(totalMinutes)}</span>
            </div>
            <div class="stat-item-text">
                <span data-lang-key="focus_total_sessions">${DQ_DATA.translations[lang].focus_total_sessions}</span>
                <span>${totalSessions}</span>
            </div>
            <div class="stat-item-text">
                <span data-lang-key="focus_total_plants">${DQ_DATA.translations[lang].focus_total_plants}</span>
                <span>${totalSessions} 🌳</span>
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
        
        const statKeys = ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'];
        const statLabels = ['💪', '🏃‍♂️', '🤸‍♀️', '🔋', '🧠'];
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

        ctx.font = '24px sans-serif';
        ctx.fillStyle = labelColor;
        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            const labelRadius = radius * 1.2;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(statLabels[i], x, y);
        }
        
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
        
        container.scrollLeft = container.scrollWidth;
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