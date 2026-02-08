# Focus/Timer System - Funktions-Erklärung

## Übersicht
Das Focus/Timer System (Vibe-Fokus) ermöglicht konzentriertes Arbeiten mit Pomodoro-Timer und Stopwatch-Modi. Fokus-Sessions können mit Quests verknüpft werden für automatische Completion und speziellen Rewards. Session-Daten werden in IndexedDB gespeichert und für Achievements sowie Stats (Durchhaltevermögen) getrackt.

## Relevante Dateien und Ordner

### Hauptdateien
- `js/vibe-fokus/vibe_state.js` - State Management
- `js/vibe-fokus/page_fokus_main.js` - Page Routing
- `js/vibe-fokus/page_fokus_timer.js` - Timer Implementation
- `js/database.js` - IndexedDB Zugriffe

### Verbundene Module
- `js/page_exercises.js` - Quest-Verknüpfung
- `js/character/page_character_stats.js` - Stats Integration

## Wichtige Punkte

### Timer Modi

#### Pomodoro Mode
```javascript
POMODORO_MODES = {
  short: { minutes: 15, break: 5 },
  normal: { minutes: 25, break: 10 },
  long: { minutes: 50, break: 15 }
};
```
- Feste Duration
- Auto-Start bei Completion
- Keine Pausen-Belohnungen

#### Stopwatch Mode
```javascript
// Open-ended, belohnt ab 2+ Minuten
STOPWATCH_REWARDS = {
  minSessionMinutes: 2, // Minimum für Rewards
  perMinute: {
    gold: 4,
    mana: 2
  },
  statBonus: {
    durchhaltevermoegen: 1 // Alle 20 Minuten
  }
};
```

### Session Rewards

#### Standard Focus Rewards (pro Minute)
```
Gold: 4 pro Minute
Mana: 2 pro Minute
Durchhaltevermögen: +1 alle 20 Minuten
```

#### Linked Quest Rewards
```
Folgen dem Quest-Template:
- manaReward: Quest-spezifisch
- goldReward: Quest-spezifisch
- Stats: Quest-spezifisch
```

### Focus Session Objekt
```javascript
{
  id: "uuid-v4",
  startTime: "2026-02-08T10:00:00Z",
  endTime: null,
  duration: null, // in minutes
  mode: "pomodoro" | "stopwatch",
  modeConfig: { ... },
  linkedQuestId: null, // Quest-ID wenn verknüpft
  label: "Reading", // Custom label
  completed: false,
  rewards: {
    mana: 0,
    gold: 0,
    stats: { durchhaltevermoegen: 0 }
  }
}
```

### Custom Labels
```javascript
DEFAULT_LABELS = [
  { id: "reading", nameKey: "label_reading", icon: "📖" },
  { id: "learning", nameKey: "label_learning", icon: "📚" },
  { id: "meditating", nameKey: "label_meditating", icon: "🧘" }
];

// User Labels in focus_labels Store
{
  id: autoIncrement,
  name: "Custom Label",
  icon: "🎯"
}
```

## Design Richtung

### Architektur
- **Async State**: `DQ_VIBE_STATE` für Timer-State
- **Persistence**: State wird bei jeder Änderung gespeichert
- **Background Support**: Web Worker oder setInterval für Timer

### UI-Rendering
- Große Timer-Anzeige
- Progress-Ring
- Mode-Auswahl
- Custom Label Input

## IndexDB Speicherung

### Store: `vibe_state`
```javascript
{
  storeName: 'vibe_state',
  keyPath: 'key', // 'current_session', 'total_focus_minutes', etc.
  values: {
    current_session: sessionObject,
    total_focus_minutes: 0,
    session_history: []
  }
}
```

### Store: `focus_labels`
```javascript
{
  storeName: 'focus_labels',
  keyPath: 'id',
  autoIncrement: true
}
```

### Operationen
```javascript
// Session speichern
await DQ_DB.putSingle('vibe_state', {
  key: 'current_session',
  value: session
});

// Total Minutes
await DQ_DB.putSingle('vibe_state', {
  key: 'total_focus_minutes',
  value: totalMinutes
});

// Label hinzufügen
await DQ_DB.add('focus_labels', {
  name: "Custom",
  icon: "🎯"
});
```

## Export/Import JSON

### Export Struktur
```json
{
  "vibe_state": {
    "total_focus_minutes": 360,
    "session_history": [
      {
        "id": "uuid",
        "startTime": "2026-02-08T10:00:00Z",
        "duration": 25,
        "mode": "pomodoro",
        "completed": true
      }
    ]
  },
  "focus_labels": [
    { "id": 1, "name": "Reading", "icon": "📖" }
  ]
}
```

## Streak Verbindung

### Focus Time Achievement
```javascript
// In data/achievements.js
{
  id: "focus_time",
  icon: "🧠",
  tracking: "totalFocusMinutes",
  tiers: [
    { threshold: 60, rewardGold: 100, rewardMana: 100 },
    { threshold: 300, rewardGold: 200, rewardMana: 200 },
    // ... mehr Tiers bis 60000
  ]
}
```

### Durchhaltevermögen Stat
```javascript
// Alle 20 Minuten Fokus
character.stats.durchhaltevermoegen += 1;
character.statProgress.durchhaltevermoegen += 1;
```

## Quest Verknüpfung

### Link Quest to Session
```javascript
function prepareSession(questId) {
  const session = {
    ...baseSession,
    linkedQuestId: questId
  };
  await DQ_DB.putSingle('vibe_state', { key: 'current_session', value: session });

  // Timer starten
  startTimer();
}
```

### Auto-Complete bei Session-Ende
```javascript
function onSessionComplete(session) {
  if (session.linkedQuestId) {
    // Quest automatisch completen
    await DQ_EXERCISES.completeQuest(session.linkedQuestId);
  }

  // Standard Rewards
  if (session.mode === 'stopwatch' && session.duration >= 2) {
    const manaEarned = session.duration * 2;
    const goldEarned = session.duration * 4;
    await DQ_CHARACTER_MAIN.addMana(manaEarned);
    await DQ_CHARACTER_MAIN.addGold(goldEarned);

    // Stat Bonus alle 20 Minuten
    if (session.duration >= 20) {
      character.stats.durchhaltevermoegen += Math.floor(session.duration / 20);
    }
  }
}
```

## Häufige Fehler

### 1. Timer läuft im Background nicht weiter
**Fehler**: setInterval pausiert bei Inactive Tab
**Lösung**: Web Worker verwenden oder `Date.now()` Delta nutzen

### 2. Session ohne Endzeit
**Fehler**: Crash bei `session.endTime = null`
**Lösung**: `session.endTime || Date.now()` bei Berechnung

### 3. Linked Quest bereits completed
**Fehler**: Auto-Complete eines schon-done Quests
**Lösung**: Prüfe `quest.completed` vor Link

### 4. Total Minutes Overflow
**Fehler**: Zu große Zahlen bei vielen Sessions
**Lösung**: Nutze `Number` statt `Integer` oder `BigInt`

### 5. Custom Labels werden gelöscht
**Fehler**: Import überschreibt focus_labels
**Lösung**: Merge-Strategie bei Import

## Wichtige Funktionen

### vibe_state.js
```javascript
DQ_VIBE_STATE = {
  state: {
    currentSession: null,
    totalFocusMinutes: 0,
    isTimerRunning: false
  },

  saveState() {
    await DQ_DB.putSingle('vibe_state', {
      key: 'current_session',
      value: this.state.currentSession
    });
  },

  loadState() {
    const state = await DQ_DB.getSingle('vibe_state', 'current_session');
    if (state) this.state.currentSession = state;
  },

  startSession(config) {
    this.state.currentSession = {
      id: generateUUID(),
      startTime: Date.now(),
      mode: config.mode,
      modeConfig: config,
      linkedQuestId: config.linkedQuestId || null,
      label: config.label || null
    };
    this.saveState();
  },

  endSession() {
    if (!this.state.currentSession) return;

    const endTime = Date.now();
    const durationMs = endTime - this.state.currentSession.startTime;
    const durationMin = Math.floor(durationMs / 60000);

    this.state.currentSession.endTime = endTime;
    this.state.currentSession.duration = durationMin;
    this.state.currentSession.completed = true;

    this.state.totalFocusMinutes += durationMin;
    await DQ_DB.putSingle('vibe_state', {
      key: 'total_focus_minutes',
      value: this.state.totalFocusMinutes
    });

    return this.state.currentSession;
  }
};
```

### page_fokus_timer.js
```javascript
DQ_FOKUS_TIMER = {
  timerInterval: null,
  remainingSeconds: 0,

  renderTimerScreen() { ... },          // Timer UI
  renderModeSelector() { ... },          // Pomodoro/Stopwatch
  prepareSession(questId) { ... },      // Mit Quest verknüpfen
  startTimer() { ... },                 // Timer starten
  pauseTimer() { ... },                 // Timer pausieren
  resumeTimer() { ... },                // Fortsetzen
  stopTimer() { ... },                  // Abbrechen
  completeSession() { ... },            // Session beenden
  formatTime(seconds) { ... },          // Zeit formatieren MM:SS
  updateProgressRing() { ... },         // Visueller Fortschritt
  playNotificationSound() { ... }        // Sound bei Ende
};
```

## UI Components

### Timer Display
```html
<div class="fokus-timer">
  <div class="timer-modes">
    <button class="mode-btn active" data-mode="pomodoro">Pomodoro</button>
    <button class="mode-btn" data-mode="stopwatch">Stopwatch</button>
  </div>

  <div class="timer-display">
    <svg class="progress-ring">
      <circle class="progress-ring-bg" />
      <circle class="progress-ring-fill" />
    </svg>
    <div class="time-text">25:00</div>
  </div>

  <div class="timer-controls">
    <button class="control-btn" id="start-btn">▶ Start</button>
    <button class="control-btn hidden" id="pause-btn">⏸ Pause</button>
    <button class="control-btn hidden" id="stop-btn">⏹ Stop</button>
  </div>

  ${linkedQuest ?
    `<div class="linked-quest">
       🔗 ${t(linkedQuest.nameKey)}
     </div>` : ''
  }

  <div class="custom-label-input">
    <input type="text" placeholder="${t('fokus_custom_label')}" />
  </div>
</div>
```

### Session History
```html
<div class="fokus-history">
  <h3>${t('fokus_history')}</h3>
  <div class="session-list">
    ${sessions.map(session => `
      <div class="session-item">
        <div class="session-icon">${session.label?.icon || '🧠'}</div>
        <div class="session-info">
          <div class="session-label">${session.label?.name || 'Fokus'}</div>
          <div class="session-duration">${session.duration} min</div>
        </div>
        <div class="session-rewards">
          +${session.rewards?.mana || 0}⚡
          +${session.rewards?.gold || 0}💰
        </div>
      </div>
    `).join('')}
  </div>
</div>
```

## Testing Checkliste

- [ ] Pomodoro Timer läuft korrekt runter
- [ ] Stopwatch zählt korrekt hoch
- [ ] Pause/Resume funktioniert
- [ ] Custom Labels werden gespeichert
- [ ] Session-History zeigt vergangene Sessions
- [ ] Rewards werden nach Session addiert
- [ ] Durchhaltevermögen erhöht sich alle 20 Minuten
- [ ] Focus Time Achievement progressiert
- [ ] Quest-Link funktioniert (Auto-Complete)
- [ ] Linked Quest Rewards folgen Quest-Template
- [ ] Background-Timer funktioniert
- [ ] Notification Sound spielt bei Ende
- [ ] Export enthält vibe_state
- [ ] Import stellt Sessions wieder her
