# Dungeon System - Funktions-Erklärung

## Übersicht
Das Dungeon System ist ein Kampfsystem, bei dem Spieler gegen Monster kämpfen, um XP und Mana-Stones zu verdienen. Dungeons werden automatisch generiert basierend auf dem Spieler-Level, mit steigender Schwierigkeit und skalierbaren Belohnungen.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/dungeons/page_dungeon_main.js` - Dungeon UI Rendering
- `js/dungeons/dungeon_combat.js` - Kampflogik
- `js/database.js` - IndexedDB Zugriffe

### Daten-Dateien
- `data/dungeons.js` - Dungeon und Monster Definitionen
- `data/translations.js` - Übersetzungen

## Wichtige Punkte

### Dungeon Struktur
```javascript
{
  id: 'forest-trial',
  nameKey: 'dungeon_forest_trial',
  description: 'Der Wald der Schatten...',
  monsters: [
    { id: 'wolf', name: 'Schattenwolf', baseHp: 30, baseDmg: 8 },
    { id: 'bear', name: 'Höhlenbär', baseHp: 36, baseDmg: 9 },
    { id: 'zombie', name: 'Morast-Zombie', baseHp: 28, baseDmg: 7 }
  ],
  tasks: [
    { id: 'pushups', label: 'Liegestütze', baseDamage: 10 },
    { id: 'squats', label: 'Squats', baseDamage: 6 },
    { id: 'situps', label: 'Sit-Ups', baseDamage: 5 }
  ],
  rewards: { xp: 50, manaStones: 3 },
  backgroundImage: 'forest-bg.jpg'
}
```

### Dungeon Level Scaling
```javascript
DUNGEON_SCALING = {
  hpMultiplier: 1.18,    // +18% HP pro Dungeon-Level
  damageMultiplier: 1.15, // +15% Damage pro Dungeon-Level
  rewardMultiplier: 1.1  // +10% Rewards pro Dungeon-Level
};

function scaleDungeon(dungeon, level) {
  const scale = Math.pow(1.18, level - 1);
  return {
    ...dungeon,
    monsters: dungeon.monsters.map(m => ({
      ...m,
      hp: Math.floor(m.baseHp * scale),
      maxHp: Math.floor(m.baseHp * scale),
      damage: Math.floor(m.baseDmg * Math.pow(1.15, level - 1))
    })),
    rewards: {
      xp: Math.floor(dungeon.rewards.xp * Math.pow(1.1, level - 1)),
      manaStones: Math.floor(dungeon.rewards.manaStones * Math.pow(1.1, level - 1))
    }
  };
}
```

### Combat Mechanic

#### Damage Formel
```
Player Damage = baseDamage * (1 + attack/100)

Monster Counter = monsterBaseDamage * (1 - protection/100)
Max Mitigation = 80%
```

#### HP Berechnung
```
HP Max = 100 + (character.level * 10)
HP Current = aktueller HP Stand
```

### Dungeon Progress Store
```javascript
{
  key: 'dungeon_progress',
  value: {
    currentLevel: 1,
    currentDungeon: 'forest-trial',
    monsterSpawned: false,
    currentMonster: null,
    playerHp: 100,
    monsterHp: 100
  }
}
```

### Spawn System
```javascript
SPAWN_CHANCE = 0.05; // 5% Chance

// In main.js bei App-Start
if (Math.random() < 0.05 && !dungeonProgress.monsterSpawned) {
  showDungeonSpawnChip();
}
```

## Design Richtung

### Architektur
- **Persistence**: Dungeon-Status in `dungeon_progress` Store
- **Sync Access**: Combat nutzt `window.__dq_cached_char__`
- **Reward Distribution**: XP und Mana-Stones bei Sieg

### UI-Rendering
- Modal/Popup für Dungeon-Kampf
- HP-Bars für Spieler und Monster
- Task-Buttons für Attacken

## IndexDB Speicherung

### Store: `dungeon_progress`
```javascript
{
  storeName: 'dungeon_progress',
  keyPath: 'key',
  value: {
    currentLevel: 1,
    currentDungeonId: 'forest-trial',
    monsterSpawned: false,
    playerHp: 100,
    playerHpMax: 100,
    currentMonster: null,
    combatLog: []
  }
}
```

### Store: `character` (Combat Stats)
```javascript
{
  // ... andere Felder
  combat: {
    attack: 0,
    protection: 0,
    hpMax: 100,
    hpCurrent: 100
  }
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "dungeon_progress": {
    "currentLevel": 5,
    "currentDungeonId": "forest-trial",
    "monsterSpawned": true,
    "playerHp": 75,
    "currentMonster": {
      "id": "wolf",
      "name": "Schattenwolf",
      "hp": 50,
      "maxHp": 100,
      "damage": 12
    }
  }
}
```

## Streak Verbindung

### Keine direkte Streak-Verbindung
- Dungeons beeinflussen den Daily Streak nicht direkt
- **Indirekt**: Mehr Mana durch Dungeon = mehr Level-Ups

### Dungeon Completion Achievement
```javascript
// Quest Achievement trackt nicht Dungeon-Wins
// Aber: Dungeon XP gibt Mana = Level-Ups
```

## Häufige Fehler

### 1. Combat Stats nicht aktuell
**Fehler**: Dungeon nutzt alte Equipment-Stats
**Lösung**: `window.__dq_cached_char__` vor Kampf refreshen

### 2. HP Overflow/Underflow
**Fehler**: HP geht über Max oder unter 0
**Lösung**: `Math.min(hpMax, hp)` und `Math.max(0, hp)`

### 3. Protection capping
**Fehler**: Mehr als 80% Protection möglich
**Lösung**: `Math.min(protection, 80)` bei DMG-Berechnung

### 4. Dungeon Level wird nicht gespeichert
**Fehler**: Fortschritt geht bei Reload verloren
**Lösung**: `dungeon_progress` bei jeder Änderung speichern

### 5. Spawn nach Reset
**Fehler**: Monster spawnt obwohl Dungeon gelöst
**Lösung**: `monsterSpawned: false` nach Win/Loss setzen

## Wichtige Funktionen

### page_dungeon_main.js
```javascript
DQ_DUNGEON_MAIN = {
  renderDungeonPage() { ... },        // Dungeon UI
  showDungeonChip() { ... },          // Spawn Chip
  enterDungeon() { ... },             // Dungeon betreten
  exitDungeon() { ... },              // Verlassen
  renderCombatScreen() { ... },       // Kampf UI
  renderMonster() { ... },            // Monster anzeigen
  renderPlayerStats() { ... },        // Spieler-Stats
  renderTasks() { ... },              // Attack-Buttons
  applyAction(taskId) { ... },        // Task ausführen
  monsterAttack() { ... },            // Monster greift an
  checkWinCondition() { ... },        // Sieg-Prüfung
  checkLossCondition() { ... }       // Niederlage-Prüfung
}
```

### dungeon_combat.js
```javascript
DQ_DUNGEON_COMBAT = {
  initForDungeon() { ... },           // Kampf initialisieren
  getPlayerCombatStatsSync() { ... },  // Combat-Stats lesen
  calculatePlayerDamage(baseDamage) { ... }, // DMG berechnen
  calculateMonsterDamage(baseDamage) { ... },
  applyDamageToMonster(amount) { ... },
  applyDamageToPlayer(amount) { ... },
  handleWin() { ... },                // Belohnungen geben
  handleLoss() { ... },               // Keine Belohnungen
  getCombatState() { ... }           // State lesen
};
```

### Combat Berechnungen
```javascript
function calculatePlayerDamage(baseDamage) {
  const char = window.__dq_cached_char__;
  const attackBonus = char.combat.attack || 0;
  const damageMultiplier = 1 + (attackBonus / 100);
  return Math.floor(baseDamage * damageMultiplier);
}

function calculateMonsterDamage(baseDamage) {
  const char = window.__dq_cached_char__;
  const protection = Math.min(char.combat.protection || 0, 80);
  const mitigation = protection / 100;
  return Math.floor(baseDamage * (1 - mitigation));
}
```

## Dungeon Monster

### Monster Typen
```javascript
MONSTERS = {
  wolf: {
    name: "Schattenwolf",
    baseHp: 30,
    baseDmg: 8,
    speed: 2, // Attack frequency
    weakness: 'agility' // Mehr Damage bei entsprechendem Task
  },
  bear: {
    name: "Höhlenbär",
    baseHp: 36,
    baseDmg: 9,
    speed: 1,
    weakness: 'strength'
  },
  zombie: {
    name: "Morast-Zombie",
    baseHp: 28,
    baseDmg: 7,
    speed: 1.5,
    weakness: 'endurance'
  }
};
```

### Tasks (Attacken)
```javascript
TASKS = {
  pushups: {
    label: "Liegestütze",
    baseDamage: 10,
    statScaling: { kraft: 0.5 }
  },
  squats: {
    label: "Squats",
    baseDamage: 6,
    statScaling: { kraft: 0.3, ausdauer: 0.2 }
  },
  situps: {
    label: "Sit-Ups",
    baseDamage: 5,
    statScaling: { kraft: 0.2 }
  },
  jumping_jacks: {
    label: "Jumping Jacks",
    baseDamage: 4,
    statScaling: { ausdauer: 0.3 }
  }
};
```

## UI Components

### Spawn Chip
```html
<div class="dungeon-spawn-chip floating">
  <div class="monster-icon">🐺</div>
  <div class="spawn-text">${t('dungeon_spawn_message')}</div>
  <button class="enter-btn">${t('dungeon_enter')}</button>
  <button class="ignore-btn">${t('dungeon_ignore')}</button>
</div>
```

### Combat Screen
```html
<div class="dungeon-combat">
  <div class="combat-header">
    <h2>${t(dungeon.nameKey)}</h2>
    <span class="dungeon-level">Level ${progress.currentLevel}</span>
  </div>

  <div class="combat-arena">
    <div class="player-stats">
      <div class="hp-bar">
        <div class="hp-fill" style="width: ${playerHpPercent}%"></div>
      </div>
      <div class="hp-text">${playerHp} / ${playerHpMax}</div>
      <div class="player-stats-detail">
        ⚔️ ${character.combat.attack} | 🛡️ ${character.combat.protection}
      </div>
    </div>

    <div class="monster-display">
      <div class="monster-sprite">🐺</div>
      <div class="monster-name">${currentMonster.name}</div>
      <div class="hp-bar monster-hp">
        <div class="hp-fill" style="width: ${monsterHpPercent}%"></div>
      </div>
      <div class="hp-text">${monsterHp} / ${currentMonster.maxHp}</div>
    </div>
  </div>

  <div class="combat-tasks">
    <h3>${t('dungeon_attack_with')}</h3>
    <div class="task-buttons">
      ${tasks.map(task => `
        <button class="task-btn" data-task="${task.id}">
          <span class="task-label">${t(task.label)}</span>
          <span class="task-damage">⚔️ ${calculateDamage(task)}</span>
        </button>
      `).join('')}
    </div>
  </div>

  <div class="combat-log">
    ${combatLog.map(entry => `
      <div class="log-entry ${entry.type}">${entry.message}</div>
    `).join('')}
  </div>
</div>
```

### Victory Screen
```html
<div class="dungeon-victory">
  <div class="victory-icon">🎉</div>
  <h2>${t('dungeon_victory')}</h2>
  <div class="rewards">
    <div class="reward-item">
      <span class="icon">✨</span>
      <span class="value">+${rewards.xp} XP</span>
    </div>
    <div class="reward-item">
      <span class="icon">💎</span>
      <span class="value">+${rewards.manaStones} Mana-Stones</span>
    </div>
  </div>
  <button class="continue-btn">${t('dungeon_continue')}</button>
</div>
```

## Testing Checkliste

- [ ] Dungeon Spawn Chip erscheint (5% Chance)
- [ ] Dungeon betretbar von jeder Page
- [ ] Monster HP skalieren mit Dungeon-Level
- [ ] Player Damage skaliert mit Equipment
- [ ] Protection capped bei 80%
- [ ] Tasks zeigen korrekten Damage
- [ ] Combat Log zeigt alle Aktionen
- [ ] Victory Screen zeigt Rewards
- [ ] Defeat Screen zeigt "Versuch es erneut"
- [ ] Dungeon Level erhöht sich nach Sieg
- [ ] Dungeon Progress wird gespeichert
- [ ] Reload setzt Combat fort
- [ ] Export enthält dungeon_progress
- [ ] Import stellt Dungeon-Status wieder her
