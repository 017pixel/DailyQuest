# 07_Der_Dungeon.md - Monster und Kämpfe ⚔️

Hallo Benjamin! Wer sagt, dass Programmieren kein Abenteuer ist?

Der Dungeon ist der Ort, wo du deine Stärke beweist. Hier wird aus trockener Logik spannende Action.

## 👹 Monster Generierung
In `js/dungeons/` passiert etwas Magisches.
*   Wir haben Listen von Monstern (Namen, Bilder, Stärke).
*   Wenn du einen Kampf startest, würfelt der Computer: Welches Monster kommt?
*   Je höher dein Level, desto stärker das Monster (Skalierung).

## 🛡️ Das Kampf-System (Rundenbasiert)
Das läuft so ab wie Stein-Schere-Papier, nur komplexer:
1.  **Du greifst an:** Dein Schaden (basierend auf deinem Level/Waffe) wird berechnet.
2.  **Monster Lebenspunkte (HP):** Dem Monster werden HP abgezogen.
3.  **Animaton:** Ein roter "Damage Text" fliegt hoch (-15 HP!).
4.  **Monster greift an:** Wenn es nicht tot ist, haut es zurück. Aua!

## 🎲 Zufall (RNG)
Wir nutzen `Math.random()` für den Zufall.
*   Kritischer Treffer? (Zufall < 10% Chance).
*   Ausweichen? (Zufall < 5% Chance).
Das macht jeden Kampf einzigartig.

## 🏆 Der Sieg
Wenn das Monster 0 HP hat:
*   Du bekommst Gold und XP (viel mehr als bei normalen Aufgaben).
*   Vielleicht droppt es ein Item (eher selten).
*   Du fühlst dich stark!

Das System ist flexibel: Wir können jederzeit neue Monster und Bosse hinzufügen! 🔥
