# 02_Startpunkt_Index_und_Main.md - Wo alles beginnt 🏁

Moin Benjamin! 👋

Jedes Programm braucht einen Startknopf. Bei Webseiten ist das fast immer die `index.html`.

## 🏠 index.html - Der Hausplan
Stell dir die `index.html` als den Bauplan für dein Haus vor.
*   Sie sagt dem Browser: "Hier ist ein Knopf, da ist ein Bild, dort ist Text."
*   Aber am Anfang ist das Haus leer und dumm. Es weiß noch nichts.
*   Ganz unten in der Datei steht eine wichtige Zeile: `<script src="js/main.js"></script>`.
*   Das ist der Befehl: "Hol den Architekten (JavaScript) dazu!"

## 🧠 main.js - Der Dirigent
Sobald die `index.html` geladen ist, wacht die `main.js` auf.
Was macht sie?
1.  **Initialisierung:** Sie schaut nach, ob du schon mal da warst (Daten laden).
2.  **Aufbau:** Sie baut die Inhalte auf, die nicht fest im HTML stehen (z.B. deine aktuelle Gold-Anzahl).
3.  **Event Listeners:** Sie spitzt die Ohren. Klickst du auf "Aufgabe erledigen"? Die `main.js` hört das und reagiert.

## 🔄 Der Ablauf beim Starten
1.  Du öffnest die App.
2.  Browser lädt `index.html` (das Gerüst).
3.  Browser lädt `css/main.css` (die Farbe).
4.  Browser lädt `js/main.js` (das Gehirn).
5.  `main.js` fragt die Datenbank: "Wer ist dieser Nutzer und welches Level hat er?"
6.  Die App ist bereit! ✨

Das passiert alles in Millisekunden! ⚡
