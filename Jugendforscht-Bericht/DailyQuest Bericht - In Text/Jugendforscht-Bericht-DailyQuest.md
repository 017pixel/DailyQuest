# DailyQuest – Gamification als Motivationswerkzeug
## Eine Progressive Web App zur Steigerung der Alltagsproduktivität durch spielerische Elemente

**Jugend forscht 2026 – Fachgebiet: Mathematik/Informatik**

**Autor:** Benjamin  
**Projektdauer:** Über 5 Monate  
**Stand:** Dezember 2025

---

# 1. Projektübersicht (Abstract)

Die tägliche Motivation für Sport, Lernen und produktive Gewohnheiten stellt für viele Jugendliche und Erwachsene ein großes Problem dar. Klassische To-Do-Listen und Fitness-Apps bieten oft nur wenige Anreize und verlieren nach kurzer Zeit ihren motivierenden Effekt.

**DailyQuest** ist eine von mir entwickelte Progressive Web App (PWA), die dieses Problem durch konsequente Gamification löst. Die Kernidee: Alltägliche Aufgaben werden in "Quests" verwandelt, die Erfahrungspunkte (Mana), Gold und Charakterfortschritt bringen – genau wie in einem Rollenspiel.

Die technische Umsetzung erfolgte ausschließlich mit Webtechnologien (HTML5, CSS3, JavaScript) ohne externe Frameworks. Als Datenbank dient IndexedDB für lokale Datenspeicherung direkt im Browser des Nutzers. Nach einmaligem Öffnen mit Internetverbindung ist die App auch offline nutzbar, installierbar und läuft auf allen Geräten mit modernem Browser.

Das Hauptergebnis: Eine voll funktionsfähige Gamification-App mit Level-System, Streak-Tracking, Shop, Dungeon-Kämpfen und messbaren positiven Effekten bei allen Testpersonen über einen Zeitraum von 4 Monaten.

---

# Inhaltsverzeichnis

1. Projektübersicht (Abstract)
2. Fachliche Kurzfassung
3. Motivation und Fragestellung
4. Hintergrund und theoretische Grundlagen
5. Vorgehensweise, Materialien und Methoden
6. Ergebnisse
7. Ergebnisdiskussion
8. Fazit und Ausblick
9. Quellen
10. Anhang: Code-Beispiele

---

# 2. Fachliche Kurzfassung

## Technische Kernelemente

DailyQuest nutzt folgende Technik:

| Komponente | Technologie | Funktion |
|:-----------|:------------|:---------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Semantische Struktur, Styling mit Dark/Light-Theme, responsive Design, komplette Anwendungslogik |
| **Datenbank** | IndexedDB | Clientseitige NoSQL-Datenbank für lokale, private Datenspeicherung |
| **PWA-Features** | Service Worker, Web App Manifest | Offline-Fähigkeit, Caching, Installation auf Startbildschirm |
| **Visualisierung** | Chart.js | Radar-Diagramme für Stats, Linien-Diagramme für Gewichtsverlauf |
| **Icons** | Material Symbols Rounded | Einheitliches, professionelles Icon-Design |

## Gamification-Mechanik

Das Belohnungssystem folgt einem durchdachten XP-Algorithmus. Jede abgeschlossene Quest belohnt den Spieler mit Mana (Erfahrungspunkte), wobei die Menge von der Schwierigkeit der Aufgabe abhängt. Das Level-System verwendet eine exponentielle Skalierung, sodass höhere Level zunehmend mehr Mana erfordern. Dadurch bleibt der Fortschritt herausfordernd und motivierend.

Das Streak-System verfolgt die tägliche Nutzung der App. Längere, ununterbrochene Serien schalten besondere Achievements frei und verstärken so das Engagement. Gleichzeitig gibt es ein Strafsystem: Werden Quests verpasst, führt das zu Level- und Stat-Verlusten. Diese negativen Konsequenzen erhöhen die Verbindlichkeit. Zusätzlich bietet das Dungeon-System zufällige Kämpfe gegen Monster, die durch körperliche Übungen gewonnen werden müssen.

## Hauptziele des Projekts

Das Projekt hat vier zentrale Ziele. An erster Stelle steht die Steigerung der Motivation: Durch spielerische Elemente soll die dauerhafte Motivation für Alltags- und Sportaufgaben erhöht werden. Das zweite Ziel ist der Aufbau von Gewohnheiten. Mithilfe des Streak-Systems und täglicher Quests können Nutzer feste Routinen entwickeln.

Aus technischer Sicht will das Projekt ein hohes Niveau erreichen. Die App ist als PWA gebaut, bietet schnelle Ladezeiten, Offline-Fähigkeit und legt besonderen Wert auf Datenschutz. Schließlich soll die App einfach zu bedienen sein und auf allen Geräten funktionieren.

---

# 3. Motivation und Fragestellung

## 3.1 Persönliche Motivation

Die Idee zu DailyQuest entstand aus zwei Leidenschaften. Zum einen interessiere ich mich stark fürs Lernen, für Produktivität und für eine feste Tagesroutine. Zum anderen begeistere ich mich fürs Programmieren. Diese beiden Interessen wollte ich miteinander verbinden.

Als begeisterter Zuschauer des Animes **"Solo Leveling"** (나 혼자만 레벨업) – ich habe beide Staffeln geschaut – war ich fasziniert von der Idee eines "Systems", das dem Protagonisten tägliche Aufgaben gibt und ihn bei Erfüllung stärker werden lässt. Ich fragte mich: *Warum gibt es so etwas nicht im echten Leben?*

Bestehende To-Do-Apps und Fitness-Tracker haben ein grundlegendes Problem: Sie bieten keine echte Motivation. Man hakt Aufgaben ab, aber es fühlt sich nicht belohnend an. Nach wenigen Wochen verliert man das Interesse.

## 3.2 Die Lücke im Markt

Bei meiner Recherche fand ich zwar einige Gamification-Apps, aber keine erfüllte alle meine Anforderungen. Habitica beispielsweise ist zu komplex, erfordert einen Account und die Social-Features lenken eher ab als zu helfen. Klassische To-Do-Apps wie Todoist oder Microsoft To Do bieten keine echte Gamification – es gibt nur simple Häkchen zum Abhaken. Fitness-Apps wie Nike Training oder Freeletics fokussieren sich ausschließlich auf Sport und vernachlässigen die Bildung von allgemeinen Gewohnheiten.

Es fehlte also eine App, die komplett offline funktioniert (nach einmaligem Online-Öffnen) und keine Registrierung erfordert. Außerdem sollte sie alle Daten lokal im Browser des Nutzers halten und ein tiefes Gamification-System bieten – mit Level, Stats, Ausrüstung und Kämpfen. Die ideale App wäre auf Sport und allgemeine Produktivität ausgerichtet und hätte ein schlichtes, cleanes Design ohne Werbung oder In-App-Käufe.

## 3.3 Forschungsfrage

Aus diesen Überlegungen ergab sich meine zentrale Forschungsfrage:

> **„Kann die dauerhafte Nutzung von Gamification in einer Progressive Web App die Motivation und Produktivität im Alltag steigern und positive Veränderungen an einem bewirken?"**

Daraus ergaben sich auch einige untergeordnete Fragen: Welche Gamification-Elemente sind am wirksamsten? Kann eine PWA eine native App vollständig ersetzen? Und wie wichtig ist das Strafsystem für die Motivation?

---

# 4. Hintergrund und theoretische Grundlagen

## 4.1 Progressive Web Apps (PWA)

Eine Progressive Web App ist eine Webanwendung, die sich wie eine native App verhält. Der Begriff wurde 2015 von Google geprägt und beschreibt Websites, die bestimmte Eigenschaften erfüllen.

Eine PWA ist progressiv, das heißt sie funktioniert für jeden Nutzer unabhängig vom verwendeten Browser. Außerdem ist sie responsiv und passt sich an jede Bildschirmgröße an, egal ob Desktop, Tablet oder Smartphone. Ein wesentliches Merkmal ist die Offline-Fähigkeit: Die App funktioniert auch ohne Internetverbindung. Durch die App-Shell-Architektur fühlt sie sich wie eine native App an. Nutzer können die App zum Startbildschirm hinzufügen und installieren. Dank Service Worker bleibt die App immer aktuell, da automatische Updates ermöglicht werden.

### Technische Komponenten

#### Service Worker

Der Service Worker ist ein JavaScript-Skript, das im Hintergrund läuft und als Vermittler zwischen der App und dem Netzwerk arbeitet. Er ermöglicht:

```javascript
// Service Worker Registrierung
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registriert:', reg.scope))
            .catch(err => console.error('Service Worker Fehler:', err));
    });
}
```

**Caching-Strategie**: DailyQuest verwendet "Cache First". Das bedeutet, dass alle Dateien beim ersten Laden gespeichert und danach aus dem Speicher geladen werden. Das sorgt für sofortige Ladezeiten nach dem ersten Besuch und volle Funktion ohne Internet. Außerdem wird der Datenverbrauch deutlich weniger.

#### Web App Manifest

Das Manifest (manifest.json) stellt Metadaten bereit:

```json
{
    "name": "DailyQuest",
    "short_name": "DailyQuest",
    "start_url": ".",
    "display": "standalone",
    "background_color": "#121212",
    "theme_color": "#5f8575",
    "description": "Gamify your daily workouts and build your character.",
    "icons": [
        { "src": "icon.png", "sizes": "192x192", "type": "image/png" },
        { "src": "icon.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

### Vorteile gegenüber nativen Apps

| Aspekt | Native App | PWA (DailyQuest) |
|:-------|:-----------|:-----------------|
| Installation | App Store nötig | Direkt aus Browser |
| Speicherplatz | 50-200 MB | ~2 MB |
| Updates | Manuell durch Nutzer | Automatisch |
| Entwicklungszeit | Separate für iOS/Android | Eine Codebasis |
| Kosten | Developer Account nötig | Kostenlos |
| Offline-Nutzung | Ja | Ja |

## 4.2 Gamification-Theorie

### Definition

**Gamification** bezeichnet die Anwendung spieltypischer Elemente in einem spielfremden Kontext. Das Ziel ist, durch Belohnungsmechanismen die Motivation und das Engagement zu steigern.

Die Wirksamkeit von Gamification basiert auf mehreren psychologischen Prinzipien.

#### 1. Operante Konditionierung (B.F. Skinner)
Das Konzept der operanten Konditionierung besagt, dass Verhaltensweisen, die belohnt werden, häufiger wiederholt werden. DailyQuest belohnt jede abgeschlossene Quest mit Mana (Erfahrungspunkte), Gold (Währung) und Stat-Verbesserungen. Dadurch wird das gewünschte Verhalten positiv verstärkt.

#### 2. Variable Ratio Reinforcement
Unvorhersehbare Belohnungen sind motivierender als vorhersehbare. DailyQuest nutzt dieses Prinzip auf verschiedene Weisen: Es gibt Extra-Quests, die der Nutzer aktiv annehmen kann und die hohe Belohnungen bei höherem Risiko bieten. Außerdem erscheinen Dungeon-Encounters mit einer 5-prozentigen Spawn-Rate beim App-Start. Auch die unterschiedlichen Belohnungen je nach Übungstyp tragen zu diesem Effekt bei.

#### 3. Dopamin-basierte Feedback-Loops
Schnelles, positives Feedback aktiviert das Belohnungszentrum im Gehirn. DailyQuest nutzt dies durch sofortiges optisches Feedback bei Quest-Abschluss, Level-Up-Animationen und Streak-Counter-Updates. Diese direkten Reaktionen sorgen für regelmäßige Dopaminausschüttungen und halten die Motivation hoch.

#### 4. Zielsetzungstheorie (Locke & Latham)
Nach dieser Theorie führen spezifische, herausfordernde Ziele zu besserer Leistung. DailyQuest setzt dies um durch klar definierte tägliche Quests, langfristige Level-Ziele und ein Achievement-System für wichtige Meilensteine.

### Angewandte Gamification-Elemente in DailyQuest

| Element | Beschreibung | Psychologischer Effekt |
|:--------|:-------------|:-----------------------|
| **XP/Mana** | Erfahrungspunkte für Quests | Fortschrittsgefühl |
| **Level** | Aufstieg durch XP-Sammeln | Langzeitmotivation |
| **Streak** | Tägliche Aktivitätsserie | Verlustangst, Routine |
| **Stats** | Kraft, Ausdauer, etc. | Sichtbare Verbesserung |
| **Ausrüstung** | Kaufbare Items | Belohnungsgefühl |
| **Dungeons** | Kämpfe gegen Monster | Herausforderung, Spaß |
| **Achievements** | Freischaltbare Erfolge | Sammelreiz |
| **Strafen** | Konsequenzen bei Versagen | Negative Verstärkung |

## 4.3 Datenspeicherung im Web

### Lokale Speicheroptionen

Für die Speicherung von Nutzerdaten im Browser gibt es verschiedene Möglichkeiten:

| Methode | Speicherlimit | Datentypen | Asynchron |
|:--------|:--------------|:-----------|:----------|
| Cookies | ~4 KB | String | Nein |
| LocalStorage | ~5 MB | String | Nein |
| SessionStorage | ~5 MB | String | Nein |
| **IndexedDB** | **Dynamisch (GB)** | **Alle** | **Ja** |
| WebSQL | 50 MB | SQL | Ja |

Ich habe mich für IndexedDB entschieden, weil diese Technologie zahlreiche Vorteile bietet. Sie kann hunderte Megabyte bis Gigabyte speichern und unterstützt komplexe Objekte, nicht nur einfache Strings. Die asynchrone API blockiert nicht die Benutzeroberfläche, was für eine flüssige Nutzererfahrung sorgt. Außerdem garantieren Transaktionen durch ACID-Eigenschaften die Datenintegrität, und Indizes ermöglichen eine schnelle Suche.

### Datenschutz durch lokale Speicherung

Ein wichtiger Punkt bei DailyQuest ist der **Datenschutz**. Nutzer brauchen keinen Account und können sofort loslegen. Es gibt keine Cloud-Verbindung, alle Daten bleiben nur auf dem eigenen Gerät. Die App nutzt kein Tracking, keine Analyse-Tools und zeigt keine Werbung an. Gleichzeitig haben Nutzer durch Export- und Import-Funktionen die volle Kontrolle über ihre Daten.

Dieser Ansatz unterscheidet DailyQuest stark von vielen anderen Apps, die oft viele persönliche Daten sammeln.

---

# 5. Vorgehensweise, Materialien und Methoden

## 5.1 Materialien und Tools

### Entwicklungsumgebungen

Während der Entwicklung von DailyQuest habe ich verschiedene Entwicklungsumgebungen genutzt:

| Tool | Typ | Verwendungszweck |
|:-----|:----|:-----------------|
| **VS Code** | Code-Editor | Primäre Entwicklungsumgebung, Extensions für HTML/CSS/JS |
| **Cursor** | KI-unterstützter Editor | Code-Completion, Debugging-Hilfe |
| **Windsurf** | KI-IDE | Komplexe Refactorings, Code-Review |
| **Antigravity** | KI-IDE (Google) | Neueste Google-IDE mit KI-Unterstützung |
| **Warp.dev** | Terminal | Modernes Terminal mit KI-Unterstützung |

### Programmiersprachen und Technologien

| Sprache | Version | Einsatzbereich |
|:--------|:--------|:---------------|
| **HTML5** | - | Semantische Struktur, Accessibility |
| **CSS3** | - | Styling, Animationen, Themes (Dark/Light) |
| **JavaScript** | ES6+ | Anwendungslogik, DOM-Manipulation, IndexedDB-Interaktion |
| **JSON** | - | Konfiguration, Manifest, Datenexport |

### Bibliotheken und Frameworks

Das Projekt wurde bewusst als **„Vanilla“-Projekt** ohne große Frameworks umgesetzt. Als einzige externe Bibliothek kommt Chart.js für Diagramme zum Einsatz. Für ein einheitliches Icon-Design werden Material Symbols Rounded von Google als Webfont verwendet. Die bewusste Entscheidung gegen React, Vue oder Angular wurde getroffen, um einen maximalen Lerneffekt zu erzielen und die Performance zu optimieren.

## 5.2 Entwicklungsmethodik

### Agile Entwicklung

Die Entwicklung erfolgte Schritt für Schritt nach agilen Prinzipien. In der Sprint-Planung wurden wöchentliche Features definiert. Während der Umsetzung lag der Fokus jeweils auf einem Feature pro Sprint. Nach jeder Programmierung wurde sofort getestet. Basierend auf dem Nutzerfeedback wurden Anpassungen vorgenommen, und es gab regelmäßige Updates.

### Mobile-First-Design

Die App wurde zuerst für Smartphones optimiert. Dafür wurde der Viewport-Meta-Tag `<meta name="viewport" content="width=device-width, initial-scale=1">` eingesetzt. Für flexible Layouts kommen CSS Flexbox und Grid zum Einsatz. Die Oberfläche ist touch-optimiert mit großen Buttons und Swipe-Gesten. Die Anpassung an Desktop erfolgte nachträglich über responsive Breakpoints.

### Versionskontrolle

Für die Versionskontrolle kommt Git zur lokalen Versionierung zum Einsatz. GitHub dient als Remote-Repository für Backup und Veröffentlichung. Das Projekt folgt dem Semantic Versioning und hat die Versionen v1.0, v2.0, v2.1 und aktuell v2.2 durchlaufen.

## 5.3 Testverfahren

### Testpersonen

Die App wurde über einen Zeitraum von 4 Monaten von folgenden Personen getestet:

| Person | Alter | Trainingsziel | Testdauer |
|:-------|:------|:--------------|:----------|
| **Ich selbst** | Jugendlich | Muskelaufbau, Calisthenics | 5+ Monate |
| **Meine Mutter** | Erwachsen | Gewichtsverlust, Routine | 4 Monate |
| **Mein Bruder** | Jugendlich | Kraft, Motivation | 4 Monate |
| **Freunde** | Jugendlich | Verschiedene | 1-3 Monate |

### Testmethoden

Für das Testen der App wurden verschiedene Methoden genutzt. Im manuellen Testen wurden alle Features auf verschiedenen Geräten durchgespielt. Mit Browser-Emulatoren, insbesondere den Chrome DevTools, wurden verschiedene Bildschirmgrößen simuliert. Beim Cross-Browser-Testen wurde die App in Chrome, Firefox, Safari und Edge überprüft.

Besonders wichtig waren die Geräte-Kompatibilitätstests. Dabei wurde die App auf verschiedenen Smartphones, Tablets und Desktops geprüft, um herauszufinden, auf welchen Geräten sie am besten läuft. Die App wurde für möglichst viele Geräte optimiert, auch für solche mit geringerer Leistung – da sie browserbasiert ist, sind die Hardware-Anforderungen niedrig. Ergänzend dazu gab es regelmäßige Gespräche mit den Testpersonen, um ihr Nutzerfeedback einzuholen.

### Feedback-Erhebung

Da alle Testpersonen aus meinem direkten Umfeld stammen (Familie, Freunde), erfolgte die Feedback-Erhebung **mündlich** im persönlichen Gespräch. Es wurden keine Analytics-Tools oder automatische Datensammlung verwendet. Die Testpersonen berichteten mir direkt, was gut funktioniert und wo Probleme oder Bugs auftreten. Außerdem teilten sie ihre Verbesserungsvorschläge mit und beschrieben, wie motivierend sie die App finden.

---

# 6. Ergebnisse

## 6.1 Die Benutzeroberfläche (UI)

### Design-Philosophie

Das Design von DailyQuest folgt mehreren Grundideen. Das Dark-Theme ist der Standard, da es angenehm für die Augen ist und gut zum Gaming-Look passt. Die App orientiert sich am Material Design mit einheitlichen Icons und klaren Flächen. Das Layout passt sich automatisch an alle Bildschirmgrößen an. Insgesamt ist das Design einfach gehalten, damit man sich auf das Wichtigste konzentrieren kann.

### Farbpalette

| Farbe | Hex-Code | Verwendung |
|:------|:---------|:-----------|
| Hintergrund (Dunkel) | `#1a1a2e` | App-Background |
| Primär (Lila) | `#9d4edd` | Buttons, Highlights |
| Sekundär (Cyan) | `#00f5d4` | Akzente, Mana |
| Gold | `#ffd700` | Währung, Erfolge |
| Erfolg (Grün) | `#00ff88` | Positive Aktionen |
| Warnung (Rot) | `#ff4757` | Strafen, HP |

### Hauptseiten der App

#### Startseite (Daily Quests)
Die Startseite zeigt die aktuellen Daily Quests zusammen mit ihren Belohnungen an. Unten rechts befindet sich der Dungeon-Chip, sofern ein Dungeon aktiv ist. Beim Herunterscrollen werden weitere Übungen für freies Training angezeigt.

#### Charakter-Seite
Die Charakter-Seite enthält einen Streak-Counter, der die tägliche Aktivitätsserie anzeigt, sowie die Level- und Mana-Anzeige. Die Charakter-Stats werden in einem Radar-Diagramm visualisiert. Ein Player-Label wie zum Beispiel "Kraftprotz" oder "Marathoner" zeigt den Schwerpunkt des Trainings. Außerdem gibt es einen Inventar-Tab für die Ausrüstung und ein Gewichtsverlauf-Diagramm.

#### Extra-Quest
Beim Extra-Quest sind mehrere Herausforderungen pro Tag möglich. Eine Quest wird erst angenommen, wenn der Nutzer aktiv auf "Annehmen" klickt. Die Extra-Quests bieten große Belohnungen, bergen aber auch ein großes Risiko – man weiß vorher nicht, welche Quest kommt. Bei Scheitern drohen Strafen.

#### Shop
Im Shop werden kaufbare Waffen und Rüstungen angeboten, außerdem Mana-Steine als Verbrauchsgegenstände. Alle Items haben Preise in Gold. Bei jedem Item werden die Stat-Boni angezeigt.

#### Fokus-Modul
Das Fokus-Modul bietet einen Pomodoro-Timer und eine Stoppuhr-Funktion. Außerdem können verschiedene Kategorien wie Lernen oder Coding ausgewählt werden.

## 6.2 Code-Implementierung (Kern-Funktionen)

Die vollständigen Code-Beispiele zu den folgenden Abschnitten befinden sich im Anhang am Ende dieses Berichts.

### XP/Mana-zu-Level-Berechnung [1]

Ein wichtiges Designziel war es, die Schwierigkeit mit der Zeit zu steigern. Das Level-System sollte nicht immer gleich leicht bleiben, sondern den Nutzer kontinuierlich herausfordern. Dafür verwende ich eine mathematische Formel, die exponentiell skaliert.

Die Funktion `calculateLevel` nimmt die gesammelten Mana-Punkte und berechnet daraus das aktuelle Level. Der Faktor 0.1 und die Wurzelfunktion (`Math.sqrt`) bewirken, dass die ersten Level schnell erreicht werden, während höhere Level exponentiell mehr Mana erfordern. So braucht man für Level 1 nur 100 Mana, für Level 10 aber bereits 10.000 Mana. Diese steigende Schwierigkeit ist bewusst gewählt: Am Anfang soll der Nutzer schnelle Erfolge erleben, um motiviert zu bleiben. Mit der Zeit muss er jedoch mehr leisten, um weiterzukommen. So bleibt das Spiel auch nach Wochen und Monaten herausfordernd und verliert nicht seinen Reiz.

### Service Worker mit Cache-Strategie [2]

Der Service Worker ist das Herzstück der Offline-Funktionalität. Ich habe mich für diese Technologie entschieden, weil sie ermöglicht, die App auch ohne Internetverbindung zu nutzen – ein wichtiger Vorteil gegenüber normalen Websites.

Der Code funktioniert in zwei Phasen. Beim ersten Laden der App wird der `install`-Event ausgelöst. In diesem Moment werden alle wichtigen Dateien (HTML, CSS, JavaScript, Icons) in einen lokalen Cache gespeichert. Die Variable `CACHE_NAME` enthält eine Versionsnummer, die ich bei Updates erhöhe, damit alte Caches ersetzt werden. Beim `fetch`-Event – also bei jeder Netzwerkanfrage – prüft der Service Worker zuerst, ob die Datei bereits im Cache liegt. Falls ja, wird sie sofort von dort geladen, was die App extrem schnell macht. Nur wenn die Datei nicht gecached ist, wird sie aus dem Internet geholt. Diese "Cache-First"-Strategie habe ich gewählt, weil sie die beste Performance bietet und die App auch bei schlechter Internetverbindung zuverlässig funktioniert.

### IndexedDB Datenbank-Setup [3]

Für die dauerhafte Speicherung aller Nutzerdaten habe ich IndexedDB gewählt. Diese browsereigene Datenbank ist ideal für die App, weil sie große Datenmengen speichern kann und komplett lokal funktioniert – ohne Server oder Account.

Die Funktion `openDatabase` öffnet die Datenbank und gibt ein Promise zurück, das die weitere Verarbeitung ermöglicht. Die Versionsnummer (`DB_VERSION = 24`) ist wichtig: Bei jeder Änderung an der Datenbankstruktur erhöhe ich diese Nummer. Dann wird automatisch der `onupgradeneeded`-Event ausgelöst, der neue Object Stores anlegt. Die vier Stores (`character`, `quests`, `inventory`, `dungeon_progress`) speichern alle relevanten Spielerdaten. Der `keyPath: 'id'` sorgt dafür, dass jeder Datensatz eindeutig identifizierbar ist. Der Vorteil dieser Struktur: Alle Daten bleiben auch nach dem Schließen des Browsers erhalten, und der Nutzer hat volle Kontrolle über seine Daten durch Export- und Import-Funktionen.

### Dungeon-Kampfsystem [4]

Das Dungeon-System verbindet Training mit Spielspaß. Statt einfach nur Übungen abzuhaken, kämpft der Nutzer gegen Monster – und jede ausgeführte Wiederholung verursacht Schaden. Diese Verbindung macht das Training greifbarer und unterhaltsamer.

Die Funktion `attack` berechnet den Kampfverlauf. Je nach Übungstyp wird ein unterschiedlicher Schadenswert pro Wiederholung verwendet: Liegestütze verursachen 10 Schaden, weil sie anspruchsvoller sind, Situps nur 5 Schaden. Die unterschiedlichen Werte spiegeln die Intensität der Übungen wider. Zusätzlich kann der Spieler durch gekaufte Ausrüstung seinen Angriff verstärken (`attackBonus`). Das Monster schlägt zurück, aber die eigene Verteidigung kann den Schaden reduzieren – minimal jedoch auf 1 Schadenspunkt. Dadurch lohnt sich das Kaufen von Ausrüstung im Shop, und der Spieler hat einen weiteren Anreiz, Gold zu sammeln.

### Quest-Generierung basierend auf Trainingsziel [5]

Jeder Nutzer hat unterschiedliche Ziele: Muskelaufbau, Ausdauer, Gewichtsverlust oder Calisthenics. Die App generiert täglich passende Quests, die zum gewählten Trainingsziel passen.

Die Funktion `generateDailyQuests` erzeugt jeden Tag die täglichen Aufgaben. Zunächst werden die Nutzereinstellungen ausgelesen: Trainingsziel, Schwierigkeitsgrad und verfügbare Ausrüstung. Das Objekt `questPools` enthält für jedes Ziel passende Übungen – Muskelaufbau bekommt andere Übungen als Ausdauertraining. Die Anzahl der Quests variiert je nach gewähltem Schwierigkeitsgrad: Bei "hard" gibt es 6 Quests, bei "medium" 5, bei "easy" nur 4. Die Schleife wählt zufällig Übungen aus dem passenden Pool und berechnet für jede Quest die Wiederholungen, Mana-Belohnung und Gold. Diese personalisierte Generierung sorgt dafür, dass die App für verschiedene Nutzer und Fitnesslevel geeignet ist.

## 6.3 Geräte-Optimierung und Kompatibilität

Ein wichtiges Ziel bei der Entwicklung war die **breite Geräte-Kompatibilität**. Die App wurde auf verschiedenen Geräten getestet:

### Getestete Geräte

| Gerätetyp | Optimierungsgrad |
|:----------|:-----------------|
| **Smartphones** | Primär optimiert – beste Nutzungserfahrung |
| **Tablets/iPads** | Gut nutzbar – Layout passt sich an |
| **Desktop-PCs** | Funktioniert – responsive Design |

### Optimierungsmerkmale

Die App wurde mit einem Mobile-First Ansatz entwickelt und ist primär für Smartphones konzipiert und getestet. Das responsive Design passt sich an verschiedene Bildschirmgrößen an. Da die App browserbasiert ist, sind die Hardware-Anforderungen gering – sie benötigt keine leistungsstarke Hardware. Durch die Cache-Optimierung werden nach dem ersten Laden alle Assets gecached, was zu schnellen Ladezeiten führt.

### PWA-Funktionalität

Die App erfüllt alle Kriterien für eine Progressive Web App. Sie ist nach einmaligem Online-Öffnen offline nutzbar und kann zum Startbildschirm hinzugefügt werden. Ein gültiges Web App Manifest und ein registrierter Service Worker für Caching sind vorhanden.

---

# 7. Ergebnisdiskussion

## 7.1 Erfüllung der Forschungsfrage

**Forschungsfrage**: „Kann die durchgehende Nutzung von Gamification-Prinzipien in einer Progressive Web App die Motivation und Produktivität im Alltag deutlich verbessern?"

**Antwort: Ja, aber nicht bei jedem gleich.**

### Positive Effekte bei Testpersonen (nach 4 Monaten Nutzung)

| Person | Beobachtete Verbesserungen |
|:-------|:---------------------------|
| **Ich selbst** | Erlernen verschiedener Calisthenics-Skills, mehr Kraft, mehr Ausdauer, tägliche Motivation zum Training |
| **Meine Mutter** | Gewichtsverlust, Spaß am Training, Freude an der täglichen Routine, mehr Motivation |
| **Mein Bruder** | Gesteigerte Kraft, Spaß am täglichen Sport, Freude daran den Fortschritt im Gamification-Stil zu sehen |

### Wirksamste Gamification-Elemente

Basierend auf dem Feedback waren bestimmte Elemente besonders effektiv. Am stärksten wirkte das Streak-System: Die Angst, die Serie zu verlieren, war der stärkste Motivator. Auch der sichtbare Fortschritt durch Level-Anzeige und Stats gab konkretes Feedback und verstärkte die Motivation. Das Strafsystem erhöhte durch negative Konsequenzen die Verbindlichkeit. Außerdem sorgten die Dungeon-Kämpfe für Spaßfaktor und Abwechslung.

## 7.2 Technische Herausforderungen

### Herausforderung 1: Service Worker Debugging

**Problem**: Service Worker sind schwer zu debuggen, da sie in einem separaten Thread laufen und Änderungen nicht sofort sichtbar sind.

**Lösung**: Implementierung einer Versions-Nummer im Cache-Namen (`dailyquest-v6`) und "skipWaiting()" für sofortige Updates.

### Herausforderung 2: IndexedDB Komplexität

**Problem**: Die asynchrone API von IndexedDB ist komplex und fehleranfällig.

**Lösung**: Entwicklung einer Wrapper-Klasse (`dbHelper`) mit Promises für vereinfachten Zugriff.

### Herausforderung 3: Cross-Browser-Kompatibilität

**Problem**: Verschiedene Browser implementieren APIs unterschiedlich.

**Lösung**: Feature Detection und Fallbacks für ältere Browser.

### Herausforderung 4: Datenbank-Migrationen

**Problem**: Bei Updates mussten bestehende Nutzerdaten erhalten bleiben.

**Lösung**: Versioniertes Schema (DB_VERSION = 24) mit inkrementellen Migrationen in `onupgradeneeded`.

## 7.3 Stärken des Projekts

Das Projekt hat mehrere Stärken. Nach einmaligem Öffnen mit Internet funktioniert die App auch ohne Verbindung. Alle Daten werden lokal im Browser gespeichert – es gibt keine externen Server und keine Accounts. Die App bietet viele Features mit über 50 Übungen, Dungeons, einem Shop und Achievements. Das Design ist clean mit Dark Theme, Material Icons und Animationen – ohne Werbung oder In-App-Käufe. Die Verbesserung wurde bei allen Testpersonen festgestellt.

## 7.4 Schwächen und Kompromisse

Das Projekt hat auch einige Schwächen. PWAs können nur eingeschränkt Benachrichtigungen senden, daher gibt es keine echten Push-Notifications. Alle Daten existieren nur auf einem Gerät, da es keine Cloud-Synchronisation gibt. Social-Features wie Vergleich mit Freunden oder Challenges fehlen. Außerdem besteht eine Browser-Abhängigkeit: Das Löschen der Browser-Daten löscht auch die App-Daten.

## 7.5 Was ich heute anders machen würde

Rückblickend würde ich einiges anders machen. Statt JavaScript würde ich TypeScript verwenden, da es bessere Typ-Sicherheit bietet und zu weniger Bugs führt. Außerdem würde ich Firebase integrieren, um eine optionale Cloud-Speicherung für das Synchronisieren zwischen Geräten anzubieten. Automatisierte Unit-Tests wären von Anfang an sinnvoll gewesen. Schließlich würde ich CSS-Variablen von Beginn an konsequent für ein modulares CSS nutzen.

---

# 8. Fazit und Ausblick

## 8.1 Fazit

DailyQuest zeigt sehr gut, dass moderne Web-Technologien eine vollwertige App-Erfahrung liefern können. Die Nutzung von Spiele-Elementen hat bei allen Testpersonen zu echten Verbesserungen bei Motivation, Disziplin und körperlicher Fitness geführt.

Das Projekt beweist, dass Progressive Web Apps eine echte Alternative zu normalen Apps sind. Mit nur einem Programmcode läuft DailyQuest auf allen Geräten, braucht keinen App Store und schützt die privaten Daten der Nutzer, da alles lokal gespeichert wird.

Die wichtigste Erkenntnis: **Gamification funktioniert**, wenn man es richtig einbaut. Besonders das Streak-System und das Strafsystem haben sich als sehr starke Motivation erwiesen.

## 8.2 Ausblick

Die Entwicklung von DailyQuest ist nicht abgeschlossen. Für die Zukunft sind verschiedene Erweiterungen geplant.

### Kurzfristig (nächste 3 Monate)
In den nächsten drei Monaten soll die Web Push API integriert werden, um echte Benachrichtigungen für Quest-Erinnerungen zu ermöglichen. Außerdem sind weitere Dungeons mit neuen Monstern, Boss-Kämpfen und Story-Elementen geplant. Zusätzliche Achievements sollen mehr Meilensteine zum Freischalten bieten.

### Mittelfristig (6-12 Monate)
Mittelfristig ist eine Firebase Integration für optionale Cloud-Synchronisation zwischen Geräten vorgesehen. Multiplayer-Elemente wie Challenges gegen Freunde und Gilden sollen hinzugefügt werden. Außerdem ist ein Workout-Import für die Integration mit Fitness-Trackern geplant.

### Langfristig
Langfristig sollen native Apps über Capacitor im App Store und Play Store veröffentlicht werden. Eine KI-Integration für personalisierte Quest-Generierung basierend auf dem individuellen Fortschritt ist ebenfalls geplant. Schließlich sollen Community-Features eingeführt werden, mit denen Nutzer eigene Quests erstellen und Leaderboards nutzen können.

---

# 9. Quellen

## Inspiration

- App SelfQuest: https://selfquest.net/
- Anime Solo Leveling: https://www.crunchyroll.com/de/series/GDKHZEJ0K/solo-leveling

## Icons

- Google Icons: https://fonts.google.com/icons

## Editoren, KI Tools etc.

- https://code.visualstudio.com/
- https://cursor.com/download
- https://windsurf.com/
- https://www.warp.dev/
- https://aistudio.google.com/ 

---

**Projektseite:** Mein Github, https://github.com/017pixel/DailyQuest

**Letzte Aktualisierung:** Dezember 2025

---

# 10. Anhang: Code-Beispiele

## [1] XP/Mana-zu-Level-Berechnung

```javascript
// Level-Berechnung basierend auf Mana (XP)
function calculateLevel(mana) {
    // Exponentielle Skalierung: Jedes Level benötigt mehr Mana
    // Level 1: 100 Mana, Level 10: 10.000 Mana, usw.
    return Math.floor(0.1 * Math.sqrt(mana));
}

// Mana für nächstes Level berechnen
function manaForNextLevel(currentLevel) {
    const nextLevel = currentLevel + 1;
    return Math.pow(nextLevel / 0.1, 2);
}
```

## [2] Service Worker mit Cache-Strategie

```javascript
// service-worker.js (vereinfachter Auszug aus dem echten Code)
const CACHE_NAME = 'dailyquest-cache-v6';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components/buttons.css',
    '/css/pages/character.css',
    // ... weitere CSS-Dateien
    '/js/database.js',
    '/js/ui.js',
    '/main.js',
    // ... weitere JS-Dateien
    '/icon.png',
    '/manifest.json'
];

// Installation: Alle statischen Assets cachen
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching all app assets.');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch: Cache-First Strategie
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache-First: Schnell aus dem Cache laden, wenn verfügbar
                return response || fetch(event.request);
            })
    );
});
```

## [3] IndexedDB Datenbank-Setup

```javascript
// Datenbank-Initialisierung
const DB_NAME = 'DailyQuestDB';
const DB_VERSION = 24;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Object Stores erstellen
            if (!db.objectStoreNames.contains('character')) {
                db.createObjectStore('character', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('quests')) {
                db.createObjectStore('quests', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('inventory')) {
                db.createObjectStore('inventory', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('dungeon_progress')) {
                db.createObjectStore('dungeon_progress', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

## [4] Dungeon-Kampfsystem

```javascript
// Kampf-Logik
function attack(exerciseType, repetitions) {
    let damage = 0;
    
    // Schaden basierend auf Übungstyp
    switch(exerciseType) {
        case 'pushups':
            damage = repetitions * 10; // 10 Schaden pro Liegestütz
            break;
        case 'squats':
            damage = repetitions * 6;  // 6 Schaden pro Squat
            break;
        case 'situps':
            damage = repetitions * 5;  // 5 Schaden pro Situp
            break;
    }
    
    // Ausrüstungsbonus addieren
    damage += playerStats.attackBonus;
    
    // Schaden am Monster
    monster.hp -= damage;
    
    // Monster-Gegenangriff
    const monsterDamage = Math.max(1, monster.attack - playerStats.defense);
    player.hp -= monsterDamage;
    
    return { playerDamage: damage, monsterDamage };
}
```

## [5] Quest-Generierung basierend auf Trainingsziel

```javascript
// Tägliche Quest-Generierung
function generateDailyQuests(userSettings) {
    const { goal, difficulty, equipment } = userSettings;
    const quests = [];
    
    // Basis-Quests pro Ziel
    const questPools = {
        muscle: ['Bicep Curls', 'Deadlifts', 'Push-ups', 'Pike Push-ups'],
        endurance: ['Burpees', 'Mountain Climbers', 'Jump Squats'],
        fatloss: ['HIIT Training', 'Interval Sprints', 'Shadowboxing'],
        calisthenics: ['Pistol Squats', 'Diamond Push-ups', 'Hollow Body Hold']
    };
    
    // 4-6 Quests je nach Schwierigkeit
    const questCount = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4;
    
    // Zufällige Auswahl aus passendem Pool
    const pool = questPools[goal] || questPools.muscle;
    for (let i = 0; i < questCount; i++) {
        const exercise = pool[Math.floor(Math.random() * pool.length)];
        quests.push({
            name: exercise,
            reps: calculateReps(exercise, difficulty),
            mana: calculateMana(exercise),
            gold: calculateGold(exercise)
        });
    }
    
    return quests;
}
```

---
