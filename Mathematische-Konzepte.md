# Mathematische Konzepte in DailyQuest

Diese Dokumentation erklärt die Mathematik hinter DailyQuest in einfacher Sprache.

---

## Inhaltsverzeichnis

1. [Level-System](#level-system)
2. [Schwierigkeitsgrade](#schwierigkeitsgrade)
3. [Kampfsystem](#kampfsystem)
4. [Charakter-Werte](#charakter-werte)
5. [Zufall und Wahrscheinlichkeit](#zufall-und-wahrscheinlichkeit)
6. [Diagramme](#diagramme)
7. [Zeitberechnung](#zeitberechnung)

---

## Level-System

### Wie funktioniert das Leveln?

Jedes Level braucht mehr Erfahrungspunkte (Mana) als das vorherige. Das sorgt dafür, dass das Spiel länger interessant bleibt.

**So wird berechnet, wie viel Mana für das nächste Level braucht:**

```
Mana = 100 × 1,5^(Level - 1)
```

**Beispiel:**
- Level 1 → 2: 100 Mana
- Level 2 → 3: 150 Mana
- Level 3 → 4: 225 Mana
- Level 4 → 5: 338 Mana

Jedes Level braucht also **50% mehr Mana** als das vorherige. Das nennt man **exponentielles Wachstum**.

| Level | Mana für dieses Level | Gesamt Mana |
|-------|----------------------|-------------|
| 1     | 100                  | 100         |
| 5     | 506                  | 1.319       |
| 10    | 3.844                | ~25.000     |
| 20    | ~222.000             | ~440.000    |

---

## Schwierigkeitsgrade

### Wie werden Quests schwerer?

Es gibt 5 Schwierigkeitsstufen. Bei höherer Stufe musst du mehr schaffen, bekommst aber auch mehr Belohnung.

**Zielwert berechnen:**
```
Neues Ziel = Altes Ziel × (1 + 0,4 × (Stufe - 1))
```

**Beispiel bei 10 Liegestützen als Basis:**

| Stufe | Rechnung | Neues Ziel |
|-------|----------|------------|
| 1     | 10 × 1,0 | 10         |
| 2     | 10 × 1,4 | 14         |
| 3     | 10 × 1,8 | 18         |
| 4     | 10 × 2,2 | 22         |
| 5     | 10 × 2,6 | 26         |

**Belohnungen:**
- Mana: +20% pro Schwierigkeitsstufe
- Gold: +15% pro Schwierigkeitsstufe

---

## Kampfsystem

### Wie wird Schaden berechnet?

**Dein Schaden:**
```
Dein Schaden = Basis-Schaden × (1 + Angriff ÷ 100)
```

**Beispiel:** 
- Basis-Schaden: 10
- Dein Angriff: 25
- Ergebnis: 10 × 1,25 = **13 Schaden**

Mehr Angriff = mehr Schaden (prozentual).

---

### Wie funktioniert Schutz?

Schutz reduziert den Schaden, den du bekommst:

```
Erhaltener Schaden = Monster-Schaden × (1 - Schutz ÷ 100)
```

**Wichtig:** Schutz wirkt nur bis maximal 80%. Du kannst also nicht unverwundbar werden.

**Beispiel:**
- Monster macht 20 Schaden
- Dein Schutz: 50
- Ergebnis: 20 × 0,5 = **10 Schaden**

---

### Wie werden Monster stärker?

Mit jedem Dungeon-Level werden Monster stärker:

| Wert | Formel |
|------|--------|
| Monster HP | Basis-HP × (1 + 0,18 × (Level - 1)) |
| Monster Schaden | Basis-Schaden × (1 + 0,15 × (Level - 1)) |

**Beispiel Level 10:**
- HP: 2,62× so viel wie am Anfang
- Schaden: 2,35× so hoch wie am Anfang

---

### Extra HP durch Schutz

Deine maximalen HP steigen mit deinem Schutz:

```
Max HP = Basis-HP × (1 + Schutz ÷ 100)
```

**Bonus:** Pro Schutz-Punkt bekommst du **+1% HP**.

---

## Charakter-Werte

### Wie steigen die Stats?

Es gibt 5 Stats: Kraft, Ausdauer, Beweglichkeit, Durchhaltevermögen, Willenskraft.

Für jede Stat-Erhöhung brauchst du eine bestimmte Anzahl Punkte:

| Schwierigkeit | Punkte für Haupt-Stats | Punkte für Willenskraft |
|---------------|------------------------|-------------------------|
| 1             | 5,5                    | 4,5                     |
| 2             | 5,0                    | 4,0                     |
| 3             | 4,5                    | 3,5                     |
| 4             | 4,0                    | 3,0                     |
| 5             | 3,5                    | 2,5                     |

**Tipp:** Willenskraft ist immer 0,5 Punkte leichter zu erhöhen als die anderen Stats.

---

### Durchhaltevermögen wird halbiert

Punkte für Durchhaltevermögen zählen nur halb:

```
Tatsächliche Punkte = Erhaltene Punkte × 0,5
```

Das verhindert, dass dieser Stat zu schnell steigt.

---

## Zufall und Wahrscheinlichkeit

### Dungeon erscheint zufällig

Beim App-Start gibt es eine **5% Chance** auf ein Dungeon:

```
Wenn Zufallszahl < 0,05 → Dungeon erscheint
```

Das bedeutet: Im Durchschnitt kommt **1 von 20 Starts** ein Dungeon.

---

### Zufällige Quest-Auswahl

Quests werden zufällig ausgewählt. Dafür wird eine bewährte Methode namens **Fisher-Yates-Shuffle** verwendet. Das sorgt dafür, dass jede Quest die gleiche Chance hat, ausgewählt zu werden.

---

## Diagramme

### Radar-Diagramm (Stats-Übersicht)

Deine 5 Stats werden als Fünfeck angezeigt:

- Jeder Stat bekommt eine Ecke
- Alle Ecken sind gleich weit vom Mittelpunkt entfernt (72° auseinander)
- Je höher der Stat, desto weiter außen liegt der Punkt

**Berechnung der Position:**
```
X = Mittelpunkt_X + Radius × cos(Winkel)
Y = Mittelpunkt_Y + Radius × sin(Winkel)
```

Das ergibt ein schönes rundes Diagramm.

---

### Liniendiagramm (Gewichtsverlauf)

Das Gewichts-Diagramm zeigt deinen Fortschritt über die Zeit:

- **X-Achse:** Zeit (von links nach rechts)
- **Y-Achse:** Gewicht (von unten nach oben)

Die Punkte werden mit geraden Linien verbunden. So siehst du auf einen Blick, ob du zu- oder abnimmst.

---

### Farben abdunkeln

Für verschiedene Linien im Diagramm werden Farben automatisch abgedunkelt:

```
Neue Farbe = Alte Farbe × (1 - Prozent)
```

Beispiel: Bei 20% Abdunklung wird aus hellem Blau ein dunkleres Blau.

---

## Zeitberechnung

### Countdown anzeigen

Ein Countdown wird in Stunden, Minuten und Sekunden aufgeteilt:

```
Stunden = Gesamtzeit ÷ (1000 × 60 × 60)
Minuten = Rest ÷ (1000 × 60)
Sekunden = Rest ÷ 1000
```

**Beispiel:** 90.000 Millisekunden = 1 Minute und 30 Sekunden

---

### Fokus-Belohnung

Für Fokus-Zeit bekommst du Ausdauer-Punkte:

```
Ausdauer = Minuten ÷ 40 (abgerundet)
```

**Beispiel:** 
- 40 Minuten Fokus = 1 Ausdauer-Punkt
- 80 Minuten Fokus = 2 Ausdauer-Punkte

---

## Zusammenfassung

| Konzept | Wofür? | Einfach erklärt |
|---------|--------|-----------------|
| **Exponentielles Wachstum** | Level | Jedes Level braucht 50% mehr Mana |
| **Lineare Skalierung** | Schwierigkeit | Pro Stufe +40% Zielwert |
| **Prozentrechnung** | Kampf | +Angriff = +Schaden in % |
| **Winkelberechnung** | Radar-Chart | 360° ÷ 5 Stats = 72° pro Stat |
| **Zufallszahlen** | Dungeons | 5% Chance = 1 von 20 |
| **Division** | Fokus | 40 Minuten = 1 Ausdauer-Punkt |

---
