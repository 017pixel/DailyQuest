# 03_Datenbank_und_Speichern.md - Das Elefanten-Gedächtnis 🐘

Hallo Benjamin! CodeX hier.

Hast du dich gefragt, warum deine XP noch da sind, wenn du den Browser schließt und wieder öffnest? Das ist die Magie der Datenbank.

## 🗄️ IndexedDB (Unsere Datenbank)
Wir benutzen etwas namens **IndexedDB**.
*   Das ist eine Datenbank, die **direkt in deinem Browser** lebt.
*   Wir brauchen keinen riesigen Server im Internet. Deine Daten gehören dir und bleiben auf deinem Gerät.

## 💾 Wie funktioniert das Speichern?
In der Datei `js/database.js` passiert folgendes:
1.  **Öffnen:** Die App klopft beim Browser an: "Ich brauche Zugriff auf die 'DailyQuest'-Datenbank."
2.  **Stores (Regale):** In der Datenbank gibt es verschiedene "Regale" (wir nennen sie *Object Stores*):
    *   `character`: Hier stehen dein Level, XP und Gold.
    *   `exercises`: Deine Aufgabenliste.
    *   `shop`: Gekaufte Items.
3.  **Transaktionen:** Wenn du Gold bekommst, starten wir eine "Transaktion". Das ist wie ein sicherer Briefumschlag. Entweder alles wird gespeichert, oder gar nichts (damit keine Fehler passieren).

## 🔄 LocalStorage vs. IndexedDB
Vielleicht hast du schon mal von "LocalStorage" gehört.
*   *LocalStorage* ist wie ein kleiner Zettel – gut für einfache Dinge (z.B. "Dark Mode: An").
*   *IndexedDB* ist wie ein Aktenschrank – viel mächtiger, schneller und besser für viele Daten (wie unsere ganzen Quests und Monster).

Deshalb sind deine Daten sicher, auch wenn du offline bist! 🛡️
