# 10_Code_Architektur_Best_Practices.md - Sauberer Code 🏗️

Hallo Benjamin! Zum Abschluss etwas für Profis. 🤓

Warum ist der Code so aufgebaut, wie er ist? Damit wir nicht den Überblick verlieren!

## 🧩 Modulares System (Bausteine)
Wir schreiben nicht alles in eine riesige Datei. Das wäre Chaos.
Stattdessen haben wir kleine, spezialisierte Dateien:
*   `database.js` kümmert sich NUR um die Datenbank.
*   `ui.js` kümmert sich NUR um das Aussehen.
*   `character/` kümmert sich NUR um den Spieler.

Das nennt man **"Separation of Concerns"** (Trennung der Aufgaben).
Vorteil: Wenn der Shop kaputt ist, weißt du sofort: "Der Fehler muss in `page_shop.js` sein!" und musst nicht 3000 Zeilen Code durchsuchen.

## 🔄 DRY Prinzip (Don't Repeat Yourself)
Informatiker sind faul – auf eine gute Art.
Wenn wir einen Code zweimal brauchen (z.B. "Berechne XP"), schreiben wir ihn nur einmal als Funktion und rufen ihn immer wieder auf.
Wenn wir dann etwas ändern wollen, müssen wir es nur an einer Stelle tun.

## 🔮 Zukunftssicherheit
Dein Code ist so geschrieben, dass er wachsen kann.
Du kannst neue Seiten, neue Features oder neue Monster hinzufügen, ohne das Fundament kaputt zu machen.
Das unterscheidet ein "Bastel-Projekt" von professioneller Software.

Du hast hier eine solide Basis gebaut. Sei stolz drauf! 🚀
Dein CodeX.
