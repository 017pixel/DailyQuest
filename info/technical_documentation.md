# Technische Dokumentation - DailyQuest

DailyQuest ist eine Progressive Web App (PWA), die auf modernen Webtechnologien basiert. Das Ziel ist eine performante, cloud-synchronisierte Anwendung mit lokaler Datenspeicherung fuer maximale Performance.

## 1. Architektur-Übersicht

Die App folgt dem Prinzip der "Separation of Concerns" (Aufgabentrennung). Der Code ist in spezialisierte Module unterteilt:

- **database.js**: Zentrale Schnittstelle zur IndexedDB. Verwaltet alle lokalen Datenbankoperationen.
- **supabase-config.js & supabase-client.js**: Cloud-Synchronisation, Authentifizierung und Account-Management.
- **ui.js**: Steuert die Anzeige und Interaktion.
- **main.js**: Einstiegspunkt und Koordination der App-Logik.
- **Modulare Seiten (js/page_*.js)**: Jede Ansicht (Shop, Charakter, Dungeons) hat ihre eigene Logik-Datei.

## 2. Progressive Web App (PWA)

DailyQuest nutzt PWA-Features, um eine App-ähnliche Erfahrung im Browser zu bieten:

- **Service Worker**: Ermoeglicht Offline-Faehigkeit durch Caching aller statischen Assets (HTML, CSS, JS, Bilder). Verwendet eine "Cache First"-Strategie.
- **Web App Manifest**: Definiert Name, Icons und Startverhalten fuer die Installation auf dem Startbildschirm.

## 3. Datenpersistenz: Hybrid-Architektur (IndexedDB + Supabase)

DailyQuest nutzt eine zweistufige Datenarchitektur:

### Lokale Ebene: IndexedDB
- **Strukturierte Daten**: Speicherung komplexer JavaScript-Objekte.
- **Performance**: Sofortiger Zugriff ohne Netzwerk-Latenz.
- **Asynchronitaet**: Verhindert das Blockieren des Main-Threads waehrend Datenbankzugriffen.
- **Datenintegritaet**: Nutzung von Transaktionen fuer sichere Schreibvorgaenge.

### Cloud-Ebene: Supabase (PostgreSQL)
- **Cross-Device Sync**: Daten sind auf allen Geraeten verfuegbar.
- **Automatische Sicherung**: Kein Datenverlust bei Geraetewechsel oder Cache-Leeren.
- **RLS (Row Level Security)**: Jeder User sieht nur seine eigenen Daten.
- **Anonymous Tracking**: Auch nicht-registrierte User senden Daten (nur fuer Tracking, kein Cross-Device Sync).
- **Sync-Strategie**: Debounced (5s) + periodisch (2min) + bei Tab-Verlassen.

## 4. CSS-Architektur und Design-System

Das Styling basiert auf einem modularen CSS-Ansatz:

- **CSS Variablen**: Zentrale Definition von Farben und Abständen für einfache Anpassbarkeit.
- **Responsive Design**: Mobile-First Ansatz mit Media Queries für optimale Darstellung auf allen Geräten.
- **Keyframe Animationen**: Flüssige Übergänge für UI-Elemente und Kampfeffekte.

## 4. Externe Bibliotheken

Um die App schlank zu halten, wurden externe Abhaengigkeiten minimiert:

- **Supabase Client (CDN)**: Authentifizierung und Cloud-Datenbank via CDN fuer GitHub Pages Kompatibilitaet.
- **Chart.js**: Zur Visualisierung von Charakter-Stats (Radar-Diagramm) und Gewichtsverlauf.
- **Material Symbols Rounded**: Einheitliche Icons via Webfont.
- **Vanilla JS**: Keine Frameworks wie React oder Vue, um maximale Performance und Lerneffekte zu erzielen.

## 5. Sicherheit

- **RLS (Row Level Security)**: In Supabase aktiviert. Jeder User kann nur seine eigenen Daten lesen/schreiben.
- **Anon Key**: Im Frontend wird ausschliesslich der publishable Anon Key verwendet. Der Service Role Key ist niemals im Client-Code enthalten.
- **XSS-Schutz**: Alle User-Inputs werden vor der DOM-Einfuegung escaped.
- **Anonymous Auth**: Supabase Anonymous Sign-In ermoeglicht Tracking ohne persoenliche Daten.
