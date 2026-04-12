# Character System - Funktions-Erklärung

##icht
Das Character System ist das Übers zentrale Spieler-Managementsystem in DailyQuest. Es verwaltet alle Spieler-Daten,Stats,Level,Gold,Ausrüstung und Inventar. Das Character-Objekt ist das Herzstück des Spiels und wird in der IndexedDB im Store `character` mit `id: 1` gespeichert.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/character/page_character_main.js` - Hauptmodul für Character-Verwaltung
- `js/character/page_character_stats.js` - Stats-System und Radar-Chart
- `js/character/page_character_inventory.js` - Ausrüstung und Inventar
- `js/character/page_character_labels.js` - Dynamische Spieler-Labels
- `js/database.js` - IndexedDB Zugriffe

### Verbundene Module
- `js/page_exercises.js` - Quest-Verarbeitung
- `js/page_shop.js` - Shop-Käufe
- `js/main.js` - Level-Up und Mana-Berechnung
- `js/dungeons/page_dungeon_main.js` - Kampfwert-Abfrage

## Wichtige Punkte

### Character Objekt Struktur
```javascript
{
  id: 1,
  name: "Unknown Hunter",
  level: 1,
  mana: 0,
  manaToNextLevel: 100,
  gold: 200,
  stats: {
    kraft: 5,           // Strength - Kraftübungen
    ausdauer: 5,        // Endurance - Ausdauerübungen
    beweglichkeit: 5,    // Agility - Beweglichkeitsübungen
    durchhaltevermoegen: 5, // Stamina - Durchhaltevermögen
    willenskraft: 5      // Willpower - Fokus/Lernübungen
  },
  statProgress: { ... }, // Fortschritt zum nächsten Stat-Punkt
  equipment: {
    weapons: [],         // Waffen-Array
    armor: null          // Einzelnes Rüstungsobjekt
  },
  inventory: [],         // Gekaufte Items
  combat: {
    attack: 0,
    protection: 0,
    hpMax: 100,
    hpCurrent: 100
  },
  weightTrackingEnabled: true,
  targetWeight: null,
  weightDirection: 'lose',
  achievements: {
    level: { tier: 0, claimable: false },
    quests: { tier: 0, claimable: false },
    gold: { tier: 0, claimable: false },
    shop: { tier: 0, claimable: false },
    strength: { tier: 0, claimable: false },
    streak: { tier: 0, claimable: false },
    focus_time: { tier: 0, claimable: false }
  },
  totalGoldEarned: 200,
  totalQuestsCompleted: 0,
  totalItemsPurchased: 0
}
```

### Stat-System Details

#### Stat-Typen
| Stat | Deutsch | Übungs-Typ | XP-Quelle |
|------|---------|-------------|------------|
| kraft | Kraft | Kraft-Übungen | Liegestütze, Bizeps-Curls |
| ausdauer | Ausdauer | Cardio | Laufen, Springen |
| beweglichkeit | Beweglichkeit | Flexibilität | Dehnen, Mobilität |
| durchhaltevermoegen | Durchhaltevermögen | Ausdauer | Fokus-Sessions |
| willenskraft | Willenskraft | Fokus/Lernen | Lern-Quests |

#### Stat-Point Berechnung
- `statProgress` sammelt Fortschritt pro Übung
- Threshold variiert nach Schwierigkeit:
  - Difficulty 1: 5.5 Punkte nötig
  - Difficulty 5: 3.5 Punkte nötig (schwerer = schneller Stats)
- Jede Übung hat `statPoints` Objekt (z.B. `{ kraft: 1 }`)

### Level-Up Logik

#### Mana Formula
```javascript
manaToNextLevel = 100 * 1.5^(level-1)
```
- Level 1 → 2: 100 Mana
- Level 2 → 3: 150 Mana
- Level 3 → 4: 225 Mana
- Level 5 → 6: 506 Mana

#### Trigger
- Prüfung nach jeder Quest-Completion
- While-Loop für Multiple-Level-Ups
- Notification bei Level-Up

## Design Richtung

### Architektur
- **Singleton Pattern**: Character ist Single-Record (`id: 1`)
- **Promise-Based DB**: Alle DB-Operationen asynchron
- **Module Pattern**: `DQ_CHARACTER_MAIN` Objekt mit `init()`, `renderPage()`

### UI-Rendering
- Separate Pages für Stats, Inventory, Labels
- Radar-Chart für visuelle Stats-Darstellung
- Statische Labels basierend auf dominantem Stat

## IndexDB Speicherung

### Store: `character`
```javascript
{
  storeName: 'character',
  keyPath: 'id',
  value: characterObject // Siehe oben
}
```

### Lese-Schreib-Zugriffe
```javascript
// Lesen
const char = await DQ_DB.getSingle('character', 1);

// Schreiben
await DQ_DB.putSingle('character', updatedChar);

// Sync für Combat (dungeon_combat.js)
window.__dq_cached_char__ = await DQ_DB.getSingle('character', 1);
```

## Export/Import JSON

### Export
```javascript
// In main.js exportData()
const data = {
  character: await DQ_DB.getAll('character'),
  // ... andere Stores
  streakData: JSON.parse(localStorage.getItem('streakData'))
};
```

### Import
```javascript
// In main.js importData()
await DQ_DB.clearStore('character');
await DQ_DB.putSingle('character', importedChar[0]);
```

## Streak Verbindung

### Streak-Penalty bei Level
- Bei Streak-Reset: Level -1 (wenn Level > 1)
- Mana wird für neues Level neu berechnet

### Achievement Tracking
- `achievements.level` - basiert auf `level`
- `achievements.strength` - basiert auf `stats.kraft`
- `achievements.gold` - basiert auf `totalGoldEarned`
- `achievements.quests` - basiert auf `totalQuestsCompleted`

## Häufige Fehler

### 1. Sync-Problem bei Combat
**Fehler**: Dungeon nutzt `window.__dq_cached_char__` statt frische Daten
**Lösung**: Vor Dungeon `DQ_DB.getSingle('character', 1)` aufrufen

### 2. Mana Overflow
**Fehler**: Mana geht über 100% beim Level-Up
**Lösung**: While-Loop mit `mana -= manaToNextLevel` vor `manaToNextLevel = newThreshold`

### 3. Stats bleiben bei Level 1
**Fehler**: Stats können nicht erhöht werden
**Lösung**: `statProgress` muss gefüllt sein und Threshold erreicht

### 4. Uninitialized Character
**Fehler**: App startet ohne Character
**Lösung**: `initDefaultCharacter()` in `main.js` bei erster Nutzung

## Wichtige Funktionen

### page_character_main.js
```javascript
DQ_CHARACTER_MAIN = {
  init(elements) { ... },           // Initialisierung
  renderPage() { ... },             // Page-Rendering
  updateStats(newStats) { ... },    // Stats aktualisieren
  addGold(amount) { ... },          // Gold hinzufügen
  addMana(amount) { ... },          // Mana hinzufügen
  equipItem(item) { ... },         // Item ausrüsten
  unequipItem(itemId) { ... }      // Item ablegen
}
```

### page_character_stats.js
```javascript
DQ_STATS = {
  renderStatsPage() { ... },        // Stats-Page
  renderRadarChart() { ... },      // Radar-Chart SVG
  renderFocusStats() { ... },      // Fokus-Statistik
  renderWeightTracking() { ... },  // Gewichts-Verfolgung
  getStatProgress() { ... }        // Fortschritt berechnen
}
```

### page_character_inventory.js
```javascript
DQ_INVENTORY = {
  renderInventoryPage() { ... },   // Inventar-Page
  renderEquipment() { ... },       // Ausrüstung anzeigen
  renderInventory() { ... },       // Items anzeigen
  equipItem(item) { ... },         // Item ausrüsten
  unequipItem(slot, itemId) { ... } // Item ablegen
}
```

## Weight Tracking Integration

### Settings
```javascript
{
  weightTrackingEnabled: boolean,
  targetWeight: number,
  weightDirection: 'lose' | 'gain'
}
```

### Weight Entries Store
```javascript
{
  id: autoIncrement,
  date: 'YYYY-MM-DD',
  weight: number
}
```

### Berechnung
- Chart zeigt Gewichtsverlauf über Zeit
- Richtungspfeil basierend auf `weightDirection`
- Target-Marker bei `targetWeight`

## Label-System

### Labels nach dominantem Stat

**Single Stat Labels**:
- Kraft > others → "Kraftprotz"
- Ausdauer > others → "Marathoner"
- Beweglichkeit > others → "Akrobat"
- Durchhaltevermögen > others → "Stoiker"
- Willenskraft > others → "Eiserner Wille"

**Two-Stat Kombinationen**:
- Kraft + Willenskraft → "Tank"
- Kraft + Ausdauer → "Powerläufer"
- Ausdauer + Durchhaltevermögen → "Langläufer"
- Beweglichkeit + Willenskraft → "Präzisionskünstler"

**Special Labels**:
- Balanced (3+ ähnlich) → "Allrounder"
- Niedrige Stats → "Neuling"

### Label-Berechnung
```javascript
// page_character_labels.js
analyzeStats(stats) {
  const percentages = normalizeToPercentages(stats);
  const dominant = findDominant(percentages, threshold = 0.10);
  return getLabelForCombination(dominant);
}
```

## Module Abhängigkeiten

```
main.js
  ↓
DQ_DB.getSingle('character', 1)
  ↓
DQ_CHARACTER_MAIN
  ├─ DQ_STATS (Radar, Weight)
  ├─ DQ_INVENTORY (Equipment, Items)
  └─ DQ_LABELS (Dynamic Titles)
```

## Testing Checkliste

- [ ] Character wird bei erstem Start erstellt
- [ ] Stats erhöhen sich nach Quest-Completion
- [ ] Level-Up triggert bei Mana >= Threshold
- [ ] Mana wird korrekt berechnet (100 * 1.5^(level-1))
- [ ] Gold wird bei Quest-Belohnung addiert
- [ ] Achievements werden aktualisiert
- [ ] Labels ändern sich bei Stat-Änderung
- [ ] Weight Tracking speichert und zeigt Daten
- [ ] Export/Import erhält alle Character-Daten
- [ ] Dungeon nutzt aktuelle Combat-Stats
