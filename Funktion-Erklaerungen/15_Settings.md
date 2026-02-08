# Settings System - Funktions-Erklärung

## Übersicht
Das Settings System verwaltet alle Benutzer-Einstellungen wie Sprache, Theme, Schwierigkeit und Trainings-Ziele. Einstellungen werden in IndexedDB persistiert und sind schnell abrufbar.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/main.js` - Settings Initialisierung
- `js/ui.js` - UI Settings-Integration
- `js/database.js` - IndexedDB Zugriffe

### Verbundene Module
- `data/translations.js` - Sprach-Texte
- `js/page_exercises.js` - Quest-Generation

## Wichtige Punkte

### Settings Struktur
```javascript
{
  id: 1,                        // Immer 1 (Single Record)
  language: 'de',               // 'de' oder 'en'
  theme: 'dark',               // 'dark' oder 'light'
  difficulty: 3,              // 1-5 Skala
  goal: 'muscle',             // Trainings-Kategorie
  restDays: 2,                 // Ruhetage pro Woche (0-7)
  notifications: {
    questReminder: true,      // Quest-Erinnerung
    dailyReset: true,         // Tageswechsel-Benachrichtigung
    achievements: true,      // Achievement-Benachrichtigungen
    dungeonSpawn: true       // Dungeon-Spawn-Benachrichtigung
  },
  timer: {
    defaultMode: 'pomodoro',  // 'pomodoro' oder 'stopwatch'
    pomodoroDuration: 25,     // Minuten
    shortBreak: 5,            // Minuten
    longBreak: 15,           // Minuten
    autoStartBreaks: false
  },
  display: {
    showAnimations: true,
    compactMode: false,
    largeText: false
  }
}
```

### Settings Store
```javascript
// In database.js
{
  storeName: 'settings',
  keyPath: 'id',
  value: { id: 1, ...settingsObject }
}
```

### Default Settings
```javascript
DEFAULT_SETTINGS = {
  id: 1,
  language: 'de',
  theme: 'dark',
  difficulty: 3,
  goal: 'muscle',
  restDays: 2,
  notifications: {
    questReminder: true,
    dailyReset: true,
    achievements: true,
    dungeonSpawn: true
  },
  timer: {
    defaultMode: 'pomodoro',
    pomodoroDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false
  },
  display: {
    showAnimations: true,
    compactMode: false,
    largeText: false
  }
};
```

### Settings Zugriff
```javascript
async function getSettings() {
  const settings = await DQ_DB.getSingle('settings', 1);
  if (settings) {
    return settings;
  }
  // Return defaults if not set
  return { ...DEFAULT_SETTINGS };
}

async function updateSettings(newSettings) {
  const current = await getSettings();
  const merged = { ...current, ...newSettings };
  await DQ_DB.putSingle('settings', merged);

  // Apply settings immediately
  applySettings(merged);

  return merged;
}
```

### Apply Settings
```javascript
function applySettings(settings) {
  // Theme
  document.documentElement.setAttribute('data-theme', settings.theme);

  // Language
  window.currentLanguage = settings.language;

  // Animations
  if (!settings.display.showAnimations) {
    document.body.classList.add('no-animations');
  } else {
    document.body.classList.remove('no-animations');
  }

  // Compact Mode
  if (settings.display.compactMode) {
    document.body.classList.add('compact-mode');
  } else {
    document.body.classList.remove('compact-mode');
  }

  // Large Text
  if (settings.display.largeText) {
    document.body.classList.add('large-text');
  } else {
    document.body.classList.remove('large-text');
  }
}
```

### Difficulty Auswirkungen
```javascript
// Quest Generation basierend auf Difficulty
function getDifficultyMultiplier(difficulty) {
  const multipliers = {
    1: { mana: 1.0, gold: 1.0, stat: 5.5 },
    2: { mana: 1.2, gold: 1.15, stat: 5.0 },
    3: { mana: 1.4, gold: 1.3, stat: 4.5 },
    4: { mana: 1.6, gold: 1.45, stat: 4.0 },
    5: { mana: 1.8, gold: 1.6, stat: 3.5 }
  };
  return multipliers[difficulty];
}

function generateQuestsForDifficulty(difficulty) {
  const multiplier = getDifficultyMultiplier(difficulty);

  return exercises.map(exercise => ({
    ...exercise,
    target: Math.round(exercise.baseTarget * difficulty),
    manaReward: Math.round(exercise.baseMana * multiplier.mana),
    goldReward: Math.round(exercise.baseGold * multiplier.gold)
  }));
}
```

## Design Richtung

### Architektur
- **Single Record**: Settings nutzen `id: 1`
- **Auto-Apply**: Settings werden sofort nach Update angewendet
- **Validation**: Settings-Werte werden validiert

### UI-Rendering
- Formular mit verschiedenen Sektionen
- Toggle-Switches für Boolean-Werte
- Slider für Difficulty (1-5)

## IndexDB Speicherung

### Store: `settings`
```javascript
{
  storeName: 'settings',
  keyPath: 'id',
  value: { id: 1, ...settings }
}
```

## Export/Import

### Export Struktur
```json
{
  "settings": [
    {
      "id": 1,
      "language": "de",
      "theme": "dark",
      "difficulty": 3,
      "goal": "muscle",
      "restDays": 2,
      "notifications": { ... },
      "timer": { ... },
      "display": { ... }
    }
  ]
}
```

## Häufige Fehler

### 1. Settings nicht angewendet
**Fehler**: Theme ändert sich nicht
**Lösung**: `applySettings()` nach Update aufrufen

### 2. Invalid Difficulty Range
**Fehler**: Difficulty außerhalb 1-5
**Lösung**: `Math.max(1, Math.min(5, difficulty))`

### 3. Language nicht geladen
**Fehler**: Übersetzungen fehlen
**Lösung**: `window.currentLanguage` nach Settings-Update setzen

### 4. Old Settings Structure
**Fehler**: Import von alten Settings-Versionen
**Lösung**: Merge mit Default-Settings

## UI Components

### Settings Modal
```html
<div class="settings-modal">
  <h2>${t('settings_title')}</h2>

  <div class="settings-section">
    <h3>${t('settings_general')}</h3>

    <div class="setting-row">
      <label>${t('settings_language')}</label>
      <select onchange="updateSetting('language', this.value)">
        <option value="de" ${settings.language === 'de' ? 'selected' : ''}>
          Deutsch
        </option>
        <option value="en" ${settings.language === 'en' ? 'selected' : ''}>
          English
        </option>
      </select>
    </div>

    <div class="setting-row">
      <label>${t('settings_theme')}</label>
      <select onchange="updateSetting('theme', this.value)">
        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>
          🌙 ${t('theme_dark')}
        </option>
        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>
          ☀️ ${t('theme_light')}
        </option>
      </select>
    </div>
  </div>

  <div class="settings-section">
    <h3>${t('settings_gameplay')}</h3>

    <div class="setting-row">
      <label>${t('settings_difficulty')}</label>
      <div class="difficulty-slider">
        <input type="range"
               min="1" max="5"
               value="${settings.difficulty}"
               oninput="updateDifficulty(this.value)" />
        <span class="difficulty-value">${settings.difficulty}</span>
      </div>
    </div>

    <div class="setting-row">
      <label>${t('settings_goal')}</label>
      <select onchange="updateSetting('goal', this.value)">
        <option value="muscle" ${settings.goal === 'muscle' ? 'selected' : ''}>
          💪 ${t('goal_muscle')}
        </option>
        <option value="endurance" ${settings.goal === 'endurance' ? 'selected' : ''}>
          🏃 ${t('goal_endurance')}
        </option>
        <option value="fatloss" ${settings.goal === 'fatloss' ? 'selected' : ''}>
          🔥 ${t('goal_fatloss')}
        </option>
        <option value="restday" ${settings.goal === 'restday' ? 'selected' : ''}>
          🧘 ${t('goal_restday')}
        </option>
      </select>
    </div>

    <div class="setting-row">
      <label>${t('settings_rest_days')}</label>
      <select onchange="updateSetting('restDays', parseInt(this.value))">
        ${[0,1,2,3].map(d => `
          <option value="${d}"
                  ${settings.restDays === d ? 'selected' : ''}>
            ${d} ${d === 1 ? 'Tag' : 'Tage'}
          </option>
        `).join('')}
      </select>
    </div>
  </div>

  <div class="settings-section">
    <h3>${t('settings_notifications')}</h3>

    ${Object.entries(settings.notifications).map(([key, value]) => `
      <div class="setting-row toggle">
        <label>${t(`settings_notif_${key}`)}</label>
        <label class="switch">
          <input type="checkbox"
                 ${value ? 'checked' : ''}
                 onchange="updateNestedSetting('notifications', '${key}', this.checked)" />
          <span class="slider"></span>
        </label>
      </div>
    `).join('')}
  </div>

  <button class="save-btn" onclick="closeSettings()">
    ${t('settings_save')}
  </button>
</div>
```

## Testing Checkliste

- [ ] Settings werden bei erstem Start erstellt
- [ ] Language-Änderung lädt neue Übersetzungen
- [ ] Theme-Änderung aktualisiert UI
- [ ] Difficulty-Änderung beeinflusst Quest-Generation
- [ ] Goal-Änderung ändert Quest-Kategorie
- [ ] Rest-Days werden bei Quest-Generation berücksichtigt
- [ ] Notifications-Toggles funktionieren
- [ ] Export enthält Settings
- [ ] Import stellt Settings wieder her
- [ ] Settings werden sofort angewendet
