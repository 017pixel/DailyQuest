# Weight Tracking System - Funktions-Erklärung

## Übersicht
Das Weight Tracking System ermöglicht Spielern ihr Körpergewicht zu tracken und Fortschritte zu ihren Zielen zu visualisieren. Es ist Teil des Character-Stats-Systems und nutzt einen separaten IndexedDB-Store für die Historie.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/character/page_character_stats.js` - Weight UI Rendering
- `js/database.js` - IndexedDB Zugriffe
- `js/character/page_character_main.js` - Character-Integration

## Wichtige Punkte

### Weight Tracking Settings
```javascript
// Teil von character-Objekt
character.weightTrackingEnabled = true;
character.targetWeight = 75.0;     // Zielgewicht in kg
character.weightDirection = 'lose'; // 'lose', 'gain', 'maintain'
```

### Weight Entry Struktur
```javascript
{
  id: 1,                    // Auto-increment
  date: "2026-02-08",       // YYYY-MM-DD
  weight: 78.5,             // Gewicht in kg
  note: ""                  // Optionale Notiz
}
```

### Weight Store Schema
```javascript
// In database.js
{
  storeName: 'weight_entries',
  keyPath: 'id',
  autoIncrement: true,
  indexes: [
    { name: 'date', keyPath: 'date' }
  ]
}
```

### Weight Entry Hinzufügen
```javascript
async function addWeightEntry(weight, note = "") {
  const today = new Date().toISOString().split('T')[0];

  // Prüfen ob heute schon ein Eintrag existiert
  const existing = await DQ_DB.getByIndex('weight_entries', 'date', today);

  if (existing.length > 0) {
    // Update bestehenden Eintrag
    const entry = existing[0];
    entry.weight = weight;
    entry.note = note;
    await DQ_DB.putSingle('weight_entries', entry);
  } else {
    // Neuen Eintrag erstellen
    await DQ_DB.add('weight_entries', {
      date: today,
      weight: weight,
      note: note
    });
  }

  // Chart aktualisieren
  renderWeightChart();
}
```

### Gewichts-Berechnungen
```javascript
function calculateWeightStats(entries) {
  if (entries.length === 0) {
    return {
      currentWeight: null,
      startWeight: null,
      totalChange: null,
      weeklyAverage: null,
      trend: 'stable' // 'up', 'down', 'stable'
    };
  }

  // Sortieren nach Datum
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const currentWeight = sorted[sorted.length - 1].weight;
  const startWeight = sorted[0].weight;
  const totalChange = currentWeight - startWeight;

  // Trend berechnen (letzte 7 Einträge)
  const recentEntries = sorted.slice(-7);
  if (recentEntries.length >= 2) {
    const recentChange =
      recentEntries[recentEntries.length - 1].weight -
      recentEntries[0].weight;

    if (recentChange < -0.5) {
      trend = 'down';
    } else if (recentChange > 0.5) {
      trend = 'up';
    } else {
      trend = 'stable';
    }
  }

  return {
    currentWeight,
    startWeight,
    totalChange,
    trend,
    entryCount: entries.length
  };
}
```

### Ziel-Berechnung
```javascript
function calculateGoalProgress(currentWeight, targetWeight, direction) {
  if (!targetWeight) {
    return { progress: 0, remaining: null, achieved: false };
  }

  const diff = Math.abs(currentWeight - targetWeight);

  if (direction === 'lose') {
    if (currentWeight <= targetWeight) {
      return { progress: 100, remaining: 0, achieved: true };
    }
    // Schätzung basierend auf Startgewicht
    const startWeight = getStartWeight(); // Aus History
    const totalToLose = startWeight - targetWeight;
    const lost = startWeight - currentWeight;
    const progress = Math.min(100, (lost / totalToLose) * 100);

    return {
      progress: Math.round(progress),
      remaining: Math.round(diff * 10) / 10,
      achieved: false
    };
  }

  if (direction === 'gain') {
    if (currentWeight >= targetWeight) {
      return { progress: 100, remaining: 0, achieved: true };
    }
    const startWeight = getStartWeight();
    const totalToGain = targetWeight - startWeight;
    const gained = currentWeight - startWeight;
    const progress = Math.min(100, (gained / totalToGain) * 100);

    return {
      progress: Math.round(progress),
      remaining: Math.round(diff * 10) / 10,
      achieved: false
    };
  }

  // Maintain
  return { progress: 100, remaining: null, achieved: true };
}
```

## Design Richtung

### Architektur
- **Auto-Date**: Jeder Entry hat automatisch das heutige Datum
- **Chart Visualization**: Line-Chart für Gewichts-Verlauf

### UI-Rendering
- Input-Field für Gewicht
- Line-Chart für Verlauf

## IndexDB Speicherung

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

## Export/Import

### Export Struktur
```json
{
  "weight_entries": [
    { "id": 1, "date": "2026-02-07", "weight": 78.0 },
    { "id": 2, "date": "2026-02-08", "weight": 77.8 }
  ]
}
```

## Häufige Fehler

### 1. Duplicate Entries
**Fehler**: Mehrere Einträge pro Tag
**Lösung**: Prüfe bestehenden Eintrag vor Create

### 2. Wrong Date Format
**Fehler**: Inkonsistentes Datums-Format
**Lösung**: Immer `toISOString().split('T')[0]` verwenden

### 3. Chart ohne Daten
**Fehler**: Chart crash ohne Entries
**Lösung**: Check `entries.length > 0` vor Rendering

### 4. Target Direction Confusion
**Fehler**: Gain vs Lose verwechselt
**Lösung**: Klare Labels und Icons verwenden

## UI Components

### Weight Input Card
```html
<div class="weight-input-card">
  <h3>${t('weight_today')}</h3>

  <div class="weight-input-row">
    <input type="number"
           class="weight-input"
           step="0.1"
           value="${todayWeight || ''}"
           placeholder="--.-"
           onchange="saveWeight(this.value)" />
    <span class="unit">kg</span>
  </div>

  ${targetWeight ?
    `<div class="goal-indicator ${weightDirection}">
       Ziel: ${targetWeight} kg
       ${weightDirection === 'lose' ? '📉 Abnehmen' :
         weightDirection === 'gain' ? '📈 Zunehmen' : '⚖️ Halten'}
     </div>` : ''
  }
</div>
```

### Weight Chart
```html
<div class="weight-chart-container">
  <canvas id="weight-chart"></canvas>

  <div class="weight-stats">
    <div class="stat">
      <span class="label">${t('weight_current')}</span>
      <span class="value">${stats.currentWeight} kg</span>
    </div>
    <div class="stat">
      <span class="label">${t('weight_change')}</span>
      <span class="value ${stats.totalChange >= 0 ? 'up' : 'down'}">
        ${stats.totalChange >= 0 ? '+' : ''}${stats.totalChange?.toFixed(1) || 0} kg
      </span>
    </div>
    <div class="stat">
      <span class="label">${t('weight_trend')}</span>
      <span class="value trend-${stats.trend}">
        ${stats.trend === 'up' ? '📈' :
          stats.trend === 'down' ? '📉' : '➡️'}
        ${t(`weight_trend_${stats.trend}`)}
      </span>
    </div>
  </div>
</div>
```

### Goal Progress
```html
<div class="goal-progress">
  <h4>${t('weight_goal_progress')}</h4>

  <div class="progress-bar-container">
    <div class="progress-bar">
      <div class="progress-fill ${goal.achieved ? 'achieved' : ''}"
           style="width: ${goal.progress}%"></div>
    </div>
    <span class="progress-text">${goal.progress}%</span>
  </div>

  ${!goal.achieved ?
    `<div class="remaining">
       ${t('weight_remaining', { kg: goal.remaining })}
     </div>` :
    `<div class="achieved-badge">
       🎉 ${t('weight_goal_achieved')}
     </div>`
  }
</div>
```

## Testing Checkliste

- [ ] Weight-Entry wird pro Tag gespeichert
- [ ] Update funktioniert wenn Eintrag schon existiert
- [ ] Chart zeigt korrekten Verlauf
- [ ] Ziel-Berechnung funktioniert
- [ ] Trend wird korrekt berechnet
- [ ] Export enthält weight_entries
- [ ] Import stellt History wieder her
- [ ] Empty State wird angezeigt wenn keine Daten
