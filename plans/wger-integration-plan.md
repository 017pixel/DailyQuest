# Plan: wger-Datenbank-Integration in DailyQuest

## Übersicht

Ersetze die lokale Übungssammlung (`DQ_DATA.exercisePool`, ~50 Übungen) durch die öffentliche wger-REST-API (~818 Übungen). Sportliche Übungen kommen aus wger, Nicht-Sport-Übungen (Lernen, Fokus, Erholung, Rest Days, Krank) bleiben lokal.

---

## 1. wger API & Datenmodell

### API-Endpunkte (alle kostenlos, kein API-Key)

| Endpunkt | Beschreibung | Details |
|----------|-------------|---------|
| `GET /api/v2/exerciseinfo/` | **Alle Übungen** (818) | category, muscles, equipment, images, translations (DE/EN), videos |
| `GET /api/v2/exercisecategory/` | 8 Kategorien | Abs, Arms, Back, Calves, Cardio, Chest, Legs, Shoulders |
| `GET /api/v2/muscle/` | 15 Muskeln | SVG-Diagramme (front/back), deutsche + englische Namen |
| `GET /api/v2/equipment/` | 11 Geräte | Barbell, Dumbbell, Bodyweight, etc. |
| `GET /api/v2/exerciseimage/` | 360 Bilder | Thumbnails 200x200 + 400x400 |
| `GET /api/v2/language/` | 30 Sprachen | DE = 1, EN = 2 |

### Datenstruktur einer Übung (exerciseinfo)

```json
{
  "id": 1962,
  "category": { "id": 15, "name": "Cardio" },
  "muscles": [{ "id": 10, "name_en": "Quads", "is_front": true, "image_url_main": "…" }],
  "muscles_secondary": [{ "id": 2, "name_en": "Shoulders", … }],
  "equipment": [{ "id": 7, "name": "none (bodyweight exercise)" }],
  "images": [{ "image": "…png", "thumbnails": { "small": "…200x200…", "medium": "…400x400…" }, "is_main": true }],
  "translations": [
    { "language": 1, "name": "Step Jack", "description": "<p>Anleitung…</p>" },
    { "language": 2, "name": "Step Jack", "description": "<p>Instructions…</p>" }
  ],
  "variation_group": "uuid-…",
  "videos": []
}
```

### API-Pagination (wger limitiert evtl. Response-Size)

Die wger-API unterstützt vermutlich **nicht** `?limit=818` (Default-Limit ist oft 20, Max-Limit ist 100-200). Stattdessen:

- **Chunked Import:** In Batches a 100 (oder dem maximal unterstützten Limit) paginieren
- `GET /api/v2/exerciseinfo/?limit=100&offset=0` → dann offset=100, 200, ... bis alle 818 geladen
- Alle Requests parallel oder nacheinander — da sie im Hintergrund laufen, ist das egal
- Nur beim Erstimport + wöchentlichem Sync nötig

### Type-Override-Liste (für Spezialfälle)

Manche Übungen werden in der falschen Kategorie-Default erwischt (z.B. Russian Twists in Abs = reps, sind aber time). Daher eine kurze manuelle Override-Liste:

```js
const TYPE_OVERRIDES = {
  // Exercise nameEn → type override
  "Plank": "time",
  "Wall Sit": "time",
  "Side Plank": "time",
  "Mountain Climbers": "time",
  "Flutter Kicks": "time",
  "Russian Twist": "time",
  "Dead Bug": "time",
  "Bird Dog": "time",
  "Glute Bridge": "time",
  "Superman Hold": "time",
  "L-Sit Hold": "time",
  "Wall Angel": "time",
  "Hollow Body Hold": "time",
  "Dumbbell Pullover": "reps",
  "Burpee": "reps",          // Burpees sind reps, obwohl Cardio
};
```

Diese Liste wird beim Import angewandt: Wenn `exercise.nameEn` im Override existiert, wird dieser type verwendet statt des Kategorie-Defaults. Nach dem Import kann die Liste bei Bedarf erweitert werden.

### Wichtige Einschränkungen

- **Keine baseValues** (Wiederholungszahlen/Zeiten) — werden lokal via Defaults pro Kategorie ergänzt
- **Kein type** (reps/time/check) — wird via Defaults pro Kategorie gesetzt, Cardio = time, Rest = reps
- **Keine Difficulty** — wird durch DailyQuests eigenes 1-5 System abgedeckt
- **Keine Mana/Gold/StatPoints** — werden lokal berechnet wie bisher
- **Keine Kategorien für Lernen/Fokus/Restday** — bleiben in lokaler Custom-DB
- **Keine `timerDuration` für Fokus-Übungen** — existiert nur in lokalen Custom-Übungen
- **Keine `directStatGain`** — existiert nur in lokalen Custom-Übungen

### Fallback-Übungen (10 hartcodierte Basis-Übungen für Notfälle)

Falls wger.de beim **ersten Start** nicht erreichbar ist (kein Internet), braucht die App ein minimales Set, damit sie nutzbar bleibt:

```js
const FALLBACK_EXERCISES = [
  { id: -1, nameDe: "Liegestütze", nameEn: "Push-Ups", type: "reps", baseValue: 10, category: "Chest", mana: 20, gold: 6 },
  { id: -2, nameDe: "Kniebeugen", nameEn: "Squats", type: "reps", baseValue: 15, category: "Legs", mana: 18, gold: 5 },
  { id: -3, nameDe: "Plank", nameEn: "Plank", type: "time", baseValue: 30, category: "Abs", mana: 22, gold: 7 },
  { id: -4, nameDe: "Ausfallschritte", nameEn: "Lunges", type: "reps", baseValue: 12, category: "Legs", mana: 18, gold: 5 },
  { id: -5, nameDe: "Hampelmänner", nameEn: "Jumping Jacks", type: "time", baseValue: 30, category: "Cardio", mana: 20, gold: 6 },
  { id: -6, nameDe: "Dips (Stuhl)", nameEn: "Tricep Dips", type: "reps", baseValue: 10, category: "Arms", mana: 20, gold: 6 },
  { id: -7, nameDe: "Bergsteiger", nameEn: "Mountain Climbers", type: "time", baseValue: 30, category: "Cardio", mana: 25, gold: 8 },
  { id: -8, nameDe: "Bizeps-Curls", nameEn: "Bicep Curls", type: "reps", baseValue: 10, category: "Arms", mana: 20, gold: 6, needsEquipment: true },
  { id: -9, nameDe: "Rudern (Hantel)", nameEn: "Dumbbell Rows", type: "reps", baseValue: 8, category: "Back", mana: 22, gold: 7, needsEquipment: true },
  { id: -10, nameDe: "Schulterdrücken", nameEn: "Shoulder Press", type: "reps", baseValue: 8, category: "Shoulders", mana: 22, gold: 7, needsEquipment: true },
];
```

Diese werden nur genutzt wenn `wger_exercises` Store leer ist **und** kein Internet besteht. Sobald der Import später gelingt, werden sie ersetzt.

### API-Response-Größe & Sprache

Die wger-API hat **keinen zuverlässigen Language-Filter** für den `exerciseinfo`-Endpoint. Jede Übung kommt mit **allen** verfügbaren Übersetzungen (DE + EN + FR + ES + NL + IT + ...). Der Payload für 818 Übungen kann dadurch **~1-2 MB** groß werden.

**Lösung:** Trotzdem in einem Request laden, da:
- Nur einmal pro Woche (Sync) oder einmalig (Erstimport)
- ~1-2 MB sind bei heutigen Verbindungen vernachlässigbar
- Im Client werden nur DE + EN behalten, restliche Übersetzungen verworfen
- Bei `?limit=818` prüfen ob der Server das supported — falls nicht, auf 3 Chunks a 300 aufteilen

### CC-BY-SA 4.0 Lizenz-Attribution

Die wger-Übungsdaten sind unter **CC-BY-SA 4.0** lizenziert. Jede Übung enthält ein `license`- und `license_author`-Feld. DailyQuest muss dies anerkennen:
- In den Einstellungen > Über: "Übungsdaten von wger.de (CC-BY-SA 4.0)" Link
- Optional: Im Info-Popup ganz unten klein "Daten: wger.de (CC-BY-SA 4.0)"

---

## 2. Lokales Datenmodell (IndexedDB)

### Neuer Store: `wger_exercises`

```js
{
  // Von wger
  wgerId: 1962,                    // wger exerciseinfo.id
  uuid: "…",                       // wger UUID
  category: "Cardio",              // wger category.name
  categoryId: 15,                  // wger category.id
  muscles: [10],                   // primary muscle ids
  musclesSecondary: [2, 8, 14, 6], // secondary muscle ids
  equipment: [7],                  // equipment ids
  hasImage: true,                  // ob mind. ein Bild existiert
  imageUrl: "https://…png",       // main image URL
  imageThumbSm: "https://…200x200…",
  imageThumbMd: "https://…400x400…",
  
  // Lokal ergänzt
  nameDe: "Step Jack",            // aus translation.language=1
  nameEn: "Step Jack",            // aus translation.language=2
  descriptionDe: "<p>Anleitung…</p>",
  descriptionEn: "<p>Instructions…</p>",
  type: "reps",                    // aus Default-Tabelle: "reps" | "time"
  baseValue: 10,                   // aus Default-Tabelle
  manaReward: 20,                  // basierend auf baseValue + category
  goldReward: 6,                   // basierend auf baseValue + category
  statPoints: { kraft: 1 },        // basierend auf category
  
  // Metadaten
  importedAt: "2026-07-04T…",      // Zeitstempel des Imports
  lastUpdated: "2026-06-19T…"      // wger last_update_global
}
```

### Bestehende Stores bleiben

| Store | Inhalt |
|-------|--------|
| `wger_exercises` (NEU) | 818 importierte Sport-Übungen |
| `exercises` | **Nur noch** Nicht-Sport: Fokus, Lernen, Restday, Krank, Senior |
| `daily_quests` | Unverändert (tägliche Quests) |
| `character` | Unverändert |
| `custom_plans` | Unverändert (Custom-Pläne referenzieren jetzt wger_exercises) |
| `custom_user_exercises` | **ENTFERNT** |

### Default-baseValues pro wger-Kategorie

| wger Category | type | baseValue | Mana/Gold-Faktor | StatPoints |
|--------------|------|-----------|------------------|------------|
| Abs | reps | 15 | 20 mana, 6 gold | durchhaltevermoegen: 1 |
| Arms | reps | 10 | 20 mana, 6 gold | kraft: 1 |
| Back | reps | 8 | 25 mana, 8 gold | kraft: 1.5 |
| Calves | reps | 15 | 15 mana, 5 gold | ausdauer: 0.5 |
| Cardio | time | 30 | 25 mana, 8 gold | ausdauer: 1 |
| Chest | reps | 10 | 22 mana, 7 gold | kraft: 1 |
| Legs | reps | 10 | 20 mana, 6 gold | kraft: 0.5 |
| Shoulders | reps | 10 | 20 mana, 6 gold | kraft: 0.5 |

Die Difficulty-Skalierung bleibt: `baseValue × (1 + 0.4 × (difficulty - 1))`

---

## 3. Import & Sync

### Beim ersten Start (oder wenn keine wger-Übungen in DB)

1. `fetch('https://wger.de/api/v2/exerciseinfo/?limit=818')` aufrufen
2. Jede Übung mit lokalen Defaults anreichern (type, baseValue, mana, gold, statPoints)
3. DE + EN translations parsen und in `nameDe`/`nameEn`/`descriptionDe`/`descriptionEn` speichern
4. images-Array checken: `hasImage = images.length > 0 && images.some(i => i.is_main)`, erste main-URL speichern
5. Alle angereicherten Übungen in `wger_exercises` Store schreiben

### Background-Import (unsichtbar für den User)

Der gesamte Import muss **vollständig unsichtbar** ablaufen:

1. **App-Start-Check:** `main.js` prüft beim Start: Existiert `wger_exercises` Store? → Ja: alles gut, normal starten. Nein: Flag `wgerImportPending = true` setzen, App normal starten
2. **Verzögerter Import:** 2 Sekunden nach App-Start (nachdem UI fertig gerendert ist) wird `wger-import.js` im Hintergrund gestartet
3. **Chunked Loading:** 818 Übungen + 360 Bilder-URLs sind als JSON ~200-300KB. Aufteilung in 3 parallele Requests (`?limit=300&offset=0`, `?limit=300&offset=300`, `?limit=218&offset=600`) um Timeout-Risiko zu minimieren
4. **Kein UI-Freeze:** Während des Imports läuft alles normal — User kann trainieren, Quests machen, ohne etwas zu merken
5. **Progress-Indikator:** Falls Import länger als 3 Sekunden dauert → kleines, dezentes Toast "Übungsdatenbank wird aktualisiert…" unten. Bei Erfolg/Fehler kein weiteres Feedback. Nur bei kritischem Fehler kurzer Hinweis.
6. **Schreib-Logik:** Alle Daten werden in einer einzigen Transaktion geschrieben (im Hintergrund, kein Sperren der UI)

### Background-Sync-Cron

1. **Wöchentlich:** App prüft beim Start: ist `lastUpdate` der wger-Übungen älter als 7 Tage?
2. **Nicht blockierend:** Sync läuft im Hintergrund, User merkt nichts
3. **Inkrementell:** Nur neue/geänderte Übungen updaten (anhand `last_update_global`)
4. **Keine Löschung:** Gelöschte wger-Übungen werden nicht entfernt, nur mit `deprecated: true` markiert

### Service Worker Cache (PWA-Offline)

- Die wger-Bilder (`wger.de/media/exercise-images/…`) werden beim ersten Betrachten automatisch vom Service Worker gecached
- **Cache-Strategie:** "Cache-First" für Thumbnails (200x200), "Network-First" für große Bilder — Thumbnails sind klein und sollten schnell laden
- **Prefetch:** Bis zu 100 Bild-Thumbnails werden im Hintergrund vorgeladen (niedrige Priorität via `requestIdleCallback`, nur bei WLAN) — vom implementierenden Agenten zu konfigurieren
- **Cache-Limit:** Max 200 gecachte Bilder, älteste werden verdrängt (LRU) — Cache-Speicher bleibt so unter ~6 MB
- **Hotlinking vermeiden:** Die App cached Thumbnails beim ersten Laden — danach werden sie nicht mehr von wger.de nachgeladen, solange sie im Cache sind
- **Service Worker Anpassung:** Die `CACHE_URLS` im Service Worker müssen NICHT die wger-URLs enthalten (die sind unbekannt). Stattdessen: generische Fetch-Handler-Strategie die wger.de-Bilder abfängt und cached (`/media/exercise-images/` im URL-Pfad erkennen)

### IndexedDB Version Upgrade

Der `database.js` muss einen **Version-Bump** bekommen:

```js
const DB_VERSION = 4; // aktuell, hochzählen

// Im onupgradeneeded Handler:
if (dbVersion < 4) {
  const wgerStore = db.createObjectStore('wger_exercises', { keyPath: 'id', autoIncrement: false });
  wgerStore.createIndex('category', 'category', { unique: false });
  wgerStore.createIndex('equipment', 'equipment', { unique: false, multiEntry: true });
  wgerStore.createIndex('muscles', 'muscles', { unique: false, multiEntry: true });
  wgerStore.createIndex('importedAt', 'importedAt', { unique: false });
}
```

### Wichtiges Edge-Case-Handling

- **API nicht erreichbar beim Start:** App läuft mit zuletzt gespeicherten Daten (oder zeigt leeren Übungsbereich mit Hinweis "Datenbank wird bei nächster Internetverbindung geladen")
- **API nicht erreichbar beim ersten Start (keine DB):** App startet trotzdem. Freies Training zeigt "Übungen werden geladen…" Spinner + automatischer Retry alle 30s
- **Rate Limit:** Bei 818 Übungen reichen 3 Requests mit je 300 — weit unter jedem Limit
- **Import fehlgeschlagen (mittendrin):** Bereits gespeicherte Batches bleiben erhalten. Beim nächsten Start wird abgebrochener Import fortgesetzt (über `wgerImportOffset` in localStorage)
- **Kein Bild:** `hasImage = false`, im Popup Platzhalter anzeigen (s. Abschnitt 6)
- **Keine deutschen Übersetzung:** Auf Englisch fallen
- **Keine Übersetzung (weder DE noch EN):** `nameKey` = `"unknown_" + wgerId` als Fallback
- **App wird geschlossen während Import:** `wgerImportOffset` in localStorage speichert Fortschritt — beim nächsten Start fortsetzen

---

## 4. Kategorie-Mapping

### Freies Training Filter (überarbeitet)

Bisherige Filter `[Alle, Kraft, Ausdauer, Fettverbrennung, Körpergewicht, Lernen, Erholung, Allg. Workout]` werden ersetzt durch:

| Neuer Filter | Quelle |
|-------------|--------|
| Alle | wger + custom |
| Abs | wger |
| Arms | wger |
| Back | wger |
| Calves | wger |
| Cardio | wger |
| Chest | wger |
| Legs | wger |
| Shoulders | wger |
| Lernen | lokal (custom) |
| Fokus | lokal (custom) |
| Erholung | lokal (custom) |

### Filter-UI auf Mobile (Dropdown/Expandable)

Mit 12 Kategorien + Equipment-Filter + Muskel-Filter + Suche passt die alte horizontale Scroll-Leiste nicht mehr. Neues Layout:

```
┌──────────────────────────────┐
│  [ Suche...               ]  │  ← Such-Input
├──────────────────────────────┤
│  Kategorie  (Alle)     ⌵    │  ← Dropdown (wger + custom)
│  Equipment  (Alle)     ⌵    │  ← Dropdown
│  Muskel     (Alle)     ⌵    │  ← Dropdown
├──────────────────────────────┤
│  [Abs] [Arms] [Back] ...     │  ← Quick-Chips (wie Tags)
│  +2 mehr >                   │
└──────────────────────────────┘
```

- **Standard:** Nur die ersten 6 Kategorie-Chips + "+X mehr" Button
- **Erweitert:** Bei Klick auf "⌵" öffnet sich ein Fullscreen/Overlay-Filter
- **Aktive Filter** werden als Chips unter der Leiste angezeigt (zum schnellen Entfernen)
- Die Filter wirken sich auf den IndexedDB-Query aus (kein client-seitiges Filtern von 818 items)

### extraQuestPool (bleibt lokal)

Die 10 Extra-Quests (`data/exercises.js` — `DQ_DATA.extraQuestPool`) bleiben unverändert:
- Keine Sport-Übungen, haben keinen wger-Ersatz
- Werden weiterhin im Dungeon/Extra-Bereich angezeigt

### Custom Plan Configurator (überarbeitet)

Gleiche 8 wger-Kategorien als Tabs. Zusätzlich:

- **Filter nach Equipment** (Bodyweight, Dumbbell, Barbell, etc.)
- **Filter nach Muskel** (Dropdown oder Chip-Liste)
- **Search** (wie bisher, aber über 818 Übungen statt 50)
- **Kein "Eigene Übungen" Tab** mehr

---

## 5. Freies Training — Lazy Loading

### Konzept

```js
const BATCH_SIZE = 30;
let currentOffset = 0;
let isLoading = false;

async function loadNextBatch() {
  if (isLoading) return;
  isLoading = true;
  
  const exercises = await getFromDB(filter, currentOffset, BATCH_SIZE);
  renderCards(exercises);
  currentOffset += exercises.length;
  isLoading = false;
}

// Intersection Observer am letzten sichtbaren Card-Element
const sentinel = document.getElementById('lazy-load-sentinel');
observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) loadNextBatch();
});
observer.observe(sentinel);
```

### Performance-Optimierungen

- IndexedDB-Query mit `IDBKeyRange` + `cursor.advance()` für Batches
- Bilder erst laden wenn Card im Viewport (loading="lazy" auf img)
- Kein Re-Render aller Cards bei Filter-Wechsel — nur neuen Batch laden
- `requestAnimationFrame` für DOM-Inserts

### Struktur

```html
<div id="free-training-container">
  <h2>Freies Training</h2>
  <!-- Filter-Leiste (wger Categories + Custom) -->
  <div id="free-exercise-filters">…</div>
  <!-- Lazy-Loaded Liste -->
  <div id="exercise-list" class="content-container"></div>
  <!-- Sentinel für IntersectionObserver -->
  <div id="lazy-load-sentinel" class="loading-sentinel">
    <span class="material-symbols-rounded">more_horiz</span>
  </div>
</div>
```

---

## 6. Info-Popup — Komplett-Überarbeitung

### Neue Struktur

```
┌──────────────────────────────────┐
│  [Bild der Übung - groß]         │  ← falls hasImage, sonst Platzhalter-SVG
│                                  │
│  Übungsname (h2)                 │
│                                  │
│  ⌵ Anleitung anzeigen (details)  │  ← collapsed by default
│    Schritt 1...                   │
│    Schritt 2...                   │
│                                  │
│  ⋮ Mehr Details (dropdown)       │  ← 3-Punkte-Menü
│    ├ Phase: —                     │
│    ├ Trainingspläne: Cardio       │
│    └ Belastung: Mittel            │
│                                  │
│  ██████████ trainiert █████████  │  ← Badges:
│  [Brust] [Schultern] [Trizeps]   │      Muskel-Badges (klickbar?)
│                                  │
│  🧍 Körper-Silhouette            │  ← SVG front/back
│    ✦ Hauptmuskeln farbig         │      Primäre = rot/dunkel
│    ✦ Sekundäre heller            │      Sekundäre = hell/orange
│                                  │
│  Ziel: 10 Wiederholungen         │
│  Belohnung: +20 Mana | +6 Gold   │
└──────────────────────────────────┘
```

### Fehlende Bilder/Inhalte handhaben

- **Kein Bild:** Platzhalter-SVG — eine stilisierte Übungs-Silhouette (generic exercise icon)
- **Keine Anleitung:** "Keine Anleitung verfügbar" Text
- **Keine Muskeln (leeres Array):** "Allgemein" Badge
- **Keine Muskel-SVG:** Nur Text-Badges, keine Silhouette
- **Kein Video:** Video-Bereich einfach nicht rendern

### Silhouette-SVG

- Eine eigene SVG-Komponente bauen: menschlicher Körper (Vorder- + Rückseite)
- 15 Muskelregionen als `<path>`-Elemente mit IDs
- Farbe ändern per CSS: `#muscle-10 { fill: var(--muscle-active, #ff4444); }`
- Primäre Muskeln = volle Farbe, Sekundäre = 50% opacity
- Nicht trainierte Muskeln = transparent/ausgegraut
- Bei vielen Muskeln (z.B. Full-Body): alle leuchten

Alternative: Falls eigene Silhouette zu aufwändig, stattdessen die 15 wger-SVG-Muskel-Icons nebeneinander in einer Grid-Ansicht.

---

## 7. Daily Quests — Integration

### Keine Änderungen am Quest-System

- `DQ_TRAINING_SYSTEM`, Phasen, Sets-Modus, Log-Modus, completionMode bleiben unverändert
- `getTodayQuestSet()` wählt weiterhin Übungen aus, referenziert aber jetzt `wger_exercises` statt `DQ_DATA.exercisePool`
- Restday, Fokus, Lernen, Krank bleiben in altem `exercises`-Store

### Phasen-Mapping (`data/training_plans.js`)

Die aktuellen Phasen (`goal: 'muscle'`, `'endurance'`, `'fatloss'`, `'calisthenics'`) referenzieren alte DQ_DATA-Kategorien. Sie müssen auf wger-Kategorien gemappt werden:

| Phase/Ziel | Alte DQ_DATA-Kategorien | Neue wger-Kategorien |
|------------|------------------------|---------------------|
| Kraft (muscle) | muscle, kraft_abnehmen | Chest, Arms, Back, Shoulders, Legs |
| Ausdauer (endurance) | endurance | Cardio, Abs, Calves |
| Fettverbrennung (fatloss) | fatloss | Cardio, Legs, Abs, Shoulders |
| Körpergewicht (calisthenics) | calisthenics | Chest, Arms, Back, Abs, Legs, Shoulders (nur equipment=7) |

Zusätzlich wird ein Filter auf `equipment` angewandt:
- **Körpergewicht:** Nur `equipment.includes(7)` (bodyweight)
- **Kraft/Ausdauer/Fettverbrennung:** Alle wger-Übungen (auch mit Equipment)

Diese Mapping-Tabelle wird in `data/wger-defaults.js` definiert und von `DQ_TRAINING_SYSTEM.getPlan(goal)` verwendet.

### Änderungen in training_system.js

- `getPlan(goal)` bekommt wger-Übungen statt exercisePool
- `generateQuest()` erzeugt Quests mit wger-Daten + Default-baseValues + Difficulty-Skalierung
- `formatQuestTarget()` zeigt korrekte Werte
- Timer-Popup (Hampelmänner etc.) wird über `exercise.type` gesteuert — Cardio = `time` als Default

### Nicht-Sport-Kategorien (bleiben lokal)

Folgende Categories bleiben im alten `exercises`-Store + `DQ_DATA.exercisePool`:

| Kategorie | Enthält |
|-----------|---------|
| restday | Spazieren, Lesen, gesunder Snack, Dehnen |
| learning | Neue Skills lernen, für Schule lernen, Sprache lernen |
| sick | Tee trinken, kurzer Spaziergang, Medizin nehmen |
| senior | Spezielle Senioren-Übungen |
| fokus/timer | Timer-basierte Produktivität |

---

## 8. Custom Plan Configurator — Überarbeitung

### Ersetzen von manual-plan-system.js

**Aktuelle Probleme:**
- Maximal 30 Übungen auswählbar
- Category-Tabs basieren auf alten DQ_DATA-Kategorien
- "Eigene Übungen" Tab
- Kleine horizontale Liste

**Neue Implementierung:**

1. **Tabs:** 8 wger-Kategorien + "Alle"
2. **Zusätzliche Filter:**
   - Equipment-Chips (Bodyweight, Dumbbell, Barbell, etc.)
   - Muscle-Chips (Chest, Quads, Biceps, etc.)
   - Such-Input (wie bisher)
3. **Übungsauswahl:**
   - Vertical scrollbare Liste (lazy loaded wie Freies Training)
   - Jede Übung hat Checkbox/Switch zum Hinzufügen
   - Max 30 Limit bleibt
   - Rechts: Aktuelle Auswahl-Liste (ähnlich Warenkorb)
4. **Kein "Eigene Übung erstellen" Button** mehr
5. **Kein `custom_user_exercises` Store** mehr — `DQ_MANUAL_PLAN.EXERCISE_STORE` entfernen

---

## 9. Zu entfernende/ändernde Code-Stellen

### Entfernen (komplett löschen)

| Datei/Stelle | Begründung |
|-------------|-----------|
| `data/exercises.js` — `exercisePool.muscle`, `.endurance`, `.fatloss`, `.kraft_abnehmen`, `.calisthenics`, `.general_workout` | Werden durch wger ersetzt (nur Nicht-Sport-Kategorien bleiben: restday, learning, sick, senior) |
| `data/exercises.js` — `extraQuestPool` | Bleibt lokal (keine Sport-Übungen) |
| `js/manual-plan-system.js` — `EXERCISE_STORE`, `CATEGORY_TABS.user_created`, Custom-Exercise CRUD | Keine eigenen Übungen mehr |
| `js/page_exercises_training.js` — `renderCustomExercisesSection()` | Entfällt |
| `js/page_exercises.js` — Referenzen auf `customExerciseId` | Entfällt |
| HTML: Custom Exercise Popup (`#custom-exercise-popup`) | Entfällt |
| HTML: `#manual-plan-create-exercise` Button | Entfällt |
| Tests: `tests/` — ggf. anpassen | Datenstruktur-Tests updaten |

### Anpassen

| Datei | Änderung |
|-------|---------|
| **NEU:** `js/wger-import.js` | API-Client: Import, Sync, Pagination, Background-Logik |
| **NEU:** `data/wger-defaults.js` | Default-baseValues, Type-Override-Liste, Phasen-Mapping, Kategorie-Mapping, OLD_TO_WGER_Mapping |
| **NEU:** `css/muscle-silhouette.svg` | SVG Körper-Silhouette mit 15 Muskel-Overlays |
| `js/database.js` | Neuen Store `wger_exercises` + Upgrade-Logik |
| `js/page_exercises.js` | `renderFreeExercisesPage()` → Lazy Loading, wger-Queries |
| `js/page_exercises_training.js` | `renderQuests()` → wger-Referenzen statt exercisePool, `renderExerciseInfoPopup()` → neues Design, `renderFreeExercisesPage()` → lazy, `completeFreeExercise()` → wger-IDs |
| `js/manual-plan-system.js` | Category-Tabs auf wger umstellen, Custom-Exercise CRUD entfernen |
| `js/training_system.js` | Übungsauswahl aus wger statt exercisePool |
| `js/ui.js` | Ggf. neue UI-Komponenten |
| `data/translations.js` | Neue Übersetzungen für wger-Categories |
| `css/pages/exercises.css` | Neues Info-Popup-Styling, Lazy-Loading-Sentinel |
| `css/pages/extra-quest.css` | Nicht betroffen? |
| `css/components/popups.css` | Info-Popup-Update |
| `index.html` | Custom-Exercise-Popup entfernen, Filter-Leiste updaten |
| `main.js` | wger-Import beim App-Start triggern |
| `service-worker.js` | Dynamischer Cache für wger.de-Bilder (`/media/exercise-images/` im Fetch-Handler abfangen) |

---

## 10. Wichtige offene Entscheidungen & Fragen

### 1. extraQuestPool
Bleibt lokal — 10 Extra-Quests wie "Zimmer putzen", "Freund anrufen" haben keinen wger-Ersatz. ✅

### 2. Silhouette-SVG complexity
Eine detaillierte Körper-Silhouette mit 15 farbigen Muskelregionen ist aufwändig. Alternatives Vorgehen:
- **Phase 1:** Nur Muskel-Badges + kleine SVG-Icons (die wger SVGs einzeln)
- **Phase 2:** Eigene Silhouette bauen
→ Vorschlag: Phase 1 für MVP, Phase 2 als Follow-up

### 3. Bestehende User-Pläne migrieren

User mit gespeicherten Custom-Plänen referenzieren alte Exercise-IDs. Diese müssen auf wger-IDs gemappt werden.

**Mapping-Strategie:** Vordefinierte Tabelle `oldNameKey → wgerNameEn` in `data/wger-defaults.js`:

```js
const OLD_TO_WGER_MAPPING = {
  "push_ups_normal": "Push-Up",
  "squats": "Squat",
  "lunges": "Lunge",
  "burpees": "Burpee",
  "plank": "Plank",
  "mountain_climbers": "Mountain Climber",
  "bicep_curls": "Bicep Curl",
  // ... alle 50 alten Übungen
};
```

**Ablauf:**
1. Beim ersten Start nach dem Update: Prüfen ob alte Custom-Pläne in `custom_plans` Store existieren
2. Für jede Übung im Plan: `nameKey → OLD_TO_WGER_MAPPING → wger exercise.nameEn`
3. Falls keine wger-Übung gefunden: Übung aus Plan entfernen + Toast: "X Übungen wurden automatisch ersetzt"
4. Alte `daily_quests`-Historie wird nicht migriert (historische Einträge bleiben mit alter ID)

### 4. Mana/Gold-Balance
wger hat kein Mana/Gold. Die Default-Werte pro Kategorie sind geschätzt. Evtl. muss die Balance nach dem Import getuned werden.
→ Vorschlag: Konservative Defaults, User kann Feedback geben

---

## 11. Dateien für den implementierenden Agenten

### Reihenfolge der Implementierung

1. **Vorbereitung:** `js/database.js` — neuen Store + DB-Upgrade
2. **Import:** Neues Modul `js/wger-import.js` — API-Client + Sync
3. **Daten:** `data/wger-defaults.js` — Default-baseValues + Kategorie-Mapping
4. **Free Training:** `js/page_exercises.js` + `js/page_exercises_training.js` — Lazy Loading
5. **Info-Popup:** `js/page_exercises_training.js` — `renderExerciseInfoPopup()` überarbeiten
6. **Muskel-SVG:** Neue Datei `css/muscle-silhouette.svg` + CSS
7. **Custom Plan:** `js/manual-plan-system.js` — wger-Tabs + Filter
8. **Bereinigung:** Custom-Exercise-Code entfernen, `data/exercises.js` kürzen
9. **Tests:** Test-Suite updaten, neue Tests für wger-Import + Lazy Loading
10. **Fine-Tuning:** Mana/Gold-Balance, Performance-Optimierung
