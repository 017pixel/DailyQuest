# Technische Dokumentation - DailyQuest

DailyQuest ist eine Progressive Web App (PWA), die auf modernen Webtechnologien basiert. Das Ziel ist eine performante, offline-fähige Anwendung mit lokaler Datenspeicherung.

## 1. Architektur-Übersicht

Die App folgt dem Prinzip der "Separation of Concerns" (Aufgabentrennung). Der Code ist in spezialisierte Module unterteilt:

- **database.js**: Zentrale Schnittstelle zur IndexedDB. Verwaltet alle Datenbankoperationen.
- **ui.js**: Steuert die Anzeige und Interaktion.
- **main.js**: Einstiegspunkt und Koordination der App-Logik.
- **Modulare Seiten (js/page_*.js)**: Jede Ansicht (Shop, Charakter, Dungeons) hat ihre eigene Logik-Datei.

## 2. Progressive Web App (PWA)

DailyQuest nutzt PWA-Features, um eine App-ähnliche Erfahrung im Browser zu bieten:

- **Service Worker**: Ermöglicht Offline-Fähigkeit durch Caching aller statischen Assets (HTML, CSS, JS, Bilder). Verwendet eine "Cache First"-Strategie.
- **Web App Manifest**: Definiert Name, Icons und Startverhalten für die Installation auf dem Startbildschirm.

## 3. Datenpersistenz mit IndexedDB

Als primäre Datenbank wird IndexedDB verwendet. Dies bietet mehrere Vorteile gegenüber LocalStorage:

- **Strukturierte Daten**: Speicherung komplexer JavaScript-Objekte.
- **Großes Speichervolumen**: Ermöglicht das Speichern umfangreicher Trainingshistorien und Charakterdaten.
- **Asynchronität**: Verhindert das Blockieren des Main-Threads während Datenbankzugriffen.
- **Datenintegrität**: Nutzung von Transaktionen für sichere Schreibvorgänge.

## 4. CSS-Architektur und Design-System

Das Styling basiert auf einem modularen CSS-Ansatz:

- **CSS Variablen**: Zentrale Definition von Farben und Abständen für einfache Anpassbarkeit.
- **Responsive Design**: Mobile-First Ansatz mit Media Queries für optimale Darstellung auf allen Geräten.
- **Keyframe Animationen**: Flüssige Übergänge für UI-Elemente und Kampfeffekte.

## 5. Externe Bibliotheken

Um die App schlank zu halten, wurden externe Abhängigkeiten minimiert:

- **Chart.js**: Zur Visualisierung von Charakter-Stats (Radar-Diagramm) und Gewichtsverlauf.
- **Material Symbols Rounded**: Einheitliche Icons via Webfont.
- **Vanilla JS**: Keine Frameworks wie React oder Vue, um maximale Performance und Lerneffekte zu erzielen.
