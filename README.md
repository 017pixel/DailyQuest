# DailyQuest

> Verwandle dein tägliches Training in ein episches Rollenspiel. Steige im Level auf, sammle Ausrüstung und werde zur besten Version deiner selbst.

<div align="center">
  <img src="Screenshots%20f%C3%BCr%20README/Main%20Page%20-%20Daily%20Quests.png" alt="Daily Quests Overview" width="380" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
</div>

---

## Über das Projekt

DailyQuest ist eine Progressive Web App (PWA), die darauf abzielt, die Motivation für Sport und produktive Gewohnheiten durch konsequente Gamification zu steigern. Das Projekt wurde im Rahmen von **Jugend forscht 2026** entwickelt und kombiniert moderne Webtechnologien mit psychologischen Motivationsmodellen.

Die Kernidee basiert auf dem "System"-Konzept aus dem Webtoon Solo Leveling: Alltägliche Aufgaben werden in Quests verwandelt, die Erfahrungspunkte (Mana), Gold und Charakterfortschritt bringen.

---

## Kernfunktionen

### Gameplay-Mechanik

<div align="center">

| Feature | Beschreibung |
|---------|--------------|
| **Level-System** | Jede Aufgabe gibt Mana (XP). Steige auf und verbessere deine Werte. |
| **Tägliche Quests** | Automatisch generierte Aufgaben, angepasst an deine Ziele und Schwierigkeit. |
| **Strafsystem** | Verpasste Quests haben Konsequenzen für Level und Stats - Disziplin wird belohnt. |
| **Streak-System** | Tägliche Nutzung wird getrackt. Streak Freezes retten deine Serie in Notfällen. |
| **Extra-Quests** | Tägliche Herausforderungen mit hohem Risiko und hohen Belohnungen. |

</div>

### Charakter-System

<div align="center">
  <img src="Screenshots%20f%C3%BCr%20README/Character%20Seite.png" alt="Character Page" width="360" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin: 8px;">
</div>

- **Dynamische Stats**: Kraft, Ausdauer, Beweglichkeit, Durchhaltevermögen, Willenskraft.
- **Player-Labels**: Über 20 personalisierte Titel basierend auf deinen individuellen Stärken.
- **Ausrüstung**: Erwerbe Waffen und Rüstungen im Shop, um Boni für Kämpfe zu erhalten.
- **Fortschrittsvisualisierung**: Radar-Diagramme für Stats und Linien-Diagramme für Gewichtsverlauf.

### Training und Übungen

Über **50 Übungen** sind für das Home-Gym und Eigengewichtstraining optimiert:

<div align="center">

| Kategorie | Beispiele |
|-----------|-----------|
| Kraft | Bicep Curls, Deadlifts, Pistol Squats |
| Ausdauer | Burpees, Joggen, Hula Hoop |
| Fettverbrennung | Mountain Climbers, Shadowboxing |
| Körpergewicht | Push-ups, Plank, Hollow Body Hold |
| Fokus | Lernen, Sprachen, Coding (Timer-basiert) |
| Erholung | Spaziergänge, Dehnen, Lesen |

</div>

### Fokus-Modul

<div align="center">
  <img src="Screenshots%20f%C3%BCr%20README/Fokus%20Timer.png" alt="Focus Timer" width="360" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin: 8px;">
</div>

- Pomodoro-Timer und Stoppuhr für produktive Phasen.
- Kategorien-System zur Einordnung der Sessions.
- Belohnungen für abgeschlossene Fokus-Zeit zur Steigerung der Konzentration.

### Dungeons und Kampf

Mit einer Wahrscheinlichkeit von 5% erscheint beim App-Start ein Dungeon:

- **Monster-Typen**: Schattenwolf, Höhlenbär, Morast-Zombie mit skalierender Stärke.
- **Aktives Kampfsystem**: Besiege Gegner durch das Absolvieren realer physischer Übungen.
- **Strategie**: Nutze Ausrüstungs-Boni und verwalte deine persistenten HP.

---

## Dokumentation

Detaillierte Informationen zur Architektur, zum Design und zur Theorie hinter DailyQuest findest du hier:

- [Technische Dokumentation](info/technical_documentation.md) - Architektur, PWA und IndexedDB.
- [Design Guide](info/design_guide.md) - UI-Prinzipien, Farben und CSS-Struktur.
- [Gamification-Theorie](info/theories_gamification.md) - Psychologische Grundlagen und Motivationsmodelle.
- [Funktions-Erklärungen](Funktion-Erklaerungen/) - Detaillierte Beschreibungen einzelner App-Features.
- [Mathematische Konzepte](Mathematische-Konzepte.md) - Mathematische Prinzipien, Formeln und Algorithmen.

---

## Technologien und Sicherheit

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Datenbank**: IndexedDB für 100% lokale Datenspeicherung im Browser.
- **PWA**: Offline-Funktionalität durch Service Worker und Web App Manifest.
- **Visualisierung**: Chart.js für dynamische Diagramme.
- **Datenschutz**: Keine Accounts, kein Tracking, keine Cloud - alle Daten bleiben auf deinem Gerät.

---

## Installation

1. Öffne die App im Browser.
2. Wähle im Browser-Menü "Zum Startbildschirm hinzufügen".
3. Nutze DailyQuest als native App auf deinem Gerät.

---

## Changelog

Die vollständige Historie der Änderungen findest du in der [CHANGELOG.md](CHANGELOG.md).

---

<div align="center">
  <strong>DailyQuest</strong> - Wo jeder Tag ein Abenteuer ist!
</div>
