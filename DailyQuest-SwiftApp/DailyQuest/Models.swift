import Foundation

enum AppLanguage: String, Codable, CaseIterable, Identifiable {
    case de
    case en

    var id: String { rawValue }

    var title: String {
        switch self {
        case .de: return "Deutsch"
        case .en: return "English"
        }
    }
}

enum AppTheme: String, Codable, CaseIterable, Identifiable {
    case dark
    case light

    var id: String { rawValue }
}

enum MainTab: String, Codable, CaseIterable, Identifiable {
    case exercises
    case focus
    case character
    case shop
    case extraQuest

    var id: String { rawValue }
}

enum TrainingGoal: String, Codable, CaseIterable, Identifiable {
    case muscle
    case endurance
    case fatloss
    case kraft_abnehmen
    case calisthenics
    case sick
    case restday
    case learning
    case general_workout

    var id: String { rawValue }
}

enum ExerciseType: String, Codable {
    case reps
    case time
    case check
    case focus
    case link
}

enum StatKey: String, Codable, CaseIterable, Hashable, Identifiable {
    case kraft
    case ausdauer
    case beweglichkeit
    case durchhaltevermoegen
    case willenskraft

    var id: String { rawValue }
}

struct ExerciseTemplate: Codable, Identifiable, Hashable {
    let id: Int
    let category: TrainingGoal
    let nameKey: String
    let type: ExerciseType
    let baseValue: Int
    let mana: Int
    let gold: Int
    let statPoints: [StatKey: Double]?
    let directStatGain: [StatKey: Double]?
    let timerDuration: Int?
}

struct DailyQuest: Codable, Identifiable, Hashable {
    let id: Int
    var date: String
    var nameKey: String
    var type: ExerciseType
    var target: Int
    var manaReward: Int
    var goldReward: Int
    var completed: Bool
    var goal: TrainingGoal
}

enum InventoryItemType: String, Codable, CaseIterable {
    case weapon
    case armor
    case consumable
    case streak_freeze
}

struct ShopItem: Codable, Identifiable, Hashable {
    let id: Int
    var name: String
    var description: String
    var cost: Int
    var type: InventoryItemType
    var bonus: [String: Int]?
    var effect: [String: Int]?
    var iconSymbol: String?
}

struct ItemInstance: Codable, Identifiable, Hashable {
    let id: UUID
    var baseItemID: Int
    var name: String
    var description: String
    var cost: Int
    var type: InventoryItemType
    var bonus: [String: Int]?
    var effect: [String: Int]?
    var iconSymbol: String?

    init(from item: ShopItem) {
        self.id = UUID()
        self.baseItemID = item.id
        self.name = item.name
        self.description = item.description
        self.cost = item.cost
        self.type = item.type
        self.bonus = item.bonus
        self.effect = item.effect
        self.iconSymbol = item.iconSymbol
    }

    init(
        baseItemID: Int,
        name: String,
        description: String,
        cost: Int,
        type: InventoryItemType,
        bonus: [String: Int]? = nil,
        effect: [String: Int]? = nil,
        iconSymbol: String? = nil
    ) {
        self.id = UUID()
        self.baseItemID = baseItemID
        self.name = name
        self.description = description
        self.cost = cost
        self.type = type
        self.bonus = bonus
        self.effect = effect
        self.iconSymbol = iconSymbol
    }
}

struct EquipmentSet: Codable, Hashable {
    var weapons: [ItemInstance]
    var armor: ItemInstance?
}

struct CombatStats: Codable, Hashable {
    var attack: Int
    var protection: Int
    var hpMax: Int
    var hpCurrent: Int
}

enum WeightDirection: String, Codable, CaseIterable, Identifiable {
    case lose
    case gain

    var id: String { rawValue }
}

enum AchievementKey: String, Codable, CaseIterable, Hashable, Identifiable {
    case level
    case quests
    case gold
    case shop
    case strength
    case streak
    case focus_time

    var id: String { rawValue }
}

struct AchievementProgress: Codable, Hashable {
    var tier: Int
    var claimable: Bool
}

struct Character: Codable, Hashable {
    var id: Int
    var name: String
    var level: Int
    var mana: Int
    var manaToNextLevel: Int
    var gold: Int
    var stats: [StatKey: Double]
    var statProgress: [StatKey: Double]
    var equipment: EquipmentSet
    var inventory: [ItemInstance]
    var weightTrackingEnabled: Bool
    var targetWeight: Double?
    var weightDirection: WeightDirection
    var combat: CombatStats
    var achievements: [AchievementKey: AchievementProgress]
    var totalGoldEarned: Int
    var totalQuestsCompleted: Int
    var totalItemsPurchased: Int
}

struct StreakData: Codable, Hashable {
    var streak: Int
    var lastDate: String?
}

struct GameSettings: Codable, Hashable {
    var id: Int
    var language: AppLanguage
    var theme: AppTheme
    var difficulty: Int
    var goal: TrainingGoal
    var restDays: Int
}

struct ExtraQuestDefinition: Codable, Identifiable, Hashable {
    let id: Int
    let nameKey: String
    let mana: Int
    let gold: Int
    let statPoints: [StatKey: Double]
}

struct ActiveExtraQuest: Codable, Hashable, Identifiable {
    var id: Int
    var nameKey: String
    var manaReward: Int
    var goldReward: Int
    var startTime: Date
    var deadline: Date
    var completed: Bool
}

struct WeightEntry: Codable, Identifiable, Hashable {
    var id: UUID
    var date: String
    var time: Date
    var weight: Double
}

enum LinkedFocusType: String, Codable {
    case quest
    case free
}

struct LinkedFocusQuest: Codable, Hashable {
    var type: LinkedFocusType
    var id: Int
    var labelKey: String?
}

enum FocusMode: String, Codable, CaseIterable, Identifiable {
    case pomodoro
    case stopwatch

    var id: String { rawValue }
}

struct FocusTimerState: Codable, Hashable {
    var mode: FocusMode
    var startTime: Date?
    var endTime: Date?
    var pomodoroDuration: Int
    var elapsedSeconds: Int
    var isSessionActive: Bool
}

struct FocusSession: Codable, Identifiable, Hashable {
    var id: UUID
    var date: Date
    var duration: Int
    var label: String
}

struct VibeState: Codable, Hashable {
    var sessions: [FocusSession]
    var timer: FocusTimerState
    var linkedQuest: LinkedFocusQuest?
    var currentSessionLabel: String?
    var customLabels: [String]
}

struct TutorialState: Codable, Hashable {
    var completed: Bool
    var seenFeatures: Set<String>
}

struct DungeonProgress: Codable, Hashable {
    var globalLevel: Int
    var activeDungeon: Bool
}

struct DungeonMonster: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let imageName: String
    let baseHp: Int
    let baseDmg: Int
}

struct DungeonTask: Codable, Identifiable, Hashable {
    let id: String
    let label: String
    let baseDamage: Int
}

struct DungeonRewards: Codable, Hashable {
    let xp: Int
    let manaStones: Int
}

struct DungeonDefinition: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let monsters: [DungeonMonster]
    let tasks: [DungeonTask]
    let rewards: DungeonRewards
}

struct DungeonEncounter: Identifiable, Hashable {
    let id = UUID()
    var dungeon: DungeonDefinition
    var monster: DungeonMonster
    var level: Int
    var monsterHpMax: Int
    var monsterHp: Int
    var monsterBaseDamage: Int
    var playerHpMax: Int
    var playerHp: Int
    var attack: Int
    var protection: Int
}

struct GameState: Codable, Hashable {
    var settings: GameSettings
    var character: Character
    var streak: StreakData
    var dailyQuests: [DailyQuest]
    var nextQuestID: Int
    var extraQuest: ActiveExtraQuest?
    var exercises: [ExerciseTemplate]
    var shopItems: [ShopItem]
    var weightEntries: [WeightEntry]
    var vibe: VibeState
    var tutorial: TutorialState
    var dungeonProgress: DungeonProgress
    var lastPenaltyCheck: String?
}

struct AchievementDefinition: Hashable {
    let key: AchievementKey
    let icon: String
    let nameKey: String
    let descriptionKey: String
    let tiers: [Int]
}

struct CharacterLabel: Hashable {
    let key: String
    let name: String
    let description: String
    let colorHex: String
    let stats: [String]
}
