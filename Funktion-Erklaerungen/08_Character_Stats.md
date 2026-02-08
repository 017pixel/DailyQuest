# Character Stats System - Funktions-Erklärung

## Übersicht
Das Character Stats System verwaltet die fünf Kern-Stats des Spielers: Kraft, Ausdauer, Beweglichkeit, Durchhaltevermögen und Willenskraft. Stats werden durch Quest-Completion, Fokus-Sessions und Dungeon-Aktivität erhöht. Das System enthält auch ein Radar-Chart für visuelle Darstellung und Gewichts-Tracking.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/character/page_character_stats.js` - Stats-Rendering
- `js/character/page_character_main.js` - Character-Integration
- `js/database.js` - IndexedDB Zugriffe

### Verbundene Module
- `js/page_exercises.js` - Quest-Completion Events
- `js/vibe-fokus/page_fokus_timer.js` - Fokus-Stat Integration
- `js/dungeons/dungeon_combat.js` - Combat-Stats

## Wichtige Punkte

### Stats Struktur
```javascript
character.stats = {
  kraft: 5,                 // Strength - Kraftübungen
  ausdauer: 5,              // Endurance - Cardio
  beweglichkeit: 5,         // Agility - Flexibilität
  durchhaltevermoegen: 5,   // Stamina - Ausdauer
  willenskraft: 5           // Willpower - Fokus/Lernen
};

character.statProgress = {
  kraft: 0,
  ausdauer: 0,
  beweglichkeit: 0,
  durchhaltevermoegen: 0,
  willenskraft: 0
};
```

### Stat Points System

#### Progress-basierte Erhöhung
```javascript
STAT_THRESHOLDS = {
  1: 5.5,  // Difficulty 1
  2: 5.0,
  3: 4.5,
  4: 4.0,
  5: 3.5   // Difficulty 5 (schneller)
};

function addStatProgress(stat, points) {
  character.statProgress[stat] += points;

  // Threshold erreicht?
  const threshold = STAT_THRESHOLDS[settings.difficulty];
  if (character.statProgress[stat] >= threshold) {
    character.stats[stat] += 1;
    character.statProgress[stat] = 0; // Reset oder Overflow
    showStatIncreaseNotification(stat);
  }
}
```

#### Stat Points pro Übung
```javascript
// In exercises.js
{
  id: "bicep_curls",
  statPoints: { kraft: 1 },
  // ...
}

{
  id: "running",
  statPoints: { ausdauer: 1, durchhaltevermoegen: 0.5 },
  // ...
}

{
  id: "meditation",
  statPoints: { willenskraft: 1.5 },
  // ...
}
```

### Stat-Quest Mapping

| Quest Type | Primary Stat | Secondary Stats |
|------------|--------------|----------------|
| Kraft-Übungen | `kraft` | - |
| Cardio | `ausdauer` | `durchhaltevermoegen` |
| Beweglichkeit | `beweglichkeit` | - |
| Fokus-Session | `willenskraft` | - |
| Lange Fokus | `durchhaltevermoegen` | - |

### Radar Chart Daten
```javascript
RADAR_CHART_CONFIG = {
  size: 200,
  levels: 5,
  statLabels: ['Kraft', 'Ausdauer', 'Bewegung', 'Durchhalte', 'Wille'],
  colors: {
    fill: 'rgba(99, 102, 241, 0.2)',
    stroke: 'rgb(99, 102, 241)',
    grid: 'rgba(255, 255, 255, 0.1)'
  }
};
```

### Gewichts-Tracking
```javascript
character.weightTrackingEnabled = true;
character.targetWeight = 75.0; // kg
character.weightDirection = 'lose'; // 'lose' | 'gain' | 'maintain'
```

## Design Richtung

### Architektur
- **Dual-Storage**: Stats in `character` Store, History in `weight_entries`
- **Progress-Tracking**: `statProgress` sammelt XP bis zum nächsten Punkt
- **Visualisierung**: SVG-basiertes Radar-Chart

### UI-Rendering
- Radar-Chart für Stats-Übersicht
- Progress-Bars für `statProgress`
- Separater Weight-Chart (falls aktiviert)

## IndexDB Speicherung

### Store: `character`
```javascript
{
  // ... andere Felder
  stats: {
    kraft: 5,
    ausdauer: 5,
    beweglichkeit: 5,
    durchhaltevermoegen: 5,
    willenskraft: 5
  },
  statProgress: {
    kraft: 0,
    ausdauer: 0,
    beweglichkeit: 0,
    durchhaltevermoegen: 0,
    willenskraft: 0
  },
  weightTrackingEnabled: true,
  targetWeight: 75.0,
  weightDirection: 'lose'
}
```

### Store: `weight_entries`
```javascript
{
  storeName: 'weight_entries',
  keyPath: 'id',
  autoIncrement: true,
  indexes: [
    { name: 'date', keyPath: 'date' }
  ]
}
```

### Weight Entry Objekt
```javascript
{
  id: 1,
  date: "2026-02-08",       // YYYY-MM-DD
  weight: 78.5,             // in kg
  note: ""                  // Optionale Notiz
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "character": {
    "stats": {
      "kraft": 5,
      "ausdauer": 5,
      "beweglichkeit": 5,
      "durchhaltevermoegen": 5,
      "willenskraft": 5
    },
    "statProgress": {
      "kraft": 0,
      "ausdauer": 0,
      "beweglichkeit": 0,
      "durchhaltevermoegen": 0,
      "willenskraft": 0
    },
    "weightTrackingEnabled": true,
    "targetWeight": 75.0,
    "weightDirection": "lose"
  },
  "weight_entries": [
    { "id": 1, "date": "2026-02-07", "weight": 78.0 },
    { "id": 2, "date": "2026-02-08", "weight": 77.8 }
  ]
}
```

## Streak Verbindung

### Stats Achievement
```javascript
// In data/achievements.js
{
  id: "strength",
  icon: "💪",
  tracking: "character.stats.kraft",
  tiers: [
    { threshold: 10, rewardGold: 100, rewardMana: 100 },
    { threshold: 13, rewardGold: 200, rewardMana: 200 },
    // ... bis 70
  ]
}
```

### Extra Quest Penalty
```javascript
// Bei Extra Quest Deadline-Überschreitung
if (character.level > 1) {
  character.level -= 1;
}

character.gold = Math.max(0, character.gold - 150);

for (const stat in character.stats) {
  if (stat === 'willenskraft') {
    character.stats[stat] = Math.max(1, character.stats[stat] - 3);
  } else {
    character.stats[stat] = Math.max(1, character.stats[stat] - 1);
  }
}
```

## Häufige Fehler

### 1. Stat Progress Overflow
**Fehler**: Progress wird nicht resettet bei Stat-Erhöhung
**Lösung**: `character.statProgress[stat] = 0` nach Erhöhung

### 2. Threshold Inkonsistenz
**Fehler**: Unterschiedliche Thresholds in verschiedenen Files
**Lösung**: Zentrale `STAT_THRESHOLDS` Konstante

### 3. Weight Entries ohne Datum
**Fehler**: Weight-Entries ohne `date` Key
**Lösung**: Auto-Set `date: new Date().toISOString().split('T')[0]`

### 4. Radar Chart Skalierung
**Fehler**: Chart skaliert nicht richtig bei hohem Stat
**Lösung**: Normalize auf max_stat oder festes Maximum (z.B. 50)

### 5. Float Precision
**Fehler**: Stat-Progress hat Float-Arithmetik Probleme
**Lösung**: `Math.round()` bei Vergleichen oder Integer-Multiplikatoren

## Wichtige Funktionen

### page_character_stats.js
```javascript
DQ_STATS = {
  renderStatsPage() { ... },          // Stats Page
  renderRadarChart() { ... },          // SVG Radar-Chart
  renderFocusStats() { ... },          // Fokus-Statistik
  renderWeightTracking() { ... },     // Gewichts-Chart
  renderStatBars() { ... },            // Progress-Bars
  getStatProgressPercent(stat) { ... }, // Progress %
  calculateStatTotal() { ... },        // Total Stats Sum
  updateWeight(newWeight) { ... },    // Gewicht eintragen
  getWeightHistory() { ... },         // History laden
  renderWeightChart() { ... }         // Gewichts-Chart
};
```

### Stat Progress Updates
```javascript
function updateStatProgressFromQuest(quest) {
  const exercise = getExerciseById(quest.nameKey);

  if (exercise.statPoints) {
    for (const [stat, points] of Object.entries(exercise.statPoints)) {
      // Apply difficulty modifier
      const modifier = getDifficultyStatModifier();
      character.statProgress[stat] += points * modifier;

      // Check for stat increase
      const threshold = STAT_THRESHOLDS[settings.difficulty];
      if (character.statProgress[stat] >= threshold) {
        character.stats[stat] += 1;
        character.statProgress[stat] = 0;
        showStatNotification(stat);
      }
    }
  }
}

function updateDurchhaltevermogenFromFocus(minutes) {
  // +1 Durchhaltevermögen alle 20 Minuten Fokus
  const points = Math.floor(minutes / 20);
  if (points > 0) {
    character.stats.durchhaltevermoegen += points;
    character.statProgress.durchhaltevermoegen += points;
  }
}
```

### Radar Chart Generation
```javascript
function renderRadarChart() {
  const stats = character.stats;
  const maxStat = 50; // Chart maximum

  // Normalize stats to 0-1 range
  const normalized = {
    kraft: stats.kraft / maxStat,
    ausdauer: stats.ausdauer / maxStat,
    beweglichkeit: stats.beweglichkeit / maxStat,
    durchhaltevermoegen: stats.durchhaltevermoegen / maxStat,
    willenskraft: stats.willenskraft / maxStat
  };

  // Calculate polygon points
  const points = calculatePolygonPoints(normalized, 5, 100);

  // Render SVG
  return `
    <svg viewBox="0 0 200 200">
      ${renderGridLines()}
      ${renderStatPolygon(points)}
      ${renderLabels()}
    </svg>
  `;
}
```

## Weight Tracking Charts

### Weight History Store
```javascript
// weight_entries Store
{
  id: autoIncrement,
  date: 'YYYY-MM-DD',
  weight: number
}
```

### Weight Chart Rendering
```javascript
function renderWeightChart() {
  const entries = await DQ_DB.getAll('weight_entries');
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  const ctx = document.createElement('canvas');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: entries.map(e => e.date),
      datasets: [{
        label: 'Gewicht',
        data: entries.map(e => e.weight),
        borderColor: 'rgb(99, 102, 241)',
        fill: true
      }]
    },
    options: {
      scales: {
        y: {
          min: character.targetWeight - 10,
          max: character.targetWeight + 10
        }
      }
    }
  });

  return ctx;
}
```

## UI Components

### Radar Chart
```html
<div class="radar-chart-container">
  <svg class="radar-chart" viewBox="0 0 200 200">
    <!-- Grid Lines -->
    <circle class="grid-circle" r="20" />
    <circle class="grid-circle" r="40" />
    <circle class="grid-circle" r="60" />
    <circle class="grid-circle" r="80" />
    <circle class="grid-circle" r="100" />

    <!-- Stat Polygon -->
    <polygon class="stat-polygon"
             points="${statPointsString}" />

    <!-- Labels -->
    ${labels.map((label, i) => `
      <text x="${label.x}" y="${label.y}">
        ${t(`stat_${label.key}`)}
      </text>
    `).join('')}
  </svg>
</div>
```

### Stat Progress Bars
```html
<div class="stat-bars">
  ${Object.entries(character.stats).map(([stat, value]) => `
    <div class="stat-bar-row">
      <div class="stat-label">
        <span class="stat-icon">${getStatIcon(stat)}</span>
        <span class="stat-name">${t(`stat_${stat}`)}</span>
        <span class="stat-value">${value}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill"
               style="width: ${getStatProgressPercent(stat)}%"></div>
        </div>
        <span class="progress-text">
          ${Math.round(character.statProgress[stat] * 10) / 10} /
          ${STAT_THRESHOLDS[settings.difficulty]}
        </span>
      </div>
    </div>
  `).join('')}
</div>
```

### Weight Tracking Card
```html
<div class="weight-tracking-card">
  <h3>${t('weight_tracking_title')}</h3>

  <div class="weight-input">
    <input type="number"
           step="0.1"
           value="${currentWeight}"
           onchange="updateWeight(this.value)" />
    <span class="unit">kg</span>
  </div>

  <div class="weight-target">
    <span class="target-label">Ziel:</span>
    <span class="target-value">${targetWeight} kg</span>
    <span class="direction-badge ${weightDirection}">
      ${weightDirection === 'lose' ? '📉 Abnehmen' :
        weightDirection === 'gain' ? '📈 Zunehmen' : '⚖️ Halten'}
    </span>
  </div>

  <div class="weight-chart">
    ${renderWeightChart()}
  </div>

  <div class="weight-summary">
    <span class="change">${getWeightChange()}</span>
    <span class="remaining">${getRemainingToTarget()}</span>
  </div>
</div>
```

## Testing Checkliste

- [ ] Radar Chart zeigt korrekte Stats
- [ ] Stat Progress Bars füllen sich bei Quests
- [ ] Stats erhöhen sich bei Threshold
- [ ] Notification erscheint bei Stat-Erhöhung
- [ ] Difficulty beeinflusst Threshold
- [ ] Fokus-Sessions erhöhen Durchhaltevermögen
- [ ] Weight Tracking speichert Einträge
- [ ] Weight Chart zeigt Verlauf
- [ ] Target Weight wird berücksichtigt
- [ ] Weight Direction wird visualisiert
- [ ] Stats Achievement progressiert
- [ ] Extra Quest Penalty senkt Stats
- [ ] Export enthält Stats und Weight Entries
- [ ] Import stellt alles wieder her
