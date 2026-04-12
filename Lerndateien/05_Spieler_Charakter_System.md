# 05_Spieler_Charakter_System.md - Dein virtuelles Ich 🦸‍♂️

Hallo Benjamin!

Hier geht es um das Herzstück des Spiels: Deinen Charakter.
Alles, was du tust, macht diesen Charakter stärker.

## 📊 Die Attribute (Werte)
Dein Charakter besteht technisch gesehen aus einem JavaScript-Objekt (einem Daten-Paket).
Darin stehen Werte wie:
*   **Level:** Wie weit du bist.
*   **XP (Erfahrung):** Wie viel du geleistet hast.
*   **Gold:** Deine Währung.
*   **Vitals:** (Optional) Dinge wie Energie oder Stimmung.

## 📈 Level Up Logik
Wie steigst du auf? Das ist pure Mathe! 🧮
1.  Jede Aufgabe gibt XP.
2.  Wir haben eine Formel (oft in `js/character/xp_logic.js` oder ähnlich), die sagt:
    *   "Für Level 1 brauchst du 100 XP."
    *   "Für Level 2 brauchst du 200 XP."
3.  Wenn deine aktuellen XP höher sind als das Ziel, macht es *Bling!* ✨
    *   Dein Level steigt um +1.
    *   Das XP-Ziel für das nächste Level wird höher (damit es schwieriger wird).

Wichtig: Diese Daten werden sofort in der Datenbank (`DQ_DB`) gespeichert, damit kein Fortschritt verloren geht.

## 🎨 Anzeige
Die Datei `js/ui.js` liest diese Werte ständig aus und aktualisiert die Balken oben auf dem Bildschirm. Wenn du 50% der XP hast, macht sie den Balken 50% breit. Ganz einfach! 😎
