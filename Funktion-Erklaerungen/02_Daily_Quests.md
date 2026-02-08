# Daily Quests System - Funktions-Erklärung

## Übersicht
Das Daily Quests System verwaltet die täglichen Trainingsquests, die jeden Tag neu generiert werden. Quests sind nach Kategorien sortiert (Kraft, Ausdauer, Fettabbau, etc.) und skalieren mit der eingestellten Schwierigkeit. Das System prüft täglich die Completions für den Streak.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/page_exercises.js` - Hauptmodul für Quest-Verwaltung
- `js/main.js` - Quest-Generation und Streak-Prüfung
- `js/database.js` - IndexedDB Zugriffe

### Daten-Dateien
- `data/exercises.js` - Pool aller verfügbaren Übungen
- `data/translations.js` - Übersetzungen für UI

## Wichtige Punkte

### Quest Objekt Struktur
```javascript
{
  questId: 1,                    // Auto-increment ID
  date: "2026-02-08",           // YYYY-MM-DD
  nameKey: "bicep_curls",       // Translation Key
  type: "reps",                 // reps, time, check, link, focus
  target: 10,                   // Ziel-Wert (Wiederholungen/Minuten)
  manaReward: 20,               // Mana Belohnung
  goldReward: 6,                // Gold Belohnung
  completed: false,             // Completion Status
  goal: "muscle"                // Kategorie: muscle, endurance, fatloss, etc.
}
```

### Quest-Typen
| Typ | Beschreibung | UI-Input |
|-----|--------------|----------|
| `reps` | Wiederholungs-basierte Übung | Number Input |
| `time` | Zeit-basierte Übung (Sekunden) | Number Input |
| `check` | Einfacher Checkbox-Quest | Checkbox |
| `link` | Link zu externer Ressource | Link + Checkbox |
| `focus` | Fokus-Session-Verknüpfung | Timer + Auto-Complete |

### Quest-Generation

#### Generierungs-Logik (`generateDailyQuestsIfNeeded`)
```javascript
function generateDailyQuestsIfNeeded(forceRegenerate = false) {
  // 1. Prüfe ob Quests für heute existieren
  // 2. Wenn nicht oder forceRegenerate:
  //    a. Bestimme Kategorie basierend auf:
  //       - User-Goal (settings.goal)
  //       - Wochentag (restDays konfiguriert)
  //    b. Wähle aus Exercise-Pool für Kategorie
  //    c. Shuffle und pick 6 Exercises (5 für Restday/Sick)
  //    d. Skaliere Target-Werte nach Difficulty
  //    e. Skaliere Rewards nach Difficulty
  //    f. Speichere in daily_quests Store
}
```

#### Schwierigkeits-Skalierung

**Target-Werte**:
- Basis-Werte aus `exercises.js`
- Multiplikator nach Difficulty (1-5)

**Rewards**:
```
Difficulty 1: Base mana, Base gold
Difficulty 2: Base * 1.2 mana, Base * 1.15 gold
Difficulty 3: Base * 1.4 mana, Base * 1.3 gold
Difficulty 4: Base * 1.6 mana, Base * 1.45 gold
Difficulty 5: Base * 1.8 mana, Base * 1.6 gold
```

### Quest-Kategorien

| Kategorie | Key | Focus |
|-----------|-----|-------|
| Muscle | `muscle` | Kraftaufbau |
| Endurance | `endurance` | Cardio/Stamina |
| Fat Loss | `fatloss` | Kalorienverbrennung |
| Bodyweight | `kraft_abnehmen` | Calisthenics |
| Rest Day | `restday` | Erholung |
| Learning | `learning` | Lernen/Fokus |
| Calisthenics | `calisthenics` | Körpergewicht |
| Sick | `sick` | Leichte Erholung |
| General Workout | `general_workout` | Freies Training |

### Rest-Day Logik
- Anzahl `restDays` in Settings konfiguriert (default: 2)
- Automatische Erkennung basierend auf `settings.restDays`
- Reduzierte Quest-Anzahl (5 statt 6)
- Spezielle Rest-Day Übungen (Yoga, Stretching, etc.)

## Design Richtung

### Architektur
- **IndexedDB Storage**: `daily_quests` Store mit `questId` als KeyPath
- **Date-Based**: Quests sind an `date` gebunden
- **Auto-Generation**: Quests werden beim App-Start generiert wenn nötig

### UI-Rendering
- Grid-Layout für Quest-Karten
- Progress-Animation bei Completion
- Kategorie-Farbcodierung

## IndexDB Speicherung

### Store: `daily_quests`
```javascript
{
  storeName: 'daily_quests',
  keyPath: 'questId',           // Auto-increment
  indexes: [
    { name: 'date', keyPath: 'date' }
  ]
}
```

### Operationen
```javascript
// Quests für heute laden
const today = new Date().toISOString().split('T')[0];
const quests = await DQ_DB.getByIndex('daily_quests', 'date', today);

// Quest speichern
await DQ_DB.putSingle('daily_quests', quest);

// Alle Quests löschen (bei Reset)
await DQ_DB.clearStore('daily_quests');
```

## Export/Import JSON

### Export Struktur
```json
{
  "daily_quests": [
    {
      "questId": 1,
      "date": "2026-02-08",
      "nameKey": "bicep_curls",
      "type": "reps",
      "target": 10,
      "manaReward": 20,
      "goldReward": 6,
      "completed": false,
      "goal": "muscle"
    }
  ]
}
```

### Import Logik
```javascript
// Bei Import werden Quests überschrieben
await DQ_DB.clearStore('daily_quests');
for (const quest of importedQuests) {
  await DQ_DB.putSingle('daily_quests', quest);
}
```

## Streak Verbindung

### Streak-Berechnung (`checkStreakCompletion`)
```javascript
function checkStreakCompletion() {
  // 1. Today's date string holen
  const today = new Date().toISOString().split('T')[0];
  const yesterday = getYesterdayDateString();

  // 2. Quests für heute laden
  const todaysQuests = await DQ_DB.getByIndex('daily_quests', 'date', today);

  // 3. Alle Quests completed?
  const allCompleted = todaysQuests.every(q => q.completed);

  // 4. Streak Update
  if (allCompleted && lastDate !== today) {
    if (lastDate === yesterday) {
      streak += 1;  // Streak fortführen
    } else {
      streak = 1;  // Neuer Streak starten
    }
  } else if (lastDate !== today) {
    // Heute noch nicht completed, aber schonmal gecheckt
    // Kein Reset hier - passiert bei Midnight
  }

  // 5. Speichern
  localStorage.setItem('streakData', JSON.stringify({ streak, lastDate: today }));
}
```

### Midnight Penalty
```javascript
// checkForPenaltyAndReset() wird bei Midnight ausgeführt
function checkForPenaltyAndReset() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = getYesterdayDateString();

  // Quests für gestern laden
  const yesterdaysQuests = await DQ_DB.getByIndex('daily_quests', 'date', yesterday);
  const allCompleted = yesterdaysQuests.every(q => q.completed);

  if (!allCompleted) {
    // PENALTY: Streak reset und Level -1
    streak = 0;
    localStorage.setItem('streakData', JSON.stringify({ streak: 0, lastDate: yesterday }));

    // Level -1 wenn Level > 1
    if (character.level > 1) {
      character.level -= 1;
      character.manaToNextLevel = calculateManaThreshold(character.level);
      await DQ_DB.putSingle('character', character);
    }
  }
}
```

## Häufige Fehler

### 1. Quest-Typ Verwechslung
**Fehler**: `time` Quest erwartet Minuten statt Sekunden
**Lösung**: `time` ist in Sekunden, `focus` in Minuten

### 2. Double Completion
**Fehler**: Quest wird zweimal completed (API-Call doppelt)
**Lösung**: `completed` Check vor Verarbeitung

### 3. Yesterday Quests werden gelöscht
**Fehler**: Bei Tageswechsel werden unvollständige Quests entfernt
**Lösung**: Nur Quests mit `date < yesterday - 7 days` löschen

### 4. Schwierigkeits-Skalierung inkonsistent
**Fehler**: Unterschiedliche Multiplikatoren in Generation vs. Rewards
**Lösung**: Nutze konsistente `calculateDifficultyMultiplier()` Funktion

### 5. Focus-Quest Auto-Complete
**Fehler**: Focus-Session completed Quest nicht automatisch
**Lösung**: Verknüpfe `questId` in `vibe_state` bei Timer-Start

## Wichtige Funktionen

### page_exercises.js
```javascript
DQ_EXERCISES = {
  init(elements) { ... },                    // Initialisierung
  renderQuests() { ... },                    // Daily Quests anzeigen
  renderFreeExercisesPage() { ... },         // Freie Übungen
  completeQuest(questId, value) { ... },    // Quest abschließen
  completeFreeExercise(exerciseId) { ... }, // Freie Übung
  handleInputChange(questId, value) { ... }, // Input-Änderung
  renderProgressBar() { ... }                // Fortschrittsbalken
}
```

### main.js - Quest Generation
```javascript
function generateDailyQuestsIfNeeded(forceRegenerate) {
  const today = new Date().toISOString().split('T')[0];
  const existing = await DQ_DB.getByIndex('daily_quests', 'date', today);

  if (!existing.length || forceRegenerate) {
    // Quests generieren
    const category = determineQuestCategory();
    const exercises = selectExercisesForCategory(category);
    const quests = createQuestsFromExercises(exercises, category);
    await DQ_DB.clearStore('daily_quests');
    for (const quest of quests) {
      await DQ_DB.putSingle('daily_quests', quest);
    }
  }
}
```

### main.js - Quest Completion
```javascript
function performQuestCompletion(questId, userInput = null) {
  // 1. Quest aus DB laden
  const quest = await DQ_DB.getSingle('daily_quests', questId);

  // 2. Validation
  if (quest.completed) return;
  if (userInput !== null && userInput < quest.target) {
    // Zeige Fehler: Ziel nicht erreicht
    return;
  }

  // 3. Update Quest
  quest.completed = true;
  await DQ_DB.putSingle('daily_quests', quest);

  // 4. Rewards vergeben
  await DQ_CHARACTER_MAIN.addMana(quest.manaReward);
  await DQ_CHARACTER_MAIN.addGold(quest.goldReward);

  // 5. Stats aktualisieren
  updateStatProgress(quest);

  // 6. Check Level Up
  checkAndLevelUp();

  // 7. Check Streak
  checkStreakCompletion();
}
```

## Exercise Pool Integration

### exercises.js Struktur
```javascript
EXERCISES = {
  muscle: [
    {
      id: "bicep_curls",
      nameKey: "bicep_curls",
      type: "reps",
      baseTarget: 10,
      baseMana: 20,
      baseGold: 6,
      statPoints: { kraft: 1 },
      difficultyMultiplier: 1.2
    }
  ],
  // ... andere Kategorien
}
```

### Stat Points Mapping
```javascript
// Bei Quest Completion
const exercise = getExerciseById(quest.nameKey);
character.statProgress[stat] += exercise.statPoints[stat];

// Wenn Threshold erreicht
if (character.statProgress[stat] >= getStatThreshold()) {
  character.stats[stat] += 1;
  character.statProgress[stat] = 0; // Reset oder Overflow
}
```

## UI Components

### Quest Card HTML
```html
<div class="quest-card" data-quest-id="${questId}">
  <div class="quest-header">
    <span class="quest-category-icon">💪</span>
    <span class="quest-name">${t(quest.nameKey)}</span>
  </div>
  <div class="quest-progress">
    <input type="number" min="0" max="${quest.target}" />
    <span class="quest-target">/ ${quest.target}</span>
  </div>
  <div class="quest-rewards">
    <span class="mana">+${quest.manaReward} Mana</span>
    <span class="gold">+${quest.goldReward} Gold</span>
  </div>
  <button class="complete-btn" ${quest.completed ? 'disabled' : ''}>
    ${quest.completed ? '✓ Erledigt' : 'Abschließen'}
  </button>
</div>
```

## Testing Checkliste

- [ ] Quests werden bei erstem Start des Tages generiert
- [ ] Quest-Typen render korrekt (reps, time, check, link, focus)
- [ ] Completion funktioniert nur wenn Target erreicht
- [ ] Mana und Gold werden korrekt addiert
- [ ] Stats werden aktualisiert
- [ ] Level-Up triggert richtig
- [ ] Streak wird nur incrementiert wenn alle Quests done
- [ ] Focus-Quest completed automatisch nach Timer
- [ ] Export enthält alle Quest-Daten
- [ ] Import stellt Quests korrekt wieder her
- [ ] Rest-Day Logik generiert korrekte Anzahl
