# Tutorial System - Funktions-Erklärung

## Übersicht
Das Tutorial System führt neue Spieler durch die verschiedenen Features von DailyQuest. Es nutzt ein progressives System, das Features erst vorstellt wenn sie verfügbar werden, sowie ein dynamisches State-Tracking für bereits gesehene Tutorials.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/tutorial/tutorial_state.js` - Tutorial State Management
- `js/tutorial/tutorial_main.js` - Tutorial Orchestrierung
- `js/tutorial/tutorial_progressive.js` - Progressive Feature Tutorials
- `js/tutorial/tutorial_triggers.js` - Trigger-Bedingungen
- `css/tutorial.css` - Tutorial Styles

### Verbundene Module
- `js/ui.js` - UI Integration
- `js/database.js` - IndexedDB Zugriffe

## Wichtige Punkte

### Tutorial State Struktur
```javascript
tutorialState = {
  completedTutorials: [],       // Array von tutorialIds
  currentTutorial: null,        // Aktuell aktives Tutorial
  tutorialProgress: {},          // Fortschritt pro Tutorial
  dismissedTutorials: [],       // Vom User übersprungene
  lastTriggerCheck: null         // Letzte Trigger-Prüfung
};
```

### Tutorial Definition Struktur
```javascript
{
  id: "daily_quests_intro",
  titleKey: "tutorial_daily_quests_title",
  contentKey: "tutorial_daily_quests_content",
  targetElement: ".daily-quest-card", // CSS Selector
  position: "bottom",           // top, bottom, left, right, center
  triggerCondition: "first_visit", // Trigger-Typ
  triggerDelay: 0,              // ms Verzögerung
  showOnce: true,               // Nur einmal zeigen
  requiredLevel: 1,             // Ab welchem Level
  requiredFeature: null,        // Feature das aktiviert sein muss
  steps: [                     // Multi-step Tutorial
    {
      targetElement: ".quest-card-1",
      contentKey: "tutorial_step_1",
      position: "right"
    },
    {
      targetElement: ".complete-btn",
      contentKey: "tutorial_step_2",
      position: "bottom"
    }
  ]
}
```

### Trigger Typen
```javascript
TRIGGER_TYPES = {
  first_visit: "Wird bei erstem App-Besuch gezeigt",
  level_up: "Wird bei Level-Up gezeigt",
  quest_complete: "Wird nach Quest-Completion gezeigt",
  feature_unlocked: "Wird gezeigt wenn Feature freigeschaltet",
  time_spent: "Wird nach bestimmter Zeit gezeigt",
  element_visible: "Wird gezeigt wenn Element sichtbar wird",
  manual: "Manuell triggerbar"
};
```

### Progressive Tutorial Phasen
```javascript
PROGRESSIVE_TUTORIALS = {
  phase1_welcome: {
    id: "welcome",
    level: 1,
    titleKey: "tutorial_welcome_title",
    contentKey: "tutorial_welcome_content",
    steps: [
      { target: ".nav-quests", content: "Hier sind deine Daily Quests" },
      { target: ".quest-card", content: "Erledige Quests für XP und Gold" },
      { target: ".nav-character", content: "Hier siehst du deine Stats" }
    ]
  },
  phase2_quests: {
    id: "quest_basics",
    level: 2,
    titleKey: "tutorial_quests_title",
    contentKey: "tutorial_quests_content",
    steps: [
      { target: ".quest-input", content: "Gib deinen Fortschritt ein" },
      { target: ".complete-btn", content: "Klick hier zum Abschließen" }
    ]
  },
  phase3_shop: {
    id: "shop_intro",
    level: 3,
    titleKey: "tutorial_shop_title",
    contentKey: "tutorial_shop_content",
    steps: [
      { target: ".nav-shop", content: "Im Shop kannst du Ausrüstung kaufen" },
      { target: ".shop-item", content: "Bessere Ausrüstung = stärker im Dungeon" }
    ]
  },
  phase4_dungeon: {
    id: "dungeon_intro",
    level: 5,
    titleKey: "tutorial_dungeon_title",
    contentKey: "tutorial_dungeon_content",
    steps: [
      { target: ".dungeon-chip", content: "Ein Dungeon ist erschienen!" },
      { target: ".combat-tasks", content. "Nutze deine Quests als Waffen" }
    ]
  }
};
```

### Tutorial Triggers Logic
```javascript
function checkTutorialTriggers() {
  const triggers = getActiveTriggers();

  for (const trigger of triggers) {
    if (trigger.condition() && !isTutorialCompleted(trigger.tutorialId)) {
      if (trigger.delay > 0) {
        setTimeout(() => showTutorial(trigger.tutorialId), trigger.delay);
      } else {
        showTutorial(trigger.tutorialId);
      }
    }
  }
}

// Trigger Beispiele
const TRIGGERS = [
  {
    tutorialId: "welcome",
    condition: () => !hasCompletedTutorial("welcome") && isFirstVisit(),
    delay: 500
  },
  {
    tutorialId: "shop_intro",
    condition: () => !hasCompletedTutorial("shop_intro") &&
                    character.level >= 3 &&
                    character.gold >= 100,
    delay: 2000
  },
  {
    tutorialId: "dungeon_intro",
    condition: () => !hasCompletedTutorial("dungeon_intro") &&
                    character.level >= 5,
    delay: 0
  }
];
```

## Design Richtung

### Architektur
- **Progressive Enthüllung**: Tutorials werden basierend auf Fortschritt gezeigt
- **State Persistence**: Tutorial-State in IndexedDB
- **Non-Intrusive**: User kann Tutorials überspringen

### UI-Rendering
- Overlay-Highlighting für Target-Elemente
- Pfeil/Popover mit Erklärung
- Next/Back Buttons für Multi-Step

## IndexDB Speicherung

### Store: `tutorial_state`
```javascript
{
  storeName: 'tutorial_state',
  keyPath: 'key',
  value: {
    completedTutorials: [],
    currentTutorial: null,
    tutorialProgress: {},
    dismissedTutorials: [],
    lastTriggerCheck: Date.now()
  }
}
```

### Store: `tutorial_dynamic_state`
```javascript
{
  storeName: 'tutorial_dynamic_state',
  keyPath: 'key',
  value: {
    viewCount: {},
    interactionCount: {},
    featureUsage: {}
  }
}
```

## Export/Import JSON

### Export Struktur
```json
{
  "tutorial_state": {
    "completedTutorials": ["welcome", "quest_basics"],
    "currentTutorial": null,
    "tutorialProgress": {
      "welcome": { "step": 3, "completed": true },
      "quest_basics": { "step": 1, "completed": false }
    },
    "dismissedTutorials": []
  }
}
```

## Streak Verbindung

### Keine direkte Verbindung
- Tutorials beeinflussen den Streak nicht
- **Indirekt**: Besseres Verständnis = bessere Quest-Erledigung

## Häufige Fehler

### 1. Tutorial zeigt bei falschem Element
**Fehler**: Target-Selector matcht nicht oder falsches Element
**Lösung**: Debug-Tooltip mit sichtbaren Selectors

### 2. Tutorial triggert zu früh
**Fehler**: Feature noch nicht verfügbar
**Lösung**: `requiredLevel` und `requiredFeature` checks

### 3. Overlay blockiert Interaktion
**Fehler**: User kann nicht mit Element interagieren
**Lösung**: Click-through auf Target-Element erlauben

### 4. Multi-Step Progress verloren
**Fehler**: Reload verliert Step-Fortschritt
**Lösung**: `tutorialProgress` in DB speichern

## Wichtige Funktionen

### tutorial_state.js
```javascript
DQ_TUTORIAL_STATE = {
  loadState() { ... },                   // State aus DB laden
  saveState() { ... },                   // State in DB speichern
  markComplete(tutorialId) { ... },      // Tutorial als complete markieren
  isComplete(tutorialId) { ... },        // Check ob complete
  getProgress(tutorialId) { ... },      // Fortschritt lesen
  setProgress(tutorialId, step) { ... }, // Fortschritt setzen
  dismiss(tutorialId) { ... },            // Tutorial überspringen
  isDismissed(tutorialId) { ... },      // Check ob dismissed
  reset() { ... }                        // Alle Tutorials resetten
};
```

### tutorial_main.js
```javascript
DQ_TUTORIAL = {
  init() { ... },                        // Tutorial System initialisieren
  checkTriggers() { ... },               // Trigger prüfen
  showTutorial(tutorialId) { ... },     // Tutorial anzeigen
  hideTutorial() { ... },                // Tutorial ausblenden
  nextStep() { ... },                   // Nächster Step
  prevStep() { ... },                   // Vorheriger Step
  completeTutorial() { ... },           // Tutorial abschließen
  skipTutorial() { ... },               // Tutorial überspringen
  renderTutorialUI() { ... },           // Tutorial UI bauen
  positionTutorial() { ... },           // Position berechnen
  highlightTarget() { ... },            // Target-Element highlighten
  scrollToTarget() { ... }              // Zum Element scrollen
};
```

### tutorial_progressive.js
```javascript
DQ_TUTORIAL_PROGRESSIVE = {
  PHASES: {
    // ... Phase-Definitionen
  },

  getCurrentPhase() { ... },            // Aktuelle Phase bestimmen
  getNextTutorial() { ... },            // Nächstes Tutorial
  activatePhase(phaseId) { ... },       // Phase aktivieren
  renderPhaseIndicator() { ... },       // Phase-Indicator UI
  shouldShowTutorial(tutorial) { ... } // Soll Tutorial gezeigt werden?
};
```

## UI Components

### Tutorial Overlay
```html
<div class="tutorial-overlay" id="tutorial-overlay">
  <div class="tutorial-highlight" id="tutorial-highlight"></div>

  <div class="tutorial-popover" id="tutorial-popover">
    <div class="tutorial-header">
      <h3>${t(tutorial.titleKey)}</h3>
      <button class="skip-btn" onclick="DQ_TUTORIAL.skipTutorial()">✕</button>
    </div>

    <div class="tutorial-content">
      <p>${t(tutorial.contentKey)}</p>
    </div>

    <div class="tutorial-footer">
      <span class="step-indicator">
        Step ${currentStep + 1} / ${totalSteps}
      </span>
      <div class="tutorial-buttons">
        ${currentStep > 0 ?
          `<button class="prev-btn" onclick="DQ_TUTORIAL.prevStep()">
             ${t('tutorial_prev')}
           </button>` : ''
        }
        ${currentStep < totalSteps - 1 ?
          `<button class="next-btn" onclick="DQ_TUTORIAL.nextStep()">
             ${t('tutorial_next')}
           </button>` :
          `<button class="done-btn" onclick="DQ_TUTORIAL.completeTutorial()">
             ${t('tutorial_done')}
           </button>`
        }
      </div>
    </div>
  </div>

  <div class="tutorial-arrow"></div>
</div>
```

### Progress Indicator
```html
<div class="tutorial-progress-bar">
  <div class="tutorial-dots">
    ${phases.map((phase, i) => `
      <div class="tutorial-dot ${isCompleted(phase.id) ? 'completed' : ''}
                          ${isCurrent(phase.id) ? 'current' : ''}
                          ${isLocked(phase.id) ? 'locked' : ''}">
        ${isCompleted(phase.id) ? '✓' : i + 1}
      </div>
    `).join('')}
  </div>
  <div class="tutorial-labels">
    ${phases.map(phase => `
      <span class="phase-label ${isCurrent(phase.id) ? 'current' : ''}">
        ${t(phase.titleKey)}
      </span>
    `).join('')}
  </div>
</div>
```

## Testing Checkliste

- [ ] Welcome Tutorial erscheint bei erstem Besuch
- [ ] Tutorials werden in korrekter Reihenfolge gezeigt
- [ ] Multi-Step Tutorials funktionieren (Next/Back)
- [ ] Skip-Button funktioniert
- [ ] Complete-Markierung wird gespeichert
- [ ] Bereits gesehene Tutorials werden nicht wiederholt
- [ ] Element-Highlighting funktioniert
- [ ] Popover-Positionierung ist korrekt
- [ ] Tutorial-State wird in DB gespeichert
- [ ] Reload setzt Tutorial-Fortschritt fort
- [ ] Export enthält Tutorial-State
- [ ] Import stellt Tutorial-State wieder her
