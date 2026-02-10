# 06_Aufgaben_und_Training.md - Dein Trainingsplan 📝

CodeX hier! Jetzt geht es an die Arbeit.

Der wichtigste Teil von DailyQuest sind deine Aufgaben. Ohne Aufgaben keine XP. So einfach ist das.

## 📋 Wo leben die Aufgaben?
Die Datei `js/page_exercises.js` oder `js/page_tasks.js` (je nach Version) kümmert sich um alles.
*   **Erstellung:** Wenn du eine Aufgabe wie "Laufen gehen" erstellst, wird ein neues Objekt (wie ein kleiner Zettel) erstellt.
*   **Speichern:** Dieser Zettel wandert sofort in die Datenbank (in den `exercises` Store).

## ✅ Der "Erledigt"-Button
Wenn du auf das grüne Häkchen klickst:
1.  **Check:** JavaScript prüft: Ist das eine tägliche Aufgabe oder eine einmalige?
2.  **Belohnung:** Es ruft die Funktion `addXP()` auf (ja, die haben wir wirklich so programmiert!).
3.  **Update:** Es sagt der Datenbank: "Diese Aufgabe wurde heute erledigt."
4.  **Effekt:** Ein Sound wird abgespielt ("Ding!") und Partikel fliegen über den Bildschirm 🎉.

## 🔁 Wiederholende Aufgaben (Daily Quests)
Das Besondere ist, dass manche Aufgaben jeden Tag neu kommen.
*   Die App merkt sich das Datum, wann du sie zuletzt gemacht hast.
*   Wenn du morgen früh aufwachst, sieht die App: "Oh, das Datum ist neu!" und setzt die Aufgabe zurück auf "nicht erledigt".

Das motiviert dich, jeden Tag produktiv zu sein! 💪
