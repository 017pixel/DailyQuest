# Changelog - DailyQuest

Hinweis: Dieser Changelog dokumentiert die wichtigsten technischen und inhaltlichen Updates der Anwendung.

---

## Version 2.7.0 - Timer Feature & Buttons

### Erstellt
- Neues Timer-Popup für zeitbasierte Übungen (Plank, Side Plank, Hollow Body Hold, etc.)
- 5-Sekunden Countdown mit "GO!" Anzeige vor dem Start
- Web Worker für präzise Zeitmessung (läuft im Hintergrund weiter)
- Warnung beim Schließen des Popups während Timer läuft
- Grüne Kauf-Buttons im Shop für bessere Sichtbarkeit
- Grüne Ausrüsten-Buttons im Inventar

### Verändert
- Timer-Popup zeigt 65% der Bildschirmgröße
- Progress-Bar zeigt den Timer-Fortschritt
- Start/Pause/Fortsetzen/Geschafft-Buttons implementiert
- Senior-Modus Bug behoben (zeigt wieder 6 statt 3 Aufgaben)
- Mana und Gold Werte mehrerer Übungen angepasst
- Muskelaufbau-Pool bereinigt (Plank-Varianten entfernt)
- App-Version auf 2.7.0 erhöht

### Gelöscht
- Alte Plank-Varianten aus dem Muskelaufbau-Training (Core-Slot)

---

## Version 2.6.0 - Rentnermodus Modernisierung

### Erstellt
- 11 neue einfache Senior-Übungen hinzugefügt (arm_circles, leg_raises_seated, neck_stretch, wrist_circles, calf_stretch, shoulder_shrugs, deep_breathing, finger_spreads, knee_lifts, side_stretch)
- Tiefes Atmen als neue Übung für Entspannung
- Deutsche und englische Übersetzungen für alle neuen Übungen

### Verändert
- Rentnermodus komplett vereinfacht: keine Phasen mehr, nur noch eine tägliche Phase
- Spaziergänge zeigen keine Sätze/Wdh mehr, nur noch einmal abhaken
- Phase-Banner im Rentnermodus deaktiviert (weniger verwirrend)
- Phase-Badges im Info-Popup für Senior ausgeblendet
- Alle Senior-Übungen auf einfaches Abhaken umgestellt
- Training Plan auf tap-Modul umgestellt (direkt abhaken statt Sätze zählen)
- App-Version auf 2.6.0 erhöht
- Datenbank-Version auf 34 erhöht

### Gelöscht
- Alte Phasen im Rentnermodus (Sanfter Einstieg, Stabiler Aufbau, etc.)
- Phasen-Fortschritts-Balken im Rentnermodus

---

## Version 2.5.4 - Settings Redesign & Many Improvements

### Erstellt
- Einstellungen komplett überarbeitet mit 5 Tabs (Main, Gewicht, Training, Extras, Teilen)
- Neues Teilen-Feature mit QR-Code zum Teilen der App
- Set-Animationen beim Training (Zahlen animieren beim Klicken)
- Phasenfortschritt zeigt jetzt wie viel der Phase abgeschlossen ist
- Unendlich-Symbol für die finale Phase

### Verändert
- Tab-Wechsel mit fließender Höhen-Animation
- Pop-up-Animationen von unten (wie andere Pop-ups)
- Einstellungen öffnen und schließen mit Slide-Effekt
- Hampelmänner aus Muscle-Trainingsplan entfernt
- Ausdauer-Eintrag ohne Power-Feld
- Notizen nur noch bei Lauf-Übungen (Joggen, Walken)
- Tutorial-Neuanfang funktioniert wieder zuverlässig

### Gelöscht
- Veraltetes Power-Feld im Ausdauer-Eintrag
- Externe QR-Code-Bibliothek (jetzt lokal eingebunden)
- Scrollbereich in den Settings-Tabs

---

## Version 2.5.3 - Tutorial Reset Fix

### Dungeon-Feature Erweiterung
- **Zufällige Dungeons**: Implementierung einer 5% Wahrscheinlichkeit beim App-Start für ein Dungeon-Erscheinen.
- **Kampfsystem**: Gegner werden durch physische Übungen (Liegestütze, Squats, Sit-Ups) besiegt.
- **Skalierung**: Einführung dynamischer Monster-Stats, die mit dem Spieler-Level wachsen.
- **Belohnungen**: Mana-Steine und Mana (XP) als Belohnung für erfolgreiche Kämpfe.
- **Persistente HP**: Lebenspunkte werden zwischen Kämpfen gespeichert, was strategisches Vorgehen erfordert.
- **Monster-Typen**: Einführung von Schattenwolf, Höhlenbär und Morast-Zombie mit individuellen Eigenschaften.

### Design und UX
- **Material Symbols**: Vollständige Umstellung aller Icons auf Material Symbols Rounded für ein professionelles Design.
- **Animationen**: Neue Kampf-Animationen und visuelles Treffer-Feedback.
- **Screen Damage**: Visueller Effekt bei erlittenem Schaden zur Steigerung der Immersion.

### Technische Updates
- **Datenbank Version 27**: Neue Tabelle 'dungeon_progress' für die Speicherung des Fortschritts.
- **Service Worker v9**: Optimierter Cache für alle neuen Dungeon-Grafiken und Assets.
- **Spawn-Logik**: Fix der Zufallsberechnung für Dungeon-Erscheinungen.

---

## Version 2.2 - Dungeon Update

### Streak-Freeze Feature
- **Shop-Kategorisierung**: Streak Freezes wurden in die neue Kategorie 'Weiteres' verschoben.
- **Item-Überarbeitung**: Umbenennung von Items für bessere Konsistenz (z.B. Drachenrobe, Götter-Aura).
- **Inventar-Limit**: Begrenzung auf maximal 2 Streak Freezes gleichzeitig.
- **Automatischer Verbrauch**: Schutz der Streak bei verpassten Tagen durch automatische Nutzung.

### Balancing
- **Durchhaltevermögen**: Anpassung der Stat-Gewinne für besseres Langzeit-Balancing.
- **Zeit-Anzeige**: Umstellung von Sekunden auf Minuten in der Benutzeroberfläche für bessere Lesbarkeit.
- **Mobile Fixes**: Korrektur von Darstellungsfehlern in den Einstellungen auf Mobilgeräten.

---

## Version 2.1 - Home-Gym Revolution & Enhanced Experience

### Übungs-Bibliothek
- **Home-Gym Optimierung**: Komplette Überarbeitung der Übungen für die Nutzung mit Hanteln oder Eigengewicht.
- **Geräteunabhängigkeit**: Fokus auf Übungen, die keine komplexen Studiogeräte erfordern.

### Player-Label System
- **Adaptive Labels**: Einführung von 20 individuellen Titeln basierend auf den Spieler-Stärken.
- **Analyse-Logik**: Intelligente Vergabe von Labels wie 'Marathoner' oder 'Kraftprotz'.
- **Interaktive UI**: Tooltips zur Erklärung der verschiedenen Labels.

---

## Version 2.0 - Player Labels & Enhanced Training

- Erstmalige Einführung des Player-Label Systems.
- Erweiterung der Übungsbibliothek um über 10 neue Bewegungsformen.
- Optimierung der Restday-Erkennung und Anzeige.
- Performance-Verbesserungen bei der initialen Datenbank-Migration.

---

## Version 1.0 - Foundation

- Implementierung des Kern-Quest-Systems.
- Charakter-Stats und Ausrüstungs-Management.
- Fokus-Modul mit Pomodoro-Timer und Stoppuhr.
- Lokale Datenspeicherung mittels IndexedDB.
- Export- und Import-Funktion zur Datensicherung.
