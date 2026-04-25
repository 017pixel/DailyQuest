/**
 * @file page_character_cards.js
 * @description Alle neuen Analytics-Karten fuer die Character-Seite.
 */
const DQ_CARDS = {

    _explanationStyle: 'font-size:12px;opacity:0.65;text-align:center;padding:10px 8px 4px 8px;font-style:italic;line-height:1.4;',

    renderProfileTypeCard(analyticsData) {
        const container = document.getElementById('profile-type-container');
        const section = document.getElementById('profile-type-section');
        if (!container || !section) return;

        const log = analyticsData.activityLog || [];
        const events = analyticsData.events || [];

        let sportCount = 0, focusCount = 0, restCount = 0;
        log.forEach(entry => {
            if (entry.goal === 'muscle' || entry.goal === 'endurance' || entry.goal === 'calisthenics') sportCount++;
            else if (entry.goal === 'sick' || entry.goal === 'restday') restCount++;
            else sportCount++;
        });
        events.forEach(evt => { if (evt.type === 'focus_session') focusCount++; });

        const total = sportCount + focusCount + restCount;
        if (total === 0) { section.style.display = 'none'; return; }

        const sportPct = Math.round((sportCount / total) * 100);
        const focusPct = Math.round((focusCount / total) * 100);
        const restPct = Math.max(0, 100 - sportPct - focusPct);
        section.style.display = '';

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:20px;padding:8px 0;justify-content:center;min-height:100%;">
                <div style="display:flex;justify-content:space-around;align-items:center;padding:16px 0;">
                    <div style="text-align:center;">
                        <span class="material-symbols-rounded" style="font-size:36px;color:#a8c9a8;">sports_gymnastics</span>
                        <div style="font-size:28px;font-weight:700;color:#a8c9a8;margin-top:4px;">${sportPct}%</div>
                        <div style="font-size:12px;opacity:0.7;">Sport</div>
                    </div>
                    <div style="text-align:center;">
                        <span class="material-symbols-rounded" style="font-size:36px;color:#b8a9c9;">self_improvement</span>
                        <div style="font-size:28px;font-weight:700;color:#b8a9c9;margin-top:4px;">${focusPct}%</div>
                        <div style="font-size:12px;opacity:0.7;">Focus</div>
                    </div>
                    <div style="text-align:center;">
                        <span class="material-symbols-rounded" style="font-size:36px;color:#d4b8a0;">bedtime</span>
                        <div style="font-size:28px;font-weight:700;color:#d4b8a0;margin-top:4px;">${restPct}%</div>
                        <div style="font-size:12px;opacity:0.7;">Pause</div>
                    </div>
                </div>
                <div class="card-profile-split">
                    <div class="segment" style="width:${sportPct}%;background:#a8c9a8;"></div>
                    <div class="segment" style="width:${focusPct}%;background:#b8a9c9;"></div>
                    <div class="segment" style="width:${restPct}%;background:#d4b8a0;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0 8px;font-size:13px;opacity:0.8;">
                    <span>${sportCount} Aktivitaeten</span>
                    <span>${focusCount} Sessions</span>
                </div>
                <div style="${this._explanationStyle}">
                    Zeigt wie sich deine Aktivitaeten zwischen Sport, Fokus und Erholung aufteilen.
                </div>
            </div>
        `;
    },

    renderConsistencyCard(analyticsData) {
        const container = document.getElementById('consistency-container');
        const section = document.getElementById('consistency-section');
        if (!container || !section) return;

        const log = analyticsData.activityLog || [];
        if (log.length === 0) { section.style.display = 'none'; return; }
        section.style.display = '';

        const streakData = DQ_CONFIG.getStreakData();
        const currentStreak = streakData.streak || 0;

        // Quest-Anzahl pro Tag fuer Heatmap-Opacity
        const questCountPerDay = {};
        log.forEach(e => {
            if (e.date) {
                questCountPerDay[e.date] = (questCountPerDay[e.date] || 0) + 1;
            }
        });
        const maxQuestsInDay = Math.max(...Object.values(questCountPerDay), 1);

        const sortedDates = Object.keys(questCountPerDay).sort();
        const now = new Date();
        const oldest = sortedDates.length > 0 ? new Date(sortedDates[0]) : now;
        const weeks = Math.max(1, Math.ceil((now - oldest) / (1000 * 60 * 60 * 24 * 7)));
        const qpw = Math.round(log.length / weeks * 10) / 10;

        const score = Math.min(100, Math.round(Math.min(40, currentStreak * 2) + Math.min(40, (qpw / 7) * 40) + Math.min(20, log.length)));

        const heatmapDays = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = questCountPerDay[dateStr] || 0;
            const opacity = count === 0 ? 0.08 : Math.min(0.2 + (count / maxQuestsInDay) * 0.8, 1);
            heatmapDays.push({ date: dateStr, count, opacity });
        }

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0;">
                <div style="display:flex;justify-content:center;align-items:center;gap:8px;padding:8px 0;">
                    <div class="card-ring-container">
                        <canvas id="consistency-ring-chart" width="90" height="90"></canvas>
                        <div class="ring-text"><div class="number">${score}</div><div class="label">Score</div></div>
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding-left:8px;">
                        <div class="card-row" style="border-bottom:1px solid var(--outline-color);">
                            <span class="material-symbols-rounded icon" style="color:#d4b8a0;">local_fire_department</span>
                            <div class="content"><div class="title">Aktuelle Streak</div></div>
                            <div class="value">${currentStreak} Tage</div>
                        </div>
                        <div class="card-row" style="border-bottom:1px solid var(--outline-color);">
                            <span class="material-symbols-rounded icon" style="color:#a0c4d4;">calendar_month</span>
                            <div class="content"><div class="title">Quests / Woche</div></div>
                            <div class="value">${qpw}</div>
                        </div>
                        <div class="card-row">
                            <span class="material-symbols-rounded icon" style="color:#a8c9a8;">check_circle</span>
                            <div class="content"><div class="title">Gesamt</div></div>
                            <div class="value">${log.length}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="font-size:12px;opacity:0.7;margin-bottom:8px;text-align:center;">Letzte 30 Tage</div>
                    <div class="card-heatmap" style="gap:4px;">
                        ${heatmapDays.map(d => `<div class="day" style="width:24px;height:24px;border-radius:4px;background:#a8c9a8;opacity:${d.opacity};" title="${d.date}: ${d.count} Quests"></div>`).join('')}
                    </div>
                </div>
                <div style="font-size:11px;opacity:0.6;text-align:center;padding:6px 12px;background:var(--surface-container-high);border-radius:8px;margin:4px 8px 0 8px;line-height:1.5;">
                    <span style="font-weight:600;">Score:</span> Basierend auf Streak (${Math.min(40, currentStreak * 2)}%) + Quests/Woche (${Math.min(40, Math.round((qpw / 7) * 40))}%) + Gesamt (${Math.min(20, log.length)}%)
                </div>
                <div style="${this._explanationStyle}">
                    Je dunkler das Kaestchen, desto mehr Quests wurden an diesem Tag erledigt.
                </div>
            </div>
        `;

        setTimeout(() => {
            const canvas = document.getElementById('consistency-ring-chart');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const dpr = window.devicePixelRatio || 1;
                canvas.width = 90 * dpr; canvas.height = 90 * dpr;
                canvas.style.width = '90px';
                canvas.style.height = '90px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                const start = -Math.PI / 2;
                const end = start + (score / 100) * 2 * Math.PI;
                ctx.beginPath(); ctx.arc(45, 45, 38, 0, 2 * Math.PI);
                ctx.strokeStyle = 'var(--surface-container-high)'; ctx.lineWidth = 10; ctx.stroke();
                ctx.beginPath(); ctx.arc(45, 45, 38, start, end);
                ctx.strokeStyle = '#a8c9a8'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
            }
        }, 0);
    },

    renderTimePatternsCard(analyticsData) {
        const container = document.getElementById('time-patterns-container');
        const section = document.getElementById('time-patterns-section');
        if (!container || !section) return;

        const log = analyticsData.activityLog || [];
        if (log.length === 0) { section.style.display = 'none'; return; }
        section.style.display = '';

        const timeRanges = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
        const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        const timeMeta = [
            { key: 'morning', label: 'Morgen', color: '#d4c4a0' },
            { key: 'afternoon', label: 'Nachmittag', color: '#a0c4d4' },
            { key: 'evening', label: 'Abend', color: '#b8a9c9' },
            { key: 'night', label: 'Nacht', color: '#9fb4cc' }
        ];

        log.forEach(e => {
            if (!e.timestamp) return;
            const d = new Date(e.timestamp);
            const h = d.getHours();
            const day = d.getDay();
            const idx = day === 0 ? 6 : day - 1;
            if (h >= 5 && h < 12) timeRanges.morning++;
            else if (h >= 12 && h < 17) timeRanges.afternoon++;
            else if (h >= 17 && h < 22) timeRanges.evening++;
            else timeRanges.night++;
            weekdayCounts[idx]++;
        });

        const maxTime = Math.max(...Object.values(timeRanges), 1);
        const maxWeekday = Math.max(...weekdayCounts, 1);

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:24px;padding:8px 0;align-items:center;justify-content:center;min-height:100%;">
                <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
                    <div class="card-section-title" style="justify-content:center;">
                        <span class="material-symbols-rounded" style="font-size:16px;color:#a0c4d4;">schedule</span>
                        Uhrzeit
                    </div>
                    <div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;height:120px;padding:0 8px;max-width:320px;width:100%;">
                        ${timeMeta.map(t => `
                            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
                                <span style="font-size:12px;font-weight:500;">${timeRanges[t.key]}</span>
                                <div style="width:100%;max-width:48px;background:${t.color};border-radius:6px 6px 0 0;height:${(timeRanges[t.key] / maxTime) * 90}px;transition:height 0.5s cubic-bezier(0.34,1.56,0.64,1);"></div>
                                <span style="font-size:11px;opacity:0.7;">${t.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
                    <div class="card-section-title" style="justify-content:center;">
                        <span class="material-symbols-rounded" style="font-size:16px;color:#a8c9a8;">calendar_today</span>
                        Wochentage
                    </div>
                    <div class="card-bar-chart" style="height:100px;max-width:320px;width:100%;">
                        ${weekdayCounts.map((c, i) => `
                            <div class="bar-col">
                                <span class="count">${c}</span>
                                <div class="bar" style="background:${i < 5 ? '#9fb4cc' : '#d4b8a0'};height:${(c / maxWeekday) * 75}px;opacity:${c > 0 ? 1 : 0.3};transition:height 0.5s cubic-bezier(0.34,1.56,0.64,1);"></div>
                                <span class="label">${labels[i]}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="${this._explanationStyle}">
                    Zeigt wann und an welchen Tagen du am aktivsten bist.
                </div>
            </div>
        `;
    },

    renderEnduranceCard(analyticsData) {
        const container = document.getElementById('endurance-stats-container');
        const section = document.getElementById('endurance-stats-section');
        if (!container || !section) return;

        // Nur anzeigen wenn Trainingsziel Ausdauer ist
        const trainingGoal = DQ_CONFIG.userSettings.training_goal;
        if (trainingGoal !== 'endurance') { section.style.display = 'none'; return; }

        const logs = (analyticsData.activityLog || []).filter(e => e.type === 'endurance_entry');
        if (logs.length === 0) { section.style.display = 'none'; return; }
        section.style.display = '';

        const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp).slice(-12);
        const avgDist = Math.round((sorted.reduce((s, e) => s + (e.distance || 0), 0) / sorted.length) * 10) / 10;
        const avgDur = Math.round(sorted.reduce((s, e) => s + (e.duration || 0), 0) / sorted.length);
        const avgPow = Math.round(sorted.reduce((s, e) => s + (e.power || 0), 0) / sorted.length * 10) / 10;

        const chartData = sorted.map((e, i) => ({ label: `${i + 1}`, values: [e.distance || 0, e.duration || 0, e.power || 0] }));

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0;align-items:center;">
                <div class="card-triple-stats" style="width:100%;max-width:320px;">
                    <div class="stat"><div class="label">Strecke</div><div class="value" style="color:#a0c4d4;font-size:20px;">${avgDist} km</div></div>
                    <div class="stat"><div class="label">Zeit</div><div class="value" style="color:#d4c4a0;font-size:20px;">${avgDur} min</div></div>
                    <div class="stat"><div class="label">Power</div><div class="value" style="color:#b8a9c9;font-size:20px;">${avgPow}</div></div>
                </div>
                <div style="position:relative;width:100%;max-width:320px;height:200px;">
                    <canvas id="endurance-chart-canvas" style="width:100%;height:200px;"></canvas>
                </div>
                <div style="display:flex;justify-content:center;gap:16px;font-size:11px;">
                    <span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#a0c4d4;display:inline-block;"></span> Strecke</span>
                    <span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#d4c4a0;display:inline-block;"></span> Zeit</span>
                    <span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#b8a9c9;display:inline-block;"></span> Power</span>
                </div>
                <div style="${this._explanationStyle}">
                    Entwicklung deiner Ausdauerleistungen ueber die letzten Eintraege.
                </div>
            </div>
        `;

        setTimeout(() => {
            const canvas = document.getElementById('endurance-chart-canvas');
            if (canvas && typeof DQ_CHARTS !== 'undefined') {
                const parentWidth = canvas.parentElement?.offsetWidth || 320;
                DQ_CHARTS.drawLineChart(canvas, chartData, {
                    width: parentWidth, height: 200,
                    lineColors: ['#a0c4d4', '#d4c4a0', '#b8a9c9'], fillOpacity: 0.1, pointRadius: 5
                });
            }
        }, 0);
    },

    renderManaGoldCard(analyticsData) {
        const container = document.getElementById('mana-gold-container');
        const section = document.getElementById('mana-gold-section');
        if (!container || !section) return;

        const snapshots = analyticsData.snapshots || [];
        if (snapshots.length < 2) { section.style.display = 'none'; return; }
        section.style.display = '';

        const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
        const chartData = sorted.map(s => ({ label: s.date.split('-W')[1] || '', values: [s.mana || 0, s.gold || 0] }));
        const events = analyticsData.events || [];
        const totalMana = events.filter(e => e.type === 'quest_completed').reduce((s, e) => s + (e.mana || 0), 0);
        const totalGold = events.filter(e => e.type === 'quest_completed').reduce((s, e) => s + (e.gold || 0), 0);

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0;align-items:center;">
                <div class="card-triple-stats" style="width:100%;max-width:320px;">
                    <div class="stat"><div class="label">Mana gesamt</div><div class="value" style="color:#a0c4d4;font-size:20px;">${totalMana}</div></div>
                    <div class="stat"><div class="label">Gold gesamt</div><div class="value" style="color:#d4c4a0;font-size:20px;">${totalGold}</div></div>
                </div>
                <div style="position:relative;width:100%;max-width:320px;height:200px;">
                    <canvas id="mana-gold-chart-canvas" style="width:100%;height:200px;"></canvas>
                </div>
                <div style="display:flex;justify-content:center;gap:16px;font-size:11px;">
                    <span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#a0c4d4;display:inline-block;"></span> Mana</span>
                    <span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#d4c4a0;display:inline-block;"></span> Gold</span>
                </div>
                <div style="${this._explanationStyle}">
                    Wochenverlauf deines gesammelten Mana und Gold.
                </div>
            </div>
        `;

        setTimeout(() => {
            const canvas = document.getElementById('mana-gold-chart-canvas');
            if (canvas && typeof DQ_CHARTS !== 'undefined') {
                const parentWidth = canvas.parentElement?.offsetWidth || 320;
                DQ_CHARTS.drawLineChart(canvas, chartData, {
                    width: parentWidth, height: 200,
                    lineColors: ['#a0c4d4', '#d4c4a0'], fillOpacity: 0.12, pointRadius: 5
                });
            }
        }, 0);
    },

    renderAchievementStatsCard(char) {
        const container = document.getElementById('achievement-stats-container');
        const section = document.getElementById('achievement-stats-section');
        if (!container || !section || !char.achievements) return;
        section.style.display = '';

        const ach = char.achievements;
        const defs = DQ_DATA.achievements || {};
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const t = DQ_DATA.translations[lang];
        const keys = ['level', 'quests', 'gold', 'shop', 'strength', 'streak', 'focus_time'];
        const icons = { level: 'military_tech', quests: 'check_circle', gold: 'paid', shop: 'shopping_cart', strength: 'fitness_center', streak: 'local_fire_department', focus_time: 'self_improvement' };
        const colors = { level: '#d4c4a0', quests: '#a8c9a8', gold: '#d4c4a0', shop: '#a0c4d4', strength: '#c4a8b8', streak: '#d4b8a0', focus_time: '#b8a9c9' };

        // Fix fuer focus_time Namen
        const nameFallbacks = {
            level: 'Level Meister', quests: 'Quest Meister', gold: 'Goldhaendler',
            shop: 'Shopper', strength: 'Kraftprotz', streak: 'Streak Koenig',
            focus_time: 'Fokus Meister'
        };

        let total = 0;
        const items = keys.map(key => {
            const def = defs[key];
            const current = ach[key]?.tier || 0;
            const tiers = def?.tiers || [];
            const maxTier = tiers.length;
            const pct = maxTier > 0 ? Math.round((current / maxTier) * 100) : 0;
            total += pct;
            const name = t[`ach_${key}_name`] || nameFallbacks[key] || key;
            return { key, name, current, max: maxTier, pct, color: colors[key] };
        });
        const overall = Math.round(total / keys.length);

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0;">
                <div style="text-align:center;padding:8px 0;">
                    <div class="card-big-number">${overall}%</div>
                    <div style="font-size:12px;opacity:0.7;">Gesamtfortschritt</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${items.map(item => `
                        <div class="card-achievement-item">
                            <span class="material-symbols-rounded icon" style="color:${item.color};">${icons[item.key]}</span>
                            <div class="info">
                                <div class="title-row"><span>${item.name}</span><span>${item.current} / ${item.max}</span></div>
                                <div class="card-progress-bar small"><div class="fill" style="width:${item.pct}%;background:${item.color};"></div></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="${this._explanationStyle}">
                    Dein Fortschritt in allen Erfolgskategorien auf einen Blick.
                </div>
            </div>
        `;
    },

    renderExtraShopCard(analyticsData, char) {
        const container = document.getElementById('extra-shop-container');
        const section = document.getElementById('extra-shop-section');
        if (!container || !section) return;

        const extraHist = analyticsData.extraQuestHistory || [];
        const shopHist = analyticsData.shopHistory || [];
        if (extraHist.length === 0 && shopHist.length === 0) { section.style.display = 'none'; return; }
        section.style.display = '';

        const totalExtra = extraHist.length;
        const extraMana = extraHist.reduce((s, e) => s + (e.manaReward || 0), 0);
        const extraGold = extraHist.reduce((s, e) => s + (e.goldReward || 0), 0);
        const avgTime = totalExtra > 0 ? Math.round(extraHist.reduce((s, e) => s + (e.completedInMinutes || 0), 0) / totalExtra) : 0;

        const totalShop = shopHist.filter(s => s.type === 'buy').length;
        const totalSpent = shopHist.filter(s => s.type === 'buy').reduce((s, e) => s + (e.cost || 0), 0);
        const invValue = (char.inventory || []).reduce((s, item) => s + (item.cost || 0), 0);

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0;">
                <div>
                    <div class="card-section-title"><span class="material-symbols-rounded" style="font-size:18px;color:#b8a9c9;">stars</span>Extra-Quests</div>
                    <div class="card-stats-grid">
                        <div class="stat-box"><div class="value" style="color:#b8a9c9;">${totalExtra}</div><div class="label">Absolviert</div></div>
                        <div class="stat-box"><div class="value" style="color:#d4c4a0;">${extraGold}</div><div class="label">Gold</div></div>
                        <div class="stat-box"><div class="value" style="color:#a0c4d4;">${extraMana}</div><div class="label">Mana</div></div>
                        <div class="stat-box"><div class="value" style="color:#a8c9a8;">${avgTime}m</div><div class="label">Durchschnitt</div></div>
                    </div>
                </div>
                <div>
                    <div class="card-section-title"><span class="material-symbols-rounded" style="font-size:18px;color:#d4c4a0;">shopping_bag</span>Shop</div>
                    <div class="card-stats-grid">
                        <div class="stat-box"><div class="value" style="color:#d4c4a0;">${totalShop}</div><div class="label">Gekauft</div></div>
                        <div class="stat-box"><div class="value" style="color:#c4a8b8;">${totalSpent}</div><div class="label">Ausgegeben</div></div>
                        <div class="stat-box full-width"><div class="value" style="color:#a8c9a8;">${invValue}</div><div class="label">Inventarwert</div></div>
                    </div>
                </div>
                <div style="${this._explanationStyle}">
                    Uebersicht ueber deine Extra-Quests und Shop-Aktivitaeten.
                </div>
            </div>
        `;
    }
};

try { window.DQ_CARDS = DQ_CARDS; } catch { }
