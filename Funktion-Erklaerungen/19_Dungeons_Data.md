# Dungeons Data - Funktions-Erklärung

## Übersicht
Die Dungeons Data-Datei enthält alle Dungeon-Definitionen, Monster-Daten und Task-Strukturen für das Kampfsystem. Diese Daten werden zur Laufzeit basierend auf dem Dungeon-Level skaliert.

## Relevante Dateien und Ordner

### Hauptdateien
- `data/dungeons.js` - Dungeon und Monster Definitionen
- `js/dungeons/page_dungeon_main.js` - Dungeon UI
- `js/dungeons/dungeon_combat.js` - Kampflogik

## Wichtige Punkte

### Dungeon Struktur
```javascript
{
  id: "forest_trial",
  nameKey: "dungeon_forest_trial",
  descriptionKey: "dungeon_forest_trial_desc",
  icon: "",
  backgroundImage: "forest_bg",
  difficulty: 1,           // Basis-Schwierigkeit
  monsters: [...],         // Monster-Array
  tasks: [...],           // Task-Array
  rewards: { ... },        // Basis-Belohnungen
  requiredLevel: 1        // Ab welchem Level verfügbar
}
```

### Monster Struktur
```javascript
{
  id: "shadow_wolf",
  nameKey: "monster_shadow_wolf",
  icon: "",
  sprite: "wolf_sprite.png",
  baseHp: 30,
  baseDamage: 8,
  attackSpeed: 1.0,       // Angriffe pro Runde
  weakness: "agility",     // Schwäche für mehr Schaden
  abilities: [            // Special Abilities
    {
      id: "howl",
      trigger: "on_hit",  // on_hit, on_death, periodic
      chance: 0.2,         // 20% Chance
      effect: {
        type: "debuff",
        stat: "accuracy",
        duration: 2,
        value: -0.1
      }
    }
  ],
  flavorTextKey: "monster_shadow_wolf_flavor"
}
```

### Task Struktur (Combat Actions)
```javascript
{
  id: "pushups",
  nameKey: "task_pushups",
  icon: "",
  baseDamage: 10,
  statScaling: {
    kraft: 0.5,           // +0.5 Schaden pro Kraft-Punkt
    ausdauer: 0.2
  },
  cooldown: 0,            // Runden bis wieder nutzbar
  type: "physical",       // physical, magical, special
  descriptionKey: "task_pushups_desc"
}
```

### Dungeon Definitionen
```javascript
const DUNGEONS = [
  {
    id: "forest_trial",
    nameKey: "dungeon_forest_trial",
    descriptionKey: "dungeon_forest_trial_desc",
    icon: "",
    backgroundImage: "forest_bg",
    difficulty: 1,
    requiredLevel: 1,
    monsters: [
      {
        id: "shadow_wolf",
        nameKey: "monster_shadow_wolf",
        icon: "",
        baseHp: 30,
        baseDamage: 8,
        attackSpeed: 1.0,
        weakness: "agility"
      },
      {
        id: "giant_rat",
        nameKey: "monster_giant_rat",
        icon: "",
        baseHp: 25,
        baseDamage: 6,
        attackSpeed: 1.5,
        weakness: "strength"
      },
      {
        id: "zombie",
        nameKey: "monster_zombie",
        icon: "",
        baseHp: 35,
        baseDamage: 7,
        attackSpeed: 0.8,
        weakness: "endurance"
      }
    ],
    tasks: [
      {
        id: "pushups",
        nameKey: "task_pushups",
        icon: "",
        baseDamage: 10,
        statScaling: { kraft: 0.5 }
      },
      {
        id: "squats",
        nameKey: "task_squats",
        icon: "",
        baseDamage: 8,
        statScaling: { kraft: 0.4, ausdauer: 0.2 }
      },
      {
        id: "situps",
        nameKey: "task_situps",
        icon: "",
        baseDamage: 6,
        statScaling: { kraft: 0.3 }
      },
      {
        id: "jumping_jacks",
        nameKey: "task_jumping_jacks",
        icon: "⭐",
        baseDamage: 5,
        statScaling: { ausdauer: 0.3, beweglichkeit: 0.2 }
      }
    ],
    rewards: {
      xp: 50,
      manaStones: 3,
      goldBonus: 10
    }
  },

  {
    id: "cave_of_darkness",
    nameKey: "dungeon_cave",
    descriptionKey: "dungeon_cave_desc",
    icon: "️",
    backgroundImage: "cave_bg",
    difficulty: 2,
    requiredLevel: 5,
    monsters: [
      {
        id: "cave_bear",
        nameKey: "monster_cave_bear",
        icon: "",
        baseHp: 45,
        baseDamage: 12,
        attackSpeed: 0.9,
        weakness: "strength"
      },
      {
        id: "dark_spirit",
        nameKey: "monster_dark_spirit",
        icon: "",
        baseHp: 35,
        baseDamage: 15,
        attackSpeed: 1.2,
        weakness: "willpower"
      },
      {
        id: "goblin",
        nameKey: "monster_goblin",
        icon: "",
        baseHp: 38,
        baseDamage: 10,
        attackSpeed: 1.3,
        weakness: "agility"
      }
    ],
    tasks: [
      {
        id: "deadlift",
        nameKey: "task_deadlift",
        icon: "️",
        baseDamage: 15,
        statScaling: { kraft: 0.6 }
      },
      {
        id: "pullups",
        nameKey: "task_pullups",
        icon: "",
        baseDamage: 12,
        statScaling: { kraft: 0.5 }
      },
      {
        id: "lunges",
        nameKey: "task_lunges",
        icon: "",
        baseDamage: 10,
        statScaling: { kraft: 0.3, ausdauer: 0.3 }
      },
      {
        id: "plank",
        nameKey: "task_plank",
        icon: "",
        baseDamage: 8,
        statScaling: { durchhaltevermoegen: 0.5, kraft: 0.2 }
      }
    ],
    rewards: {
      xp: 75,
      manaStones: 5,
      goldBonus: 20
    }
  },

  {
    id: "volcano_forge",
    nameKey: "dungeon_volcano",
    descriptionKey: "dungeon_volcano_desc",
    icon: "",
    backgroundImage: "volcano_bg",
    difficulty: 3,
    requiredLevel: 10,
    monsters: [
      {
        id: "fire_golem",
        nameKey: "monster_fire_golem",
        icon: "",
        baseHp: 60,
        baseDamage: 18,
        attackSpeed: 0.7,
        weakness: "endurance"
      },
      {
        id: "dragon_whelp",
        nameKey: "monster_dragon_whelp",
        icon: "",
        baseHp: 55,
        baseDamage: 20,
        attackSpeed: 1.0,
        weakness: "agility"
      },
      {
        id: "lava_elemental",
        nameKey: "monster_lava_elemental",
        icon: "",
        baseHp: 50,
        baseDamage: 16,
        attackSpeed: 1.1,
        weakness: "willpower"
      }
    ],
    tasks: [
      {
        id: "bench_press",
        nameKey: "task_bench_press",
        icon: "️",
        baseDamage: 20,
        statScaling: { kraft: 0.7 }
      },
      {
        id: "overhead_press",
        nameKey: "task_overhead_press",
        icon: "",
        baseDamage: 18,
        statScaling: { kraft: 0.6 }
      },
      {
        id: "burpees",
        nameKey: "task_burpees",
        icon: "",
        baseDamage: 15,
        statScaling: { ausdauer: 0.5, kraft: 0.3 }
      },
      {
        id: "mountain_climbers",
        nameKey: "task_mountain_climbers",
        icon: "️",
        baseDamage: 12,
        statScaling: { ausdauer: 0.4, beweglichkeit: 0.3 }
      }
    ],
    rewards: {
      xp: 100,
      manaStones: 8,
      goldBonus: 35
    }
  }
];
```

### Dungeon Skalierung
```javascript
const DUNGEON_SCALING = {
  hpMultiplier: 1.18,       // +18% HP pro Level
  damageMultiplier: 1.15,   // +15% Damage pro Level
  rewardMultiplier: 1.1     // +10% Rewards pro Level
};

function scaleDungeon(dungeon, level) {
  const scaleFactor = Math.pow(DUNGEON_SCALING.hpMultiplier, level - 1);
  const damageScale = Math.pow(DUNGEON_SCALING.damageMultiplier, level - 1);
  const rewardScale = Math.pow(DUNGEON_SCALING.rewardMultiplier, level - 1);

  return {
    ...dungeon,
    level: level,
    monsters: dungeon.monsters.map(monster => ({
      ...monster,
      baseHp: Math.floor(monster.baseHp * scaleFactor),
      maxHp: Math.floor(monster.baseHp * scaleFactor),
      baseDamage: Math.floor(monster.baseDamage * damageScale)
    })),
    rewards: {
      xp: Math.floor(dungeon.rewards.xp * rewardScale),
      manaStones: Math.floor(dungeon.rewards.manaStones * rewardScale),
      goldBonus: Math.floor(dungeon.rewards.goldBonus * rewardScale)
    }
  };
}
```

### Task Damage Berechnung
```javascript
function calculateTaskDamage(task, character) {
  let damage = task.baseDamage;

  // Stat Scaling
  if (task.statScaling) {
    for (const [stat, multiplier] of Object.entries(task.statScaling)) {
      damage += (character.stats[stat] || 0) * multiplier;
    }
  }

  // Equipment Bonus
  damage += character.combat?.attack || 0;

  // Monster Weakness Bonus
  // (Wird im Combat berechnet basierend auf Monster)

  return Math.floor(damage);
}
```

## UI Components

### Dungeon Selector
```html
<div class="dungeon-selector">
  <h3>${t('dungeons_available')}</h3>

  ${DUNGEONS.filter(d => character.level >= d.requiredLevel).map(dungeon => `
    <div class="dungeon-card"
         onclick="selectDungeon('${dungeon.id}')">
      <div class="dungeon-icon">${dungeon.icon}</div>
      <div class="dungeon-info">
        <h4>${t(dungeon.nameKey)}</h4>
        <p>${t(dungeon.descriptionKey)}</p>
        <div class="dungeon-meta">
          <span class="level-req">
            ${t('dungeon_level_req', { level: dungeon.requiredLevel })}
          </span>
          <span class="difficulty">
            ${renderDifficultyStars(dungeon.difficulty)}
          </span>
        </div>
      </div>
    </div>
  `).join('')}
</div>
```

## Testing Checkliste

- [ ] Alle Dungeons haben gültige Monster
- [ ] Monster HP skaliert korrekt mit Level
- [ ] Task Damage nutzt Stats korrekt
- [ ] Dungeon-Lock funktioniert (Level Requirement)
- [ ] Rewards skalieren mit Level
- [ ] Translation Keys existieren für alle Dungeon/Monster/Task
