# Extra Quest System - Funktions-Erklärung

## Übersicht
Das Extra Quest System bietet spezielle, zeitlich begrenzte Quests mit höheren Belohnungen. Im Gegensatz zu Daily Quests können Extra Quests manuell aktiviert werden und haben Deadline-Konsequenzen bei Nicht-Abschluss (Level -1, Gold -150, Stats -1).

## Relevante Dateien und Ordner

### Hauptdateien
- `js/page_extra_quest.js` - Hauptmodul für Extra Quest-UI
- `js/database.js` - IndexedDB Zugriffe
- `js/main.js` - Penalty-Berechnung bei Deadline

### Daten-Dateien
- `data/exercises.js` - Exercise-Pool für Extra Quests
- `data/translations.js` - Übersetzungen

## Wichtige Punkte

### Extra Quest Struktur
```javascript
{
  id: 1,                         // Immer 1 (Single Record)
  active: true,                  // Ob Quest aktiv ist
  nameKey: "special_marathon",   // Translation Key
  type: "time",                  // reps, time, check
  target: 42,                    // Ziel-Wert
  manaReward: 100,               // Mana Belohnung
  goldReward: 500,               // Gold Belohnung
  deadline: "2026-02-15",       // YYYY-MM-DD
  startedAt: "2026-02-08",      // Wann Quest gestartet wurde
  completed: false,              // Completion Status
  statBonus: { kraft: 2 },       // Extra Stats bei Completion
  description: "Laufe 42km bis zum 15. Februar!" // Optional
}
```

### Extra Quest vs Daily Quest

| Feature | Daily Quest | Extra Quest |
|---------|--------------|-------------|
| **Generierung** | Automatisch täglich | Manuell aktivieren |
| **Anzahl** | 5-6 pro Tag | 1 gleichzeitig |
| **Deadline** | Tagesende (Midnight) | Konfigurierbar |
| **Belohnungen** | Basis (+ Schwierigkeit) | 2-3x höher |
| **Konsequenzen** | Streak-Verlust | Level -1, Gold -150, Stats -1 |
| **Stats** | Progress-basierend | Sofort-Stat-Bonus |

### Aktivierung
```javascript
function activateExtraQuest() {
  // Prüfen ob schon aktiv
  if (currentExtraQuest && !currentExtraQuest.completed) {
    showWarning(t('extra_quest_already_active'));
    return;
  }

  // Extra Quest generieren
  const newQuest = generateExtraQuest();
  newQuest.id = 1; // Single Record
  newQuest.active = true;
  newQuest.startedAt = today;

  // Speichern
  await DQ_DB.putSingle('extra_quest', newQuest);
  renderExtraQuest();
}
```

### Deadline Penalty
```javascript
function checkExtraQuestPenalty() {
  const quest = await DQ_DB.getSingle('extra_quest', 1);

  if (!quest || !quest.active || quest.completed) return;

  const today = new Date().toISOString().split('T')[0];

  if (today > quest.deadline) {
    // PENALTY anwenden
    applyExtraQuestPenalty(quest);
  }
}

function applyExtraQuestPenalty(quest) {
  // Level -1 (wenn Level > 1)
  if (character.level > 1) {
    character.level -= 1;
    character.manaToNextLevel = calculateManaThreshold(character.level);
  }

  // Gold -150
  character.gold = Math.max(0, character.gold - 150);

  // Alle Stats -1 (außer Willenskraft -3)
  for (const stat in character.stats) {
    if (stat === 'willenskraft') {
      character.stats[stat] = Math.max(1, character.stats[stat] - 3);
    } else {
      character.stats[stat] = Math.max(1, character.stats[stat] - 1);
    }
  }

  // Extra Quest deaktivieren
  quest.active = false;
  await DQ_DB.putSingle('extra_quest', quest);
  await DQ_DB.putSingle('character', character);

  showPenaltyNotification();
}
```

### Completion Bonus
```javascript
function completeExtraQuest() {
  const quest = await DQ_DB.getSingle('extra_quest', 1);

  if (quest.completed) return;

  // Markieren als completed
  quest.completed = true;
  quest.active = false;

  // Rewards geben
  await DQ_CHARACTER_MAIN.addMana(quest.manaReward);
  await DQ_CHARACTER_MAIN.addGold(quest.goldReward);

  // Stat Bonus sofort anwenden
  if (quest.statBonus) {
    for (const [stat, value] of Object.entries(quest.statBonus)) {
      character.stats[stat] += value;
    }
  }

  // Speichern
  await DQ_DB.putSingle('extra_quest', quest);
  await DQ_DB.putSingle('character', character);

  showCompletionNotification(quest);
}
```

## Design Richtung

### Architektur
- **Single Record**: Extra Quest nutzt `id: 1` im Store
- **Deadline-Check**: Automatisch bei App-Start oder Midnight
- **Konsequenzen**: Harte Strafen bei Nicht-Abschluss

### UI-Rendering
- Prominente Anzeige wenn Extra Quest aktiv
- Countdown-Timer bis Deadline
- Visuelle Warnung bei nahender Deadline

## IndexDB Speicherung

### Store: `extra_quest`
```javascript
{
  storeName: 'extra_quest',
  keyPath: 'id',
  value: 1, // Immer 1
  extraQuestObject // Siehe oben
}
```

### Operationen
```javascript
// Extra Quest laden
const quest = await DQ_DB.getSingle('extra_quest', 1);

// Speichern
await DQ_DB.putSingle('extra_quest', { id: 1, ...questData });

// Löschen (bei Reset)
await DQ_DB.delete('extra_quest', 1);
```

## Export/Import JSON

### Export Struktur
```json
{
  "extra_quest": {
    "id": 1,
    "active": true,
    "nameKey": "special_marathon",
    "type": "time",
    "target": 42,
    "manaReward": 100,
    "goldReward": 500,
    "deadline": "2026-02-15",
    "startedAt": "2026-02-08",
    "completed": false,
    "statBonus": { "kraft": 2 }
  }
}
```

## Streak Verbindung

### Keine direkte Streak-Verbindung
- Extra Quest hat keinen direkten Einfluss auf den Daily Streak
- **Indirekt**: Failed Extra Quest kann Level senken, was indirekt Quest-Difficulty senkt

### Streak-Integration
```javascript
// Bei Extra Quest Penalty wird NICHT der Streak resettet
// Nur: Level -1, Gold -150, Stats -1

// Der Daily Streak wird weiterhin durch Daily Quests getrackt
function checkStreakCompletion() {
  // Normale Streak-Logik
}
```

## Häufige Fehler

### 1. Deadline nicht geprüft
**Fehler**: Penalty wird nicht bei App-Start geprüft
**Lösung**: `checkExtraQuestPenalty()` in `main.js:init()` aufrufen

### 2. Math.max vergessen
**Fehler**: Stats können auf 0 oder negativ gehen
**Lösung**: `Math.max(1, character.stats[stat] - 1)` verwenden

### 3. Gold kann negativ werden
**Fehler**: Gold wird weniger als 0
**Lösung**: `Math.max(0, character.gold - 150)` verwenden

### 4. Extra Quest trotz Strafe weiter aktiv
**Fehler**: Penalty applied aber Quest bleibt active
**Lösung**: `quest.active = false` nach Penalty setzen

### 5. Multiple Extra Quests gleichzeitig
**Fehler**: Spieler kann mehrere aktivieren
**Lösung**: Prüfe `currentExtraQuest && !currentExtraQuest.completed`

## Wichtige Funktionen

### page_extra_quest.js
```javascript
DQ_EXTRA = {
  init(elements) { ... },                    // Initialisierung
  renderPage() { ... },                     // UI rendern
  renderActiveQuest() { ... },              // Aktive Quest anzeigen
  activateNewQuest() { ... },               // Neue Quest starten
  completeQuest() { ... },                  // Quest abschließen
  getRemainingTime() { ... },              // Countdown berechnen
  cancelQuest() { ... }                     // Quest abbrechen (optional)
}
```

### main.js
```javascript
// Bei Init
init() {
  // ... andere Initialisierung
  checkExtraQuestPenalty();
}

// Bei Daily Check
checkForPenaltyAndReset() {
  // ... Daily Streak Penalty
  checkExtraQuestPenalty();
}
```

## Extra Quest Templates

### Vordefinierte Extra Quests
```javascript
EXTRA_QUEST_TEMPLATES = [
  {
    nameKey: "marathon_training",
    type: "time",
    target: 42000, // Sekunden = 7km
    manaReward: 100,
    goldReward: 500,
    deadlineDays: 7,
    statBonus: { ausdauer: 2 }
  },
  {
    nameKey: "strength_challenge",
    type: "reps",
    target: 500,
    manaReward: 150,
    goldReward: 600,
    deadlineDays: 3,
    statBonus: { kraft: 3 }
  },
  {
    nameKey: "meditation_marathon",
    type: "focus",
    target: 1800, // 30 Minuten
    manaReward: 200,
    goldReward: 800,
    deadlineDays: 5,
    statBonus: { willenskraft: 4 }
  }
];
```

## UI Components

### Active Extra Quest Card
```html
<div class="extra-quest-card active">
  <div class="quest-header">
    <span class="special-badge">⭐ SPECIAL</span>
    <span class="quest-title">${t(quest.nameKey)}</span>
  </div>

  <div class="quest-deadline">
    <span class="deadline-label">Deadline:</span>
    <span class="deadline-date">${formatDate(quest.deadline)}</span>
    <span class="countdown">${getCountdownText(quest.deadline)}</span>
  </div>

  <div class="quest-target">
    <span class="target-label">Ziel:</span>
    <span class="target-value">${quest.target} ${getUnitLabel(quest.type)}</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${getProgress()}%"></div>
    </div>
  </div>

  <div class="quest-rewards">
    <span class="mana">⚡ +${quest.manaReward}</span>
    <span class="gold">💰 +${quest.goldReward}</span>
    ${quest.statBonus ?
      `<span class="stats">📈 +${formatStats(quest.statBonus)}</span>` : ''}
  </div>

  <button class="complete-btn" onclick="DQ_EXTRA.completeQuest()">
    ${t('extra_quest_complete')}
  </button>

  ${isNearDeadline() ?
    `<div class="deadline-warning">
       ⚠️ ${t('extra_quest_deadline_warning')}
     </div>` : ''
  }
</div>
```

### No Active Quest
```html
<div class="extra-quest-empty">
  <div class="empty-icon">🎯</div>
  <div class="empty-title">${t('extra_quest_no_active')}</div>
  <div class="empty-desc">${t('extra_quest_no_active_desc')}</div>

  <div class="available-quests">
    <h4>${t('extra_quest_available')}</h4>
    <!-- Quest Templates anzeigen -->
  </div>

  <button class="activate-btn" onclick="DQ_EXTRA.activateNewQuest()">
    ${t('extra_quest_activate')}
  </button>
</div>
```

## Testing Checkliste

- [ ] Extra Quest kann aktiviert werden wenn keine active
- [ ] Nur 1 Extra Quest gleichzeitig möglich
- [ ] Countdown zeigt korrekte verbleibende Zeit
- [ ] Completion gibt korrekte Rewards
- [ ] Stats werden bei Completion sofort erhöht
- [ ] Deadline-Penalty wird bei App-Start geprüft
- [ ] Level -1 bei Deadline (wenn Level > 1)
- [ ] Gold -150 bei Deadline (nicht unter 0)
- [ ] Stats -1 bei Deadline (nicht unter 1)
- [ ] Willenskraft -3 bei Deadline (nicht unter 1)
- [ ] Quest wird bei Penalty deaktiviert
- [ ] Notification erscheint bei Penalty
- [ ] Export enthält Extra Quest Daten
- [ ] Import stellt Extra Quest wieder her
