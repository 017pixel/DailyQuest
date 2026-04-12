import SwiftUI

struct ExercisesView: View {
    @EnvironmentObject private var store: GameStore

    @State private var selectedFilter: TrainingGoal? = nil
    @State private var searchText = ""
    @State private var highlightedExerciseID: Int?
    @State private var infoPayload: ExerciseInfoPayload?

    private let filterOptions: [TrainingGoal?] = [
        nil,
        .muscle,
        .endurance,
        .fatloss,
        .kraft_abnehmen,
        .learning,
        .restday,
        .general_workout,
        .calisthenics,
        .sick
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(store.t("daily_quests"))
                    .font(.title3.bold())

                if store.dailyQuestsForToday().isEmpty {
                    Text(store.state.settings.language == .de ? "Noch keine Quests für heute." : "No quests for today yet.")
                        .foregroundStyle(.secondary)
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(store.dailyQuestsForToday()) { quest in
                            QuestCard(
                                title: store.exerciseName(for: quest.nameKey),
                                target: store.formatTarget(type: quest.type, value: quest.target),
                                completed: quest.completed,
                                isFocus: quest.type == .focus,
                                onInfo: {
                                    infoPayload = .quest(quest)
                                },
                                onAction: {
                                    if quest.type == .focus {
                                        store.prepareFocusForQuest(questID: quest.id)
                                    } else {
                                        store.completeQuest(quest.id)
                                    }
                                }
                            )
                        }
                    }
                }

                if store.isRestDay() {
                    Text(store.t("restday_info_box"))
                        .font(.subheadline)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                }

                Divider()

                Text(store.t("free_training"))
                    .font(.title3.bold())

                HStack(spacing: 8) {
                    TextField(store.t("search"), text: $searchText)
                        .textFieldStyle(.roundedBorder)

                    Button(store.t("search")) {
                        guard let result = store.searchExercise(term: searchText) else {
                            store.toast = ToastMessage(
                                text: store.state.settings.language == .de
                                    ? "Übung nicht gefunden."
                                    : "Exercise not found.",
                                isPenalty: true
                            )
                            return
                        }
                        selectedFilter = nil
                        highlightedExerciseID = result.id
                    }
                    .buttonStyle(.borderedProminent)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(filterOptions, id: \.self) { option in
                            Button(filterTitle(option)) {
                                selectedFilter = option
                            }
                            .buttonStyle(.bordered)
                            .tint(selectedFilter == option ? .accentColor : .secondary)
                        }
                    }
                    .padding(.vertical, 2)
                }

                LazyVStack(spacing: 12) {
                    ForEach(store.freeExercises(filter: selectedFilter)) { exercise in
                        QuestCard(
                            title: store.exerciseName(for: exercise.nameKey),
                            target: scaledTargetText(for: exercise),
                            completed: false,
                            isFocus: exercise.type == .focus,
                            onInfo: {
                                infoPayload = .exercise(exercise)
                            },
                            onAction: {
                                if exercise.type == .focus {
                                    store.prepareFocusForExercise(exerciseID: exercise.id)
                                } else {
                                    store.completeFreeExercise(exercise.id)
                                }
                            }
                        )
                        .overlay {
                            if highlightedExerciseID == exercise.id {
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.accentColor, lineWidth: 2)
                                    .padding(1)
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .onAppear {
            store.generateDailyQuestsIfNeeded(forceRegenerate: false)
        }
        .sheet(item: $infoPayload) { payload in
            ExerciseInfoView(payload: payload)
                .environmentObject(store)
        }
    }

    private func scaledTargetText(for exercise: ExerciseTemplate) -> String {
        var target = exercise.baseValue
        if exercise.type != .check && exercise.type != .link && exercise.type != .focus {
            target = Int(ceil(Double(exercise.baseValue) + (Double(exercise.baseValue) * 0.4 * Double(store.state.settings.difficulty - 1))))
        }
        return store.formatTarget(type: exercise.type, value: target)
    }

    private func filterTitle(_ filter: TrainingGoal?) -> String {
        guard let filter else {
            return store.state.settings.language == .de ? "Alle" : "All"
        }

        switch filter {
        case .muscle: return store.state.settings.language == .de ? "Kraft" : "Strength"
        case .endurance: return store.state.settings.language == .de ? "Ausdauer" : "Endurance"
        case .fatloss: return store.state.settings.language == .de ? "Fettverbrennung" : "Fat Loss"
        case .kraft_abnehmen: return store.state.settings.language == .de ? "Körpergewicht" : "Bodyweight"
        case .learning: return store.state.settings.language == .de ? "Lernen" : "Learning"
        case .restday: return store.state.settings.language == .de ? "Erholung" : "Recovery"
        case .general_workout: return store.state.settings.language == .de ? "Allgemein" : "General"
        case .calisthenics: return "Calisthenics"
        case .sick: return store.state.settings.language == .de ? "Krank" : "Sick"
        }
    }
}

private struct QuestCard: View {
    let title: String
    let target: String
    let completed: Bool
    let isFocus: Bool
    let onInfo: () -> Void
    let onAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                    if !target.isEmpty {
                        Text(target)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer(minLength: 8)
                HStack(spacing: 8) {
                    Button("?") {
                        onInfo()
                    }
                    .buttonStyle(.bordered)

                    Button {
                        onAction()
                    } label: {
                        if completed {
                            Image(systemName: "checkmark")
                        } else {
                            Text(isFocus ? "Start" : "OK")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(completed)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(completed ? Color.green.opacity(0.14) : Color.secondary.opacity(0.08))
        )
    }
}

private struct ExerciseInfoView: View {
    @EnvironmentObject private var store: GameStore
    let payload: ExerciseInfoPayload

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(title)
                        .font(.title3.bold())

                    Text(store.explanation(for: nameKey))
                        .font(.body)
                        .foregroundStyle(.secondary)

                    if !targetText.isEmpty {
                        infoRow(label: store.state.settings.language == .de ? "Ziel" : "Target", value: targetText)
                    }

                    infoRow(label: store.state.settings.language == .de ? "Belohnung" : "Reward", value: "+\(manaReward) Mana, +\(goldReward) Gold")
                }
                .padding(16)
            }
            .navigationTitle(store.state.settings.language == .de ? "Infos" : "Info")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var nameKey: String {
        switch payload {
        case .quest(let quest): return quest.nameKey
        case .exercise(let exercise): return exercise.nameKey
        }
    }

    private var title: String {
        store.exerciseName(for: nameKey)
    }

    private var targetText: String {
        switch payload {
        case .quest(let quest):
            return store.formatTarget(type: quest.type, value: quest.target)
        case .exercise(let exercise):
            let difficulty = store.state.settings.difficulty
            var target = exercise.baseValue
            if exercise.type != .check && exercise.type != .link && exercise.type != .focus {
                target = Int(ceil(Double(exercise.baseValue) + (Double(exercise.baseValue) * 0.4 * Double(difficulty - 1))))
            }
            return store.formatTarget(type: exercise.type, value: target)
        }
    }

    private var manaReward: Int {
        switch payload {
        case .quest(let quest):
            return quest.manaReward
        case .exercise(let exercise):
            let difficulty = store.state.settings.difficulty
            return Int(ceil(Double(exercise.mana) * (1 + 0.2 * Double(difficulty - 1))))
        }
    }

    private var goldReward: Int {
        switch payload {
        case .quest(let quest):
            return quest.goldReward
        case .exercise(let exercise):
            let difficulty = store.state.settings.difficulty
            return Int(ceil(Double(exercise.gold) * (1 + 0.15 * Double(difficulty - 1))))
        }
    }

    @ViewBuilder
    private func infoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .fontWeight(.medium)
            Spacer()
            Text(value)
                .multilineTextAlignment(.trailing)
        }
    }
}

enum ExerciseInfoPayload: Identifiable {
    case quest(DailyQuest)
    case exercise(ExerciseTemplate)

    var id: String {
        switch self {
        case .quest(let q): return "quest-\(q.id)"
        case .exercise(let e): return "exercise-\(e.id)"
        }
    }
}
