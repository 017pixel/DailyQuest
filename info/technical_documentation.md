# Technische Dokumentation - DailyQuest

DailyQuest ist eine Progressive Web App (PWA), die auf modernen Webtechnologien basiert. Das Ziel ist eine performante Anwendung mit rein lokaler Datenspeicherung fuer maximale Performance und Datenschutz.

## 1. Architektur-Übersicht

Die App folgt dem Prinzip der "Separation of Concerns" (Aufgabentrennung). Der Code ist in spezialisierte Module unterteilt:

- **database.js**: Zentrale Schnittstelle zur IndexedDB. Verwaltet alle lokalen Datenbankoperationen.
- **backup.js**: Lokaler Export und Import von Backups als JSON-Datei. Das Format bleibt kompatibel mit DailyQuest-Next.
- **ui.js**: Steuert die Anzeige und Interaktion.
- **main.js**: Einstiegspunkt und Koordination der App-Logik.
- **Modulare Seiten (js/page_*.js)**: Jede Ansicht (Shop, Charakter, Dungeons) hat ihre eigene Logik-Datei.

## 2. Progressive Web App (PWA)

DailyQuest nutzt PWA-Features, um eine App-ähnliche Erfahrung im Browser zu bieten:

- **Service Worker**: Ermoeglicht Offline-Faehigkeit durch Caching aller statischen Assets (HTML, CSS, JS, Bilder). Verwendet eine "Cache First"-Strategie.
- **Web App Manifest**: Definiert Name, Icons und Startverhalten fuer die Installation auf dem Startbildschirm.

## 3. Datenpersistenz: Lokal in IndexedDB

DailyQuest speichert alle Daten lokal im Browser:

### Lokale Ebene: IndexedDB
- **Strukturierte Daten**: Speicherung komplexer JavaScript-Objekte.
- **Performance**: Sofortiger Zugriff ohne Netzwerk-Latenz.
- **Asynchronitaet**: Verhindert das Blockieren des Main-Threads waehrend Datenbankzugriffen.
- **Datenintegritaet**: Nutzung von Transaktionen fuer sichere Schreibvorgaenge.
- **Kein Cloud-Sync**: Es gibt keine Synchronisation zwischen Geraeten. Backups laufen ueber Export und Import als JSON-Datei in den Einstellungen.

## 4. CSS-Architektur und Design-System

Das Styling basiert auf einem modularen CSS-Ansatz:

- **CSS Variablen**: Zentrale Definition von Farben und Abständen für einfache Anpassbarkeit.
- **Responsive Design**: Mobile-First Ansatz mit Media Queries für optimale Darstellung auf allen Geräten.
- **Keyframe Animationen**: Flüssige Übergänge für UI-Elemente und Kampfeffekte.

## 4. Externe Bibliotheken

Um die App schlank zu halten, wurden externe Abhaengigkeiten minimiert:

- **Chart.js**: Zur Visualisierung von Charakter-Stats (Radar-Diagramm) und Gewichtsverlauf.
- **Material Symbols Rounded**: Einheitliche Icons via Webfont.
- **Vanilla JS**: Keine Frameworks wie React oder Vue, um maximale Performance und Lerneffekte zu erzielen.

## 5. Sicherheit

- **Lokal zuerst**: Alle Daten bleiben im Browser auf dem eigenen Geraet. Es werden keine Daten an Server gesendet.
- **XSS-Schutz**: Alle User-Inputs werden vor der DOM-Einfuegung escaped.
