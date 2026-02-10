# 08_Belohnung_Shop_Items.md - Der Schatzmeister 💰

Hey Benjamin!

Was macht man mit hart verdientem Gold? Ausgeben!
Der Shop ist deine Belohnung für Disziplin.

## 🛍️ Der Laden (`page_shop.js`)
Der Shop ist eigentlich nur eine Liste von Items.
Jedes Item hat:
*   Einen `Namen` (z.B. "Heiltrank").
*   Einen `Preis` (z.B. 50 Gold).
*   Einen `Effekt` (z.B. +10 HP).
*   Ein `Bild`.

## 💳 Kaufen
Wenn du auf "Kaufen" klickst:
1.  **Geld-Check:** Hab ich genug Gold? (`if (playerGold >= itemPrice)`).
    *   Nein? Fehler-Sound. "Nicht genug Gold!" ❌.
    *   Ja? Weiter zu Schritt 2.
2.  **Transaktion:**
    *   Gold wird abgezogen (`playerGold - itemPrice`).
    *   Item wird deinem Inventar hinzugefügt.
3.  **Speichern:** Beides wird sofort in der Datenbank gesichert.

## 🎒 Das Inventar
Dein Inventar ist wie ein Rucksack. Es ist eine Liste (Array) in der Datenbank.
Wir können dort alles speichern: Tränke, Waffen, Rüstungen oder sogar Trophäen für besondere Leistungen.

Das System ist so gebaut, dass du später hunderte Items hinzufügen kannst, ohne den Code komplett neu zu schreiben! 💎
