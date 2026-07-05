if (typeof window.DQ_DATA === 'undefined') {
    window.DQ_DATA = {};
}

DQ_DATA.wgerDefaults = {
    CATEGORY_DEFAULTS: {
        Abs: { type: 'reps', baseValue: 15, mana: 20, gold: 6, statPoints: { durchhaltevermoegen: 1 } },
        Arms: { type: 'reps', baseValue: 10, mana: 20, gold: 6, statPoints: { kraft: 1 } },
        Back: { type: 'reps', baseValue: 8, mana: 25, gold: 8, statPoints: { kraft: 1.5 } },
        Calves: { type: 'reps', baseValue: 15, mana: 15, gold: 5, statPoints: { ausdauer: 0.5 } },
        Cardio: { type: 'time', baseValue: 30, mana: 25, gold: 8, statPoints: { ausdauer: 1 } },
        Chest: { type: 'reps', baseValue: 10, mana: 22, gold: 7, statPoints: { kraft: 1 } },
        Legs: { type: 'reps', baseValue: 10, mana: 20, gold: 6, statPoints: { kraft: 0.5 } },
        Shoulders: { type: 'reps', baseValue: 10, mana: 20, gold: 6, statPoints: { kraft: 0.5 } }
    },

    TYPE_OVERRIDES: {
        Plank: 'time',
        'Wall Sit': 'time',
        'Side Plank': 'time',
        'Mountain Climbers': 'time',
        'Flutter Kicks': 'time',
        'Russian Twist': 'time',
        'Dead Bug': 'time',
        'Bird Dog': 'time',
        'Glute Bridge': 'time',
        'Superman Hold': 'time',
        'L-Sit Hold': 'time',
        'Wall Angel': 'time',
        'Hollow Body Hold': 'time',
        'Dumbbell Pullover': 'reps',
        Burpee: 'reps'
    },

    PHASE_CATEGORY_MAPPING: {
        muscle: ['Chest', 'Arms', 'Back', 'Shoulders', 'Legs'],
        kraft_abnehmen: ['Chest', 'Arms', 'Back', 'Shoulders', 'Legs', 'Abs', 'Cardio'],
        endurance: ['Cardio', 'Abs', 'Calves'],
        fatloss: ['Cardio', 'Legs', 'Abs', 'Shoulders'],
        calisthenics: ['Chest', 'Arms', 'Back', 'Abs', 'Legs', 'Shoulders']
    },

    SLOT_CATEGORY_MAPPING: {
        push: ['Chest', 'Shoulders', 'Arms'],
        pull: ['Back', 'Arms'],
        legs: ['Legs', 'Calves'],
        core: ['Abs'],
        posterior: ['Back', 'Legs'],
        finisher: ['Cardio', 'Abs', 'Legs'],
        cardio: ['Cardio'],
        full: ['Cardio', 'Legs', 'Abs', 'Shoulders'],
        mobility: ['Abs', 'Calves'],
        warmup: ['Cardio'],
        interval: ['Cardio', 'Abs'],
        distance: ['Cardio', 'Legs'],
        tempo: ['Cardio'],
        cooldown: ['Calves', 'Abs'],
        upper: ['Chest', 'Back', 'Arms', 'Shoulders'],
        skill: ['Cardio', 'Abs', 'Legs']
    },

    WGER_CATEGORIES: ['Abs', 'Arms', 'Back', 'Calves', 'Cardio', 'Chest', 'Legs', 'Shoulders'],

    LOCAL_EXERCISE_CATEGORIES: ['restday', 'learning', 'sick', 'senior', 'general_workout'],

    BODYWEIGHT_EQUIPMENT_ID: 7,

    MUSCLE_NAMES: {
        1: { de: 'Bizeps', en: 'Biceps' },
        2: { de: 'Schultern', en: 'Shoulders' },
        3: { de: 'Serratus', en: 'Serratus' },
        4: { de: 'Brust', en: 'Chest' },
        5: { de: 'Trizeps', en: 'Triceps' },
        6: { de: 'Bauch', en: 'Abs' },
        7: { de: 'Waden', en: 'Calves' },
        8: { de: 'Gesaess', en: 'Glutes' },
        9: { de: 'Trapez', en: 'Traps' },
        10: { de: 'Quadrizeps', en: 'Quads' },
        11: { de: 'Beinbeuger', en: 'Hamstrings' },
        12: { de: 'Ruecken', en: 'Lats' },
        13: { de: 'Brachialis', en: 'Brachialis' },
        14: { de: 'Seitliche Bauchmuskeln', en: 'Obliques' },
        15: { de: 'Soleus', en: 'Soleus' }
    },

    EQUIPMENT_NAMES: {
        1: 'Barbell',
        2: 'SZ-Bar',
        3: 'Dumbbell',
        4: 'Gym mat',
        5: 'Swiss Ball',
        6: 'Pull-up bar',
        7: 'Bodyweight',
        8: 'Bench',
        9: 'Incline bench',
        10: 'Kettlebell',
        11: 'none'
    },

    OLD_TO_WGER_MAPPING: {
        bicep_curls: 'Bicep Curl',
        dumbbell_rows: 'Dumbbell Row',
        push_ups_narrow: 'Close-Grip Push-Up',
        weighted_squats: 'Squat',
        barbell_rows: 'Barbell Row',
        dumbbell_press: 'Dumbbell Bench Press',
        shoulder_press: 'Shoulder Press',
        deadlifts: 'Deadlift',
        pistol_squats: 'Pistol Squat',
        pike_push_ups: 'Pike Push-Up',
        diamond_push_ups: 'Diamond Push-Up',
        single_leg_glute_bridge: 'Single Leg Glute Bridge',
        burpees: 'Burpee',
        jumping_jacks: 'Jumping Jack',
        high_knees: 'High Knees',
        step_ups: 'Step Up',
        jump_squats: 'Jump Squat',
        leg_raises: 'Leg Raise',
        russian_twists: 'Russian Twist',
        hollow_body_hold: 'Hollow Body Hold',
        jump_rope: 'Jump Rope',
        wall_sit: 'Wall Sit',
        jogging: 'Jogging',
        running: 'Running',
        mountain_climbers: 'Mountain Climbers',
        walking_lunges: 'Walking Lunge',
        plank: 'Plank',
        situps: 'Sit-Up',
        knee_push_ups: 'Knee Push-Up',
        tricep_dips_chair: 'Tricep Dip',
        lunges: 'Lunge',
        sumo_squats: 'Sumo Squat',
        glute_bridges: 'Glute Bridge',
        tricep_extensions: 'Triceps Extension',
        side_plank: 'Side Plank',
        bicycle_crunch: 'Bicycle Crunch',
        reverse_flys: 'Reverse Fly',
        push_ups_normal: 'Push-Up',
        push_ups_wide: 'Wide Push-Up'
    },

    OLD_ID_TO_NAME_KEY: {
        101: 'bicep_curls', 102: 'dumbbell_rows', 103: 'push_ups_narrow', 104: 'weighted_squats',
        105: 'barbell_rows', 106: 'dumbbell_press', 107: 'shoulder_press', 108: 'deadlifts',
        109: 'pistol_squats', 110: 'pike_push_ups', 111: 'diamond_push_ups', 112: 'single_leg_glute_bridge',
        201: 'burpees', 202: 'jumping_jacks', 203: 'high_knees', 204: 'step_ups', 205: 'jump_squats',
        206: 'pistol_squats', 207: 'leg_raises', 208: 'russian_twists', 210: 'hollow_body_hold',
        213: 'single_leg_glute_bridge', 214: 'jump_rope', 215: 'wall_sit', 216: 'jogging', 217: 'running',
        301: 'mountain_climbers', 302: 'jump_squats', 303: 'interval_sprint', 304: 'walking_lunges',
        305: 'jump_rope', 306: 'jumping_jacks', 307: 'burpees',
        501: 'plank', 502: 'situps', 503: 'knee_push_ups', 504: 'tricep_dips_chair', 505: 'lunges',
        506: 'sumo_squats', 507: 'glute_bridges', 508: 'tricep_extensions', 509: 'side_plank',
        512: 'wall_sit', 513: 'bicycle_crunch', 514: 'reverse_flys',
        601: 'push_ups_normal', 602: 'push_ups_narrow', 603: 'push_ups_wide', 604: 'squats',
        605: 'lunges', 606: 'burpees', 607: 'jump_squats', 608: 'mountain_climbers',
        609: 'plank', 610: 'side_plank', 611: 'leg_raises', 614: 'wall_sit'
    },

    FALLBACK_EXERCISES: [
        { id: 'wger:fallback:-1', wgerId: -1, nameDe: 'Liegestuetze', nameEn: 'Push-Ups', type: 'reps', baseValue: 10, category: 'Chest', manaReward: 20, goldReward: 6, statPoints: { kraft: 1 }, equipment: [7], muscles: [4, 5], musclesSecondary: [2] },
        { id: 'wger:fallback:-2', wgerId: -2, nameDe: 'Kniebeugen', nameEn: 'Squats', type: 'reps', baseValue: 15, category: 'Legs', manaReward: 18, goldReward: 5, statPoints: { kraft: 0.5 }, equipment: [7], muscles: [10], musclesSecondary: [8] },
        { id: 'wger:fallback:-3', wgerId: -3, nameDe: 'Plank', nameEn: 'Plank', type: 'time', baseValue: 30, category: 'Abs', manaReward: 22, goldReward: 7, statPoints: { durchhaltevermoegen: 1 }, equipment: [7], muscles: [6], musclesSecondary: [2] },
        { id: 'wger:fallback:-4', wgerId: -4, nameDe: 'Ausfallschritte', nameEn: 'Lunges', type: 'reps', baseValue: 12, category: 'Legs', manaReward: 18, goldReward: 5, statPoints: { kraft: 0.5 }, equipment: [7], muscles: [10], musclesSecondary: [8] },
        { id: 'wger:fallback:-5', wgerId: -5, nameDe: 'Hampelmaenner', nameEn: 'Jumping Jacks', type: 'time', baseValue: 30, category: 'Cardio', manaReward: 20, goldReward: 6, statPoints: { ausdauer: 1 }, equipment: [7], muscles: [10], musclesSecondary: [2, 6] },
        { id: 'wger:fallback:-6', wgerId: -6, nameDe: 'Dips am Stuhl', nameEn: 'Tricep Dips', type: 'reps', baseValue: 10, category: 'Arms', manaReward: 20, goldReward: 6, statPoints: { kraft: 1 }, equipment: [7], muscles: [5], musclesSecondary: [4, 2] },
        { id: 'wger:fallback:-7', wgerId: -7, nameDe: 'Bergsteiger', nameEn: 'Mountain Climbers', type: 'time', baseValue: 30, category: 'Cardio', manaReward: 25, goldReward: 8, statPoints: { ausdauer: 1 }, equipment: [7], muscles: [6, 10], musclesSecondary: [2] },
        { id: 'wger:fallback:-8', wgerId: -8, nameDe: 'Bizeps-Curls', nameEn: 'Bicep Curls', type: 'reps', baseValue: 10, category: 'Arms', manaReward: 20, goldReward: 6, statPoints: { kraft: 1 }, needsEquipment: true, equipment: [3], muscles: [1], musclesSecondary: [13] },
        { id: 'wger:fallback:-9', wgerId: -9, nameDe: 'Rudern mit Hantel', nameEn: 'Dumbbell Rows', type: 'reps', baseValue: 8, category: 'Back', manaReward: 22, goldReward: 7, statPoints: { kraft: 1 }, needsEquipment: true, equipment: [3], muscles: [12], musclesSecondary: [1] },
        { id: 'wger:fallback:-10', wgerId: -10, nameDe: 'Schulterdruecken', nameEn: 'Shoulder Press', type: 'reps', baseValue: 8, category: 'Shoulders', manaReward: 22, goldReward: 7, statPoints: { kraft: 1 }, needsEquipment: true, equipment: [3], muscles: [2], musclesSecondary: [5] }
    ]
};
