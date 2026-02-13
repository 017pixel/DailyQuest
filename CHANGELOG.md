# Changelog

> ⚠️ **Hinweis:** Nicht alle Änderungen wurden dokumentiert. Dieser Changelog enthält die wichtigsten Updates und Features.

---

## Version 2.3 - "Streak Freeze & Balance Update" (Aktuell)

### 💉 Neues Dungeon-Feature
- **Zufällige Dungeons:** Mit 5% Wahrscheinlichkeit beim App-Start erscheint ein Dungeon-Chip
- **Kampfsystem:** Besiege Monster durch das Absolvieren von Übungen (Liegestütze, Squats, Sit-Ups)
- **Skalierung:** Monster werden mit jedem besiegten Dungeon stärker
- **Belohnungen:** Erhalte Mana und Mana-Steine bei Sieg
- **Persistente HP:** Deine Lebenspunkte bleiben zwischen Kämpfen erhalten
- **Drei Monster-Typen:** Schattenwolf, Höhlenbär und Morast-Zombie mit individuellen Stats

### 🎨 Design-Verbesserungen
- **Material Symbols Integration:** Alle Icons nutzen nun Material Symbols Rounded statt Emojis
- **Dungeon-Animationen:** Flüssige Kampf-Animationen mit Monster-Hit und Gegenschlag-Effekten
- **Screen Damage Overlay:** Visuelles Feedback bei erlittenem Schaden
- **Floating Dungeon-Chip:** Elegantes Design für die Dungeon-Benachrichtigung

### 🔧 Technische Updates
- **Datenbank Version 27:** Neue `dungeon_progress` Tabelle für Dungeon-Fortschritt
- **Service Worker v9:** Aktualisierter Cache mit allen Dungeon-Assets
- **Spawn-Rate Fix:** Dungeons erscheinen jetzt korrekt nur mit 5% Wahrscheinlichkeit pro App-Start
- **Combat Cache:** Optimierte Charakter-Stats für Kampfberechnungen

---

## Version 2.2 - "Dungeon Update"

### 🧊 Neues Streak-Freeze Feature
- **Shop-Filter:** Streak Freeze wurde in die Kategorie "Weiteres" verschoben
- **Item-Renaming:** "Drachenhaut-Robe" → "Drachenrobe", "Unverwundbarkeits-Aura" → "Götter-Aura"
- **Limit:** Maximal 2 Streak Freezes gleichzeitig im Inventar
- **Verbrauch:** Bei verpasstem Tag wird 1 Freeze konsumiert und die Streak bleibt erhalten

### ⚖️ Balancing & UX
- **Durchhaltevermögen-Balancing:** Gewinne wurden halbiert
- **Zeit-Anzeige:** Zeit-Ziele als Minuten statt Sekunden dargestellt
- **Mobile Fix:** Einstellungs-Popup schließt beim Scrollen nicht mehr ungewollt

---

## Version 2.1 - "Home-Gym Revolution & Enhanced Experience"

### 🏠 Home-Gym Optimierung
- Komplett überarbeitete Übungsbibliothek für Hanteln, Langhantel oder Körpergewicht
- Keine speziellen Geräte mehr nötig

### 🏷️ Verbessertes Player-Label System
- 20 verschiedene Labels basierend auf deinen Stärken
- Intelligente Analyse und adaptive Farbgebung
- Interaktive Tooltips

### 🎨 UI/UX Verbesserungen
- Verstärkte Hintergrund-Animation
- Verbesserte Responsivität auf allen Bildschirmgrößen
- Intelligente Restday-Erkennung

### 🔧 Technische Verbesserungen
- Automatische Updates für neue Übungen
- Verbesserte Datenbank-Migration (DB Version 23)
- Service Worker Optimierung (v5)

---

## Version 2.0 - "Player Labels & Enhanced Training"

- Neues Player-Label System mit 20 verschiedenen Labels
- Erweiterte Übungsbibliothek mit 10+ neuen Übungen
- Verbesserte Restday-Erfahrung
- Technische Verbesserungen und Performance-Optimierungen

---

## Version 1.0 - "Foundation"

- Grundlegendes Level- und Quest-System
- Basis-Charakter-Stats und Ausrüstung
- Fokus-Modul mit Timer
- Gewichts-Tracking
- Erfolge-System
- Export/Import-Funktionalität
