import Foundation

enum SeedData {
    static func statDict(_ pairs: (StatKey, Double)...) -> [StatKey: Double] {
        var dict: [StatKey: Double] = [:]
        for (key, value) in pairs {
            dict[key] = value
        }
        return dict
    }

    static let exercises: [ExerciseTemplate] = [
        // muscle
        ExerciseTemplate(id: 101, category: .muscle, nameKey: "bicep_curls", type: .reps, baseValue: 10, mana: 20, gold: 6, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 102, category: .muscle, nameKey: "dumbbell_rows", type: .reps, baseValue: 8, mana: 22, gold: 7, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 103, category: .muscle, nameKey: "push_ups_narrow", type: .reps, baseValue: 8, mana: 20, gold: 5, statPoints: statDict((.kraft, 1), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 104, category: .muscle, nameKey: "weighted_squats", type: .reps, baseValue: 10, mana: 25, gold: 7, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 105, category: .muscle, nameKey: "barbell_rows", type: .reps, baseValue: 8, mana: 30, gold: 10, statPoints: statDict((.kraft, 1.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 106, category: .muscle, nameKey: "dumbbell_press", type: .reps, baseValue: 8, mana: 30, gold: 10, statPoints: statDict((.kraft, 1.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 107, category: .muscle, nameKey: "shoulder_press", type: .reps, baseValue: 8, mana: 25, gold: 8, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 108, category: .muscle, nameKey: "deadlifts", type: .reps, baseValue: 5, mana: 40, gold: 15, statPoints: statDict((.kraft, 2)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 109, category: .muscle, nameKey: "pistol_squats", type: .reps, baseValue: 5, mana: 28, gold: 40, statPoints: statDict((.kraft, 1.5), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 110, category: .muscle, nameKey: "pike_push_ups", type: .reps, baseValue: 8, mana: 25, gold: 35, statPoints: statDict((.kraft, 1), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 111, category: .muscle, nameKey: "diamond_push_ups", type: .reps, baseValue: 6, mana: 28, gold: 40, statPoints: statDict((.kraft, 1.5), (.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 112, category: .muscle, nameKey: "single_leg_glute_bridge", type: .reps, baseValue: 10, mana: 30, gold: 38, statPoints: statDict((.kraft, 1.5), (.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),

        // endurance
        ExerciseTemplate(id: 201, category: .endurance, nameKey: "burpees", type: .reps, baseValue: 10, mana: 35, gold: 12, statPoints: statDict((.ausdauer, 1), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 202, category: .endurance, nameKey: "jumping_jacks", type: .time, baseValue: 60, mana: 20, gold: 6, statPoints: statDict((.ausdauer, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 203, category: .endurance, nameKey: "high_knees", type: .time, baseValue: 45, mana: 20, gold: 7, statPoints: statDict((.ausdauer, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 204, category: .endurance, nameKey: "dumbbell_swings", type: .reps, baseValue: 15, mana: 23, gold: 32, statPoints: statDict((.kraft, 0.5), (.ausdauer, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 205, category: .endurance, nameKey: "jump_squats", type: .reps, baseValue: 12, mana: 22, gold: 29, statPoints: statDict((.beweglichkeit, 1.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 206, category: .endurance, nameKey: "pistol_squats", type: .reps, baseValue: 5, mana: 28, gold: 40, statPoints: statDict((.kraft, 1.5), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 207, category: .endurance, nameKey: "leg_raises", type: .reps, baseValue: 12, mana: 26, gold: 34, statPoints: statDict((.kraft, 1), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 208, category: .endurance, nameKey: "russian_twists", type: .reps, baseValue: 20, mana: 18, gold: 24, statPoints: statDict((.kraft, 0.5), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 210, category: .endurance, nameKey: "hollow_body_hold", type: .time, baseValue: 45, mana: 20, gold: 27, statPoints: statDict((.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 213, category: .endurance, nameKey: "single_leg_glute_bridge", type: .reps, baseValue: 10, mana: 30, gold: 38, statPoints: statDict((.kraft, 1.5), (.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 214, category: .endurance, nameKey: "hula_hoop", type: .time, baseValue: 600, mana: 40, gold: 15, statPoints: statDict((.ausdauer, 1), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 215, category: .endurance, nameKey: "stair_climbing", type: .time, baseValue: 900, mana: 50, gold: 20, statPoints: statDict((.ausdauer, 2)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 216, category: .endurance, nameKey: "jogging", type: .time, baseValue: 1200, mana: 60, gold: 25, statPoints: statDict((.ausdauer, 2.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 217, category: .endurance, nameKey: "running", type: .time, baseValue: 1800, mana: 80, gold: 35, statPoints: statDict((.ausdauer, 3)), directStatGain: nil, timerDuration: nil),

        // fatloss
        ExerciseTemplate(id: 301, category: .fatloss, nameKey: "mountain_climbers", type: .time, baseValue: 30, mana: 30, gold: 9, statPoints: statDict((.ausdauer, 1), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 302, category: .fatloss, nameKey: "jump_squats", type: .reps, baseValue: 15, mana: 25, gold: 8, statPoints: statDict((.ausdauer, 1), (.kraft, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 303, category: .fatloss, nameKey: "interval_sprint", type: .check, baseValue: 1, mana: 50, gold: 20, statPoints: statDict((.ausdauer, 2)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 304, category: .fatloss, nameKey: "walking_lunges", type: .reps, baseValue: 20, mana: 20, gold: 6, statPoints: statDict((.ausdauer, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 305, category: .fatloss, nameKey: "shadowboxing", type: .time, baseValue: 120, mana: 30, gold: 10, statPoints: statDict((.ausdauer, 1), (.kraft, 0.5)), directStatGain: nil, timerDuration: nil),

        // restday
        ExerciseTemplate(id: 401, category: .restday, nameKey: "walk_30min", type: .check, baseValue: 1, mana: 15, gold: 5, statPoints: nil, directStatGain: statDict((.durchhaltevermoegen, 1)), timerDuration: nil),
        ExerciseTemplate(id: 402, category: .restday, nameKey: "read_15pages", type: .focus, baseValue: 1, mana: 25, gold: 10, statPoints: nil, directStatGain: statDict((.willenskraft, 1)), timerDuration: 15),
        ExerciseTemplate(id: 403, category: .restday, nameKey: "healthy_snack", type: .check, baseValue: 1, mana: 10, gold: 10, statPoints: statDict((.willenskraft, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 404, category: .restday, nameKey: "stretch_10min", type: .check, baseValue: 1, mana: 10, gold: 5, statPoints: statDict((.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 405, category: .restday, nameKey: "learn_something", type: .focus, baseValue: 1, mana: 40, gold: 15, statPoints: nil, directStatGain: statDict((.willenskraft, 1.5)), timerDuration: 25),

        // learning
        ExerciseTemplate(id: 801, category: .learning, nameKey: "learn_new_skill", type: .focus, baseValue: 1, mana: 40, gold: 15, statPoints: statDict((.willenskraft, 1.5)), directStatGain: nil, timerDuration: 25),
        ExerciseTemplate(id: 802, category: .learning, nameKey: "read_for_school", type: .focus, baseValue: 1, mana: 25, gold: 10, statPoints: statDict((.willenskraft, 1)), directStatGain: nil, timerDuration: 15),
        ExerciseTemplate(id: 803, category: .learning, nameKey: "learn_language", type: .focus, baseValue: 1, mana: 40, gold: 15, statPoints: statDict((.willenskraft, 1.5)), directStatGain: nil, timerDuration: 25),
        ExerciseTemplate(id: 804, category: .learning, nameKey: "learn_math", type: .focus, baseValue: 1, mana: 45, gold: 18, statPoints: statDict((.willenskraft, 2)), directStatGain: nil, timerDuration: 25),
        ExerciseTemplate(id: 805, category: .learning, nameKey: "learn_science", type: .focus, baseValue: 1, mana: 45, gold: 18, statPoints: statDict((.willenskraft, 2)), directStatGain: nil, timerDuration: 25),

        // calisthenics
        ExerciseTemplate(id: 601, category: .calisthenics, nameKey: "push_ups_normal", type: .reps, baseValue: 15, mana: 25, gold: 8, statPoints: statDict((.kraft, 1), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 602, category: .calisthenics, nameKey: "push_ups_narrow", type: .reps, baseValue: 12, mana: 22, gold: 7, statPoints: statDict((.kraft, 1), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 603, category: .calisthenics, nameKey: "push_ups_wide", type: .reps, baseValue: 12, mana: 22, gold: 7, statPoints: statDict((.kraft, 1), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 604, category: .calisthenics, nameKey: "squats", type: .reps, baseValue: 20, mana: 20, gold: 6, statPoints: statDict((.kraft, 0.5), (.ausdauer, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 605, category: .calisthenics, nameKey: "situps", type: .reps, baseValue: 15, mana: 18, gold: 5, statPoints: statDict((.kraft, 0.5), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 606, category: .calisthenics, nameKey: "burpees", type: .reps, baseValue: 8, mana: 30, gold: 10, statPoints: statDict((.ausdauer, 1), (.kraft, 0.5), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 607, category: .calisthenics, nameKey: "pistol_squats", type: .reps, baseValue: 5, mana: 28, gold: 40, statPoints: statDict((.kraft, 1.5), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 608, category: .calisthenics, nameKey: "pike_push_ups", type: .reps, baseValue: 8, mana: 25, gold: 35, statPoints: statDict((.kraft, 1), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 609, category: .calisthenics, nameKey: "diamond_push_ups", type: .reps, baseValue: 6, mana: 28, gold: 40, statPoints: statDict((.kraft, 1.5), (.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 610, category: .calisthenics, nameKey: "leg_raises", type: .reps, baseValue: 12, mana: 26, gold: 34, statPoints: statDict((.kraft, 1), (.beweglichkeit, 1)), directStatGain: nil, timerDuration: nil),

        // sick
        ExerciseTemplate(id: 701, category: .sick, nameKey: "drink_tea", type: .check, baseValue: 1, mana: 10, gold: 2, statPoints: statDict((.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 702, category: .sick, nameKey: "short_walk", type: .check, baseValue: 1, mana: 15, gold: 3, statPoints: statDict((.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 703, category: .sick, nameKey: "stretch_5min", type: .check, baseValue: 1, mana: 5, gold: 1, statPoints: statDict((.beweglichkeit, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 704, category: .sick, nameKey: "take_nap", type: .check, baseValue: 1, mana: 10, gold: 2, statPoints: statDict((.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 705, category: .sick, nameKey: "take_medicine", type: .check, baseValue: 1, mana: 5, gold: 5, statPoints: statDict((.willenskraft, 0.5)), directStatGain: nil, timerDuration: nil),

        // kraft_abnehmen
        ExerciseTemplate(id: 501, category: .kraft_abnehmen, nameKey: "plank", type: .time, baseValue: 30, mana: 25, gold: 8, statPoints: statDict((.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 502, category: .kraft_abnehmen, nameKey: "situps", type: .reps, baseValue: 15, mana: 20, gold: 6, statPoints: statDict((.kraft, 0.5), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 503, category: .kraft_abnehmen, nameKey: "knee_push_ups", type: .reps, baseValue: 10, mana: 18, gold: 5, statPoints: statDict((.kraft, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 504, category: .kraft_abnehmen, nameKey: "tricep_dips_chair", type: .reps, baseValue: 10, mana: 22, gold: 7, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 505, category: .kraft_abnehmen, nameKey: "lunges", type: .reps, baseValue: 16, mana: 20, gold: 6, statPoints: statDict((.kraft, 0.5), (.beweglichkeit, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 506, category: .kraft_abnehmen, nameKey: "sumo_squats", type: .reps, baseValue: 12, mana: 25, gold: 8, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 507, category: .kraft_abnehmen, nameKey: "glute_bridges", type: .reps, baseValue: 15, mana: 18, gold: 5, statPoints: statDict((.kraft, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 508, category: .kraft_abnehmen, nameKey: "tricep_extensions", type: .reps, baseValue: 12, mana: 20, gold: 7, statPoints: statDict((.kraft, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 509, category: .kraft_abnehmen, nameKey: "side_plank", type: .time, baseValue: 20, mana: 22, gold: 7, statPoints: statDict((.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 510, category: .kraft_abnehmen, nameKey: "pilates_5_exercises", type: .check, baseValue: 1, mana: 60, gold: 20, statPoints: statDict((.beweglichkeit, 1.5), (.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 511, category: .kraft_abnehmen, nameKey: "russian_twists", type: .reps, baseValue: 20, mana: 18, gold: 24, statPoints: statDict((.kraft, 0.5), (.durchhaltevermoegen, 0.5)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 512, category: .kraft_abnehmen, nameKey: "hollow_body_hold", type: .time, baseValue: 45, mana: 20, gold: 27, statPoints: statDict((.durchhaltevermoegen, 1)), directStatGain: nil, timerDuration: nil),
        ExerciseTemplate(id: 513, category: .kraft_abnehmen, nameKey: "reverse_flys", type: .reps, baseValue: 12, mana: 17, gold: 21, statPoints: statDict((.kraft, 0.5)), directStatGain: nil, timerDuration: nil),

        // general workout
        ExerciseTemplate(id: 901, category: .general_workout, nameKey: "general_workout", type: .check, baseValue: 1, mana: 100, gold: 100, statPoints: statDict((.kraft, 2), (.ausdauer, 2), (.beweglichkeit, 1), (.durchhaltevermoegen, 2), (.willenskraft, 1)), directStatGain: nil, timerDuration: nil)
    ]

    static let extraQuestPool: [ExtraQuestDefinition] = [
        ExtraQuestDefinition(id: 601, nameKey: "extra_clean_room", mana: 400, gold: 200, statPoints: statDict((.durchhaltevermoegen, 2), (.willenskraft, 2))),
        ExtraQuestDefinition(id: 602, nameKey: "extra_walk_hour", mana: 500, gold: 250, statPoints: statDict((.ausdauer, 2), (.durchhaltevermoegen, 3))),
        ExtraQuestDefinition(id: 603, nameKey: "extra_learn_hour", mana: 600, gold: 300, statPoints: statDict((.willenskraft, 4))),
        ExtraQuestDefinition(id: 604, nameKey: "extra_no_sweets", mana: 450, gold: 220, statPoints: statDict((.willenskraft, 3), (.durchhaltevermoegen, 1))),
        ExtraQuestDefinition(id: 605, nameKey: "extra_go_jogging", mana: 700, gold: 350, statPoints: statDict((.ausdauer, 4), (.durchhaltevermoegen, 2))),
        ExtraQuestDefinition(id: 606, nameKey: "extra_finish_project", mana: 800, gold: 400, statPoints: statDict((.willenskraft, 3), (.durchhaltevermoegen, 2))),
        ExtraQuestDefinition(id: 607, nameKey: "extra_do_hobby", mana: 550, gold: 270, statPoints: statDict((.willenskraft, 2), (.beweglichkeit, 1))),
        ExtraQuestDefinition(id: 608, nameKey: "extra_meditate", mana: 350, gold: 180, statPoints: statDict((.willenskraft, 3))),
        ExtraQuestDefinition(id: 609, nameKey: "extra_call_friend", mana: 300, gold: 150, statPoints: statDict((.willenskraft, 2))),
        ExtraQuestDefinition(id: 610, nameKey: "extra_digital_detox", mana: 750, gold: 380, statPoints: statDict((.willenskraft, 5)))
    ]

    static let shopItems: [ShopItem] = [
        ShopItem(id: 101, name: "Trainings-Schwert", description: "+5 Angriff", cost: 100, type: .weapon, bonus: ["angriff": 5], effect: nil, iconSymbol: nil),
        ShopItem(id: 102, name: "Stahl-Klinge", description: "+15 Angriff", cost: 400, type: .weapon, bonus: ["angriff": 15], effect: nil, iconSymbol: nil),
        ShopItem(id: 103, name: "Ninja-Sterne", description: "+25 Angriff", cost: 850, type: .weapon, bonus: ["angriff": 25], effect: nil, iconSymbol: nil),
        ShopItem(id: 104, name: "Meister-Hantel", description: "Legendär. +40 Angriff", cost: 1500, type: .weapon, bonus: ["angriff": 40], effect: nil, iconSymbol: nil),
        ShopItem(id: 105, name: "Magier-Stab", description: "Episch. +60 Angriff", cost: 2500, type: .weapon, bonus: ["angriff": 60], effect: nil, iconSymbol: nil),
        ShopItem(id: 106, name: "Himmels-Speer", description: "Mythisch. +85 Angriff", cost: 4000, type: .weapon, bonus: ["angriff": 85], effect: nil, iconSymbol: nil),
        ShopItem(id: 107, name: "Dämonen-Klinge", description: "Verflucht. +120 Angriff", cost: 6500, type: .weapon, bonus: ["angriff": 120], effect: nil, iconSymbol: nil),
        ShopItem(id: 108, name: "Götter-Hammer", description: "Göttlich. +175 Angriff", cost: 10000, type: .weapon, bonus: ["angriff": 175], effect: nil, iconSymbol: nil),

        ShopItem(id: 201, name: "Leder-Bandagen", description: "+5 Schutz", cost: 100, type: .armor, bonus: ["schutz": 5], effect: nil, iconSymbol: nil),
        ShopItem(id: 202, name: "Kettenhemd", description: "+15 Schutz", cost: 400, type: .armor, bonus: ["schutz": 15], effect: nil, iconSymbol: nil),
        ShopItem(id: 203, name: "Spiegel-Schild", description: "+25 Schutz", cost: 850, type: .armor, bonus: ["schutz": 25], effect: nil, iconSymbol: nil),
        ShopItem(id: 204, name: "Titan-Panzer", description: "Legendär. +40 Schutz", cost: 1500, type: .armor, bonus: ["schutz": 40], effect: nil, iconSymbol: nil),
        ShopItem(id: 205, name: "Drachenrobe", description: "Episch. +60 Schutz", cost: 2500, type: .armor, bonus: ["schutz": 60], effect: nil, iconSymbol: nil),
        ShopItem(id: 206, name: "Runen-Weste", description: "Mythisch. +85 Schutz", cost: 4000, type: .armor, bonus: ["schutz": 85], effect: nil, iconSymbol: nil),
        ShopItem(id: 207, name: "Kristall-Harnisch", description: "Unzerbrechlich. +120 Schutz", cost: 6500, type: .armor, bonus: ["schutz": 120], effect: nil, iconSymbol: nil),
        ShopItem(id: 208, name: "Götter-Aura", description: "Göttlich. +175 Schutz", cost: 10000, type: .armor, bonus: ["schutz": 175], effect: nil, iconSymbol: nil),

        ShopItem(id: 301, name: "Kleiner Mana-Stein", description: "Stellt 50 Mana wieder her.", cost: 65, type: .consumable, bonus: nil, effect: ["mana": 50], iconSymbol: nil),
        ShopItem(id: 302, name: "Mittlerer Mana-Stein", description: "Stellt 250 Mana wieder her.", cost: 280, type: .consumable, bonus: nil, effect: ["mana": 250], iconSymbol: nil),
        ShopItem(id: 303, name: "Großer Mana-Stein", description: "Stellt 1000 Mana wieder her.", cost: 960, type: .consumable, bonus: nil, effect: ["mana": 1000], iconSymbol: nil),

        ShopItem(id: 401, name: "Streak Freeze", description: "Rettet deine Streak einmal, wenn du einen Tag verpasst.", cost: 3000, type: .streak_freeze, bonus: nil, effect: nil, iconSymbol: "snowflake")
    ]

    static let achievementDefinitions: [AchievementDefinition] = [
        AchievementDefinition(key: .level, icon: "star.fill", nameKey: "ach_level_name", descriptionKey: "ach_level_desc", tiers: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100]),
        AchievementDefinition(key: .quests, icon: "flame.fill", nameKey: "ach_quests_name", descriptionKey: "ach_quests_desc", tiers: [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 750, 900, 1000]),
        AchievementDefinition(key: .gold, icon: "dollarsign.circle.fill", nameKey: "ach_gold_name", descriptionKey: "ach_gold_desc", tiers: [1000, 2500, 5000, 7500, 10000, 15000, 20000, 30000, 40000, 50000, 65000, 80000, 100000, 125000, 150000]),
        AchievementDefinition(key: .shop, icon: "cart.fill", nameKey: "ach_shop_name", descriptionKey: "ach_shop_desc", tiers: [1, 2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50]),
        AchievementDefinition(key: .strength, icon: "bolt.fill", nameKey: "ach_strength_name", descriptionKey: "ach_strength_desc", tiers: [10, 13, 16, 19, 22, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]),
        AchievementDefinition(key: .streak, icon: "crown.fill", nameKey: "ach_streak_name", descriptionKey: "ach_streak_desc", tiers: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]),
        AchievementDefinition(key: .focus_time, icon: "brain.head.profile", nameKey: "ach_focus_name", descriptionKey: "ach_focus_desc", tiers: [60, 300, 600, 1500, 3000, 6000, 9000, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 60000])
    ]

    static let dungeon = DungeonDefinition(
        id: "forest-trial",
        name: "Waldprüfung",
        monsters: [
            DungeonMonster(id: "wolf", name: "Schattenwolf", imageName: "wolf", baseHp: 30, baseDmg: 8),
            DungeonMonster(id: "bear", name: "Höhlenbär", imageName: "bear", baseHp: 36, baseDmg: 9),
            DungeonMonster(id: "zombie", name: "Morast-Zombie", imageName: "zombie", baseHp: 28, baseDmg: 7)
        ],
        tasks: [
            DungeonTask(id: "pushups", label: "Liegestütze", baseDamage: 10),
            DungeonTask(id: "squats", label: "Squats", baseDamage: 6),
            DungeonTask(id: "situps", label: "Sit-Ups", baseDamage: 5)
        ],
        rewards: DungeonRewards(xp: 50, manaStones: 3)
    )

    static let defaultFocusLabels: [String] = ["focus_label_reading", "focus_label_learning", "focus_label_meditating"]

    static let characterLabels: [CharacterLabel] = [
        CharacterLabel(key: "kraftprotz", name: "Kraftprotz", description: "Robust und stark bei schweren Übungen", colorHex: "#8b5cf6", stats: ["kraft"]),
        CharacterLabel(key: "marathoner", name: "Marathoner", description: "Ausdauerstark, lange Sets möglich", colorHex: "#4ecdc4", stats: ["ausdauer"]),
        CharacterLabel(key: "akrobat", name: "Akrobat", description: "Flink, gute Technik bei Bewegungsübungen", colorHex: "#45b7d1", stats: ["beweglichkeit"]),
        CharacterLabel(key: "stoiker", name: "Stoiker", description: "Sehr konstante Leistung über Zeit", colorHex: "#96ceb4", stats: ["durchhaltevermoegen"]),
        CharacterLabel(key: "eiserner_wille", name: "Eiserner Wille", description: "Hoher Fokus, verlässliche Completion-Rate", colorHex: "#10b981", stats: ["willenskraft"]),
        CharacterLabel(key: "tank", name: "Tank", description: "Stark und belastbar; ideal für schwere Sätze", colorHex: "#ff9ff3", stats: ["kraft", "willenskraft"]),
        CharacterLabel(key: "powerlaeufer", name: "Powerläufer", description: "Kraftvoll und ausdauernd zugleich", colorHex: "#54a0ff", stats: ["kraft", "ausdauer"]),
        CharacterLabel(key: "kraftakrobat", name: "Kraftakrobat", description: "Stark und technisch beweglich", colorHex: "#5f27cd", stats: ["kraft", "beweglichkeit"]),
        CharacterLabel(key: "langlaeufer", name: "Langläufer", description: "Perfekte Ausdauer-Profil", colorHex: "#00d2d3", stats: ["ausdauer", "durchhaltevermoegen"]),
        CharacterLabel(key: "praezisionskuenstler", name: "Präzisionskünstler", description: "Kontrolliert & fokussiert", colorHex: "#06b6d4", stats: ["beweglichkeit", "willenskraft"]),
        CharacterLabel(key: "unermuedlicher", name: "Unermüdlicher", description: "Hält lange durch, mentale Stärke", colorHex: "#2ed573", stats: ["durchhaltevermoegen", "willenskraft"]),
        CharacterLabel(key: "allrounder", name: "Allrounder", description: "Vielseitig, keine Spezialisierung", colorHex: "#636e72", stats: ["balanced"]),
        CharacterLabel(key: "neuling", name: "Neuling", description: "Noch nicht genügend Daten für Analyse", colorHex: "#b2bec3", stats: ["insufficient_data"])
    ]

    static let strings: [AppLanguage: [String: String]] = [
        .de: [
            "exercises": "Übungen",
            "focus": "Fokus",
            "character": "Charakter",
            "shop": "Shop",
            "extra_quest": "Extra-Quest",
            "daily_quests": "Daily Quests",
            "free_training": "Freies Training",
            "search": "Suchen",
            "settings": "Einstellungen",
            "achievements": "Erfolge",
            "difficulty": "Schwierigkeit",
            "goal": "Trainingsziel",
            "rest_days": "Rest Days / Woche",
            "theme": "Theme",
            "name": "Name",
            "weight_tracking": "Gewichts-Tracking",
            "tracking_enabled": "Tracking aktiv",
            "target_weight": "Zielgewicht (kg)",
            "goal_lose_weight": "Abnehmen",
            "goal_gain_weight": "Zunehmen",
            "delete_weight_data": "Alle Gewichtsdaten löschen",
            "export": "Exportieren",
            "import": "Importieren",
            "reset_tutorial": "Intro und Tutorial neu starten",
            "streak": "Streak",
            "level": "Level",
            "mana": "Mana",
            "gold": "Gold",
            "attack": "Angriff",
            "protection": "Schutz",
            "base_stats": "Basis-Stats",
            "focus_stats": "Fokus-Stats",
            "weight_history": "Gewichtsverlauf",
            "current": "Aktuell",
            "target": "Ziel",
            "add_weight": "Neuen Eintrag hinzufügen",
            "save": "Speichern",
            "inventory": "Inventar",
            "equipment": "Ausrüstung",
            "shop_buy": "Kaufen",
            "sell": "Verkaufen",
            "equip": "Ausrüsten",
            "unequip": "Ablegen",
            "use": "Benutzen",
            "extra_start": "Quest annehmen",
            "extra_complete": "Quest abschließen",
            "extra_task": "AUFGABE",
            "extra_time": "ZEITLIMIT",
            "start": "Start",
            "stop": "Stopp",
            "timer": "Timer",
            "stopwatch": "Stopuhr",
            "focus_label_title": "Worauf konzentrierst du dich?",
            "focus_add_label": "Neues Label erstellen",
            "focus_new_label": "Neues Label",
            "claim": "Abholen",
            "restday_info_box": "Heute ist dein Restday! Genieße den Tag, hake entspannt deine Daily Quests ab und gönn dir schöne Dinge.",
            "dungeon_spawn": "Dungeon erschienen",
            "dungeon_go": "Los!"
        ],
        .en: [
            "exercises": "Workouts",
            "focus": "Focus",
            "character": "Character",
            "shop": "Shop",
            "extra_quest": "Extra Quest",
            "daily_quests": "Daily Quests",
            "free_training": "Free Training",
            "search": "Search",
            "settings": "Settings",
            "achievements": "Achievements",
            "difficulty": "Difficulty",
            "goal": "Training Goal",
            "rest_days": "Rest Days / Week",
            "theme": "Theme",
            "name": "Name",
            "weight_tracking": "Weight Tracking",
            "tracking_enabled": "Enable Tracking",
            "target_weight": "Target Weight (kg)",
            "goal_lose_weight": "Lose Weight",
            "goal_gain_weight": "Gain Weight",
            "delete_weight_data": "Delete All Weight Data",
            "export": "Export",
            "import": "Import",
            "reset_tutorial": "Restart intro and tutorial",
            "streak": "Streak",
            "level": "Level",
            "mana": "Mana",
            "gold": "Gold",
            "attack": "Attack",
            "protection": "Protection",
            "base_stats": "Base Stats",
            "focus_stats": "Focus Stats",
            "weight_history": "Weight History",
            "current": "Current",
            "target": "Target",
            "add_weight": "Add New Entry",
            "save": "Save",
            "inventory": "Inventory",
            "equipment": "Equipment",
            "shop_buy": "Buy",
            "sell": "Sell",
            "equip": "Equip",
            "unequip": "Unequip",
            "use": "Use",
            "extra_start": "Accept Quest",
            "extra_complete": "Complete Quest",
            "extra_task": "TASK",
            "extra_time": "TIME LIMIT",
            "start": "Start",
            "stop": "Stop",
            "timer": "Timer",
            "stopwatch": "Stopwatch",
            "focus_label_title": "What are you focusing on?",
            "focus_add_label": "Create new label",
            "focus_new_label": "New Label",
            "claim": "Claim",
            "restday_info_box": "Today is your rest day. Enjoy the day and complete your quests calmly.",
            "dungeon_spawn": "Dungeon spawned",
            "dungeon_go": "Go!"
        ]
    ]

    static let achievementTexts: [AppLanguage: [String: String]] = [
        .de: [
            "ach_level_name": "Held von DailyQuest",
            "ach_level_desc": "Erreiche neue Höhen und steige im Level auf.",
            "ach_quests_name": "Der Auserwählte",
            "ach_quests_desc": "Schließe täglich Quests ab und bleib konstant.",
            "ach_gold_name": "Schatzmeister",
            "ach_gold_desc": "Häufe Reichtümer durch Quests und Handel an.",
            "ach_shop_name": "Großinvestor",
            "ach_shop_desc": "Investiere in Gegenstände im Shop.",
            "ach_strength_name": "Titanen-Kraft",
            "ach_strength_desc": "Steigere deinen Kraft-Stat auf legendäre Werte.",
            "ach_streak_name": "Streak-Meister",
            "ach_streak_desc": "Halte deine tägliche Serie aufrecht.",
            "ach_focus_name": "Fokus-Meister",
            "ach_focus_desc": "Sammle Fokusminuten und beweise mentale Ausdauer."
        ],
        .en: [
            "ach_level_name": "Hero of DailyQuest",
            "ach_level_desc": "Reach new heights and level up.",
            "ach_quests_name": "The Chosen One",
            "ach_quests_desc": "Complete quests consistently every day.",
            "ach_gold_name": "Treasurer",
            "ach_gold_desc": "Build wealth through quests and trading.",
            "ach_shop_name": "Big Spender",
            "ach_shop_desc": "Invest in items from the shop.",
            "ach_strength_name": "Titan's Strength",
            "ach_strength_desc": "Increase your strength stat to legendary levels.",
            "ach_streak_name": "Streak Master",
            "ach_streak_desc": "Keep your daily streak alive.",
            "ach_focus_name": "Focus Master",
            "ach_focus_desc": "Collect focus minutes and prove mental endurance."
        ]
    ]

    static let exerciseNames: [AppLanguage: [String: String]] = [
        .de: [
            "bicep_curls": "Bizeps Curls", "dumbbell_rows": "Hantel-Rudern", "push_ups_narrow": "Enge Liegestütze",
            "weighted_squats": "Kniebeugen", "barbell_rows": "Langhantel-Rudern", "dumbbell_press": "Hantel-Bankdrücken",
            "shoulder_press": "Schulterdrücken", "deadlifts": "Kreuzheben", "burpees": "Burpees",
            "jumping_jacks": "Hampelmänner", "high_knees": "High Knees", "dumbbell_swings": "Hantel Swings",
            "jump_squats": "Jump Squats", "mountain_climbers": "Mountain Climbers", "interval_sprint": "Intervall-Sprint",
            "walking_lunges": "Walking Lunges", "shadowboxing": "Shadowboxing", "walk_30min": "Spaziergang",
            "read_15pages": "Lesen", "healthy_snack": "Gesunder Snack", "stretch_10min": "Dehnen",
            "learn_something": "Lernen", "general_workout": "Allgemeines Workout", "pistol_squats": "Pistol Squats",
            "leg_raises": "Beinheben", "russian_twists": "Russian Twists", "pike_push_ups": "Pike Push-ups",
            "hollow_body_hold": "Hollow Body Hold", "diamond_push_ups": "Diamond Push-ups", "reverse_flys": "Reverse Flys",
            "single_leg_glute_bridge": "Einbeinige Brücke", "plank": "Plank", "situps": "Situps",
            "knee_push_ups": "Knie Liegestütze", "tricep_dips_chair": "Trizep Dips", "lunges": "Ausfallschritte",
            "sumo_squats": "Sumo Squats", "glute_bridges": "Brücke", "tricep_extensions": "Trizepsheben",
            "side_plank": "Seitliche Plank", "pilates_5_exercises": "Pilates", "drink_tea": "Tee trinken",
            "short_walk": "Spaziergang", "stretch_5min": "Dehnen", "take_nap": "Mittagsschlaf",
            "take_medicine": "Medizin", "learn_new_skill": "Neue Fähigkeit", "read_for_school": "Schule lesen",
            "learn_language": "Sprache lernen", "learn_math": "Mathe lernen", "learn_science": "Naturwissenschaften",
            "push_ups_normal": "Liegestütze", "push_ups_wide": "Breite Liegestütze", "squats": "Squats",
            "hula_hoop": "Hula Hoop", "stair_climbing": "Treppen Rennen", "jogging": "Joggen", "running": "Rennen"
        ],
        .en: [
            "bicep_curls": "Bicep Curls", "dumbbell_rows": "Dumbbell Rows", "push_ups_narrow": "Narrow Push-ups",
            "weighted_squats": "Squats", "barbell_rows": "Barbell Rows", "dumbbell_press": "Dumbbell Press",
            "shoulder_press": "Shoulder Press", "deadlifts": "Deadlifts", "burpees": "Burpees",
            "jumping_jacks": "Jumping Jacks", "high_knees": "High Knees", "dumbbell_swings": "Dumbbell Swings",
            "jump_squats": "Jump Squats", "mountain_climbers": "Mountain Climbers", "interval_sprint": "Interval Sprint",
            "walking_lunges": "Walking Lunges", "shadowboxing": "Shadowboxing", "walk_30min": "Walk",
            "read_15pages": "Reading", "healthy_snack": "Healthy Snack", "stretch_10min": "Stretching",
            "learn_something": "Learning", "general_workout": "General Workout", "pistol_squats": "Pistol Squats",
            "leg_raises": "Leg Raises", "russian_twists": "Russian Twists", "pike_push_ups": "Pike Push-ups",
            "hollow_body_hold": "Hollow Body Hold", "diamond_push_ups": "Diamond Push-ups", "reverse_flys": "Reverse Flys",
            "single_leg_glute_bridge": "Single Leg Glute Bridge", "plank": "Plank", "situps": "Situps",
            "knee_push_ups": "Knee Push-ups", "tricep_dips_chair": "Tricep Dips", "lunges": "Lunges",
            "sumo_squats": "Sumo Squats", "glute_bridges": "Glute Bridges", "tricep_extensions": "Tricep Extensions",
            "side_plank": "Side Plank", "pilates_5_exercises": "Pilates", "drink_tea": "Drink Tea",
            "short_walk": "Short Walk", "stretch_5min": "Stretching", "take_nap": "Nap",
            "take_medicine": "Medicine", "learn_new_skill": "New Skill", "read_for_school": "School Reading",
            "learn_language": "Language Learning", "learn_math": "Math Learning", "learn_science": "Science Learning",
            "push_ups_normal": "Push-ups", "push_ups_wide": "Wide Push-ups", "squats": "Squats",
            "hula_hoop": "Hula Hoop", "stair_climbing": "Stair Climbing", "jogging": "Jogging", "running": "Running"
        ]
    ]

    static let extraQuestNames: [AppLanguage: [String: String]] = [
        .de: [
            "extra_clean_room": "Ein Zimmer aufräumen",
            "extra_walk_hour": "1 Stunde Spaziergang",
            "extra_learn_hour": "1 Stunde etwas Neues lernen",
            "extra_no_sweets": "Keine Süßigkeiten bis Tagesende",
            "extra_go_jogging": "Joggen gehen",
            "extra_finish_project": "Ein angefangenes Projekt beenden",
            "extra_do_hobby": "Einem produktiven Hobby nachgehen",
            "extra_meditate": "15 Minuten meditieren",
            "extra_call_friend": "Freund/Familie anrufen",
            "extra_digital_detox": "2 Stunden ohne Social Media"
        ],
        .en: [
            "extra_clean_room": "Clean a room",
            "extra_walk_hour": "1 hour walk",
            "extra_learn_hour": "Learn something new for 1 hour",
            "extra_no_sweets": "No sweets until end of day",
            "extra_go_jogging": "Go jogging",
            "extra_finish_project": "Finish a started project",
            "extra_do_hobby": "Engage in a productive hobby",
            "extra_meditate": "Meditate for 15 minutes",
            "extra_call_friend": "Call a friend/family",
            "extra_digital_detox": "2 hours without social media"
        ]
    ]

    static let exerciseExplanations: [AppLanguage: [String: String]] = [
        .de: [:],
        .en: [:]
    ]

    static func defaultState() -> GameState {
        let achievementProgress = Dictionary(uniqueKeysWithValues: AchievementKey.allCases.map {
            ($0, AchievementProgress(tier: 0, claimable: false))
        })

        let character = Character(
            id: 1,
            name: "Unknown Hunter",
            level: 1,
            mana: 0,
            manaToNextLevel: 100,
            gold: 200,
            stats: [.kraft: 5, .ausdauer: 5, .beweglichkeit: 5, .durchhaltevermoegen: 5, .willenskraft: 5],
            statProgress: [.kraft: 0, .ausdauer: 0, .beweglichkeit: 0, .durchhaltevermoegen: 0, .willenskraft: 0],
            equipment: EquipmentSet(weapons: [], armor: nil),
            inventory: [],
            weightTrackingEnabled: true,
            targetWeight: nil,
            weightDirection: .lose,
            combat: CombatStats(attack: 0, protection: 0, hpMax: 100, hpCurrent: 100),
            achievements: achievementProgress,
            totalGoldEarned: 200,
            totalQuestsCompleted: 0,
            totalItemsPurchased: 0
        )

        return GameState(
            settings: GameSettings(id: 1, language: .de, theme: .dark, difficulty: 3, goal: .muscle, restDays: 2),
            character: character,
            streak: StreakData(streak: 0, lastDate: nil),
            dailyQuests: [],
            nextQuestID: 1,
            extraQuest: nil,
            exercises: exercises,
            shopItems: shopItems,
            weightEntries: [],
            vibe: VibeState(
                sessions: [],
                timer: FocusTimerState(mode: .pomodoro, startTime: nil, endTime: nil, pomodoroDuration: 25 * 60, elapsedSeconds: 0, isSessionActive: false),
                linkedQuest: nil,
                currentSessionLabel: nil,
                customLabels: []
            ),
            tutorial: TutorialState(completed: false, seenFeatures: []),
            dungeonProgress: DungeonProgress(globalLevel: 1, activeDungeon: false),
            lastPenaltyCheck: nil
        )
    }
}
