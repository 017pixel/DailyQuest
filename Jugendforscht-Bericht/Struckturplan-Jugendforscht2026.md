

Dieser Plan folgt exakt der Struktur des Referenzberichts ("Auf der Spur des Wassers"), überträgt aber die Gliederungspunkte und Inhalte auf dein Informatik-Projekt (PWA Entwicklung).

1. Projektübersicht (Abstract)

Ziel: Kurze, prägnante Zusammenfassung des gesamten Projekts (ca. 1/2 Seite).

Inhalt: Das Problem der Motivation bei Alltagsaufgaben; Deine Lösung: DailyQuest PWA; Die technische Umsetzung (PWA, Gamification); Das Hauptergebnis (funktionierende App mit Levelsystem).

2. Fachliche Kurzfassung

Ziel: Detailliertere Zusammenfassung für die Fachjury (ca. 1 Seite).

Inhalt: Auflistung der technischen Kernelemente (Service Worker, LocalStorage, React Components) und der Gamification-Mechanik (XP-Algorithmus). Definiere die Hauptziele des Projekts.

3. Motivation und Fragestellung

Ziel: Dein "Warum" und die wissenschaftliche Kernfrage.

Inhalt:

Motivation: Dein persönliches Interesse an Produktivität und Gaming; die Lücke im Markt für motivierende To-Do-Apps.

Fragestellung: Formuliere eine klare Forschungsfrage, z.B.: "Kann die konsequente Anwendung von Gamification-Prinzipien in einer Progressive Web App die Motivation und Produktivität im Alltag von Jugendlichen signifikant steigern?"

4. Hintergrund und theoretische Grundlagen

Ziel: Erläuterung der technischen und psychologischen Basis.

Unterpunkte (Deine "Chemie-Theorie"):

4.1. Progressive Web Apps (PWA)

Erklärung der Technologie (Offline-Fähigkeit, Manifest, Service Workers).

Vorteile gegenüber nativen Apps.

4.2. Gamification-Theorie

Wie funktionieren Belohnungssysteme (XP, Level, Badges)?

Psychologischer Effekt von Feedback-Loops.

4.3. Datenpersistenz im Web

Erklärung von LocalStorage / IndexedDB.

Warum du diese Methode (statt einer Cloud-Datenbank) gewählt hast (z.B. Datenschutz, Einfachheit).

5. Vorgehensweise, Materialien und Methoden

Ziel: Beschreibung deines "Labor-Setups" und deines Entwicklungsprozesses.

Inhalt:

Materialien/Tools: Programmiersprache (JavaScript), Frameworks (React), Entwicklungsumgebung (VS Code), Versionskontrolle (Git/GitHub).

Methodik: Beschreibe dein Vorgehen (z.B. Agile Entwicklung, Mobile-First-Design).

Testverfahren: Wie hast du die App getestet (Freunde, eigene Nutzung, Browser-Emulatoren)?

6. Ergebnisse

Ziel: Darstellung der umgesetzten Features und des Codes.

6.1. Die Benutzeroberfläche (UI)

Screenshots der App (Dashboard, Level-Anzeige).

Erläuterung des Designs (Farbpalette, Responsive Design).

6.2. Code-Implementierung (Kern-Funktionen)

WICHTIG: Zeige hier deine besten, selbstgeschriebenen Funktionen (mit kurzen Erklärungen).

Beispiel A: XP-Berechnung: Funktion, die XP zu Level umrechnet.

const getLevelFromXP = (xp) => {
  // Exponentielle Skalierung, damit Level-Ups schwieriger werden
  return Math.floor(0.1 * Math.sqrt(xp)); 
};


Beispiel B: PWA-Registrierung: Wie der Service Worker registriert wird.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registriert:', reg.scope))
      .catch(err => console.error('SW Fehler:', err));
  });
}


6.3. Performance-Analyse (Lighthouse-Audit)

Vergleich: Dies sind deine "Messwerte" (wie Sauerstoff oder pH-Wert).

Methode: Audit mit Chrome Lighthouse (Performance, PWA, Accessibility).

Darstellung: Zeige den Screenshot der Ergebnisse und fasse sie in einer Tabelle zusammen:
| Kategorie | Score | Relevanz |
| :--- | :--- | :--- |
| Performance | 95+ | Schnelle Ladezeiten sind wichtig für UX. |
| PWA | 100 | Garantiert Offline-Fähigkeit und Installierbarkeit. |
| Accessibility | 100 | Die App ist für alle Nutzer bedienbar. |

7. Ergebnisdiskussion

Ziel: Kritische Auseinandersetzung mit deinen Ergebnissen.

Inhalt:

Funktionalität: Erfüllt die App die gestellte Fragestellung (Abschnitt 3)? Ja/Nein und warum.

Herausforderungen: Welche technischen Probleme gab es (z.B. Debugging des Service Workers, Speicherlimits von LocalStorage)?

Stärken: Was ist besonders gut gelungen (z.B. das Design, die Offline-Nutzung)?

Schwächen: Welche Kompromisse musstest du eingehen (z.B. keine echten Push-Notifications wie bei nativen Apps)?

Zukunft: Was würdest du jetzt anders machen?

8. Fazit und Ausblick

Ziel: Kurze Schlussfolgerung und Blick in die Zukunft.

Fazit: Fasse in zwei Sätzen die wichtigsten Erkenntnisse zusammen. Zum Beispiel: "DailyQuest demonstriert, dass moderne Web-Technologien eine vollwertige, motivierende App-Erfahrung liefern können und eine echte Alternative zur nativen Entwicklung darstellen."

Ausblick: Wie geht es weiter? (Z.B. Erweiterung um Cloud-Speicherung (Firebase!), Multiplayer-Elemente oder die Nutzung der Web Push API für Benachrichtigungen).

9. Danksagung

Kurze Erwähnung von Unterstützern (Lehrer, Familie, Test-Community).

10. Quellenverzeichnis

WICHTIG: Alle Quellen auflisten!

Technische Dokumentationen (MDN, React Docs).

Theoretische Quellen (Artikel zur Gamification).

Verwendete Bibliotheken und Tools (z.B. das Icon-Set).

Datum der letzten Abfrage (wie im Original-Bericht).