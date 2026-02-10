# 04_Erfolge_und_Achievements.md - Deine Trophäensammlung 🏆

Hallo Benjamin! CodeX am Start.

Neben den täglichen Aufgaben gibt es noch etwas für langfristige Motivation: **Achievements (Erfolge)**.
Das ist wie bei der Xbox oder PlayStation – Trophäen für besondere Meilensteine.

## 🌟 Was sind Achievements?
Das sind Ziele, die du über lange Zeit erreichst.
Beispiele aus deinem Code:
*   **Sammler:** Sammle insgesamt 1000 Gold.
*   **Arbeitsbienen:** Erledige 50 Quests.
*   **Level-Meister:** Erreiche Level 10.

## ⚙️ Wie funktioniert das Tracking?
Das passiert in `js/page_achievements.js`.
Wir speichern im Hintergrund "Lebenslange Statistiken" (Total Stats) in deinem Charakter-Objekt:
*   `char.totalGoldEarned` (Alles Gold, das du je verdient hast)
*   `char.totalQuestsCompleted` (Alle erledigten Aufgaben)

Wenn du Gold verdienst, zählt ein Zähler im Hintergrund hoch: `+1`.

## 🔍 Der "Check" (Die Überprüfung)
Immer wenn sich etwas ändert (z.B. du bekommst Gold), ruft die App die Funktion `checkAchievement()` auf.
Die macht folgendes:
1.  **Vergleich:** "Hat Benjamin schon 1000 Gold gesammelt?"
    *   Ist `totalGoldEarned` (1050) >= `Ziel` (1000)?
2.  **Treffen:** JA! 🎉
3.  **Aktion:** 
    *   Setze den Erfolg auf `claimable` (abholbar).
    *   Zeige ein Popup: "Erfolg freigeschaltet!".

## 🥇 Stufen (Tiers)
Ein Erfolg ist nicht einfach vorbei. Wir haben **Stufen**.
Wenn du die "1000 Gold"-Medaille hast, schaltet sich automatisch die nächste Stufe frei: "Sammle 5000 Gold".
Das motiviert dich immer weiter!

## 🎁 Belohnungen
Nichts ist umsonst! Wenn du einen Erfolg "abholst" (`claimReward`), passiert das:
*   Du kriegst einen Haufen **Gold** 💰.
*   Du kriegst **Mana** ✨ (für spezielle Fähigkeiten).
*   Der Erfolg wird als "Erledigt" markiert und die nächste Stufe beginnt.

Das ist das Geheimnis, warum Spiele so süchtig machen – es gibt immer das nächste Ziel! 🎯
