# Translations System - Funktions-Erklärung

## Übersicht
Das Translations System bietet Mehrsprachen-Unterstützung für die gesamte DailyQuest UI. Alle textuellen Inhalte werden über Translation Keys referenziert, die zur Laufzeit in die gewählte Sprache übersetzt werden.

## Relevante Dateien und Ordner

### Hauptdateien
- `data/translations.js` - Übersetzungs-Dateien
- `js/ui.js` - Translation Helper

## Wichtige Punkte

### Translation Struktur
```javascript
const TRANSLATIONS = {
  de: {
    // UI Elements
    app_title: "DailyQuest",
    nav_quests: "Quests",
    nav_character: "Charakter",
    nav_shop: "Shop",
    nav_achievements: "Erfolge",

    // Common
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    close: "Schließen",
    confirm: "Bestätigen",
    yes: "Ja",
    no: "Nein",
    loading: "Laden...",
    error: "Fehler",
    success: "Erfolg",

    // Character
    character_level: "Level {level}",
    character_mana: "Mana: {current}/{max}",
    character_gold: "Gold: {gold}",

    // Stats
    stat_kraft: "Kraft",
    stat_ausdauer: "Ausdauer",
    stat_beweglichkeit: "Beweglichkeit",
    stat_durchhaltevermoegen: "Durchhaltevermögen",
    stat_willenskraft: "Willenskraft",

    // Labels
    label_kraftprotz: "Kraftprotz",
    label_marathoner: "Marathoner",
    label_akrobat: "Akrobat",
    label_stoiker: "Stoiker",
    label_eiserner_wille: "Eiserner Wille",

    // Quests
    quest_daily: "Tägliche Quests",
    quest_extra: "Extra Quest",
    quest_complete: "Abschließen",
    quest_completed: "Erledigt",

    // Shop
    shop_buy: "Kaufen",
    shop_sell: "Verkaufen",
    shop_equip: "Ausrüsten",
    shop_unequip: "Ablegen",

    // Achievements
    achievement_level: "Level-Meilenstein",
    achievement_quests: "Quest-Meilenstein",
    achievement_gold: "Gold-Meilenstein",
    achievement_streak: "Streak-Meilenstein",

    // Settings
    settings_title: "Einstellungen",
    settings_language: "Sprache",
    settings_theme: "Design",
    settings_difficulty: "Schwierigkeit",

    // Errors
    error_generic: "Ein Fehler ist aufgetreten",
    error_not_enough_gold: "Nicht genug Gold",
    error_database: "Datenbank-Fehler",

    // Notifications
    notification_level_up: "Levelaufstieg!",
    notification_streak: "Streak erhöht!"
  },

  en: {
    app_title: "DailyQuest",
    nav_quests: "Quests",
    nav_character: "Character",
    nav_shop: "Shop",
    nav_achievements: "Achievements",

    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    loading: "Loading...",
    error: "Error",
    success: "Success",

    character_level: "Level {level}",
    character_mana: "Mana: {current}/{max}",
    character_gold: "Gold: {gold}",

    stat_kraft: "Strength",
    stat_ausdauer: "Endurance",
    stat_beweglichkeit: "Agility",
    stat_durchhaltevermoegen: "Stamina",
    stat_willenskraft: "Willpower",

    label_kraftprotz: "Powerhouse",
    label_marathoner: "Marathoner",
    label_akrobat: "Acrobat",
    label_stoiker: "Stoic",
    label_eiserner_wille: "Iron Will",

    quest_daily: "Daily Quests",
    quest_extra: "Extra Quest",
    quest_complete: "Complete",
    quest_completed: "Completed",

    shop_buy: "Buy",
    shop_sell: "Sell",
    shop_equip: "Equip",
    shop_unequip: "Unequip",

    achievement_level: "Level Milestone",
    achievement_quests: "Quest Milestone",
    achievement_gold: "Gold Milestone",
    achievement_streak: "Streak Milestone",

    settings_title: "Settings",
    settings_language: "Language",
    settings_theme: "Theme",
    settings_difficulty: "Difficulty",

    error_generic: "An error occurred",
    error_not_enough_gold: "Not enough gold",
    error_database: "Database error",

    notification_level_up: "Level Up!",
    notification_streak: "Streak increased!"
  }
};
```

### Translation Helper Funktion
```javascript
const $t = (key, params = {}) => {
  const lang = window.currentLanguage || 'de';
  const translations = TRANSLATIONS[lang] || TRANSLATIONS.de;

  let text = translations[key] || key;

  // Replace placeholders
  if (params) {
    for (const [placeholder, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${placeholder}}`, 'g'), value);
    }
  }

  return text;
};

// Usage examples
$t('character_level', { level: 5 });
// Output (de): "Level 5"
// Output (en): "Level 5"

$t('character_mana', { current: 75, max: 100 });
// Output (de): "Mana: 75/100"
```

### Dynamic Translation Keys
```javascript
// Für Items, Übungen, etc. werden Keys generiert
const getItemTranslationKey = (itemId) => `item_${itemId}`;
const getExerciseTranslationKey = (exerciseId) => `exercise_${exerciseId}`;
const getMonsterTranslationKey = (monsterId) => `monster_${monsterId}`;
const getAchievementTranslationKey = (achievementId) => `achievement_${achievementId}`;

// In translations.js
{
  // Auto-generierte Keys für Items
  item_iron_sword: "Eisenschwert",
  item_steel_sword: "Stahlschwert",

  // Auto-generierte Keys für Übungen
  exercise_bicep_curls: "Bizeps-Curls",
  exercise_pushups: "Liegestütze",
  exercise_running: "Laufen",

  // Auto-generierte Keys für Monster
  monster_wolf: "Schattenwolf",
  monster_bear: "Höhlenbär"
}
```

### Language Detection
```javascript
function detectLanguage() {
  // 1. Check URL parameter
  const urlLang = new URLSearchParams(window.location.search)
    .get('lang');
  if (urlLang && ['de', 'en'].includes(urlLang)) {
    return urlLang;
  }

  // 2. Check localStorage preference
  const storedLang = localStorage.getItem('language');
  if (storedLang) {
    return storedLang;
  }

  // 3. Check browser language
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('de')) {
    return 'de';
  }
  if (browserLang.startsWith('en')) {
    return 'en';
  }

  // 4. Default
  return 'de';
}

function setLanguage(lang) {
  window.currentLanguage = lang;
  localStorage.setItem('language', lang);
  document.documentElement.setAttribute('lang', lang);
  renderUI();
}
```

### Dynamic Content Translation
```javascript
// Für Listen und dynamische Inhalte
const translateList = (keys, lang) => {
  const translations = TRANSLATIONS[lang] || TRANSLATIONS.de;
  return keys.map(key => translations[key] || key);
};

// Für UI-Updates nach Language-Change
function updateAllTranslations() {
  // Alle Elemente mit data-i18n aktualisieren
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = $t(key);
  });

  // Elemente mit data-i18n-attr für Attribute
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const attr = el.getAttribute('data-i18n-attr');
    const [attrName, key] = attr.split(':');
    el.setAttribute(attrName, $t(key));
  });
}
```

### HTML Usage
```html
<!-- Direkte Keys -->
<h1 data-i18n="app_title">DailyQuest</h1>
<button data-i18n="save">Speichern</button>

<!-- Mit Placeholders (via JavaScript) -->
<span data-i18n="character_level"
      data-params='{"level": 5}'></span>

<!-- Title/Placeholder Attributes -->
<input type="text"
       data-i18n-attr="placeholder:input_placeholder"
       placeholder="Text eingeben..." />

<!-- Dynamic Translations -->
<div class="notification">
  ${$t('notification_streak')}
</div>
```

## Design Richtung

### Architektur
- **Static Dictionary**: Alle Übersetzungen in einer zentralen Datei
- **Fallback**: Deutsch als Default, fehlende Keys zeigen Key-Namen
- **Lazy Loading**: Languages werden bei Bedarf geladen (optional)

### Naming Conventions
```
{i18n_key} = "Deutsche Übersetzung"

Naming Pattern:
- UI Elements: {section}_{element}
  - nav_quests
  - button_save
  - error_generic

- Items: item_{item_id}
  - item_iron_sword
  - item_healing_potion

- Exercises: exercise_{exercise_id}
  - exercise_bicep_curls
  - exercise_running

- Achievements: achievement_{achievement_id}
  - achievement_level
  - achievement_streak

- Error/Status: {context}_{status}
  - quest_completed
  - dungeon_victory
```

## Testing Checkliste

- [ ] Alle UI-Elemente haben Translation Keys
- [ ] Deutsch ist vollständig übersetzt
- [ ] Englisch ist vollständig übersetzt
- [ ] Fallback funktioniert bei fehlenden Keys
- [ ] Parameter-Ersetzung funktioniert
- [ ] Language-Change aktualisiert UI
- [ ] Browser-Language-Detection funktioniert
- [ ] localStorage Preference wird gespeichert
- [ ] Dynamic Content wird übersetzt
