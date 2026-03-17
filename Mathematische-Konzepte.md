# Mathematische Konzepte in DailyQuest

Diese Dokumentation erläutert die mathematischen Prinzipien und Formeln, die im DailyQuest-Projekt verwendet werden.

---

## Inhaltsverzeichnis

1. [Level-System und Erfahrungspunkte](#level-system-und-erfahrungspunkte)
2. [Schwierigkeitsgrad-Skalierung](#schwierigkeitsgrad-skalierung)
3. [Kampfsystem](#kampfsystem)
4. [Stat-Berechnungen](#stat-berechnungen)
5. [Wahrscheinlichkeiten](#wahrscheinlichkeiten)
6. [Geometrie und Visualisierung](#geometrie-und-visualisierung)
7. [Zeitberechnungen](#zeitberechnungen)

---

## Level-System und Erfahrungspunkte

### Exponentielle Level-Kurve

Das Level-System basiert auf einer **exponentiellen Wachstumsfunktion**, um sicherzustellen, dass höhere Level zunehmend schwieriger zu erreichen sind:

```javascript
const getManaForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
```

**Formel:**
```
Mana für Level n = ⌊100 × 1,5^(n-1)⌋
```

| Level | Benötigtes Mana | Kumuliertes Mana |
|-------|-----------------|------------------|
| 1     | 100             | 100              |
| 2     | 150             | 250              |
| 3     | 225             | 475              |
| 4     | 338             | 813              |
| 5     | 506             | 1.319            |
| 10    | 3.844           | ~25.000          |
| 20    | ~222.000        | ~440.000         |

**Mathematisches Prinzip:** Geometrische Folge mit dem Quotienten q = 1,5

---

## Schwierigkeitsgrad-Skalierung

### Lineare Multiplikatoren für Quest-Ziele

Die Zielwerte für Quests skalieren linear mit dem Schwierigkeitsgrad (1-5):

```javascript
targetValue = Math.ceil(questTemplate.baseValue + (questTemplate.baseValue * 0.4 * (difficulty - 1)));
```

**Formel:**
```
Zielwert = ⌈Basiswert × (1 + 0,4 × (Schwierigkeit - 1))⌉
```

| Schwierigkeit | Multiplikator | Beispiel (Basis: 10) |
|---------------|---------------|----------------------|
| 1             | 1,0×          | 10                   |
| 2             | 1,4×          | 14                   |
| 3             | 1,8×          | 18                   |
| 4             | 2,2×          | 22                   |
| 5             | 2,6×          | 26                   |

### Belohnungs-Skalierung

**Mana-Belohnung:**
```javascript
manaReward = Math.ceil(baseMana × (1 + 0,2 × (difficulty - 1)))
```

**Gold-Belohnung:**
```javascript
goldReward = Math.ceil(baseGold × (1 + 0,15 × (difficulty - 1)))
```

---

## Kampfsystem

### Schadensberechnung (Spieler)

Der Spielerschaden skaliert prozentual mit dem Angriffs-Stat:

```javascript
calculatePlayerDamage(baseDamage) {
    return Math.round(baseDamage × (1 + (attack / 100)));
}
```

**Formel:**
```
Schaden = ⌊Basis-Schaden × (1 + Angriff/100)⌋
```

**Beispiel:** Bei 25 Angriff und 10 Basis-Schaden:
```
Schaden = ⌊10 × (1 + 25/100)⌋ = ⌊10 × 1,25⌋ = 13
```

### Schadensmitigation (Spieler)

Der Schutz-Stat reduziert erhaltenen Schaden mit einem Cap von 80%:

```javascript
calculateMonsterCounterDamage() {
    const mitigation = Math.max(0, Math.min(80, protection));
    return Math.round(monsterBaseDamage × (1 - mitigation / 100));
}
```

**Formel:**
```
Mitigation = clamp(Schutz, 0, 80)
Erhaltener Schaden = ⌊Monster-Schaden × (1 - Mitigation/100)⌋
```

### Monster-Skalierung nach Level

Monster-Stats skalieren linear mit dem Dungeon-Level:

```javascript
const scaleHp = Math.round(chosen.baseHp × (1 + 0,18 × (level - 1)));
const scaleDmg = Math.round(chosen.baseDmg × (1 + 0,15 × (level - 1)));
```

**Formeln:**
```
Monster HP = ⌊Basis-HP × (1 + 0,18 × (Level - 1))⌋
Monster Schaden = ⌊Basis-Schaden × (1 + 0,15 × (Level - 1))⌋
```

| Level | HP-Multiplikator | Schaden-Multiplikator |
|-------|------------------|----------------------|
| 1     | 1,00×            | 1,00×                |
| 5     | 1,72×            | 1,60×                |
| 10    | 2,62×            | 2,35×                |
| 15    | 3,52×            | 3,10×                |

### HP-Skalierung mit Schutz

Die maximalen HP werden durch Schutz erhöht:

```javascript
const scaledMaxHp = Math.round(playerHpMax × (1 + (protection / 100)));
```

**Formel:**
```
Max HP = ⌊Basis-HP × (1 + Schutz/100)⌋
```

**Bonus:** +1% HP pro Schutz-Punkt

---

## Stat-Berechnungen

### Stat-Progression Thresholds

Die benötigten Punkte für Stat-Erhöhungen variieren nach Schwierigkeitsgrad:

```javascript
const mainStatThresholds = { 1: 5.5, 2: 5, 3: 4.5, 4: 4, 5: 3.5 };
const willpowerThresholds = { 1: 4.5, 2: 4, 3: 3.5, 4: 3, 5: 2.5 };
```

**Prinzip:** Willenskraft ist bei allen Schwierigkeitsgraden um 0,5 leichter zu erhöhen.

### Durchhaltevermögen-Multiplikator

Stat-Punkte für Durchhaltevermögen werden mit 0,5 multipliziert:

```javascript
const durchhalteMultiplier = 0.5;
const gain = stat === 'durchhaltevermoegen' ? rawGain × durchhalteMultiplier : rawGain;
```

**Begründung:** Verhindert zu schnelles Wachstum dieses Stats im Vergleich zu anderen.

---

## Wahrscheinlichkeiten

### Dungeon-Spawn-Rate

Beim App-Start besteht eine **5%ige Wahrscheinlichkeit** für ein Dungeon-Ereignis:

```javascript
if (Math.random() < 0.05) {
    // Dungeon erscheint
}
```

**Mathematisches Prinzip:** Gleichverteilte Zufallszahl U(0,1)

### Fisher-Yates Shuffle

Quests werden zufällig ausgewählt mittels Fisher-Yates-Algorithmus:

```javascript
for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() × (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
}
```

**Eigenschaft:** Erzeugt eine gleichverteilte zufällige Permutation.

---

## Geometrie und Visualisierung

### Radar-Diagramm (Stats)

Die 5 Stats werden als regelmäßiges Fünfeck dargestellt:

**Winkelberechnung:**
```javascript
const angle = (i × 2 × Math.PI / numAxes) - (Math.PI / 2);
```

**Koordinatenberechnung:**
```javascript
x = centerX + radius × cos(angle)
y = centerY + radius × sin(angle)
```

**Polar zu kartesisch:**
- 360° werden in 5 gleich große Segmente geteilt (72° pro Stat)
- Startwinkel: -90° (nach oben zeigend)

### Kreisförmige Gitterlinien

```javascript
for (let level = 1; level <= levels; level++) {
    const levelRadius = (radius / levels) × level;
    // Zeichne konzentrische Fünfecke
}
```

### Lineares Diagramm (Gewichtsverlauf)

**X-Koordinate (zeitbasiert):**
```javascript
const getX = (index) => padding.left + (index / (data.length - 1)) × (totalWidth - padding.left - padding.right);
```

**Y-Koordinate (gewichtsbasiert):**
```javascript
const getY = (weight) => height - padding.bottom - ((weight - minWeight) / weightRange) × (height - padding.top - padding.bottom);
```

**Prinzip:** Lineare Interpolation zwischen Datenpunkten

### Farbabdunklung

```javascript
const darkenColor = (colorStr, percent) => {
    const factor = 1 - percent;
    r = Math.round(r × factor);
    g = Math.round(g × factor);
    b = Math.round(b × factor);
    return `rgb(${r}, ${g}, ${b})`;
};
```

**Formel:** `RGB_neu = RGB_alt × (1 - Prozent)`

---

## Zeitberechnungen

### Countdown-Zerlegung

```javascript
const hours = Math.floor(remainingTime / (1000 × 60 × 60));
const minutes = Math.floor((remainingTime % (1000 × 60 × 60)) / (1000 × 60));
const seconds = Math.floor((remainingTime % (1000 × 60)) / 1000);
```

**Prinzip:** Modulo-Arithmetik für Zeitkomponenten

### Fokus-Belohnung

```javascript
const enduranceGained = Math.floor(minutes / 40);
```

**Formel:** +1 Ausdauer pro 40 Minuten Fokus-Zeit

---

## Zusammenfassung der mathematischen Konzepte

| Konzept | Verwendung | Formel/Funktion |
|---------|------------|-----------------|
| **Exponentielles Wachstum** | Level-Kurve | f(x) = 100 × 1,5^x |
| **Lineare Skalierung** | Schwierigkeit, Monster-Stats | f(x) = a × (1 + k × x) |
| **Prozentuale Berechnung** | Schaden, Mitigation | Wert × (1 + %/100) |
| **Trigonometrie** | Radar-Chart | sin(), cos() |
| **Lineare Interpolation** | Diagramme | y = mx + b |
| **Modulo-Arithmetik** | Zeitberechnung | a mod n |
| **Zufallszahlen** | Dungeons, Shuffle | Math.random() |
| **Clamping** | Schutz-Cap | clamp(x, min, max) |
| **Rundungsfunktionen** | Alle Berechnungen | floor(), ceil(), round() |

---

*Diese Dokumentation basiert auf der Analyse der DailyQuest-Codebase (Stand: März 2026).*
