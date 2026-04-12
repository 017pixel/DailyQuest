import Foundation
import Combine

struct ToastMessage: Identifiable, Equatable {
    let id = UUID()
    let text: String
    let isPenalty: Bool
}

struct AchievementViewModel: Identifiable, Hashable {
    let id: AchievementKey
    let definition: AchievementDefinition
    let progress: AchievementProgress
    let status: AchievementStatus
}

enum AchievementStatus: Int {
    case claimable = 0
    case inProgress = 1
    case completed = 2
}

struct AchievementProgressInfo {
    let currentValue: Int
    let goalValue: Int
    let currentTier: Int
    let totalTiers: Int
}

@MainActor
final class GameStore: ObservableObject {
    @Published private(set) var state: GameState
    @Published var selectedTab: MainTab = .exercises
    @Published var activeDungeon: DungeonEncounter?
    @Published var showOnboarding: Bool = false
    @Published var toast: ToastMessage?
    @Published var showingFeatureTip: FeatureTip?

    private let saveURL: URL
    private var hasRolledDungeonSpawn = false
    private var focusTickTimer: Timer?

    init() {
        self.saveURL = GameStore.makeSaveURL()
        self.state = SeedData.defaultState()
        loadState()
        self.showOnboarding = !state.tutorial.completed

        // JS parity: stop running focus sessions when app boots.
        state.vibe.timer.isSessionActive = false
        state.vibe.timer.startTime = nil
        state.vibe.timer.endTime = nil
        state.vibe.currentSessionLabel = nil
        state.vibe.linkedQuest = nil

        Task {
            await boot()
        }
    }

    deinit {
        focusTickTimer?.invalidate()
    }

    // MARK: - Boot

    func boot() async {
        await checkForPenaltyAndReset()
        rollDungeonSpawnIfNeeded()
        checkAllAchievements()
        saveState()
    }

    // MARK: - Localization

    func t(_ key: String) -> String {
        SeedData.strings[state.settings.language]?[key] ?? SeedData.strings[.de]?[key] ?? key
    }

    func achievementText(_ key: String) -> String {
        SeedData.achievementTexts[state.settings.language]?[key]
            ?? SeedData.achievementTexts[.de]?[key]
            ?? key
    }

    func exerciseName(for nameKey: String) -> String {
        SeedData.exerciseNames[state.settings.language]?[nameKey]
            ?? SeedData.exerciseNames[.de]?[nameKey]
            ?? nameKey
    }

    func extraQuestName(for nameKey: String) -> String {
        SeedData.extraQuestNames[state.settings.language]?[nameKey]
            ?? SeedData.extraQuestNames[.de]?[nameKey]
            ?? nameKey
    }

    func explanation(for nameKey: String) -> String {
        if let value = SeedData.exerciseExplanations[state.settings.language]?[nameKey] {
            return value
        }
        if let value = SeedData.exerciseExplanations[.de]?[nameKey] {
            return value
        }
        return state.settings.language == .de
            ? "Keine Beschreibung verfügbar."
            : "No description available."
    }

    func tabTitle(_ tab: MainTab) -> String {
        switch tab {
        case .exercises: return t("exercises")
        case .focus: return t("focus")
        case .character: return t("character")
        case .shop: return t("shop")
        case .extraQuest: return t("extra_quest")
        }
    }

    // MARK: - Dates

    func todayString() -> String {
        dateString(for: Date())
    }

    func yesterdayString() -> String {
        guard let date = Calendar.current.date(byAdding: .day, value: -1, to: Date()) else {
            return todayString()
        }
        return dateString(for: date)
    }

    func dateString(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    // MARK: - Settings

    func updateLanguage(_ language: AppLanguage) {
        state.settings.language = language
        saveState()
    }

    func updateTheme(_ theme: AppTheme) {
        state.settings.theme = theme
        saveState()
    }

    func updateCharacterName(_ name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        state.character.name = trimmed.isEmpty ? "Unknown Hunter" : trimmed
        saveState()
    }

    func updateDifficulty(_ difficulty: Int) {
        state.settings.difficulty = max(1, min(5, difficulty))
        generateDailyQuestsIfNeeded(forceRegenerate: true)
        saveState()
    }

    func updateGoal(_ goal: TrainingGoal) {
        state.settings.goal = goal
        generateDailyQuestsIfNeeded(forceRegenerate: true)
        saveState()
    }

    func updateRestDays(_ restDays: Int) {
        state.settings.restDays = max(0, min(3, restDays))
        generateDailyQuestsIfNeeded(forceRegenerate: true)
        saveState()
    }

    func updateWeightTrackingEnabled(_ enabled: Bool) {
        state.character.weightTrackingEnabled = enabled
        saveState()
    }

    func updateTargetWeight(_ value: Double?) {
        state.character.targetWeight = value
        saveState()
    }

    func updateWeightDirection(_ direction: WeightDirection) {
        state.character.weightDirection = direction
        saveState()
    }

    func deleteWeightData() {
        state.weightEntries = []
        saveState()
        showToast(state.settings.language == .de ? "Alle Gewichtsdaten wurden gelöscht." : "All weight data was deleted.")
    }

    // MARK: - Quests

    func dailyQuestsForToday() -> [DailyQuest] {
        state.dailyQuests
            .filter { $0.date == todayString() }
            .sorted { $0.id < $1.id }
    }

    func quest(by id: Int) -> DailyQuest? {
        state.dailyQuests.first(where: { $0.id == id })
    }

    func freeExercises(filter: TrainingGoal?) -> [ExerciseTemplate] {
        let list = state.exercises
        let filtered = filter == nil ? list : list.filter { $0.category == filter }
        return filtered.sorted { exerciseName(for: $0.nameKey) < exerciseName(for: $1.nameKey) }
    }

    func searchExercise(term: String) -> ExerciseTemplate? {
        let query = term.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else { return nil }
        return state.exercises.first {
            exerciseName(for: $0.nameKey).lowercased().contains(query)
        }
    }

    func formatTarget(type: ExerciseType, value: Int) -> String {
        switch type {
        case .reps:
            return "\(value) Reps"
        case .time:
            if value >= 60 {
                let minutes = value / 60
                let seconds = value % 60
                return seconds == 0 ? "\(minutes) min" : "\(minutes)m \(seconds)s"
            }
            return state.settings.language == .de ? "\(value) Sek." : "\(value) sec"
        case .check, .focus, .link:
            return ""
        }
    }

    func prepareFocusForQuest(questID: Int) {
        guard let quest = quest(by: questID) else { return }
        guard quest.type == .focus else { return }
        guard let template = state.exercises.first(where: { $0.nameKey == quest.nameKey }) else { return }
        guard let timerDuration = template.timerDuration else { return }

        let labelKey = labelKeyForExercise(template.nameKey)
        prepareFocusSession(durationMinutes: timerDuration, linked: LinkedFocusQuest(type: .quest, id: questID, labelKey: labelKey))
        selectedTab = .focus
    }

    func prepareFocusForExercise(exerciseID: Int) {
        guard let exercise = state.exercises.first(where: { $0.id == exerciseID }) else { return }
        guard exercise.type == .focus else { return }
        guard let timerDuration = exercise.timerDuration else { return }

        let labelKey = labelKeyForExercise(exercise.nameKey)
        prepareFocusSession(durationMinutes: timerDuration, linked: LinkedFocusQuest(type: .free, id: exerciseID, labelKey: labelKey))
        selectedTab = .focus
    }

    func completeQuest(_ questID: Int) {
        guard let index = state.dailyQuests.firstIndex(where: { $0.id == questID }) else { return }
        guard !state.dailyQuests[index].completed else { return }

        let quest = state.dailyQuests[index]
        state.dailyQuests[index].completed = true

        state.character.mana += quest.manaReward
        state.character.gold += quest.goldReward
        state.character.totalGoldEarned += quest.goldReward
        state.character.totalQuestsCompleted += 1

        if let template = state.exercises.first(where: { $0.nameKey == quest.nameKey }) {
            processStatGains(exercise: template)
        }

        levelUpCheck()
        checkStreakCompletion()
        checkAllAchievements()
        saveState()

        showToast("+\(quest.manaReward) Mana | +\(quest.goldReward) Gold")
    }

    func completeFreeExercise(_ exerciseID: Int) {
        guard let exercise = state.exercises.first(where: { $0.id == exerciseID }) else { return }

        let difficulty = state.settings.difficulty
        let scaledMana = Int(ceil(Double(exercise.mana) * (1 + 0.2 * Double(difficulty - 1))))
        let scaledGold = Int(ceil(Double(exercise.gold) * (1 + 0.15 * Double(difficulty - 1))))

        state.character.mana += scaledMana
        state.character.gold += scaledGold
        state.character.totalGoldEarned += scaledGold

        processStatGains(exercise: exercise)
        levelUpCheck()
        checkAllAchievements()
        saveState()

        showToast("+\(scaledMana) Mana | +\(scaledGold) Gold")
    }

    func generateDailyQuestsIfNeeded(forceRegenerate: Bool = false) {
        let today = todayString()
        let questsTodayIndices = state.dailyQuests.indices.filter { state.dailyQuests[$0].date == today }

        if !questsTodayIndices.isEmpty && !forceRegenerate {
            return
        }

        if !questsTodayIndices.isEmpty && forceRegenerate {
            state.dailyQuests.removeAll { $0.date == today }
        }

        var goal = state.settings.goal
        if goal != .sick {
            let dayOfWeek = Calendar.current.component(.weekday, from: Date()) - 1
            let activeRestDays: [Int]
            switch state.settings.restDays {
            case 1: activeRestDays = [0]
            case 2: activeRestDays = [2, 6]
            case 3: activeRestDays = [0, 2, 4]
            default: activeRestDays = []
            }
            if activeRestDays.contains(dayOfWeek) {
                goal = .restday
            }
        }

        var pool = state.exercises.filter { $0.category == goal }
        if pool.isEmpty {
            pool = state.exercises.filter { $0.category == .muscle }
        }
        pool.shuffle()

        let questCount = (goal == .restday || goal == .sick) ? 5 : 6
        let selected = Array(pool.prefix(questCount))
        let difficulty = state.settings.difficulty

        for template in selected {
            var target = template.baseValue
            if template.type != .check && template.type != .link && template.type != .focus {
                target = Int(ceil(Double(template.baseValue) + (Double(template.baseValue) * 0.4 * Double(difficulty - 1))))
            }

            let manaReward = Int(ceil(Double(template.mana) * (1 + 0.2 * Double(difficulty - 1))))
            let goldReward = Int(ceil(Double(template.gold) * (1 + 0.15 * Double(difficulty - 1))))

            let quest = DailyQuest(
                id: state.nextQuestID,
                date: today,
                nameKey: template.nameKey,
                type: template.type,
                target: target,
                manaReward: manaReward,
                goldReward: goldReward,
                completed: false,
                goal: goal
            )

            state.nextQuestID += 1
            state.dailyQuests.append(quest)
        }

        saveState()
    }

    // MARK: - Stats and leveling

    private func processStatGains(exercise: ExerciseTemplate) {
        let difficulty = state.settings.difficulty
        let throughMultiplier = 0.5

        let mainThresholds: [Int: Double] = [1: 5.5, 2: 5, 3: 4.5, 4: 4, 5: 3.5]
        let willThresholds: [Int: Double] = [1: 4.5, 2: 4, 3: 3.5, 4: 3, 5: 2.5]

        if let direct = exercise.directStatGain {
            for (stat, rawGain) in direct {
                let gain = stat == .durchhaltevermoegen ? rawGain * throughMultiplier : rawGain
                state.character.stats[stat, default: 0] += gain
            }
        }

        if let statPoints = exercise.statPoints {
            for (stat, rawPoint) in statPoints {
                let points = stat == .durchhaltevermoegen ? rawPoint * throughMultiplier : rawPoint
                state.character.statProgress[stat, default: 0] += points

                let threshold = stat == .willenskraft
                    ? (willThresholds[difficulty] ?? 3.5)
                    : (mainThresholds[difficulty] ?? 4.5)

                if state.character.statProgress[stat, default: 0] >= threshold {
                    state.character.stats[stat, default: 0] += 1
                    state.character.statProgress[stat, default: 0] -= threshold
                }
            }
        }
    }

    private func levelUpCheck() {
        var didLevel = false

        while state.character.mana >= state.character.manaToNextLevel {
            let manaNeeded = state.character.manaToNextLevel
            state.character.mana -= manaNeeded
            state.character.level += 1
            state.character.manaToNextLevel = manaForLevel(state.character.level)
            didLevel = true
        }

        if didLevel {
            showToast(state.settings.language == .de
                      ? "LEVEL UP! Du bist jetzt Level \(state.character.level)!"
                      : "LEVEL UP! You are now level \(state.character.level)!")
        }
    }

    func manaForLevel(_ level: Int) -> Int {
        Int(floor(100 * pow(1.5, Double(level - 1))))
    }

    // MARK: - Streak and penalty

    func checkStreakCompletion() {
        let today = todayString()
        let yesterday = yesterdayString()
        let quests = dailyQuestsForToday()
        guard !quests.isEmpty, quests.allSatisfy(\.completed) else { return }

        if state.streak.lastDate != today {
            if state.streak.lastDate == yesterday {
                state.streak.streak += 1
            } else {
                state.streak.streak = 1
            }
            state.streak.lastDate = today
        }
    }

    func checkForPenaltyAndReset() async {
        let today = todayString()
        if state.lastPenaltyCheck == today {
            generateDailyQuestsIfNeeded(forceRegenerate: false)
            return
        }

        state.lastPenaltyCheck = today

        // Remove quests older than two days ago.
        if let twoDaysAgo = Calendar.current.date(byAdding: .day, value: -2, to: Date()) {
            let oldDate = dateString(for: twoDaysAgo)
            state.dailyQuests.removeAll { $0.date < oldDate }
        }

        let yesterday = yesterdayString()
        let yesterdaysQuests = state.dailyQuests.filter { $0.date == yesterday }

        var penaltyReason: String?

        if !yesterdaysQuests.isEmpty && !yesterdaysQuests.allSatisfy(\.completed) {
            if let freezeIndex = state.character.inventory.firstIndex(where: { $0.type == .streak_freeze }) {
                state.character.inventory.remove(at: freezeIndex)
                if state.streak.streak > 0 {
                    state.streak.lastDate = yesterday
                }
                penaltyReason = "freeze"
            } else {
                state.streak.streak = 0
                state.streak.lastDate = nil
                if state.character.level > 1 {
                    state.character.level -= 1
                    state.character.manaToNextLevel = manaForLevel(state.character.level)
                }
                penaltyReason = "daily"
            }
        }

        if let extra = state.extraQuest, !extra.completed, extra.deadline < Date() {
            if state.character.level > 1 {
                state.character.level -= 1
            }
            state.character.manaToNextLevel = manaForLevel(state.character.level)
            state.character.gold = max(0, state.character.gold - 150)

            for stat in StatKey.allCases {
                let loss: Double = stat == .willenskraft ? 3 : 1
                state.character.stats[stat] = max(1, (state.character.stats[stat] ?? 1) - loss)
            }

            state.extraQuest = nil
            penaltyReason = "extra"
        }

        generateDailyQuestsIfNeeded(forceRegenerate: true)
        checkAllAchievements()
        saveState()

        if penaltyReason == "daily" {
            showToast(state.settings.language == .de
                      ? "Strafe: Du hast ein Level verloren."
                      : "Penalty: You lost one level.", isPenalty: true)
        } else if penaltyReason == "freeze" {
            showToast(state.settings.language == .de
                      ? "Streak Freeze hat deine Serie gerettet."
                      : "Streak Freeze saved your streak.")
        } else if penaltyReason == "extra" {
            showToast(state.settings.language == .de
                      ? "Extra-Quest gescheitert. Strafe angewendet."
                      : "Extra quest failed. Penalty applied.", isPenalty: true)
        }
    }

    // MARK: - Extra Quest

    func startExtraQuest() {
        guard state.extraQuest == nil else { return }
        guard let random = SeedData.extraQuestPool.randomElement() else { return }

        let now = Date()
        var calendar = Calendar.current
        calendar.timeZone = .current
        let deadline = calendar.date(bySettingHour: 23, minute: 59, second: 59, of: now) ?? now

        state.extraQuest = ActiveExtraQuest(
            id: 1,
            nameKey: random.nameKey,
            manaReward: random.mana,
            goldReward: random.gold,
            startTime: now,
            deadline: deadline,
            completed: false
        )

        saveState()
    }

    func completeExtraQuest() {
        guard var quest = state.extraQuest else { return }
        guard !quest.completed else { return }

        if Date() > quest.deadline {
            state.extraQuest = nil
            saveState()
            showToast(state.settings.language == .de
                      ? "Die Zeit ist abgelaufen. Extra-Quest gescheitert."
                      : "Time is up. Extra quest failed.", isPenalty: true)
            return
        }

        quest.completed = true
        state.extraQuest = nil

        state.character.mana += quest.manaReward
        state.character.gold += quest.goldReward
        state.character.totalGoldEarned += quest.goldReward

        if let template = SeedData.extraQuestPool.first(where: { $0.nameKey == quest.nameKey }) {
            let exerciseEquivalent = ExerciseTemplate(
                id: template.id,
                category: .general_workout,
                nameKey: template.nameKey,
                type: .check,
                baseValue: 1,
                mana: template.mana,
                gold: template.gold,
                statPoints: template.statPoints,
                directStatGain: nil,
                timerDuration: nil
            )
            processStatGains(exercise: exerciseEquivalent)
        }

        levelUpCheck()
        checkAllAchievements()
        saveState()

        showToast("+\(quest.manaReward) Mana | +\(quest.goldReward) Gold")
    }

    func extraQuestRemainingTime() -> TimeInterval {
        guard let extra = state.extraQuest else { return 0 }
        return max(0, extra.deadline.timeIntervalSinceNow)
    }

    // MARK: - Shop / Inventory

    var equipmentStats: (angriff: Int, schutz: Int) {
        calculateEquipmentStats(character: state.character)
    }

    func calculateEquipmentStats(character: Character) -> (angriff: Int, schutz: Int) {
        let attack = character.equipment.weapons.reduce(0) { $0 + ($1.bonus?["angriff"] ?? 0) }
        let protection = (character.equipment.armor?.bonus?["schutz"] ?? 0)
        return (attack, protection)
    }

    func buyItem(_ item: ShopItem) {
        guard state.character.gold >= item.cost else {
            showToast(state.settings.language == .de ? "Nicht genug Gold." : "Not enough gold.", isPenalty: true)
            return
        }

        if item.type == .consumable {
            let count = state.character.inventory.filter { $0.type == .consumable }.count
            if count >= 5 {
                showToast(state.settings.language == .de ? "Dein Mana-Beutel ist voll (max. 5)." : "Your mana bag is full (max 5).", isPenalty: true)
                return
            }
        }

        if item.type == .streak_freeze {
            let count = state.character.inventory.filter { $0.type == .streak_freeze }.count
            if count >= 2 {
                showToast(state.settings.language == .de ? "Maximal 2 Streak Freezes erlaubt." : "Maximum 2 Streak Freezes allowed.", isPenalty: true)
                return
            }
        }

        state.character.gold -= item.cost
        state.character.inventory.append(ItemInstance(from: item))
        state.character.totalItemsPurchased += 1

        checkAchievement(.shop)
        saveState()
        showToast("\(item.name) \(state.settings.language == .de ? "gekauft" : "purchased")")
    }

    func useInventoryItem(_ itemID: UUID) {
        guard let index = state.character.inventory.firstIndex(where: { $0.id == itemID }) else { return }
        let item = state.character.inventory[index]
        guard item.type == .consumable else { return }

        let manaGain = item.effect?["mana"] ?? 0
        state.character.mana += manaGain
        state.character.inventory.remove(at: index)
        levelUpCheck()
        checkAllAchievements()
        saveState()
        showToast("+\(manaGain) Mana")
    }

    func equipInventoryItem(_ itemID: UUID) {
        guard let index = state.character.inventory.firstIndex(where: { $0.id == itemID }) else { return }
        let item = state.character.inventory[index]

        switch item.type {
        case .weapon:
            if state.character.equipment.weapons.count >= 2 {
                showToast(state.settings.language == .de ? "Du kannst nur 2 Waffen tragen." : "You can only carry 2 weapons.", isPenalty: true)
                return
            }
            state.character.equipment.weapons.append(item)
        case .armor:
            if state.character.equipment.armor != nil {
                showToast(state.settings.language == .de ? "Lege zuerst deine aktuelle Rüstung ab." : "Unequip your current armor first.", isPenalty: true)
                return
            }
            state.character.equipment.armor = item
        case .consumable, .streak_freeze:
            return
        }

        state.character.inventory.remove(at: index)
        saveState()
    }

    func unequipWeapon(_ itemID: UUID) {
        guard let index = state.character.equipment.weapons.firstIndex(where: { $0.id == itemID }) else { return }
        let item = state.character.equipment.weapons.remove(at: index)
        state.character.inventory.append(item)
        saveState()
    }

    func unequipArmor() {
        guard let armor = state.character.equipment.armor else { return }
        state.character.equipment.armor = nil
        state.character.inventory.append(armor)
        saveState()
    }

    func sellInventoryItem(_ itemID: UUID) {
        guard let index = state.character.inventory.firstIndex(where: { $0.id == itemID }) else { return }
        let item = state.character.inventory.remove(at: index)
        sellItem(item)
    }

    func sellEquippedWeapon(_ itemID: UUID) {
        guard let index = state.character.equipment.weapons.firstIndex(where: { $0.id == itemID }) else { return }
        let item = state.character.equipment.weapons.remove(at: index)
        sellItem(item)
    }

    func sellEquippedArmor() {
        guard let item = state.character.equipment.armor else { return }
        state.character.equipment.armor = nil
        sellItem(item)
    }

    private func sellItem(_ item: ItemInstance) {
        let sellPrice = Int(floor(Double(item.cost) * 0.7))
        state.character.gold += sellPrice
        state.character.totalGoldEarned += sellPrice
        checkAchievement(.gold)
        saveState()
        showToast("+\(sellPrice) Gold")
    }

    // MARK: - Weight tracking

    func addWeightEntry(_ weight: Double) {
        let clamped = min(max(weight, 0), 200)
        let now = Date()
        let entry = WeightEntry(id: UUID(), date: dateString(for: now), time: now, weight: clamped)
        state.weightEntries.append(entry)
        state.weightEntries.sort { $0.time < $1.time }
        saveState()
    }

    // MARK: - Achievements

    func achievementsList() -> [AchievementViewModel] {
        SeedData.achievementDefinitions
            .map { definition in
                let progress = state.character.achievements[definition.key] ?? AchievementProgress(tier: 0, claimable: false)
                let status: AchievementStatus
                if progress.claimable {
                    status = .claimable
                } else if progress.tier >= definition.tiers.count {
                    status = .completed
                } else {
                    status = .inProgress
                }
                return AchievementViewModel(id: definition.key, definition: definition, progress: progress, status: status)
            }
            .sorted {
                if $0.status != $1.status {
                    return $0.status.rawValue < $1.status.rawValue
                }
                return $0.definition.key.rawValue < $1.definition.key.rawValue
            }
    }

    func achievementProgress(for key: AchievementKey) -> AchievementProgressInfo {
        guard let definition = SeedData.achievementDefinitions.first(where: { $0.key == key }) else {
            return AchievementProgressInfo(currentValue: 0, goalValue: 1, currentTier: 0, totalTiers: 1)
        }

        let progress = state.character.achievements[key] ?? AchievementProgress(tier: 0, claimable: false)
        let tier = progress.tier
        let goal = tier < definition.tiers.count ? definition.tiers[tier] : definition.tiers.last ?? 1
        let current = currentProgressValue(for: key)

        return AchievementProgressInfo(
            currentValue: current,
            goalValue: goal,
            currentTier: min(tier + 1, definition.tiers.count),
            totalTiers: definition.tiers.count
        )
    }

    func claimAchievement(_ key: AchievementKey) {
        guard var progress = state.character.achievements[key] else { return }
        guard progress.claimable else { return }
        guard let definition = SeedData.achievementDefinitions.first(where: { $0.key == key }) else { return }

        let currentTier = progress.tier
        let level = currentTier + 1

        let rewardGold = 100 * level
        let rewardMana = 100 * level

        state.character.gold += rewardGold
        state.character.mana += rewardMana
        state.character.totalGoldEarned += rewardGold

        progress.tier += 1
        progress.claimable = false
        state.character.achievements[key] = progress

        checkAchievement(key)
        levelUpCheck()
        saveState()

        let title = achievementText(definition.nameKey)
        showToast("\(title): +\(rewardGold) Gold | +\(rewardMana) Mana")
    }

    func checkAllAchievements() {
        for key in AchievementKey.allCases {
            checkAchievement(key)
        }
    }

    func checkAchievement(_ key: AchievementKey) {
        guard let definition = SeedData.achievementDefinitions.first(where: { $0.key == key }) else { return }

        var progress = state.character.achievements[key] ?? AchievementProgress(tier: 0, claimable: false)

        if progress.claimable || progress.tier >= definition.tiers.count {
            state.character.achievements[key] = progress
            return
        }

        let goal = definition.tiers[progress.tier]
        let current = currentProgressValue(for: key)

        if current >= goal {
            progress.claimable = true
            state.character.achievements[key] = progress

            let name = achievementText(definition.nameKey)
            showToast(state.settings.language == .de
                      ? "Erfolg freigeschaltet: \(name)!"
                      : "Achievement unlocked: \(name)!")
        }
    }

    private func currentProgressValue(for key: AchievementKey) -> Int {
        switch key {
        case .level:
            return state.character.level
        case .quests:
            return state.character.totalQuestsCompleted
        case .gold:
            return state.character.totalGoldEarned
        case .shop:
            return state.character.totalItemsPurchased
        case .strength:
            return Int(state.character.stats[.kraft] ?? 0)
        case .streak:
            return state.streak.streak
        case .focus_time:
            return state.vibe.sessions.reduce(0) { $0 + $1.duration }
        }
    }

    // MARK: - Focus module

    var focusDefaultLabels: [String] {
        SeedData.defaultFocusLabels.map {
            switch $0 {
            case "focus_label_reading": return state.settings.language == .de ? "Lesen" : "Reading"
            case "focus_label_learning": return state.settings.language == .de ? "Lernen" : "Learning"
            case "focus_label_meditating": return state.settings.language == .de ? "Meditieren" : "Meditating"
            default: return $0
            }
        }
    }

    var focusAllLabels: [String] {
        var labels = focusDefaultLabels
        for custom in state.vibe.customLabels where !labels.contains(custom) {
            labels.append(custom)
        }
        return labels
    }

    func setFocusMode(_ mode: FocusMode) {
        guard !state.vibe.timer.isSessionActive else { return }
        state.vibe.timer.mode = mode
        state.vibe.linkedQuest = nil
        state.vibe.timer.elapsedSeconds = mode == .pomodoro ? state.vibe.timer.pomodoroDuration : 0
        saveState()
    }

    func setPomodoroDuration(minutes: Int) {
        guard !state.vibe.timer.isSessionActive else { return }
        state.vibe.timer.pomodoroDuration = max(1, minutes) * 60
        state.vibe.linkedQuest = nil
        state.vibe.timer.elapsedSeconds = state.vibe.timer.pomodoroDuration
        saveState()
    }

    func prepareFocusSession(durationMinutes: Int, linked: LinkedFocusQuest?) {
        state.vibe.timer.mode = .pomodoro
        state.vibe.timer.pomodoroDuration = max(1, durationMinutes) * 60
        state.vibe.timer.elapsedSeconds = state.vibe.timer.pomodoroDuration
        state.vibe.linkedQuest = linked
        saveState()
    }

    func startFocusSession(withLabel label: String) {
        guard !state.vibe.timer.isSessionActive else { return }

        state.vibe.timer.isSessionActive = true
        state.vibe.currentSessionLabel = label
        state.vibe.timer.startTime = Date()

        if state.vibe.timer.mode == .pomodoro {
            state.vibe.timer.endTime = Date().addingTimeInterval(TimeInterval(state.vibe.timer.pomodoroDuration))
            state.vibe.timer.elapsedSeconds = state.vibe.timer.pomodoroDuration
        } else {
            state.vibe.timer.endTime = nil
            state.vibe.timer.elapsedSeconds = 0
        }

        startFocusTicking()
        saveState()
    }

    func stopFocusSessionManually() {
        guard state.vibe.timer.isSessionActive else { return }
        let elapsedMinutes = Int(floor(Double(state.vibe.timer.elapsedSeconds) / 60.0))

        if state.vibe.timer.mode == .stopwatch && elapsedMinutes >= 2 {
            completeFocusSession(minutes: elapsedMinutes)
            return
        }

        resetFocusTimerState()
        saveState()
    }

    func addCustomFocusLabel(_ label: String) {
        let trimmed = label.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if !state.vibe.customLabels.contains(trimmed) {
            state.vibe.customLabels.append(trimmed)
            saveState()
        }
    }

    func deleteCustomFocusLabel(_ label: String) {
        state.vibe.customLabels.removeAll { $0 == label }
        saveState()
    }

    private func startFocusTicking() {
        focusTickTimer?.invalidate()
        focusTickTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.focusTick()
            }
        }
    }

    private func focusTick() {
        guard state.vibe.timer.isSessionActive else {
            focusTickTimer?.invalidate()
            focusTickTimer = nil
            return
        }

        if state.vibe.timer.mode == .pomodoro {
            let remaining = Int(round(state.vibe.timer.endTime?.timeIntervalSinceNow ?? 0))
            state.vibe.timer.elapsedSeconds = max(0, remaining)
            if state.vibe.timer.elapsedSeconds <= 0 {
                let minutes = max(1, state.vibe.timer.pomodoroDuration / 60)
                completeFocusSession(minutes: minutes)
                return
            }
        } else {
            if let start = state.vibe.timer.startTime {
                state.vibe.timer.elapsedSeconds = max(0, Int(round(Date().timeIntervalSince(start))))
            }
        }
    }

    private func completeFocusSession(minutes: Int) {
        let linked = state.vibe.linkedQuest
        let label = state.vibe.currentSessionLabel ?? (state.settings.language == .de ? "Lernen" : "Learning")

        resetFocusTimerState()

        state.vibe.sessions.append(FocusSession(id: UUID(), date: Date(), duration: minutes, label: label))

        if let linkedQuest = linked {
            if linkedQuest.type == .quest {
                completeQuest(linkedQuest.id)
            } else {
                completeFreeExercise(linkedQuest.id)
            }
            saveState()
            return
        }

        let goldEarned = minutes * 4
        let manaEarned = minutes * 2
        let enduranceGain = minutes / 40

        state.character.gold += goldEarned
        state.character.mana += manaEarned
        state.character.totalGoldEarned += goldEarned

        if enduranceGain > 0 {
            state.character.stats[.durchhaltevermoegen, default: 0] += Double(enduranceGain)
        }

        levelUpCheck()
        checkAchievement(.focus_time)
        checkAchievement(.gold)

        saveState()
        showToast("+\(goldEarned) Gold | +\(manaEarned) Mana")
    }

    private func resetFocusTimerState() {
        focusTickTimer?.invalidate()
        focusTickTimer = nil

        state.vibe.timer.isSessionActive = false
        state.vibe.timer.startTime = nil
        state.vibe.timer.endTime = nil
        state.vibe.linkedQuest = nil
        state.vibe.currentSessionLabel = nil
        state.vibe.timer.elapsedSeconds = state.vibe.timer.mode == .pomodoro ? state.vibe.timer.pomodoroDuration : 0
    }

    func focusSummaryByLabel() -> [(label: String, minutes: Int, sessions: Int)] {
        var grouped: [String: (Int, Int)] = [:]
        for session in state.vibe.sessions {
            let current = grouped[session.label] ?? (0, 0)
            grouped[session.label] = (current.0 + session.duration, current.1 + 1)
        }

        return grouped
            .map { (label: $0.key, minutes: $0.value.0, sessions: $0.value.1) }
            .sorted { $0.minutes > $1.minutes }
    }

    // MARK: - Character labels

    func calculateCharacterLabel() -> CharacterLabel {
        let stats = state.character.stats
        let total = stats.values.reduce(0, +)
        if total < 15 {
            return SeedData.characterLabels.first(where: { $0.key == "neuling" }) ?? SeedData.characterLabels[0]
        }

        let normalized = stats.mapValues { $0 / total }
        let sorted = normalized.sorted { $0.value > $1.value }

        guard sorted.count >= 3 else {
            return SeedData.characterLabels.first(where: { $0.key == "allrounder" }) ?? SeedData.characterLabels[0]
        }

        let top = sorted[0]
        let second = sorted[1]
        let third = sorted[2]
        let threshold = 0.1

        if top.value - second.value > threshold {
            return singleStatLabel(for: top.key)
        }

        if top.value - third.value > threshold {
            return twoStatLabel(top.key, second.key)
        }

        if third.value > top.value - threshold {
            return SeedData.characterLabels.first(where: { $0.key == "allrounder" }) ?? SeedData.characterLabels[0]
        }

        return SeedData.characterLabels.first(where: { $0.key == "allrounder" }) ?? SeedData.characterLabels[0]
    }

    private func singleStatLabel(for stat: StatKey) -> CharacterLabel {
        let key: String
        switch stat {
        case .kraft: key = "kraftprotz"
        case .ausdauer: key = "marathoner"
        case .beweglichkeit: key = "akrobat"
        case .durchhaltevermoegen: key = "stoiker"
        case .willenskraft: key = "eiserner_wille"
        }
        return SeedData.characterLabels.first(where: { $0.key == key })
            ?? SeedData.characterLabels.first(where: { $0.key == "allrounder" })
            ?? SeedData.characterLabels[0]
    }

    private func twoStatLabel(_ stat1: StatKey, _ stat2: StatKey) -> CharacterLabel {
        let combo = Set([stat1, stat2])
        let key: String
        switch combo {
        case Set([.kraft, .willenskraft]): key = "tank"
        case Set([.kraft, .ausdauer]): key = "powerlaeufer"
        case Set([.kraft, .beweglichkeit]): key = "kraftakrobat"
        case Set([.ausdauer, .durchhaltevermoegen]): key = "langlaeufer"
        case Set([.beweglichkeit, .willenskraft]): key = "praezisionskuenstler"
        case Set([.durchhaltevermoegen, .willenskraft]): key = "unermuedlicher"
        default:
            key = "allrounder"
        }

        return SeedData.characterLabels.first(where: { $0.key == key })
            ?? SeedData.characterLabels.first(where: { $0.key == "allrounder" })
            ?? SeedData.characterLabels[0]
    }

    // MARK: - Dungeon

    func rollDungeonSpawnIfNeeded() {
        guard !hasRolledDungeonSpawn else { return }
        hasRolledDungeonSpawn = true

        state.dungeonProgress.activeDungeon = false
        if Double.random(in: 0...1) < 0.05 {
            state.dungeonProgress.activeDungeon = true
        }
        saveState()
    }

    func openDungeon() {
        state.dungeonProgress.globalLevel += 1

        let monster = SeedData.dungeon.monsters.randomElement() ?? SeedData.dungeon.monsters[0]
        let level = max(1, state.dungeonProgress.globalLevel)

        let scaledHp = Int(round(Double(monster.baseHp) * (1 + 0.18 * Double(level - 1))))
        let scaledDamage = Int(round(Double(monster.baseDmg) * (1 + 0.15 * Double(level - 1))))

        let equipment = calculateEquipmentStats(character: state.character)
        let scaledPlayerMaxHP = Int(round(Double(state.character.combat.hpMax) * (1 + (Double(max(0, equipment.schutz)) / 100.0))))

        activeDungeon = DungeonEncounter(
            dungeon: SeedData.dungeon,
            monster: monster,
            level: level,
            monsterHpMax: scaledHp,
            monsterHp: scaledHp,
            monsterBaseDamage: scaledDamage,
            playerHpMax: scaledPlayerMaxHP,
            playerHp: scaledPlayerMaxHP,
            attack: equipment.angriff,
            protection: equipment.schutz
        )

        saveState()
    }

    func performDungeonAction(task: DungeonTask, reps: Int) {
        guard var encounter = activeDungeon else { return }

        let clampedReps = max(1, min(999, reps))
        let baseDamage = task.baseDamage * clampedReps

        let playerDamage = Int(round(Double(baseDamage) * (1 + (Double(encounter.attack) / 100.0))))
        let mitigation = max(0, min(80, encounter.protection))
        let monsterCounter = Int(round(Double(encounter.monsterBaseDamage) * (1 - Double(mitigation) / 100.0)))

        encounter.monsterHp = max(0, encounter.monsterHp - playerDamage)
        encounter.playerHp = max(0, encounter.playerHp - monsterCounter)

        activeDungeon = encounter

        if encounter.monsterHp <= 0 {
            applyDungeonResult(outcome: .win, finalPlayerHP: encounter.playerHp)
            activeDungeon = nil
            selectedTab = .exercises
            showToast(state.settings.language == .de
                      ? "Sieg! +\(SeedData.dungeon.rewards.xp) Mana, +\(SeedData.dungeon.rewards.manaStones) Mana-Steine"
                      : "Victory! +\(SeedData.dungeon.rewards.xp) mana, +\(SeedData.dungeon.rewards.manaStones) mana stones")
            return
        }

        if encounter.playerHp <= 0 {
            applyDungeonResult(outcome: .loss, finalPlayerHP: encounter.playerHp)
            activeDungeon = nil
            selectedTab = .exercises
            showToast(state.settings.language == .de ? "Niederlage!" : "Defeat", isPenalty: true)
            return
        }

        showToast(state.settings.language == .de
                  ? "Du triffst für \(playerDamage). Du erleidest \(monsterCounter)."
                  : "You hit for \(playerDamage). You take \(monsterCounter).")
    }

    private enum DungeonOutcome {
        case win
        case loss
    }

    private func applyDungeonResult(outcome: DungeonOutcome, finalPlayerHP: Int) {
        let clampedHP = max(0, min(state.character.combat.hpMax, finalPlayerHP))
        state.character.combat.hpCurrent = clampedHP

        if outcome == .win {
            state.character.mana += SeedData.dungeon.rewards.xp
            let stonesToAdd = SeedData.dungeon.rewards.manaStones
            let currentConsumables = state.character.inventory.filter { $0.type == .consumable }.count
            let availableSlots = max(0, 5 - currentConsumables)
            let gain = min(stonesToAdd, availableSlots)

            if gain > 0 {
                for _ in 0..<gain {
                    let stone = ItemInstance(
                        baseItemID: 302,
                        name: "Mittlerer Mana-Stein",
                        description: "Stellt 250 Mana wieder her.",
                        cost: 280,
                        type: .consumable,
                        effect: ["mana": 250]
                    )
                    state.character.inventory.append(stone)
                }
            }

            levelUpCheck()
            state.dungeonProgress.activeDungeon = false
        }

        saveState()
    }

    // MARK: - Tutorial

    func completeOnboarding(name: String, hasEquipment: Bool, trainingGoal: TrainingGoal) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        state.character.name = trimmed.isEmpty ? "Unknown Hunter" : trimmed

        let finalGoal: TrainingGoal
        if trainingGoal == .muscle {
            finalGoal = hasEquipment ? .muscle : .calisthenics
        } else {
            finalGoal = trainingGoal
        }

        state.settings.goal = finalGoal
        state.settings.difficulty = 2
        state.settings.restDays = 1

        state.tutorial.completed = true
        showOnboarding = false

        generateDailyQuestsIfNeeded(forceRegenerate: true)
        saveState()
    }

    func resetTutorial() {
        state.tutorial.completed = false
        state.tutorial.seenFeatures = []
        showOnboarding = true
        saveState()
    }

    func maybeShowFeatureTip(_ feature: FeatureTip) {
        guard state.tutorial.completed else { return }
        guard !state.tutorial.seenFeatures.contains(feature.key) else { return }
        state.tutorial.seenFeatures.insert(feature.key)
        showingFeatureTip = feature
        saveState()
    }

    // MARK: - Export / Import

    func exportData() throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(state)
    }

    func importData(_ data: Data) throws {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let imported = try decoder.decode(GameState.self, from: data)

        focusTickTimer?.invalidate()
        focusTickTimer = nil

        state = imported
        state.vibe.timer.isSessionActive = false
        state.vibe.timer.startTime = nil
        state.vibe.timer.endTime = nil
        state.vibe.linkedQuest = nil
        state.vibe.currentSessionLabel = nil

        selectedTab = .exercises
        activeDungeon = nil
        showOnboarding = !state.tutorial.completed

        saveState()
    }

    // MARK: - Helpers

    func labelKeyForExercise(_ nameKey: String) -> String {
        switch nameKey {
        case "read_15pages", "read_for_school":
            return "focus_label_reading"
        case "learn_something", "learn_new_skill", "learn_language", "learn_math", "learn_science":
            return "focus_label_learning"
        default:
            return "focus_label_learning"
        }
    }

    func isRestDay() -> Bool {
        guard state.settings.goal != .sick else { return false }

        let dayOfWeek = Calendar.current.component(.weekday, from: Date()) - 1
        let activeRestDays: [Int]

        switch state.settings.restDays {
        case 1: activeRestDays = [0]
        case 2: activeRestDays = [2, 6]
        case 3: activeRestDays = [0, 2, 4]
        default: activeRestDays = []
        }

        return activeRestDays.contains(dayOfWeek)
    }

    private func showToast(_ text: String, isPenalty: Bool = false) {
        toast = ToastMessage(text: text, isPenalty: isPenalty)
        let toastID = toast?.id
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            guard let self else { return }
            if self.toast?.id == toastID {
                self.toast = nil
            }
        }
    }

    private func loadState() {
        guard FileManager.default.fileExists(atPath: saveURL.path) else {
            state = SeedData.defaultState()
            generateDailyQuestsIfNeeded(forceRegenerate: true)
            saveState()
            return
        }

        do {
            let data = try Data(contentsOf: saveURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            state = try decoder.decode(GameState.self, from: data)
        } catch {
            print("Failed to load state: \(error)")
            state = SeedData.defaultState()
            generateDailyQuestsIfNeeded(forceRegenerate: true)
            saveState()
        }
    }

    private func saveState() {
        do {
            let directory = saveURL.deletingLastPathComponent()
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

            let encoder = JSONEncoder()
            encoder.outputFormatting = [.sortedKeys]
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(state)
            try data.write(to: saveURL, options: [.atomic])
        } catch {
            print("Failed to save state: \(error)")
        }
    }

    private static func makeSaveURL() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return base.appendingPathComponent("DailyQuest/state.json")
    }
}

struct FeatureTip: Identifiable, Hashable {
    let id = UUID()
    let key: String
    let title: String
    let text: String

    static let exercises = FeatureTip(
        key: "exercises",
        title: "Daily Quests",
        text: "Schließe alle Daily Quests bis Mitternacht ab, um Strafen zu vermeiden."
    )

    static let focus = FeatureTip(
        key: "focus",
        title: "Fokus",
        text: "Längere Fokus-Sessions geben Gold, Mana und Durchhaltevermögen."
    )

    static let character = FeatureTip(
        key: "character",
        title: "Charakter",
        text: "Hier siehst du Stats, Inventar, Streak und deinen Fortschritt."
    )

    static let shop = FeatureTip(
        key: "shop",
        title: "Shop",
        text: "Kaufe Ausrüstung für Dungeon-Kämpfe und nützliche Verbrauchsitems."
    )

    static let extraQuest = FeatureTip(
        key: "extraQuest",
        title: "Extra-Quest",
        text: "Hohes Risiko, hohe Belohnung. Scheitern hat harte Konsequenzen."
    )
}
