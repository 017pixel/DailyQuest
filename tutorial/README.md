# 📚 DailyQuest Progressive Tutorial System

## Übersicht

Das **Progressive Tutorial System** erklärt dem User die App schrittweise, während er sie nutzt. Jedes Feature wird beim **ersten Besuch** erklärt - nicht alles auf einmal!

## Features

✨ **Emotionale Tooltips** - Kurze, motivierende Erklärungen
💫 **Spotlight-Effekt** - Hebt wichtige Elemente hervor
🎯 **On-Demand** - Tutorials erscheinen nur beim ersten Besuch
🎨 **Smooth Animationen** - Fade-in/out, Glow-Effekte
📱 **Responsive** - Funktioniert auf Desktop und Mobile

## Architektur

### Dateien

```
tutorial/
├── js/
│   ├── tutorial_state.js       # DB-Verwaltung für Tutorial-Progress
│   ├── tutorial_main.js         # Intro-Tutorial beim ersten Start
│   ├── tutorial_progressive.js  # Progressive Feature-Tutorials
│   └── tutorial_triggers.js     # Helper für Sub-Feature Triggers
└── css/
    └── tutorial.css             # Alle Tutorial-Styles
```

### Ablauf

1. **App-Start**: Intro-Tutorial (nur beim ersten Mal)
   - System begrüßt User
   - Namenseingabe
   - Willkommens-Sequenz
   - App-Reveal Animation

2. **Nach Intro**: Exercises-Tutorial startet automatisch
   - Erklärt Daily Quests
   - Zeigt Übersichtsseite

3. **Navigation**: Weitere Tutorials beim ersten Besuch
   - Fokus → Erklärt Timer-System
   - Character → Erklärt Stats & Streak
   - Shop → Erklärt Kaufsystem
   - Extra Quest → Warnt vor Risiken

4. **Sub-Features**: Spezifische Triggers
   - Daily Quests Tooltip (auto)
   - Free Training (auto beim Scrollen)
   - Stats (auto auf Character-Page)
   - Streak (auto auf Character-Page)
   - Inventory (beim Tab-Wechsel)
   - Dungeon (beim ersten Erscheinen)

## Tutorial-Inhalte

### Seiten-Tutorials

| Feature | Trigger | Schritte |
|---------|---------|----------|
| **Exercises** | Nach Intro / Erste Navigation | 2 |
| **Fokus** | Erste Navigation zu Fokus-Page | 2 |
| **Character** | Erste Navigation zu Character-Page | 1 |
| **Shop** | Erste Navigation zu Shop-Page | 2 |
| **Extra Quest** | Erste Navigation zu Extra-Quest-Page | 2 |
| **Dungeon** | Erstes Dungeon erscheint | 3 |

### Sub-Feature Tutorials

| Feature | Trigger | Wo? |
|---------|---------|-----|
| **Daily Quests** | Auto nach Exercises-Tutorial | Übungen-Seite |
| **Free Training** | Beim Scrollen / Reveal-Button | Übungen-Seite |
| **Stats** | Auto auf Character-Page | Character-Seite |
| **Streak** | Auto auf Character-Page | Character-Seite |
| **Inventory** | Tab-Wechsel zu Inventar | Character-Seite |

## API

### Tutorial State Prüfen

```javascript
// Hat User das Intro gesehen?
const hasSeenIntro = await DQ_TUTORIAL_STATE.hasCompletedTutorial();

// Hat User ein Feature gesehen?
const hasSeenShop = await DQ_TUTORIAL_STATE.hasSeenFeature('shop');
```

### Tutorial Manuell Starten

```javascript
// Zeige Tutorial für ein Feature
await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('fokus');

// Zeige Dungeon-Tutorial (spezieller Fall)
await DQ_TUTORIAL_PROGRESSIVE.showDungeonTutorial();
```

### Tutorial-Triggers Verwenden

```javascript
// In deinem Code, z.B. wenn User auf Daily Quest klickt:
DQ_TUTORIAL_TRIGGERS.triggerDailyQuests();

// Wenn User zum Inventar wechselt:
DQ_TUTORIAL_TRIGGERS.triggerInventory();

// Wenn Dungeon erscheint:
DQ_TUTORIAL_TRIGGERS.triggerDungeon();
```

### Tutorial Zurücksetzen (Testing)

```javascript
// Komplett zurücksetzen
await DQ_TUTORIAL_STATE.resetTutorial();
// Dann Seite neu laden
location.reload();
```

## Integration in deine Module

### Beispiel: Exercises Module

```javascript
// In renderQuests() - Nach dem Rendern der Quests
if (questsRendered && firstTimeLoading) {
    setTimeout(() => {
        DQ_TUTORIAL_TRIGGERS.triggerDailyQuests();
    }, 500);
}
```

### Beispiel: Character Module

```javascript
// In renderPage() - Nach dem Rendern der Stats
if (statsRendered && firstTimeOnPage) {
    setTimeout(() => {
        DQ_TUTORIAL_TRIGGERS.triggerStats();
        DQ_TUTORIAL_TRIGGERS.triggerStreak();
    }, 600);
}
```

### Beispiel: Inventory Tab-Switch

```javascript
// In Tab-Switch Event Handler
const inventoryTab = document.querySelector('[data-tab="inventory"]');
inventoryTab.addEventListener('click', () => {
    // Switch tab logic...
    
    // Trigger tutorial
    setTimeout(() => {
        DQ_TUTORIAL_TRIGGERS.triggerInventory();
    }, 400);
});
```

### Beispiel: Dungeon Spawn

```javascript
// Wenn Dungeon erscheint
async function spawnDungeon() {
    // Spawn logic...
    
    // Trigger tutorial beim ersten Mal
    await DQ_TUTORIAL_TRIGGERS.triggerDungeon();
}
```

## Styling Anpassen

Alle Styles sind in `tutorial/css/tutorial.css`:

```css
/* Tooltip Farben */
.tutorial-tooltip-content {
    background: linear-gradient(...);
    border: 2px solid rgba(95, 133, 117, 0.5);
}

/* Spotlight Farbe */
.tutorial-spotlight {
    box-shadow: 0 0 0 4px rgba(95, 133, 117, 0.5), ...;
}

/* Button Styles */
.tutorial-next-btn {
    background: linear-gradient(135deg, #5f8575 0%, #4a6a5d 100%);
}
```

## Best Practices

✅ **DO:**
- Kurze, emotionale Texte (max. 2 Sätze)
- Emojis verwenden für Emotion
- Motivierende Sprache
- Auto-Trigger bei ersten Aktionen
- Kleine Verzögerungen (200-500ms) vor Anzeige

❌ **DON'T:**
- Lange Erklärungen
- Alle Tutorials auf einmal zeigen
- Tutorial zu früh starten (vor Render)
- Technische Details erklären
- Ohne Highlight/Spotlight arbeiten

## Debugging

```javascript
// Console Log Level
localStorage.setItem('tutorial_debug', 'true');

// Zeige alle gesehenen Features
DQ_DB.db.transaction(['tutorial_state'], 'readonly')
    .objectStore('tutorial_state')
    .get('features')
    .onsuccess = (e) => console.log(e.target.result);
```

## Zukünftige Erweiterungen

- [ ] Tutorial-Skip Option
- [ ] Tutorial-Replay Button in Settings
- [ ] Animierte Pfeile für Richtungshinweise
- [ ] Sound-Effekte beim Tutorial-Start
- [ ] Gamification: "Tutorial-Master" Achievement
