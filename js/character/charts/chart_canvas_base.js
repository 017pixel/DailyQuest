/**
 * @file chart_canvas_base.js
 * @description Gemeinsame Canvas-Utilities fuer Charts auf der Character-Seite.
 * Zweck: Konsistente Chart-Rendering-Funktionen fuer alle Karten.
 */
const DQ_CHARTS = {

    // Pastell-Farbpalette fuer alle Charts
    pastelColors: {
        primary: '#9fb4cc',
        secondary: '#b8a9c9',
        tertiary: '#a8c9a8',
        quaternary: '#d4b8a0',
        quinary: '#a0c4d4',
        senary: '#c4a8b8',
        septenary: '#b8c4a0',
        octonary: '#d4c4a0',
        gold: '#d4c4a0',
        mana: '#a0c4d4',
        sport: '#a8c9a8',
        focus: '#b8a9c9',
        rest: '#d4b8a0',
        grid: null, // wird aus CSS gelesen
        text: null  // wird aus CSS gelesen
    },

    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        const abs = Math.abs(num);
        const sign = num < 0 ? '-' : '';
        if (abs < 1000) return sign + Math.round(abs);
        if (abs < 10000) return sign + (abs / 1000).toFixed(1) + 'k';
        if (abs < 1000000) return sign + Math.round(abs / 1000) + 'k';
        return sign + (abs / 1000000).toFixed(1) + 'M';
    },

    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        return {
            grid: style.getPropertyValue('--outline-color').trim(),
            text: style.getPropertyValue('--on-surface-color').trim(),
            primary: style.getPropertyValue('--primary-color').trim()
        };
    },

    setupCanvas(canvas, width, height) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d', { alpha: true });
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        return ctx;
    },

    drawLineChart(canvas, data, options = {}) {
        // data: Array von { label, value } oder { label, values: [v1, v2] }
        const {
            width = canvas.parentElement?.offsetWidth || 300,
            height = 180,
            padding = { top: 20, right: 20, bottom: 30, left: 40 },
            lineColors = [this.pastelColors.primary, this.pastelColors.secondary, this.pastelColors.tertiary],
            fillOpacity = 0.15,
            showPoints = true,
            yMax = null,
            yMin = null,
            pointRadius = 4
        } = options;

        const ctx = this.setupCanvas(canvas, width, height);
        const colors = this.getThemeColors();
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = colors.text;
            ctx.textAlign = 'center';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText('Noch keine Daten', width / 2, height / 2);
            return;
        }

        // Ermittle Wertebereich
        let allValues = [];
        data.forEach(d => {
            if (d.values) allValues.push(...d.values);
            else if (typeof d.value === 'number') allValues.push(d.value);
        });

        let minVal = yMin !== null ? yMin : Math.min(...allValues);
        let maxVal = yMax !== null ? yMax : Math.max(...allValues);
        if (maxVal === minVal) { maxVal += 1; minVal -= 1; }
        const range = maxVal - minVal;

        // Y-Labels formatieren & breitestes Label messen fuer dynamisches Padding
        const yGridLines = 4;
        const yLabels = [];
        ctx.font = 'bold 13px sans-serif';
        let maxLabelWidth = 0;
        for (let i = 0; i <= yGridLines; i++) {
            const val = minVal + (range / yGridLines) * i;
            const label = this.formatNumber(val);
            yLabels.push({ val, label });
            const w = ctx.measureText(label).width;
            if (w > maxLabelWidth) maxLabelWidth = w;
        }

        const minLeftPad = padding.left;
        const maxLeftPad = Math.floor(width * 0.3);
        const requiredLeftPad = Math.ceil(maxLabelWidth) + 16;
        const adjustedLeftPad = Math.min(maxLeftPad, Math.max(minLeftPad, requiredLeftPad));

        const adjPad = {
            top: padding.top,
            right: padding.right,
            bottom: padding.bottom,
            left: adjustedLeftPad
        };

        const getX = (index) => adjPad.left + (index / (data.length - 1 || 1)) * (width - adjPad.left - adjPad.right);
        const getY = (value) => height - adjPad.bottom - ((value - minVal) / range) * (height - adjPad.top - adjPad.bottom);

        // Grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= yGridLines; i++) {
            const y = getY(yLabels[i].val);
            ctx.beginPath();
            ctx.moveTo(adjPad.left, y);
            ctx.lineTo(width - adjPad.right, y);
            ctx.stroke();
        }

        // Y-Achse Labels
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px sans-serif';
        yLabels.forEach(({ val, label }) => {
            ctx.fillText(label, adjPad.left - 8, getY(val) + 4);
        });

        // X-Achse Labels
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px sans-serif';
        const xStep = Math.max(1, Math.floor(data.length / 6));
        data.forEach((d, i) => {
            if (i % xStep === 0 || i === data.length - 1) {
                ctx.fillText(d.label, getX(i), height - adjPad.bottom + 14);
            }
        });

        // Linien zeichnen (mehrere Serien moeglich)
        const numSeries = data[0]?.values ? data[0].values.length : 1;

        for (let s = 0; s < numSeries; s++) {
            const color = lineColors[s % lineColors.length];

            // Fuellung
            ctx.beginPath();
            ctx.moveTo(getX(0), height - adjPad.bottom);
            data.forEach((d, i) => {
                const val = d.values ? d.values[s] : d.value;
                ctx.lineTo(getX(i), getY(val));
            });
            ctx.lineTo(getX(data.length - 1), height - adjPad.bottom);
            ctx.closePath();
            ctx.fillStyle = this._hexToRgba(color, fillOpacity);
            ctx.fill();

            // Linie
            ctx.beginPath();
            data.forEach((d, i) => {
                const val = d.values ? d.values[s] : d.value;
                if (i === 0) ctx.moveTo(getX(i), getY(val));
                else ctx.lineTo(getX(i), getY(val));
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Punkte
            if (showPoints) {
                ctx.fillStyle = color;
                data.forEach((d, i) => {
                    const val = d.values ? d.values[s] : d.value;
                    ctx.beginPath();
                    ctx.arc(getX(i), getY(val), pointRadius, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        }
    },

    drawBarChart(canvas, data, options = {}) {
        // data: Array von { label, value, color }
        const {
            width = canvas.parentElement?.offsetWidth || 300,
            height = 180,
            padding = { top: 20, right: 20, bottom: 30, left: 40 },
            barColor = this.pastelColors.primary,
            showValues = true,
            yMax = null
        } = options;

        const ctx = this.setupCanvas(canvas, width, height);
        const colors = this.getThemeColors();
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = colors.text;
            ctx.textAlign = 'center';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText('Noch keine Daten', width / 2, height / 2);
            return;
        }

        const maxVal = yMax !== null ? yMax : Math.max(...data.map(d => d.value));
        const minVal = 0;
        const range = maxVal - minVal || 1;

        // Y-Labels formatieren & breitestes Label messen
        const yGridLines = 4;
        const yLabels = [];
        ctx.font = 'bold 13px sans-serif';
        let maxLabelWidth = 0;
        for (let i = 0; i <= yGridLines; i++) {
            const val = minVal + (range / yGridLines) * i;
            const label = this.formatNumber(val);
            yLabels.push({ val, label });
            const w = ctx.measureText(label).width;
            if (w > maxLabelWidth) maxLabelWidth = w;
        }

        const minLeftPad = padding.left;
        const maxLeftPad = Math.floor(width * 0.3);
        const requiredLeftPad = Math.ceil(maxLabelWidth) + 16;
        const adjustedLeftPad = Math.min(maxLeftPad, Math.max(minLeftPad, requiredLeftPad));

        const adjPad = {
            top: padding.top,
            right: padding.right,
            bottom: padding.bottom,
            left: adjustedLeftPad
        };

        const chartWidth = width - adjPad.left - adjPad.right;
        const barWidth = (chartWidth / data.length) * 0.6;
        const barGap = (chartWidth / data.length) * 0.4;

        const getX = (index) => adjPad.left + index * (barWidth + barGap) + barGap / 2;
        const getY = (value) => height - adjPad.bottom - ((value - minVal) / range) * (height - adjPad.top - adjPad.bottom);

        // Grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= yGridLines; i++) {
            const y = getY(yLabels[i].val);
            ctx.beginPath();
            ctx.moveTo(adjPad.left, y);
            ctx.lineTo(width - adjPad.right, y);
            ctx.stroke();
        }

        // Y-Achse Labels
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px sans-serif';
        yLabels.forEach(({ val, label }) => {
            ctx.fillText(label, adjPad.left - 8, getY(val) + 4);
        });

        // Balken
        data.forEach((d, i) => {
            const x = getX(i);
            const y = getY(d.value);
            const h = height - adjPad.bottom - y;
            const color = d.color || barColor;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, h);

            // Label
            ctx.fillStyle = colors.text;
            ctx.textAlign = 'center';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(d.label, x + barWidth / 2, height - adjPad.bottom + 16);

            // Wert
            if (showValues && d.value > 0) {
                ctx.fillStyle = colors.text;
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(this.formatNumber(d.value), x + barWidth / 2, y - 6);
            }
        });
    },

    _hexToRgba(hex, alpha) {
        let r, g, b;
        if (hex.startsWith('#')) {
            const bigint = parseInt(hex.slice(1), 16);
            r = (bigint >> 16) & 255;
            g = (bigint >> 8) & 255;
            b = bigint & 255;
        } else if (hex.startsWith('rgb')) {
            const match = hex.match(/\d+/g);
            if (match) { r = parseInt(match[0]); g = parseInt(match[1]); b = parseInt(match[2]); }
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

try { window.DQ_CHARTS = DQ_CHARTS; } catch { }
