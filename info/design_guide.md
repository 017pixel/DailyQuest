# Design Guide - DailyQuest

Ein konsistentes Design ist entscheidend für die Benutzererfahrung und Motivation. Dieser Guide beschreibt die visuellen Prinzipien von DailyQuest.

## 1. Farbpalette und CSS-Variablen

Das Design nutzt CSS-Variablen im `:root`-Bereich für maximale Flexibilität:

- `--bg-color`: Ein dunkles Blau/Grau für den Hintergrund (Dark-Theme-Standard).
- `--primary-color`: Ein kräftiges Lila für Buttons und Highlights.
- `--accent-color`: Ein Cyan-Ton für Stat-Anzeigen und Mana.
- `--text-color`: Off-White für gute Lesbarkeit bei geringem Kontraststress.
- `--danger-color`: Rot für Gesundheit und Warnungen.

## 2. Typografie und Icons

- **Schriftart**: Nutzung von systemeigenen serifenlosen Fonts für beste Performance.
- **Icons**: Verwendung von "Material Symbols Rounded". Dies bietet eine konsistente, moderne Ästhetik und ist effizienter als einzelne Bild-Icons.

## 3. Responsive Design (Mobile First)

DailyQuest ist primär für die Nutzung auf Smartphones konzipiert:

- **Media Queries**: Das Layout passt sich dynamisch an verschiedene Bildschirmbreiten an.
- **Flexbox & Grid**: Verwendung moderner Layout-Technologien für flexible Elemente.
- **Touch-Optimierung**: Große Interaktionsflächen und intuitive Abstände.

## 4. Animationen und Feedback

Visuelle Rückmeldung ist essenziell für die Gamification:

- **Hover-Effekte**: Buttons reagieren sanft auf Interaktion (nur Desktop).
- **Pop-Up Animationen**: Neue Fenster und Erfolgsmeldungen nutzen Einblend-Effekte.
- **Combat-Feedback**: Visuelle Treffereffekte während Dungeon-Kämpfen zur Verdeutlichung von Aktionen.

## 5. UI-Komponenten

- **Cards**: Inhalte werden in strukturierten Karten präsentiert, um Informationseinheiten klar zu trennen.
- **Buttons**: Konsistente Button-Stile für primäre und sekundäre Aktionen.
- **Modale Dialoge**: Fokus auf eine einzige Aufgabe oder Information bei Pop-Ups.
