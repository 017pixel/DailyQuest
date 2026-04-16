if (typeof window.DQ_DATA === 'undefined') {
    window.DQ_DATA = {};
}

const DQ_TRAINING_PLAN_SHARED_REP_STAGES = [
    { labelKey: 'phase_foundation', weeks: 1, sets: 2, reps: 8 },
    { labelKey: 'phase_progress', weeks: 1, sets: 2, reps: 10 },
    { labelKey: 'phase_volume', weeks: 1, sets: 2, reps: 12 },
    { labelKey: 'phase_sets_up', weeks: 1, sets: 3, reps: 8 },
    { labelKey: 'phase_sets_more', weeks: 1, sets: 3, reps: 10 },
    { labelKey: 'phase_peak', weeks: 1, sets: 3, reps: 12 },
    { labelKey: 'phase_endgame', weeks: 1, sets: 4, reps: 10 },
    { labelKey: 'phase_endgame', weeks: 9999, sets: 4, reps: 12 }
];

const DQ_TRAINING_PLAN_ENDURANCE_STAGES = [
    { labelKey: 'phase_endurance_base', weeks: 1, sets: 1, duration: 20, distance: 2.0, power: 4 },
    { labelKey: 'phase_endurance_base', weeks: 1, sets: 1, duration: 25, distance: 2.5, power: 4.5 },
    { labelKey: 'phase_endurance_build', weeks: 1, sets: 1, duration: 28, distance: 3.0, power: 5 },
    { labelKey: 'phase_endurance_build', weeks: 1, sets: 1, duration: 32, distance: 3.5, power: 5.5 },
    { labelKey: 'phase_endurance_volume', weeks: 1, sets: 2, duration: 30, distance: 4.0, power: 6 },
    { labelKey: 'phase_endurance_volume', weeks: 1, sets: 2, duration: 35, distance: 4.5, power: 6.5 },
    { labelKey: 'phase_endurance_peak', weeks: 1, sets: 2, duration: 40, distance: 5.0, power: 7 },
    { labelKey: 'phase_endurance_endgame', weeks: 9999, sets: 2, duration: 45, distance: 5.5, power: 7.5 }
];

const DQ_TRAINING_PLAN_SENIOR_STAGES = [
    { labelKey: 'phase_senior_start', weeks: 1, sets: 1, reps: 5 },
    { labelKey: 'phase_senior_start', weeks: 1, sets: 1, reps: 6 },
    { labelKey: 'phase_senior_build', weeks: 1, sets: 2, reps: 5 },
    { labelKey: 'phase_senior_build', weeks: 1, sets: 2, reps: 6 },
    { labelKey: 'phase_senior_control', weeks: 1, sets: 2, reps: 7 },
    { labelKey: 'phase_senior_control', weeks: 1, sets: 3, reps: 5 },
    { labelKey: 'phase_senior_endgame', weeks: 9999, sets: 3, reps: 6 }
];

DQ_DATA.trainingPlans = {
    muscle: {
        completionMode: 'sets',
        stageType: 'reps',
        stages: DQ_TRAINING_PLAN_SHARED_REP_STAGES,
        slots: [
            { key: 'push', candidates: ['push_ups_normal', 'push_ups_narrow', 'push_ups_wide', 'dumbbell_press', 'shoulder_press', 'tricep_dips_chair'] },
            { key: 'pull', candidates: ['dumbbell_rows', 'barbell_rows', 'bicep_curls', 'reverse_flys'] },
            { key: 'legs', candidates: ['weighted_squats', 'squats', 'lunges', 'sumo_squats', 'deadlifts'] },
            { key: 'core', candidates: ['plank', 'situps', 'leg_raises', 'russian_twists', 'side_plank', 'hollow_body_hold'] },
            { key: 'posterior', candidates: ['glute_bridges', 'single_leg_glute_bridge', 'deadlifts', 'reverse_flys'] },
            { key: 'finisher', candidates: ['burpees', 'mountain_climbers', 'jump_squats'] }
        ]
    },
    calisthenics: {
        completionMode: 'sets',
        stageType: 'reps',
        stages: DQ_TRAINING_PLAN_SHARED_REP_STAGES,
        slots: [
            { key: 'push', candidates: ['push_ups_normal', 'push_ups_narrow', 'push_ups_wide', 'knee_push_ups', 'diamond_push_ups'] },
            { key: 'legs', candidates: ['squats', 'lunges', 'sumo_squats', 'pistol_squats', 'jump_squats'] },
            { key: 'core', candidates: ['plank', 'situps', 'leg_raises', 'russian_twists', 'hollow_body_hold', 'side_plank'] },
            { key: 'upper', candidates: ['pike_push_ups', 'tricep_dips_chair', 'push_ups_narrow', 'shoulder_press'] },
            { key: 'posterior', candidates: ['glute_bridges', 'single_leg_glute_bridge', 'reverse_flys'] },
            { key: 'skill', candidates: ['burpees', 'mountain_climbers', 'jumping_jacks', 'wall_sit'] }
        ]
    },
    fatloss: {
        completionMode: 'sets',
        stageType: 'reps',
        stages: DQ_TRAINING_PLAN_SHARED_REP_STAGES,
        slots: [
            { key: 'cardio', candidates: ['burpees', 'jumping_jacks', 'mountain_climbers', 'interval_sprint'] },
            { key: 'legs', candidates: ['jump_squats', 'walking_lunges', 'sumo_squats', 'lunges', 'squats'] },
            { key: 'core', candidates: ['plank', 'side_plank', 'situps', 'leg_raises', 'russian_twists'] },
            { key: 'full', candidates: ['burpees', 'mountain_climbers', 'jump_squats'] },
            { key: 'posterior', candidates: ['glute_bridges', 'single_leg_glute_bridge', 'deadlifts'] },
            { key: 'mobility', candidates: ['stretch_10min', 'stretch_5min', 'walk_30min'] }
        ]
    },
    kraft_abnehmen: {
        completionMode: 'sets',
        stageType: 'reps',
        stages: DQ_TRAINING_PLAN_SHARED_REP_STAGES,
        slots: [
            { key: 'push', candidates: ['push_ups_normal', 'knee_push_ups', 'push_ups_narrow', 'tricep_dips_chair'] },
            { key: 'legs', candidates: ['squats', 'lunges', 'sumo_squats', 'walking_lunges'] },
            { key: 'core', candidates: ['plank', 'situps', 'leg_raises', 'side_plank'] },
            { key: 'posterior', candidates: ['glute_bridges', 'single_leg_glute_bridge', 'reverse_flys'] },
            { key: 'conditioning', candidates: ['burpees', 'mountain_climbers', 'jumping_jacks', 'wall_sit'] },
            { key: 'mobility', candidates: ['stretch_10min', 'stretch_5min', 'walk_30min'] }
        ]
    },
    endurance: {
        completionMode: 'log',
        stageType: 'log',
        stages: DQ_TRAINING_PLAN_ENDURANCE_STAGES,
        slots: [
            { key: 'warmup', candidates: ['walk_30min', 'jumping_jacks', 'short_walk'] },
            { key: 'interval', candidates: ['interval_sprint', 'mountain_climbers', 'high_knees'] },
            { key: 'distance', candidates: ['jogging', 'running', 'step_ups', 'walk_30min'] },
            { key: 'tempo', candidates: ['running', 'jogging', 'high_knees'] },
            { key: 'legs', candidates: ['walking_lunges', 'jump_squats', 'step_ups', 'wall_sit'] },
            { key: 'cooldown', candidates: ['stretch_10min', 'stretch_5min', 'walk_30min'] }
        ]
    },
    senior: {
        completionMode: 'sets',
        stageType: 'reps',
        stages: DQ_TRAINING_PLAN_SENIOR_STAGES,
        slots: [
            { key: 'chair_stand', candidates: ['chair_sit_to_stand', 'situps', 'squats'] },
            { key: 'march', candidates: ['seated_marching', 'short_walk', 'walk_30min'] },
            { key: 'push', candidates: ['wall_push_ups', 'knee_push_ups', 'tricep_dips_chair'] },
            { key: 'balance', candidates: ['heel_raises', 'standing_balance', 'ankle_circles'] },
            { key: 'mobility', candidates: ['seated_chest_opening', 'seated_head_turns', 'stretch_5min'] },
            { key: 'stretch', candidates: ['seated_spinal_twist', 'stretch_10min', 'short_walk'] }
        ]
    },
    sick: {
        completionMode: 'tap',
        stageType: 'tap',
        stages: [
            { labelKey: 'phase_recovery', weeks: 9999, sets: 1, reps: 1 }
        ],
        slots: []
    },
    restday: {
        completionMode: 'tap',
        stageType: 'tap',
        stages: [
            { labelKey: 'phase_recovery', weeks: 9999, sets: 1, reps: 1 }
        ],
        slots: []
    }
};

DQ_DATA.trainingGoalAliases = {
    muscle: 'muscle',
    calisthenics: 'calisthenics',
    endurance: 'endurance',
    fatloss: 'fatloss',
    kraft_abnehmen: 'kraft_abnehmen',
    senior: 'senior',
    sick: 'sick',
    restday: 'restday'
};
