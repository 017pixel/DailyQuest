# Achievements System - Funktions-Erklärung

## Übersicht
Das Achievements System trackt die Spieler-Fortschritte in verschiedenen Kategorien und belohnt erreichte Meilensteine mit Gold und Mana. Achievements haben multiple Tiers und werden "claimable" wenn ein Threshold erreicht wird.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/page_achievements.js` - Hauptmodul für Achievement-UI
- `js/database.js` - IndexedDB Zugriffe
- `js/main.js` - Achievement-Updates bei Events

### Daten-Dateien
- `data/achievements.js` - Achievement Definitionen
- `data/translations.js` - Übersetzungen

## Wichtige Punkte

### Achievement Struktur
```javascript
{
  id: "level",
  icon: "⭐",
  tracking: "character.level",
  tiers: [
    { threshold: 5, rewardGold: 100, rewardMana: 100 },
    { threshold: 10, rewardGold: 200, rewardMana: 200 },
    // ... mehr Tiers
  ]
}
```

### Achievement-Tracking im Character
```javascript
character.achievements = {
  level: { tier: 0, claimable: false },
  quests: { tier: 0, claimable: false },
  gold: { tier: 0, claimable: false },
  shop: { tier: 0, claimable: false },
  strength: { tier: 0, claimable: false },
  streak: { tier: 0, claimable: false },
  focus_time: { tier: 0, claimable: false }
}
```

### Achievement Kategorien

| ID | Icon | Tracking | Beschreibung |
|----|------|----------|--------------|
| `level` | ⭐ | `character.level` | Spieler-Level |
| `quests` | 🔥 | `character.totalQuestsCompleted` | Abgeschlossene Quests |
| `gold` | 💰 | `character.totalGoldEarned` | Gesammeltes Gold |
| `shop` | 🛒 | `character.totalItemsPurchased` | Gekaufte Items |
| `strength` | 💪 | `character.stats.kraft` | Kraft-Stat |
| `streak` | 🏆 | `streakData.streak` | Tages-Streak |
| `focus_time` | 🧠 | `totalFocusMinutes` | Gesammelte Fokus-Minuten |

### Tier Definitionen

**Level Achievement**:
| Tier | Level | Reward |
|------|-------|--------|
| 1 | 5 | 100 Gold, 100 Mana |
| 2 | 10 | 200 Gold, 200 Mana |
| 3 | 15 | 300 Gold, 300 Mana |
| ... | ... | ... |
| 15 | 100 | 1500 Gold, 1500 Mana |

**Quests Achievement**:
| Tier | Quests | Reward |
|------|--------|--------|
| 1 | 10 | 100 Gold, 100 Mana |
| 2 | 25 | 200 Gold, 200 Mana |
| 3 | 50 | 300 Gold, 300 Mana |
| ... | ... | ... |
| 15 | 1000 | 1500 Gold, 1500 Mana |

**Streak Achievement**:
| Tier | Days | Reward |
|------|------|--------|
| 1 | 10 | 100 Gold, 100 Mana |
| 2 | 20 | 200 Gold, 200 Mana |
| 3 | 30 | 300 Gold, 300 Mana |
| ... | ... | ... |
| 15 | 150 | 1500 Gold, 1500 Mana |

**Focus Time Achievement**:
| Tier | Minutes | Reward |
|------|---------|--------|
| 1 | 60 | 100 Gold, 100 Mana |
| 2 | 300 | 200 Gold, 200 Mana |
| 3 | 600 | 300 Gold, 300 Mana |
| ... | ... | ... |
| 15 | 60000 | 1500 Gold, 1500 Mana |

## Design Richtung

### Architektur
- **Statische Definitionen**: Achievement-Struktur in `data/achievements.js`
- **Dynamic Tracking**: Actual Progress wird im `character.achievements` Objekt gespeichert
- **Claim-System**: Achievements werden nicht automatisch - müssen "geclaimed" werden

### UI-Rendering
- Grid-Layout für Achievement-Karten
- Progress-Bar pro Achievement
- "Claim" Button wenn `claimable: true`
- Animierte Celebration bei Claim

## IndexDB Speicherung

### Store: `character`
Achievements sind Teil des Character-Objekts:

```javascript
{
  // ... andere Felder
  achievements: {
    level: { tier: 0, claimable: false },
    quests: { tier: 0, claimable: false },
    gold: { tier: 0, claimable: false },
    shop: { tier: 0, claimable: false },
    strength: { tier: 0, claimable: false },
    streak: { tier: 0, claimable: false },
    focus_time: { tier: 0, claimable: false }
  },
  totalGoldEarned: 0,
  totalQuestsCompleted: 0,
  totalItemsPurchased: 0
}
```

### Focus Time Tracking
```javascript
// Separate Speicherung in vibe_state oder eigenem Store
{
  totalFocusMinutes: 0
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "character": {
    "achievements": {
      "level": { "tier": 0, "claimable": false },
      "quests": { "tier": 0, "claimable": false },
      // ...
    },
    "totalGoldEarned": 200,
    "totalQuestsCompleted": 0,
    "totalItemsPurchased": 0
  },
  "vibe_state": {
    "totalFocusMinutes": 0
  }
}
```

## Streak Verbindung

### Streak Achievement Update
```javascript
function updateStreakAchievement() {
  const streak = getStreak();

  // Prüfe nächsten Tier
  const achievementDef = ACHIEVEMENTS.find(a => a.id === 'streak');
  const nextTier = achievementDef.tiers.find(
    t => t.threshold <= streak && t.threshold > character.achievements.streak.tier
  );

  if (nextTier) {
    character.achievements.streak.tier = nextTierIndex + 1;
    character.achievements.streak.claimable = true;
    showAchievementNotification('streak');
  }
}
```

## Häufige Fehler

### 1. Achievement nicht updatebar
**Fehler**: Achievement Progress ändert sich nicht nach Event
**Lösung**: `updateAchievement('achievementId')` nach relevanten Events aufrufen

### 2. Double Claim
**Fehler**: Achievement wird zweimal geclaimed
**Lösung**: `claimable: false` nach Claim setzen

### 3. Tier Overflow
**Fehler**: Spieler hat mehr als max Tier
**Lösung**: Prüfe `if (achievement.tier < maxTiers)` vor Update

### 4. Focus Time nicht getrackt
**Fehler**: `totalFocusMinutes` wird nicht in vibe_state gespeichert
**Lösung**: Update `vibe_state.totalFocusMinutes` bei Session-Complete

### 5. Translation Keys fehlen
**Fehler**: Achievement-Namen nicht übersetzt
**Lösung**: `t(`achievement_${id}`)` und `t(`achievement_${id}_desc`)` in translations

## Wichtige Funktionen

### page_achievements.js
```javascript
DQ_ACHIEVEMENTS = {
  init(elements) { ... },                  // Initialisierung
  renderAchievementsPage() { ... },        // Alle Achievements anzeigen
  renderAchievementCard(achievement) { ... }, // Einzelne Karte
  updateProgress(achievementId) { ... },  // Progress aktualisieren
  claimReward(achievementId) { ... },     // Reward abholen
  checkAndNotify(achievementId) { ... },  // Notification auslösen
  getProgressPercentage(achievement) { ... } // Progress %
}
```

### Update Functions
```javascript
function updateAchievements() {
  updateLevelAchievement();
  updateQuestAchievement();
  updateGoldAchievement();
  updateShopAchievement();
  updateStrengthAchievement();
  updateStreakAchievement();
  updateFocusTimeAchievement();
}

function updateLevelAchievement() {
  const level = character.level;
  const def = ACHIEVEMENTS.find(a => a.id === 'level');

  // Finde nächsten nicht-claimed Tier
  for (let i = 0; i < def.tiers.length; i++) {
    if (level >= def.tiers[i].threshold) {
      if (character.achievements.level.tier < i + 1) {
        character.achievements.level.tier = i + 1;
        character.achievements.level.claimable = true;
        await DQ_DB.putSingle('character', character);
        showAchievementNotification('level');
      }
    }
  }
}

function claimAchievement(achievementId) {
  const achievement = character.achievements[achievementId];
  if (!achievement.claimable) return;

  const def = ACHIEVEMENTS.find(a => a.id === achievementId);
  const tierDef = def.tiers[achievement.tier - 1];

  // Rewards geben
  character.gold += tierDef.rewardGold;
  character.mana += tierDef.rewardMana;

  // Reset claimable
  achievement.claimable = false;

  // Speichern
  await DQ_DB.putSingle('character', character);
  showClaimNotification(tierDef);
}
```

## Achievement Events

### Wann werden Achievements aktualisiert?

| Achievement | Event | Update-Funktion |
|-------------|-------|-----------------|
| `level` | Level-Up | `main.js:checkAndLevelUp()` |
| `quests` | Quest Complete | `page_exercises.js:completeQuest()` |
| `gold` | Gold Add | `DQ_CHARACTER_MAIN.addGold()` |
| `shop` | Item Purchase | `page_shop.js:buyItem()` |
| `strength` | Stat Increase | `updateStatProgress()` |
| `streak` | Streak Check | `main.js:checkStreakCompletion()` |
| `focus_time` | Session Complete | `page_fokus_timer.js:completeSession()` |

## UI Components

### Achievement Card HTML
```html
<div class="achievement-card ${achievement.claimable ? 'claimable' : ''}"
     data-achievement-id="${achievementId}">
  <div class="achievement-icon">${def.icon}</div>
  <div class="achievement-info">
    <div class="achievement-name">${t(`achievement_${id}`)}</div>
    <div class="achievement-desc">${t(`achievement_${id}_desc`)}</div>
    <div class="achievement-tier">
      Tier ${achievement.tier} / ${maxTiers}
    </div>
    <div class="achievement-progress">
      <div class="progress-bar">
        <div class="progress-fill"
             style="width: ${getProgressPercentage()}%"></div>
      </div>
      <span class="progress-text">${current} / ${nextThreshold}</span>
    </div>
  </div>
  ${achievement.claimable ?
    `<button class="claim-btn" onclick="claimAchievement('${id}')">
       Claim ${tierDef.rewardGold}💰 ${tierDef.rewardMana}⚡
     </button>` :
    `<div class="achievement-locked">🔒</div>`
  }
</div>
```

## Testing Checkliste

- [ ] Alle Achievements werden initial mit tier: 0 geladen
- [ ] Level-Up incrementiert Level Achievement
- [ ] Quest Completion incrementiert Quest Achievement
- [ ] Gold-Addition incrementiert Gold Achievement
- [ ] Item-Kauf incrementiert Shop Achievement
- [ ] Stat-Increase incrementiert Strength Achievement
- [ ] Streak-Check incrementiert Streak Achievement
- [ ] Focus-Session incrementiert Focus Achievement
- [ ] Claim-Button erscheint bei claimable: true
- [ ] Claim gibt korrekte Rewards
- [ ] Claim setzt claimable auf false
- [ ] Notification erscheint bei neuem Tier
- [ ] Achievements werden im Export eingeschlossen
- [ ] Achievements werden beim Import wiederhergestellt
