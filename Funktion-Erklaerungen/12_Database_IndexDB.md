# Database/IndexDB System - Funktions-Erklärung

## Übersicht
Das Database System verwaltet alle persistenten Daten von DailyQuest mittels IndexedDB. Es abstrahiert die native IndexedDB-API in ein Promise-basiertes Interface für einfacheren Gebrauch in der gesamten Anwendung.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/database.js` - Hauptmodul für IndexedDB
- `js/main.js` - DB Initialisierung

## Wichtige Punkte

### Database Konfiguration
```javascript
const DB_CONFIG = {
  name: 'VibeCodenDB',
  version: 27
};
```

### Alle Stores und KeyPaths
```javascript
DB_STORES = {
  character: {
    keyPath: 'id',
    data: { id: 1, ...characterData }
  },
  daily_quests: {
    keyPath: 'questId',
    autoIncrement: true,
    indexes: [{ name: 'date', keyPath: 'date' }]
  },
  exercises: {
    keyPath: 'id'
  },
  shop: {
    keyPath: 'id'
  },
  settings: {
    keyPath: 'id',
    data: { id: 1, language: 'de', theme: 'dark', ... }
  },
  extra_quest: {
    keyPath: 'id',
    data: { id: 1, ...extraQuestData }
  },
  weight_entries: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [{ name: 'date', keyPath: 'date' }]
  },
  vibe_state: {
    keyPath: 'key'
  },
  focus_labels: {
    keyPath: 'id',
    autoIncrement: true
  },
  dungeon_progress: {
    keyPath: 'key'
  },
  tutorial_state: {
    keyPath: 'key'
  },
  tutorial_dynamic_state: {
    keyPath: 'key'
  }
};
```

### Promise-Based API
```javascript
class DailyQuestDB {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.handleUpgrade(event.target.result);
      };
    });
  }

  handleUpgrade(db) {
    // Create all stores with proper schema
    for (const [storeName, config] of Object.entries(DB_STORES)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, {
          keyPath: config.keyPath,
          autoIncrement: config.autoIncrement || false
        });

        // Create indexes
        if (config.indexes) {
          for (const index of config.indexes) {
            store.createIndex(index.name, index.keyPath, { unique: false });
          }
        }
      }
    }
  }
}
```

### CRUD Operationen
```javascript
// Single Record Operations
async getSingle(storeName, key) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async putSingle(storeName, value) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async delete(storeName, key) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// All Records
async getAll(storeName) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Index-Based Queries
async getByIndex(storeName, indexName, value) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store Management
async clearStore(storeName) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async add(storeName, value) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

### Helper Functions
```javascript
// Bulk Operations
async bulkPut(storeName, items) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    for (const item of items) {
      store.put(item);
    }
  });
}

// Count Records
async count(storeName) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get First Record
async getFirst(storeName) {
  const db = await this.init();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}
```

## Design Richtung

### Architektur
- **Promise-Based**: Alle Operationen geben Promises zurück
- **Singleton**: Eine DB-Instanz für die gesamte App
- **Auto-Init**: DB wird beim ersten Zugriff automatisch initialisiert
- **Schema Migration**: `onupgradeneeded` für Schema-Änderungen

### Error Handling
```javascript
async function safeDBOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    console.error('DB Operation failed:', error);
    // Fallback oder User-Notification
    showError(t('database_error'));
    throw error;
  }
}
```

## Häufige Fehler

### 1. Transaction Race Conditions
**Fehler**: Schreib-Operation während noch Read läuft
**Lösung**: Transaktionen sind isoliert, aber bei vielen parallelen Writes Queue verwenden

### 2. KeyPath Mismatch
**Fehler**: Value hat anderes KeyPath als erwartet
**Lösung**: `validateObject()` vor jedem Put

### 3. AutoIncrement Keys
**Fehler**: AutoIncrement wird bei Put nicht verwendet
**Lösung**: Bei AutoIncrement KeyPath aus Value entfernen oder undefined lassen

### 4. Index Query Returns Empty
**Fehler**: Index Query findet nichts obwohl Daten existieren
**Lösung**: Prüfe ob Index-Name korrekt und Daten indiziert

### 5. DB Version Mismatch
**Fehler**: Alte DB-Version nach Update
**Lösung**: `onupgradeneeded` korrekt implementieren

## Wichtige Funktionen

### database.js
```javascript
const DQ_DB = {
  db: null,
  isInitialized: false,

  async init() { ... },                       // DB öffnen
  getDB() { ... },                            // DB Referenz

  // CRUD
  async get(store, key) { ... },
  async getSingle(store, key) { ... },
  async put(store, value) { ... },
  async putSingle(store, value) { ... },
  async add(store, value) { ... },
  async delete(store, key) { ... },
  async clear(store) { ... },

  // Queries
  async getAll(store) { ... },
  async getByIndex(store, index, value) { ... },
  async count(store) { ... },

  // Bulk
  async bulkPut(store, items) { ... },
  async bulkAdd(store, items) { ... },

  // Utils
  async getFirst(store) { ... },
  async exists(store, key) { ... },

  // Migration
  handleUpgrade(db) { ... },

  // Debug
  async dump(store) { ... },
  async getAllStores() { ... }
};
```

## Testing Checkliste

- [ ] DB öffnet sich ohne Fehler
- [ ] Alle Stores werden korrekt erstellt
- [ ] Single Record CRUD funktioniert
- [ ] AutoIncrement Keys werden korrekt generiert
- [ ] Index-Based Queries funktionieren
- [ ] Bulk Operations funktionieren
- [ ] Clear Store funktioniert
- [ ] Error Handling fängt Exceptions
- [ ] Export/Import nutzt korrekte DB-Methoden
- [ ] Performance ist akzeptabel
- [ ] Connection Pooling (nicht nötig bei IndexedDB)
