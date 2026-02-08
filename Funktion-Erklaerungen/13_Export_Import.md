# Export/Import System - Funktions-Erklärung

## Übersicht
Das Export/Import System ermöglicht Spielern ihre gesamten Daten als JSON-Datei zu sichern und wiederherzustellen. Dies ist essentiell für Daten-Backups, Transfer zwischen Geräten und App-Resets.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/main.js` - Export/Import Funktionen
- `js/database.js` - DB Zugriffe

## Wichtige Punkte

### Export Struktur
```javascript
EXPORT_DATA_STRUCTURE = {
  version: "1.0",
  exportDate: "2026-02-08T10:00:00Z",
  appVersion: "8.2.2026",

  // IndexedDB Stores
  character: [],           // Character Store (single record)
  daily_quests: [],        // Daily Quests
  settings: [],            // Settings (single record)
  extra_quest: [],         // Extra Quest
  weight_entries: [],      // Weight Tracking
  vibe_state: {},          // Focus State
  focus_labels: [],        // Custom Labels
  dungeon_progress: {},    // Dungeon Progress
  tutorial_state: {},      // Tutorial State

  // LocalStorage
  streakData: {
    streak: 5,
    lastDate: "2026-02-07"
  }
};
```

### Export Funktion
```javascript
async function exportData() {
  try {
    // Initialize DB
    await DQ_DB.init();

    // Collect all data from IndexedDB
    const data = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      appVersion: APP_VERSION,

      // Character
      character: await DQ_DB.getAll('character'),

      // Daily Quests
      daily_quests: await DQ_DB.getAll('daily_quests'),

      // Settings
      settings: await DQ_DB.getAll('settings'),

      // Extra Quest
      extra_quest: await DQ_DB.getAll('extra_quest'),

      // Weight Entries
      weight_entries: await DQ_DB.getAll('weight_entries'),

      // Vibe State
      vibe_state: await DQ_DB.getAll('vibe_state'),

      // Focus Labels
      focus_labels: await DQ_DB.getAll('focus_labels'),

      // Dungeon Progress
      dungeon_progress: await DQ_DB.getAll('dungeon_progress'),

      // Tutorial State
      tutorial_state: await DQ_DB.getAll('tutorial_state'),

      // Streak from LocalStorage
      streakData: JSON.parse(localStorage.getItem('streakData') || '{}')
    };

    // Create JSON file
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Download file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyquest-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Cleanup
    showSuccess(t('export_success'));

  } catch (error) {
    console.error('Export failed:', error);
    showError(t('export_failed'));
  }
}
```

### Import Struktur Validierung
```javascript
function validateImportData(data) {
  const errors = [];

  // Check required fields
  if (!data.version) {
    errors.push('Missing version field');
  }

  if (!data.exportDate) {
    errors.push('Missing exportDate field');
  }

  // Check character
  if (!data.character || !Array.isArray(data.character)) {
    errors.push('Invalid or missing character data');
  } else if (data.character.length === 0) {
    errors.push('Character array is empty');
  }

  // Check character has required fields
  const character = data.character[0];
  if (!character.stats) {
    errors.push('Character missing stats');
  }
  if (!character.achievements) {
    errors.push('Character missing achievements');
  }

  // Check Streak Data
  if (data.streakData && typeof data.streakData.streak !== 'number') {
    errors.push('Invalid streakData');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Import Funktion
```javascript
async function importData(file) {
  try {
    // Read file
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate
    const validation = validateImportData(data);
    if (!validation.isValid) {
      showError(t('import_invalid') + ': ' + validation.errors.join(', '));
      return;
    }

    // Confirm overwrite
    if (!confirm(t('import_confirm'))) {
      return;
    }

    // Initialize DB
    await DQ_DB.init();

    // Clear existing data
    await clearAllStores();

    // Import data store by store
    await importCharacter(data.character);
    await importDailyQuests(data.daily_quests);
    await importSettings(data.settings);
    await importExtraQuest(data.extra_quest);
    await importWeightEntries(data.weight_entries);
    await importVibeState(data.vibe_state);
    await importFocusLabels(data.focus_labels);
    await importDungeonProgress(data.dungeon_progress);
    await importTutorialState(data.tutorial_state);

    // Restore Streak to LocalStorage
    if (data.streakData) {
      localStorage.setItem('streakData', JSON.stringify(data.streakData));
    }

    // Reload page
    showSuccess(t('import_success'));
    setTimeout(() => {
      location.reload();
    }, 1500);

  } catch (error) {
    console.error('Import failed:', error);
    showError(t('import_failed') + ': ' + error.message);
  }
}

async function clearAllStores() {
  const stores = [
    'character',
    'daily_quests',
    'settings',
    'extra_quest',
    'weight_entries',
    'vibe_state',
    'focus_labels',
    'dungeon_progress',
    'tutorial_state'
  ];

  for (const store of stores) {
    await DQ_DB.clear(store);
  }
}
```

### Store-by-Store Import
```javascript
async function importCharacter(characterData) {
  if (characterData && characterData.length > 0) {
    await DQ_DB.bulkPut('character', characterData);
  }
}

async function importDailyQuests(quests) {
  if (quests && Array.isArray(quests)) {
    await DQ_DB.bulkPut('daily_quests', quests);
  }
}

async function importSettings(settings) {
  if (settings && Array.isArray(settings)) {
    await DQ_DB.bulkPut('settings', settings);
  }
}

async function importExtraQuest(extraQuests) {
  if (extraQuests && Array.isArray(extraQuests)) {
    await DQ_DB.bulkPut('extra_quest', extraQuests);
  }
}

async function importWeightEntries(entries) {
  if (entries && Array.isArray(entries)) {
    await DQ_DB.bulkPut('weight_entries', entries);
  }
}

async function importVibeState(state) {
  if (state && typeof state === 'object') {
    // vibe_state uses key-value pairs
    for (const [key, value] of Object.entries(state)) {
      await DQ_DB.putSingle('vibe_state', { key, value });
    }
  }
}

async function importFocusLabels(labels) {
  if (labels && Array.isArray(labels)) {
    await DQ_DB.bulkPut('focus_labels', labels);
  }
}

async function importDungeonProgress(progress) {
  if (progress && typeof progress === 'object') {
    for (const [key, value] of Object.entries(progress)) {
      await DQ_DB.putSingle('dungeon_progress', { key, value });
    }
  }
}

async function importTutorialState(state) {
  if (state && typeof state === 'object') {
    for (const [key, value] of Object.entries(state)) {
      await DQ_DB.putSingle('tutorial_state', { key, value });
    }
  }
}
```

## Design Richtung

### Architektur
- **Client-Side Only**: Kein Server erforderlich
- **File Download**: Browser-File-Download API
- **File Upload**: Input type="file" mit JSON-Accept

### UI-Rendering
- Modal mit Export/Import Buttons
- Warnung vor Import (Daten werden überschrieben)
- Progress-Indikator bei großem Import

## Häufige Fehler

### 1. Circular Reference
**Fehler**: JSON.stringify fail bei zirkulären Referenzen
**Lösung**: Keine zirkulären Strukturen in DB-Objects

### 2. Large File Size
**Fehler**: Import dauert zu lange oder crashed
**Lösung**: Chunked Import bei sehr großen Datasets

### 3. Invalid JSON
**Fehler**: File ist kein valides JSON
**Lösung**: `try-catch` um JSON.parse

### 4. Version Mismatch
**Fehler**: Import von inkompatibler Backup-Version
**Lösung**: Version-Check vor Import

### 5. Streak nicht importiert
**Fehler**: Streak ist in LocalStorage, nicht in IndexedDB
**Lösung**: Extra Speicherung von Streak in Export

## UI Components

### Export/Import Modal
```html
<div class="data-management-modal">
  <h2>${t('data_management_title')}</h2>

  <div class="export-section">
    <h3>${t('export_title')}</h3>
    <p>${t('export_description')}</p>
    <button class="export-btn" onclick="exportData()">
      📥 ${t('export_button')}
    </button>
  </div>

  <div class="import-section">
    <h3>${t('import_title')}</h3>
    <p>${t('import_description')}</p>
    <input type="file"
           id="import-file"
           accept=".json"
           onchange="handleImportFile(this)" />
    <label for="import-file" class="import-label">
      📤 ${t('import_select_file')}
    </label>
    <p class="import-warning">⚠️ ${t('import_warning')}</p>
  </div>

  <div class="reset-section">
    <h3>${t('reset_title')}</h3>
    <p>${t('reset_description')}</p>
    <button class="reset-btn" onclick="confirmReset()">
      🗑️ ${t('reset_button')}
    </button>
  </div>
</div>
```

## Testing Checkliste

- [ ] Export erstellt korrekte JSON-Datei
- [ ] Export enthält alle Stores
- [ ] Export enthält LocalStorage Streak
- [ ] Dateiname enthält Datum
- [ ] Import validiert Daten-Struktur
- [ ] Import warnt vor Überschreibung
- [ ] Import löscht alte Daten
- [ ] Import stellt alle Stores wieder her
- [ ] Reload nach erfolgreichem Import
- [ ] Error-Handling bei ungültigen Dateien
- [ ] Version-Check funktioniert
- [ ] Große Dateien werden korrekt verarbeitet
