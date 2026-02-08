# Streak System - Funktions-Erklärung

## Übersicht
Das Streak System trackt die Anzahl aufeinanderfolgender Tage, an denen alle Daily Quests abgeschlossen wurden. Der Streak ist ein wichtiger Motivations-Faktor und schließt direkt an das Achievements-System an.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/main.js` - Streak-Berechnung und Penalty
- `js/database.js` - IndexedDB Zugriffe
- `js/page_exercises.js` - Quest-Completion Events

## Wichtige Punkte

### Streak Data Struktur
```javascript
// Stored in localStorage
streakData = {
  streak: 5,             // Aktuelle Streak-Tage
  lastDate: "2026-02-07" // Letzter erfolgreicher Tag (YYYY-MM-DD)
};
```

### Streak Storage
```javascript
const STREAK_KEY = 'streakData';

function getStreakData() {
  const data = localStorage.getItem(STREAK_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return { streak: 0, lastDate: null };
}

function saveStreakData(data) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}
```

### Streak Berechnungs-Logik
```javascript
async function checkStreakCompletion() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = getYesterdayDateString();

  const streakData = getStreakData();

  // Wenn heute schon gecheckt, nichts tun
  if (streakData.lastDate === today) {
    return;
  }

  // Quests für heute laden
  const todaysQuests = await DQ_DB.getByIndex('daily_quests', 'date', today);

  // Prüfen ob ALLE Quests completed sind
  const allCompleted = todaysQuests.length > 0 &&
                      todaysQuests.every(quest => quest.completed);

  if (allCompleted) {
    if (streakData.lastDate === yesterday) {
      // Streak fortführen
      streakData.streak += 1;
    } else {
      // Neuer Streak starten
      streakData.streak = 1;
    }
    streakData.lastDate = today;
    saveStreakData(streakData);

    // Achievement Update
    updateStreakAchievement();

    // UI Update
    showStreakNotification(streakData.streak);
  }
}

function getYesterdayDateString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}
```

### Midnight Penalty
```javascript
async function checkForPenaltyAndReset() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = getYesterdayDateString();

  const streakData = getStreakData();

  // Quests für GESTERN laden
  const yesterdaysQuests = await DQ_DB.getByIndex('daily_quests', 'date', yesterday);

  // Prüfen ob alle Quests completed waren
  const allCompleted = yesterdaysQuests.length > 0 &&
                      yesterdaysQuests.every(quest => quest.completed);

  if (!allCompleted && streakData.lastDate === yesterday) {
    // PENALTY: Streak zurücksetzen
    streakData.streak = 0;
    streakData.lastDate = today; // Verhindert erneuten Check
    saveStreakData(streakData);

    // Level -1 Penalty (wenn Level > 1)
    const character = await DQ_DB.getSingle('character', 1);
    if (character.level > 1) {
      character.level -= 1;
      character.manaToNextLevel = calculateManaThreshold(character.level);
      await DQ_DB.putSingle('character', character);
    }

    // UI Notification
    showPenaltyNotification('streak_reset');
  }
}
```

### Achievement Integration
```javascript
function updateStreakAchievement() {
  const streakData = getStreakData();
  const currentStreak = streakData.streak;

  // Check ob neuer Tier erreicht
  const achievementDef = ACHIEVEMENTS.find(a => a.id === 'streak');
  const newTier = achievementDef.tiers.find(
    t => t.threshold <= currentStreak
  );

  if (newTier) {
    const tierIndex = achievementDef.tiers.indexOf(newTier);

    // Update Character Achievement
    character.achievements.streak.tier = tierIndex + 1;
    character.achievements.streak.claimable = true;

    // Speichern
    DQ_DB.putSingle('character', character);

    // Notification
    showAchievementNotification('streak', tierIndex + 1);
  }
}
```

### Streak Achievement Tiers
```javascript
// In data/achievements.js
{
  id: "streak",
  icon: "🏆",
  tracking: "streakData.streak",
  tiers: [
    { threshold: 10, rewardGold: 100, rewardMana: 100 },
    { threshold: 20, rewardGold: 200, rewardMana: 200 },
    { threshold: 30, rewardGold: 300, rewardMana: 300 },
    { threshold: 40, rewardGold: 400, rewardMana: 400 },
    { threshold: 50, rewardGold: 500, rewardMana: 500 },
    { threshold: 60, rewardGold: 600, rewardMana: 600 },
    { threshold: 70, rewardGold: 700, rewardMana: 700 },
    { threshold: 80, rewardGold: 800, rewardMana: 800 },
    { threshold: 90, rewardGold: 900, rewardMana: 900 },
    { threshold: 100, rewardGold: 1000, rewardMana: 1000 },
    { threshold: 110, rewardGold: 1100, rewardMana: 1100 },
    { threshold: 120, rewardGold: 1200, rewardMana: 1200 },
    { threshold: 130, rewardGold: 1300, rewardMana: 1300 },
    { threshold: 140, rewardGold: 1400, rewardMana: 1400 },
    { threshold: 150, rewardGold: 1500, rewardMana: 1500 }
  ]
}
```

## Design Richtung

### Architektur
- **LocalStorage**: Streak in localStorage für schnellen Zugriff
- **Auto-Check**: Automatische Prüfung bei Quest-Completion
- **Midnight-Reset**: Separate Penalty-Prüfung bei Tageswechsel

### Streak-Visualisierung
- Auf der character-Seite wird der aktuelle Streak angezeigt

## IndexDB Speicherung

### LocalStorage (Primär)
```
Key: 'streakData'
Value: { streak: number, lastDate: string }
```

### Export/Import
```json
{
  "streakData": {
    "streak": 5,
    "lastDate": "2026-02-07"
  }
}
```

## Häufige Fehler

### 1. Midnight Race Condition
**Fehler**: Penalty wird ausgeführt bevor User Quests abschließt
**Lösung**: Penalty wird bei App-Start geprüft, nicht automatisch bei Midnight

### 2. Double Streak Increment
**Fehler**: Streak wird zweimal incrementiert
**Lösung**: Check `streakData.lastDate !== today` vor Update

### 3. Yesterday Calculation
**Fehler**: Falsches Yesterday-Datum bei Zeitzonen
**Lösung**: Nutze `toISOString().split('T')[0]` für konsistente Daten

### 4. Empty Quest Day
**Fehler**: Wenn keine Quests generiert wurden
**Lösung**: Prüfe `todaysQuests.length > 0`

### 5. Level -1 bei Level 1
**Fehler**: Level kann nicht unter 1 gehen
**Lösung**: `if (character.level > 1)` vor Level-Decrement

## Wichtige Funktionen

### main.js
```javascript
// Streak Management
function getStreakData() { ... }
function saveStreakData(data) { ... }
function getYesterdayDateString() { ... }

async function checkStreakCompletion() { ... }
async function checkForPenaltyAndReset() { ... }
function updateStreakAchievement() { ... }

// Streak UI Updates
function showStreakNotification(streak) { ... }
function renderStreakDisplay() { ... }
```

## UI Components

### Streak Display
```html
<div class="streak-display ${streak > 0 ? 'active' : ''}">
  <span class="streak-icon">🔥</span>
  <span class="streak-count">${streak}</span>
  <span class="streak-label">${t('streak_days')}</span>
  ${streak >= 7 ?
    `<div class="streak-badge">${t('streak_week')}</div>` : ''
  }
</div>
```

### Streak Notification
```html
<div class="streak-notification">
  <div class="notification-content">
    <span class="icon">🔥</span>
    <div class="text">
      <h4>${t('streak_increased')}</h4>
      <p>${t('streak_now', { count: streak })}</p>
    </div>
  </div>
  <div class="streak-progress">
    <span>${t('next_bonus')}</span>
    <div class="progress-bar">
      <div class="progress-fill"
           style="width: ${getProgressToNextTier()}%"></div>
    </div>
    <span>${nextTierThreshold}</span>
  </div>
</div>
```

### Penalty Notification
```html
<div class="penalty-notification">
  <div class="notification-content">
    <span class="icon">💔</span>
    <div class="text">
      <h4>${t('streak_reset_title')}</h4>
      <p>${t('streak_reset_message')}</p>
    </div>
  </div>
  <div class="penalty-details">
    <span>🔥 → 0</span>
    ${levelDecreased ? `<span>📉 Level -1</span>` : ''}
  </div>
</div>
```

## Testing Checkliste

- [ ] Streak startet bei 0
- [ ] Streak incrementiert bei Quest-Completion
- [ ] Streak bleibt bei gestern completion wenn heute noch nicht
- [ ] Streak reset bei unvollständigen Quests
- [ ] Level -1 bei Penalty (wenn Level > 1)
- [ ] Achievement tier incrementiert
- [ ] Notification erscheint bei Streak-Increase
- [ ] Export enthält streakData
- [ ] Import stellt streakData wieder her
- [ ] Reload erhält Streak
- [ ] Verschiedene Zeitzonen funktionieren
