# DailyQuest

> Verwandle dein tägliches Training in ein episches Rollenspiel. Steige im Level auf, sammle Ausrüstung und werde zur besten Version deiner selbst.

<div align="center">
  <img src="Screenshots%20f%C3%BCr%20README/Main%20Page%20-%20Daily%20Quests.png" alt="Daily Quests Overview" width="380" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
</div>

---

## Über das Projekt

DailyQuest ist eine Progressive Web App (PWA), die darauf abzielt, die Motivation für Sport und produktive Gewohnheiten durch konsequente Gamification zu steigern. Das Projekt wurde im Rahmen von **Jugend forscht 2026** entwickelt und kombiniert moderne Webtechnologien mit psychologischen Motivationsmodellen.

Die Kernidee basiert auf dem "System"-Konzept aus dem Webtoon Solo Leveling: Alltägliche Aufgaben werden in Quests verwandelt, die Erfahrungspunkte (Mana), Gold und Charakterfortschritt bringen.

### DailyQuest V2

DailyQuest 2 wird als neue Version mit modernisiertem Dashboard, Admin-Bereich und Convex-Datenbank vorbereitet. Die bestehende Open-Source-Version bleibt weiterhin nutzbar und behaelt Supabase-Sync fuer bestehende Nutzer bei.

- Neue Version: [dailyquest-next.vercel.app](https://dailyquest-next.vercel.app)
- Migrationspfad: Export aus DailyQuest 1 und Import in DailyQuest 2

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

## Tests

Das Projekt enthaelt eine Test-Suite mit 18 spezialisierten Modultests. Alle Tests werden mit Node.js ausgefuehrt:

```bash
node tests/run.js
```

| # | Test | Bereich | Beschreibung |
|---|------|---------|--------------|
| 01 | `syntax` | Syntax | Prueft jede .js-Datei im Projekt auf syntaktische Korrektheit |
| 02 | `data-structure` | Daten | Validiert Exercises, Achievements, Dungeons, Translations auf Vollstaendigkeit |
| 03 | `translations` | Lokalisierung | Stellt sicher, dass alle DE/EN-Keys paarweise existieren und konsistent sind |
| 04 | `pure-functions` | Logik | Unit-Tests fuer ageBand, difficulty-Multiplikator, scaleReps, formatDuration etc. |
| 05 | `settings` | Konfiguration | Default-Werte, Typen, Validierung der User-Settings |
| 06 | `html-ids` | DOM | Prueft, dass alle `getElementById`-Aufrufe in JS ein HTML-Gegenstueck haben |
| 07 | `css-themes` | Styling | Stellt sicher, dass alle CSS-Variablen in Dark, Light und OLED definiert sind |
| 08 | `training-plans` | Daten | Validiert Trainingsplaene, Slots, Stages und Goal-Aliases |
| 09 | `service-worker` | PWA | Cache-Name, Precache-URLs auf Existenz, Manifest-Validierung |
| 10 | `streak-penalty` | Spiellogik | Streak-Berechnung, Penalty-Reset, Level-Up-Progression, Stat-Gains |
| 11 | `onboarding-equipment` | Einrichtung | Onboarding-Daten und Equipment-Auswahl |
| 12 | `endurance-no-log` | Spiellogik | Direkter Abschluss von Ausdauer-Quests ohne Pflichtprotokoll |
| 13 | `update-safety` | Migration | Schutz bestehender Plaene und Daten bei Updates |
| 14 | `exercise-completion-flow` | Spiellogik | Persistenz, Belohnungen und Character-Aktualisierung beim Abschluss |
| 15 | `ai-plan-import` | Daten | Validierung und Normalisierung importierter KI-JSON-Plaene |
| 16 | `daily-quest-completion-flow` | Spiellogik | Funktionale Abschlussmatrix fuer Tap-, Fokus-, Ausdauer-, Satz- und Timer-Quests |
| 17 | `backup-restore` | Daten | Legacy-Import, Streak-Fortsetzung, Extra-Quest-Bereinigung und atomarer Restore |
| 18 | `preset-plan-overlay` | UI | Oeffnen, Schliessen, Zuruecknavigation und Auswahl von Standardplaenen |

Die Tests decken Syntax, Datenintegritaet, alle Daily-Quest-Abschlussarten, Backup-Restores, UI-Konsistenz und PWA-Infrastruktur ab.

---

## Technologien und Sicherheit

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Datenbank**: Supabase (PostgreSQL) fuer Cloud-Synchronisation + IndexedDB fuer lokale Performance.
- **PWA**: Offline-Funktionalitaet durch Service Worker und Web App Manifest.
- **Visualisierung**: Chart.js fuer dynamische Diagramme.
- **Cloud-Sync**: Automatische Synchronisation aller Daten ueber Supabase. Cross-Device-Zugriff mit E-Mail-Account oder anonymes Tracking.
- **Datenschutz**: Daten werden sicher in der Cloud gespeichert. RLS (Row Level Security) stellt sicher, dass nur der jeweilige User seine eigenen Daten sehen kann.

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
