# Achievements Data - Funktions-Erklärung

## Übersicht
Die Achievements Data-Datei enthält alle Achievement-Definitionen mit ihren Tracking-Metriken, Tiers und Belohnungen. Achievements werden progressiv freigeschaltet und sind mit dem Achievements-System in der UI verbunden.

## Relevante Dateien und Ordner

### Hauptdateien
- `data/achievements.js` - Achievement Definitionen
- `js/page_achievements.js` - Achievement UI

## Wichtige Punkte

### Achievement Struktur
```javascript
{
  id: "level",
  icon: "⭐",
  nameKey: "achievement_level",
  descriptionKey: "achievement_level_desc",
  tracking: "character.level",    // JSON-Path zur Tracking-Variable
  tiers: [
    {
      threshold: 5,
      rewardGold: 100,
      rewardMana: 100
    },
    // ... mehr Tiers
  ]
}
```

### Achievement Kategorien

#### Level Achievement
```javascript
{
  id: "level",
  icon: "⭐",
  nameKey: "achievement_level",
  descriptionKey: "achievement_level_desc",
  tracking: "character.level",
  tiers: [
    { threshold: 5, rewardGold: 100, rewardMana: 100 },
    { threshold: 10, rewardGold: 200, rewardMana: 200 },
    { threshold: 15, rewardGold: 300, rewardMana: 300 },
    { threshold: 20, rewardGold: 400, rewardMana: 400 },
    { threshold: 25, rewardGold: 500, rewardMana: 500 },
    { threshold: 30, rewardGold: 600, rewardMana: 600 },
    { threshold: 35, rewardGold: 700, rewardMana: 700 },
    { threshold: 40, rewardGold: 800, rewardMana: 800 },
    { threshold: 45, rewardGold: 900, rewardMana: 900 },
    { threshold: 50, rewardGold: 1000, rewardMana: 1000 },
    { threshold: 60, rewardGold: 1100, rewardMana: 1100 },
    { threshold: 70, rewardGold: 1200, rewardMana: 1200 },
    { threshold: 80, rewardGold: 1300, rewardMana: 1300 },
    { threshold: 90, rewardGold: 1400, rewardMana: 1400 },
    { threshold: 100, rewardGold: 1500, rewardMana: 1500 }
  ]
}
```

#### Quests Achievement
```javascript
{
  id: "quests",
  icon: "🔥",
  nameKey: "achievement_quests",
  descriptionKey: "achievement_quests_desc",
  tracking: "character.totalQuestsCompleted",
  tiers: [
    { threshold: 10, rewardGold: 100, rewardMana: 100 },
    { threshold: 25, rewardGold: 200, rewardMana: 200 },
    { threshold: 50, rewardGold: 300, rewardMana: 300 },
    { threshold: 75, rewardGold: 400, rewardMana: 400 },
    { threshold: 100, rewardGold: 500, rewardMana: 500 },
    { threshold: 150, rewardGold: 600, rewardMana: 600 },
    { threshold: 200, rewardGold: 700, rewardMana: 700 },
    { threshold: 250, rewardGold: 800, rewardMana: 800 },
    { threshold: 300, rewardGold: 900, rewardMana: 900 },
    { threshold: 400, rewardGold: 1000, rewardMana: 1000 },
    { threshold: 500, rewardGold: 1100, rewardMana: 1100 },
    { threshold: 600, rewardGold: 1200, rewardMana: 1200 },
    { threshold: 750, rewardGold: 1300, rewardMana: 1300 },
    { threshold: 900, rewardGold: 1400, rewardMana: 1400 },
    { threshold: 1000, rewardGold: 1500, rewardMana: 1500 }
  ]
}
```

#### Gold Achievement
```javascript
{
  id: "gold",
  icon: "💰",
  nameKey: "achievement_gold",
  descriptionKey: "achievement_gold_desc",
  tracking: "character.totalGoldEarned",
  tiers: [
    { threshold: 1000, rewardGold: 100, rewardMana: 100 },
    { threshold: 2500, rewardGold: 200, rewardMana: 200 },
    { threshold: 5000, rewardGold: 300, rewardMana: 300 },
    { threshold: 7500, rewardGold: 400, rewardMana: 400 },
    { threshold: 10000, rewardGold: 500, rewardMana: 500 },
    { threshold: 15000, rewardGold: 600, rewardMana: 600 },
    { threshold: 20000, rewardGold: 700, rewardMana: 700 },
    { threshold: 30000, rewardGold: 800, rewardMana: 800 },
    { threshold: 40000, rewardGold: 900, rewardMana: 900 },
    { threshold: 50000, rewardGold: 1000, rewardMana: 1000 },
    { threshold: 65000, rewardGold: 1100, rewardMana: 1100 },
    { threshold: 80000, rewardGold: 1200, rewardMana: 1200 },
    { threshold: 100000, rewardGold: 1300, rewardMana: 1300 },
    { threshold: 125000, rewardGold: 1400, rewardMana: 1400 },
    { threshold: 150000, rewardGold: 1500, rewardMana: 1500 }
  ]
}
```

#### Shop Achievement
```javascript
{
  id: "shop",
  icon: "🛒",
  nameKey: "achievement_shop",
  descriptionKey: "achievement_shop_desc",
  tracking: "character.totalItemsPurchased",
  tiers: [
    { threshold: 5, rewardGold: 100, rewardMana: 100 },
    { threshold: 10, rewardGold: 200, rewardMana: 200 },
    { threshold: 20, rewardGold: 300, rewardMana: 300 },
    { threshold: 30, rewardGold: 400, rewardMana: 400 },
    { threshold: 50, rewardGold: 500, rewardMana: 500 },
    { threshold: 75, rewardGold: 600, rewardMana: 600 },
    { threshold: 100, rewardGold: 700, rewardMana: 700 },
    { threshold: 125, rewardGold: 800, rewardMana: 800 },
    { threshold: 150, rewardGold: 900, rewardMana: 900 },
    { threshold: 200, rewardGold: 1000, rewardMana: 1000 },
    { threshold: 250, rewardGold: 1100, rewardMana: 1100 },
    { threshold: 300, rewardGold: 1200, rewardMana: 1200 },
    { threshold: 400, rewardGold: 1300, rewardMana: 1300 },
    { threshold: 500, rewardGold: 1400, rewardMana: 1400 },
    { threshold: 1000, rewardGold: 1500, rewardMana: 1500 }
  ]
}
```

#### Strength Achievement
```javascript
{
  id: "strength",
  icon: "💪",
  nameKey: "achievement_strength",
  descriptionKey: "achievement_strength_desc",
  tracking: "character.stats.kraft",
  tiers: [
    { threshold: 10, rewardGold: 100, rewardMana: 100 },
    { threshold: 13, rewardGold: 200, rewardMana: 200 },
    { threshold: 16, rewardGold: 300, rewardMana: 300 },
    { threshold: 19, rewardGold: 400, rewardMana: 400 },
    { threshold: 22, rewardGold: 500, rewardMana: 500 },
    { threshold: 25, rewardGold: 600, rewardMana: 600 },
    { threshold: 30, rewardGold: 700, rewardMana: 700 },
    { threshold: 35, rewardGold: 800, rewardMana: 800 },
    { threshold: 40, rewardGold: 900, rewardMana: 900 },
    { threshold: 45, rewardGold: 1000, rewardMana: 1000 },
    { threshold: 50, rewardGold: 1100, rewardMana: 1100 },
    { threshold: 55, rewardGold: 1200, rewardMana: 1200 },
    { threshold: 60, rewardGold: 1300, rewardMana: 1300 },
    { threshold: 65, rewardGold: 1400, rewardMana: 1400 },
    { threshold: 70, rewardGold: 1500, rewardMana: 1500 }
  ]
}
```

#### Streak Achievement
```javascript
{
  id: "streak",
  icon: "🏆",
  nameKey: "achievement_streak",
  descriptionKey: "achievement_streak_desc",
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

#### Focus Time Achievement
```javascript
{
  id: "focus_time",
  icon: "🧠",
  nameKey: "achievement_focus_time",
  descriptionKey: "achievement_focus_time_desc",
  tracking: "totalFocusMinutes",
  tiers: [
    { threshold: 60, rewardGold: 100, rewardMana: 100 },      // 1 Stunde
    { threshold: 300, rewardGold: 200, rewardMana: 200 },     // 5 Stunden
    { threshold: 600, rewardGold: 300, rewardMana: 300 },     // 10 Stunden
    { threshold: 1500, rewardGold: 400, rewardMana: 400 },     // 25 Stunden
    { threshold: 3000, rewardGold: 500, rewardMana: 500 },    // 50 Stunden
    { threshold: 6000, rewardGold: 600, rewardMana: 600 },    // 100 Stunden
    { threshold: 9000, rewardGold: 700, rewardMana: 700 },    // 150 Stunden
    { threshold: 12000, rewardGold: 800, rewardMana: 800 },   // 200 Stunden
    { threshold: 15000, rewardGold: 900, rewardMana: 900 },   // 250 Stunden
    { threshold: 20000, rewardGold: 1000, rewardMana: 1000 }, // 333 Stunden
    { threshold: 25000, rewardGold: 1100, rewardMana: 1100 }, // ~417 Stunden
    { threshold: 30000, rewardGold: 1200, rewardMana: 1200 }, // 500 Stunden
    { threshold: 40000, rewardGold: 1300, rewardMana: 1300 }, // ~667 Stunden
    { threshold: 50000, rewardGold: 1400, rewardMana: 1400 }, // ~833 Stunden
    { threshold: 60000, rewardGold: 1500, rewardMana: 1500 }  // 1000 Stunden
  ]
}
```

### Tracking Value Resolver
```javascript
function getTrackingValue(trackingPath) {
  // Pfad auflösen: "character.level" → character.level
  const parts = trackingPath.split('.');

  let value;
  switch (trackingPath) {
    case 'character.level':
      value = character.level;
      break;
    case 'character.totalQuestsCompleted':
      value = character.totalQuestsCompleted;
      break;
    case 'character.totalGoldEarned':
      value = character.totalGoldEarned;
      break;
    case 'character.totalItemsPurchased':
      value = character.totalItemsPurchased;
      break;
    case 'character.stats.kraft':
      value = character.stats.kraft;
      break;
    case 'streakData.streak':
      value = getStreakData().streak;
      break;
    case 'totalFocusMinutes':
      value = getTotalFocusMinutes();
      break;
    default:
      console.warn('Unknown tracking path:', trackingPath);
      value = 0;
  }

  return value;
}
```

### Progress Berechnung
```javascript
function getAchievementProgress(achievement) {
  const currentValue = getTrackingValue(achievement.tracking);
  const currentTier = character.achievements[achievement.id]?.tier || 0;
  const nextTierIndex = currentTier; // 0-basiert
  const nextTier = achievement.tiers[nextTierIndex];

  if (!nextTier) {
    return {
      currentTier: currentTier,
      currentValue: currentValue,
      nextThreshold: null,
      progressPercent: 100,
      isMaxTier: true
    };
  }

  const prevThreshold = nextTierIndex > 0
    ? achievement.tiers[nextTierIndex - 1].threshold
    : 0;

  const range = nextTier.threshold - prevThreshold;
  const progress = currentValue - prevThreshold;
  const progressPercent = Math.min(100, (progress / range) * 100);

  return {
    currentTier: currentTier,
    currentValue: currentValue,
    nextThreshold: nextTier.threshold,
    progressPercent: progressPercent,
    isMaxTier: false
  };
}
```

## UI Components

### Achievement Card
```html
<div class="achievement-card ${achievement.isClaimable ? 'claimable' : ''}"
     data-achievement-id="${achievement.id}">
  <div class="achievement-icon">${achievement.icon}</div>

  <div class="achievement-info">
    <h4>${t(achievement.nameKey)}</h4>
    <p>${t(achievement.descriptionKey)}</p>

    <div class="achievement-progress">
      <div class="progress-bar">
        <div class="progress-fill"
             style="width: ${progress.progressPercent}%"></div>
      </div>
      <span class="progress-text">
        ${progress.currentValue} / ${progress.nextThreshold || 'MAX'}
      </span>
    </div>

    <div class="achievement-tiers">
      <div class="tier-badge">
        Tier ${progress.currentTier + 1} / ${achievement.tiers.length}
      </div>
    </div>
  </div>

  ${achievement.isClaimable ?
    `<button class="claim-btn"
             onclick="claimAchievement('${achievement.id}')">
       ${t('achievement_claim')}
       <span class="rewards">
         +${currentTierReward.rewardGold}💰
         +${currentTierReward.rewardMana}⚡
       </span>
     </button>` :
    `<div class="achievement-status">
       ${progress.isMaxTier ?
         '🏆 MAX' :
         progress.currentValue >= progress.nextThreshold ?
           '✅' : '🔒'}
     </div>`
  }
</div>
```

## Testing Checkliste

- [ ] Alle Achievements haben gültige Tracking-Pfade
- [ ] Tier-Thresholds sind aufsteigend
- [ ] Rewards steigen mit Tier
- [ ] Progress-Berechnung ist korrekt
- [ ] Claim-Button erscheint bei claimable
- [ ] Max-Tier Handling funktioniert
- [ ] Translation Keys existieren
