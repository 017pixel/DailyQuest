# Exercises Pool - Funktions-Erklärung

## Übersicht
Der Exercises Pool enthält alle verfügbaren Übungen, die für Daily Quests und Extra Quests verwendet werden. Jede Übung ist einer Kategorie zugeordnet und enthält Metadaten für Quest-Generierung und Stat-Belohnungen.

## Relevante Dateien und Ordner

### Hauptdateien
- `data/exercises.js` - Pool-Definitionen
- `js/page_exercises.js` - Quest-Generierung

## Wichtige Punkte

### Exercise Struktur
```javascript
{
  id: "bicep_curls",
  nameKey: "exercise_bicep_curls",
  category: "muscle",
  type: "reps",             // reps, time, check, link, focus
  baseTarget: 10,           // Basis-Ziel für Difficulty 1
  baseMana: 20,             // Basis-Mana für Difficulty 1
  baseGold: 6,              // Basis-Gold für Difficulty 1
  statPoints: {
    kraft: 1                // Stat-Points pro Completion
  },
  difficultyScaling: 1.2,   // Target-Skalierung pro Difficulty
  equipment: [],           // Benötigte Ausrüstung
  instructionsKey: "exercise_bicep_curls_instructions"
}
```

### Kategorien
```javascript
EXERCISE_CATEGORIES = {
  muscle: {
    nameKey: "category_muscle",
    icon: "💪",
    goals: ["muscle"],
    restDay: false
  },
  endurance: {
    nameKey: "category_endurance",
    icon: "🏃",
    goals: ["endurance"],
    restDay: false
  },
  fatloss: {
    nameKey: "category_fatloss",
    icon: "🔥",
    goals: ["fatloss"],
    restDay: false
  },
  kraft_abnehmen: {
    nameKey: "category_kraft_abnehmen",
    icon: "🏋️",
    goals: ["muscle", "fatloss"],
    restDay: false
  },
  restday: {
    nameKey: "category_restday",
    icon: "🧘",
    goals: ["restday"],
    restDay: true
  },
  learning: {
    nameKey: "category_learning",
    icon: "📚",
    goals: ["learning"],
    restDay: false
  },
  calisthenics: {
    nameKey: "category_calisthenics",
    icon: "🤸",
    goals: ["muscle"],
    restDay: false
  },
  sick: {
    nameKey: "category_sick",
    icon: "🤒",
    goals: ["sick"],
    restDay: true
  },
  general_workout: {
    nameKey: "category_general",
    icon: "⚡",
    goals: ["muscle", "endurance"],
    restDay: false
  }
};
```

### Vollständiger Exercise Pool (Beispiel)
```javascript
EXERCISES = {
  muscle: [
    {
      id: "bicep_curls",
      nameKey: "exercise_bicep_curls",
      type: "reps",
      baseTarget: 10,
      baseMana: 20,
      baseGold: 6,
      statPoints: { kraft: 1 },
      difficultyScaling: 1.2
    },
    {
      id: "pushups",
      nameKey: "exercise_pushups",
      type: "reps",
      baseTarget: 15,
      baseMana: 22,
      baseGold: 7,
      statPoints: { kraft: 1, ausdauer: 0.3 },
      difficultyScaling: 1.15
    },
    {
      id: "pullups",
      nameKey: "exercise_pullups",
      type: "reps",
      baseTarget: 8,
      baseMana: 25,
      baseGold: 8,
      statPoints: { kraft: 1.5 },
      difficultyScaling: 1.25
    },
    {
      id: "squats",
      nameKey: "exercise_squats",
      type: "reps",
      baseTarget: 20,
      baseMana: 18,
      baseGold: 5,
      statPoints: { kraft: 1, ausdauer: 0.5 },
      difficultyScaling: 1.1
    },
    {
      id: "dips",
      nameKey: "exercise_dips",
      type: "reps",
      baseTarget: 12,
      baseMana: 22,
      baseGold: 6,
      statPoints: { kraft: 1 },
      difficultyScaling: 1.2
    },
    {
      id: "shoulder_press",
      nameKey: "exercise_shoulder_press",
      type: "reps",
      baseTarget: 10,
      baseMana: 20,
      baseGold: 6,
      statPoints: { kraft: 1 },
      difficultyScaling: 1.2
    }
  ],

  endurance: [
    {
      id: "running",
      nameKey: "exercise_running",
      type: "time",
      baseTarget: 600,       // 10 Minuten in Sekunden
      baseMana: 25,
      baseGold: 8,
      statPoints: { ausdauer: 1, durchhaltevermoegen: 0.3 },
      difficultyScaling: 1.1
    },
    {
      id: "jumping_jacks",
      nameKey: "exercise_jumping_jacks",
      type: "reps",
      baseTarget: 100,
      baseMana: 15,
      baseGold: 4,
      statPoints: { ausdauer: 0.8, beweglichkeit: 0.3 },
      difficultyScaling: 1.15
    },
    {
      id: "burpees",
      nameKey: "exercise_burpees",
      type: "reps",
      baseTarget: 15,
      baseMana: 30,
      baseGold: 10,
      statPoints: { ausdauer: 1.5, kraft: 0.5 },
      difficultyScaling: 1.3
    },
    {
      id: "high_knees",
      nameKey: "exercise_high_knees",
      type: "time",
      baseTarget: 300,
      baseMana: 18,
      baseGold: 5,
      statPoints: { ausdauer: 1 },
      difficultyScaling: 1.1
    }
  ],

  fatloss: [
    {
      id: "mountain_climbers",
      nameKey: "exercise_mountain_climbers",
      type: "time",
      baseTarget: 180,
      baseMana: 20,
      baseGold: 6,
      statPoints: { ausdauer: 0.8, durchhaltevermoegen: 0.5 },
      difficultyScaling: 1.15
    },
    {
      id: "plank",
      nameKey: "exercise_plank",
      type: "time",
      baseTarget: 60,
      baseMana: 22,
      baseGold: 7,
      statPoints: { kraft: 0.5, durchhaltevermoegen: 1 },
      difficultyScaling: 1.2
    },
    {
      id: "jump_rope",
      nameKey: "exercise_jump_rope",
      type: "time",
      baseTarget: 300,
      baseMana: 25,
      baseGold: 8,
      statPoints: { ausdauer: 1, beweglichkeit: 0.3 },
      difficultyScaling: 1.1
    }
  ],

  learning: [
    {
      id: "reading",
      nameKey: "exercise_reading",
      type: "focus",
      baseTarget: 15,        // 15 Minuten Fokus
      baseMana: 30,
      baseGold: 10,
      statPoints: { willenskraft: 1.5 },
      difficultyScaling: 1.0
    },
    {
      id: "language_learning",
      nameKey: "exercise_language",
      type: "time",
      baseTarget: 1800,     // 30 Minuten
      baseMana: 35,
      baseGold: 12,
      statPoints: { willenskraft: 1 },
      difficultyScaling: 1.0
    },
    {
      id: "coding",
      nameKey: "exercise_coding",
      type: "focus",
      baseTarget: 30,
      baseMana: 40,
      baseGold: 15,
      statPoints: { willenskraft: 1.5, kraft: 0.2 },
      difficultyScaling: 1.0
    }
  ],

  restday: [
    {
      id: "stretching",
      nameKey: "exercise_stretching",
      type: "time",
      baseTarget: 600,
      baseMana: 15,
      baseGold: 5,
      statPoints: { beweglichkeit: 1, willenskraft: 0.3 },
      difficultyScaling: 1.0,
      directStatGain: { beweglichkeit: 0.1 }
    },
    {
      id: "yoga",
      nameKey: "exercise_yoga",
      type: "time",
      baseTarget: 900,
      baseMana: 20,
      baseGold: 7,
      statPoints: { beweglichkeit: 0.5, willenskraft: 0.5 },
      difficultyScaling: 1.0
    },
    {
      id: "meditation",
      nameKey: "exercise_meditation",
      type: "focus",
      baseTarget: 10,
      baseMana: 25,
      baseGold: 8,
      statPoints: { willenskraft: 1 },
      difficultyScaling: 1.0
    },
    {
      id: "walking",
      nameKey: "exercise_walking",
      type: "time",
      baseTarget: 1800,
      baseMana: 12,
      baseGold: 4,
      statPoints: { ausdauer: 0.3, durchhaltevermoegen: 0.3 },
      difficultyScaling: 1.0
    }
  ],

  sick: [
    {
      id: "light_stretch",
      nameKey: "exercise_light_stretch",
      type: "time",
      baseTarget: 300,
      baseMana: 10,
      baseGold: 3,
      statPoints: { beweglichkeit: 0.5 },
      difficultyScaling: 1.0
    },
    {
      id: "deep_breathing",
      nameKey: "exercise_breathing",
      type: "check",
      baseTarget: 1,
      baseMana: 8,
      baseGold: 2,
      statPoints: { willenskraft: 0.5 },
      difficultyScaling: 1.0
    }
  ]
};
```

### Quest-Generierung
```javascript
function generateQuestsForCategory(category, count = 6, difficulty = 3) {
  const exercises = EXERCISES[category] || [];

  if (exercises.length === 0) {
    return [];
  }

  // Shuffle und Pick
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Skalierung basierend auf Difficulty
  const manaMultiplier = getManaMultiplier(difficulty);
  const goldMultiplier = getGoldMultiplier(difficulty);

  return selected.map(exercise => ({
    nameKey: exercise.nameKey,
    type: exercise.type,
    target: Math.round(exercise.baseTarget *
              Math.pow(exercise.difficultyScaling, difficulty - 1)),
    manaReward: Math.round(exercise.baseMana * manaMultiplier),
    goldReward: Math.round(exercise.baseGold * goldMultiplier),
    statPoints: exercise.statPoints,
    category: category
  }));
}

function getManaMultiplier(difficulty) {
  const multipliers = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.6, 5: 1.8 };
  return multipliers[difficulty];
}

function getGoldMultiplier(difficulty) {
  const multipliers = { 1: 1.0, 2: 1.15, 3: 1.3, 4: 1.45, 5: 1.6 };
  return multipliers[difficulty];
}
```

## Kategorie-Logik
```javascript
function getCategoryForGoal(goal, dayOfWeek, settings) {
  // Wenn explizites Goal gewählt
  if (goal && goal !== 'auto') {
    return getCategoryFromGoal(goal);
  }

  // Check ob Rest-Day
  const restDays = settings.restDays || 2;
  const isRestDay = dayOfWeek === 0 ||  // Sonntag
                   (restDays >= 7) ||   // Alle Tage Ruhetag
                   (restDays >= 1 && dayOfWeek === 6); // Samstag

  if (isRestDay) {
    return 'restday';
  }

  // Default: Muskel-Training
  return 'muscle';
}

function getCategoryFromGoal(goal) {
  const mapping = {
    'muscle': 'muscle',
    'endurance': 'endurance',
    'fatloss': 'fatloss',
    'kraft_abnehmen': 'kraft_abnehmen',
    'restday': 'restday',
    'learning': 'learning',
    'calisthenics': 'calisthenics',
    'sick': 'sick',
    'general_workout': 'general_workout'
  };
  return mapping[goal] || 'muscle';
}
```

## UI Components

### Free Exercises Page
```html
<div class="free-exercises-page">
  <div class="category-filter">
    ${Object.entries(EXERCISE_CATEGORIES).map(([key, cat]) => `
      <button class="category-btn ${selectedCategory === key ? 'active' : ''}"
              data-category="${key}">
        <span class="icon">${cat.icon}</span>
        <span class="name">${t(cat.nameKey)}</span>
      </button>
    `).join('')}
  </div>

  <div class="exercises-grid">
    ${currentExercises.map(exercise => `
      <div class="exercise-card"
           onclick="showExerciseDetails('${exercise.id}')">
        <div class="exercise-icon">
          ${getExerciseIcon(exercise)}
        </div>
        <div class="exercise-info">
          <h4>${t(exercise.nameKey)}</h4>
          <div class="exercise-meta">
            <span class="exercise-type">${t(`type_${exercise.type}`)}</span>
            <span class="exercise-target">${formatTarget(exercise)}</span>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
</div>
```

## Testing Checkliste

- [ ] Alle Kategorien haben Übungen
- [ ] Quest-Generierung nutzt korrekte Kategorien
- [ ] Schwierigkeits-Skalierung funktioniert
- [ ] Stat-Points werden korrekt zugewiesen
- [ ] Rest-Day Logik funktioniert
- [ ] Free Exercises Page zeigt alle Übungen
- [ ] Kategorie-Filter funktioniert
