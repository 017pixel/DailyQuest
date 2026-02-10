# 09_Design_System_CSS.md - Der Look & Feel 🎨

Hallo Benjamin! Dein CodeX hier.

Damit eine App Spaß macht, muss sie gut aussehen. Das ist die Aufgabe von CSS (Cascading Style Sheets) im Ordner `css/`.

## 🌈 Farben und Stimmung (Variablen)
Wir benutzen einen Trick: **CSS Variablen**.
Ganz oben in `main.css` (im `:root` Bereich) definieren wir unsere Farben:
*   `--primary-color`: Unser Haupt-Lila/Blau.
*   `--bg-color`: Das dunkle Hintergrund-Grau.
*   `--text-color`: Das Weiß für den Text.

Warum?
Wenn wir das Design ändern wollen (z.B. auf Rot), müssen wir nur *eine* Zeile ändern, und die ganze App ändert sich sofort! 🪄

## 📱 Responsive Design (Handy-Freundlich)
Deine App sieht auf dem Handy gut aus, weil wir "Media Queries" benutzen.
Das sind Regeln wie:
*   "Wenn der Bildschirm kleiner als 600px ist, mach die Schrift größer und stapel die Knöpfe übereinander."
Das nennt man **Mobile First** – wir denken zuerst ans Handy.

## ✨ Animationen
Kleine Bewegungen machen alles lebendig.
*   Wenn du über einen Knopf fährst (`:hover`), wird er heller.
*   Wenn ein Fenster aufgeht, ploppt es auf (`keyframes`).
Das fühlt sich "Smooth" und modern an, wie eine richtige App, nicht wie eine alte Webseite.
