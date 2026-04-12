# Character Labels System - Funktions-Erklärung

## Übersicht
Das Character Labels System analysiert die Stat-Verteilung des Spielers und weist dynamische Titel/Labels zu, die die Spielweise reflektieren (z.B. "Kraftprotz" für hohe Kraft, "Marathoner" für hohe Ausdauer). Labels werden automatisch basierend auf dominanten Stats berechnet.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/character/page_character_labels.js` - Label-Berechnung
- `js/character/page_character_main.js` - Character-Integration
- `js/database.js` - IndexedDB Zugriffe

## Wichtige Punkte

### Label Berechnungs-Logik
```javascript
LABEL_THRESHOLD = 0.10; // 10% Differenz für "dominant"

function analyzeStats(stats) {
  // Stats normalisieren auf Prozent
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const percentages = {};
  for (const [key, value] of Object.entries(stats)) {
    percentages[key] = value / total;
  }

  // Sortieren nach Wert
  const sorted = Object.entries(percentages)
    .sort((a, b) => b[1] - a[1]);

  // Dominanten Stat finden
  const dominant = [];
  for (const [key, value] of sorted) {
    if (dominant.length === 0) {
      dominant.push({ stat: key, percent: value });
    } else {
      const topPercent = dominant[0].percent;
      if (value >= topPercent - LABEL_THRESHOLD) {
        dominant.push({ stat: key, percent: value });
      } else {
        break;
      }
    }
  }

  return dominant;
}
```

### Single Stat Labels
```javascript
SINGLE_STAT_LABELS = {
  kraft: {
    label: "Kraftprotz",
    icon: "",
    description: "Besonders stark trainiert"
  },
  ausdauer: {
    label: "Marathoner",
    icon: "",
    description: "Hervorragende Ausdauer"
  },
  beweglichkeit: {
    label: "Akrobat",
    icon: "",
    description: "Besonders beweglich"
  },
  durchhaltevermoegen: {
    label: "Stoiker",
    icon: "",
    description: "Unerschütterliches Durchhaltevermögen"
  },
  willenskraft: {
    label: "Eiserner Wille",
    icon: "",
    description: "Unbeirrbare Willenskraft"
  }
};
```

### Two-Stat Combination Labels
```javascript
TWO_STAT_LABELS = {
  "kraft-ausdauer": {
    label: "Powerläufer",
    icon: "",
    description: "Kraft und Ausdauer kombiniert"
  },
  "kraft-beweglichkeit": {
    label: "Kampfsportler",
    icon: "",
    description: "Kraft und Beweglichkeit vereint"
  },
  "kraft-willenskraft": {
    label: "Tank",
    icon: "️",
    description: "Unaufhaltsame Kraft"
  },
  "ausdauer-beweglichkeit": {
    label: "Leichtfuß",
    icon: "",
    description: "Schnell und ausdauernd"
  },
  "ausdauer-durchhaltevermoegen": {
    label: "Langläufer",
    icon: "️",
    description: "Für lange Strecken gemacht"
  },
  "beweglichkeit-willenskraft": {
    label: "Präzisionskünstler",
    icon: "",
    description: "Fokussierte Beweglichkeit"
  },
  "durchhaltevermoegen-willenskraft": {
    label: "Mentor",
    icon: "",
    description: "Mentale Stärke und Ausdauer"
  }
};
```

### Special Labels
```javascript
SPECIAL_LABELS = {
  balanced: {
    label: "Allrounder",
    icon: "",
    description: "Gut in allen Bereichen"
  },
  beginner: {
    label: "Neuling",
    icon: "",
    description: "Noch am Anfang der Reise"
  },
  master: {
    label: "Meister",
    icon: "",
    description: "Alle Stats auf hohem Niveau"
  }
};
```

### Label Selection Logic
```javascript
function calculateCharacterLabel(stats) {
  const dominant = analyzeStats(stats);

  // Wenn nur 1 Stat dominant
  if (dominant.length === 1) {
    const stat = dominant[0].stat;
    return SINGLE_STAT_LABELS[stat];
  }

  // Wenn 2 Stats dominant
  if (dominant.length === 2) {
    const key = [dominant[0].stat, dominant[1].stat].sort().join('-');
    return TWO_STAT_LABELS[key];
  }

  // Wenn 3+ Stats ähnlich (balanced)
  if (dominant.length >= 3) {
    // Check ob alle über Minimum liegen
    const totalStats = Object.values(stats).reduce((a, b) => a + b, 0);
    const avgStat = totalStats / 5;

    if (avgStat >= 15) {
      return SPECIAL_LABELS.master;
    }
    return SPECIAL_LABELS.balanced;
  }

  // Default für neue Spieler
  const totalStats = Object.values(stats).reduce((a, b) => a + b, 0);
  if (totalStats <= 25) {
    return SPECIAL_LABELS.beginner;
  }

  // Fallback
  return SINGLE_STAT_LABELS.kraft;
}
```

## Design Richtung

### Architektur
- **Auto-Berechnung**: Label wird bei jedem Stat-Change berechnet
- **Threshold-basierend**: 10% Differenz für "Dominanz"
- **Caching**: Label wird gecached um Recalculation zu vermeiden

### UI-Rendering
- Kleines Label-Badge unter dem Charakternamen
- Tooltip mit Beschreibung bei Hover

## IndexDB Speicherung

### Store: `character`
Labels sind Teil des Character-Objekts:

```javascript
{
  // ... andere Felder
  currentLabel: {
    label: "Kraftprotz",
    icon: "",
    description: "Besonders stark trainiert"
  }
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "character": {
    // ... andere Felder
    "currentLabel": {
      "label": "Kraftprotz",
      "icon": "",
      "description": "Besonders stark trainiert"
    }
  }
}
```

## Streak Verbindung

### Keine direkte Verbindung
- Labels sind rein dekorativ
- **Indirekt**: Achievement "strength" trackt Kraft-Stat

## Häufige Fehler

### 1. Threshold zu niedrig/hoch
**Fehler**: Label wechselt zu oft oder zu selten
**Lösung**: Konsistenten Threshold (10%) verwenden

### 2. Unsortierte Keys
**Fehler**: "ausdauer-kraft" vs "kraft-ausdauer"
**Lösung**: Immer `.sort().join('-')` verwenden

### 3. Float Precision
**Fehler**: Prozent-Berechnung mit Floats
**Lösung**: `Math.round()` oder Integer-Berechnung

### 4. Master-Label zu früh
**Fehler**: Master bei niedrigen Stats
**Lösung**: Prüfe `avgStat >= 15` vorher

## Wichtige Funktionen

### page_character_labels.js
```javascript
DQ_LABELS = {
  calculateLabel(stats) { ... },      // Label berechnen
  getSingleStatLabel(stat) { ... },    // Single-Stat Label
  getCombinationLabel(stats) { ... },  // Kombinations-Label
  getSpecialLabel(stats) { ... },     // Special Label
  updateCharacterLabel() { ... },     // Label im Character updaten
  renderLabel() { ... },              // Label UI rendern
  shouldRecalculate(oldStats, newStats) { ... } // Performance-Optimierung
};
```

## UI Components

### Label Badge
```html
<div class="character-label"
     data-tooltip="${currentLabel.description}">
  <span class="label-icon">${currentLabel.icon}</span>
  <span class="label-text">${t(currentLabel.label)}</span>
</div>
```

### Label Explanation Modal
```html
<div class="label-info-modal">
  <h3>${t('label_your_label')}</h3>
  <div class="current-label">
    <span class="icon">${currentLabel.icon}</span>
    <span class="name">${t(currentLabel.label)}</span>
  </div>
  <p class="description">${t(currentLabel.description)}</p>

  <div class="label-breakdown">
    <h4>${t('label_how_earned')}</h4>
    <ul>
      <li>${explainLabelCalculation()}</li>
    </ul>
  </div>

  <div class="other-labels">
    <h4>${t('label_other_possible')}</h4>
    ${renderPossibleLabels()}
  </div>
</div>
```

## Testing Checkliste

- [ ] Single-Stat Label wird bei Dominanz angezeigt
- [ ] Two-Stat Label bei 2 ähnlichen Stats
- [ ] Balanced Label bei 3+ ähnlichen Stats
- [ ] Beginner Label bei niedrigen Stats
- [ ] Master Label bei hohen Stats
- [ ] Label ändert sich bei Stat-Änderung
- [ ] Threshold (10%) funktioniert korrekt
- [ ] Label wird im Export eingeschlossen
- [ ] Label wird beim Import wiederhergestellt
- [ ] Performance ist akzeptabel (kein UI-Lag)
