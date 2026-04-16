import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var store: GameStore

    @State private var name = ""
    @State private var hasEquipment = false
    @State private var goal: TrainingGoal = .muscle

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(store.state.settings.language == .de ? "Willkommen bei DailyQuest" : "Welcome to DailyQuest")
                        .font(.largeTitle.bold())

                    Text(store.state.settings.language == .de
                         ? "Richte deinen Hunter ein. Danach werden tägliche Quests, Fokus-Training und Fortschritt automatisch für dich erzeugt."
                         : "Set up your hunter. After that, daily quests, focus training and progression are generated automatically.")
                        .foregroundStyle(.secondary)

                    sectionCard {
                        TextField(store.t("name"), text: $name)
                            .textFieldStyle(.roundedBorder)
                    }

                    sectionCard {
                        Picker(store.t("language"), selection: Binding(
                            get: { store.state.settings.language },
                            set: { store.updateLanguage($0) }
                        )) {
                            ForEach(AppLanguage.allCases) { language in
                                Text(language.title).tag(language)
                            }
                        }

                        Picker(store.t("goal"), selection: $goal) {
                            Text(store.state.settings.language == .de ? "Muskelaufbau" : "Muscle").tag(TrainingGoal.muscle)
                            Text(store.state.settings.language == .de ? "Ausdauer" : "Endurance").tag(TrainingGoal.endurance)
                            Text(store.state.settings.language == .de ? "Abnehmen" : "Fat Loss").tag(TrainingGoal.fatloss)
                            Text(store.state.settings.language == .de ? "Kraft + Abnehmen" : "Strength + Fat Loss").tag(TrainingGoal.kraft_abnehmen)
                            Text(store.state.settings.language == .de ? "Lernen" : "Learning").tag(TrainingGoal.learning)
                            Text("Calisthenics").tag(TrainingGoal.calisthenics)
                            Text(store.state.settings.language == .de ? "Krank" : "Sick").tag(TrainingGoal.sick)
                        }

                        Toggle(store.state.settings.language == .de ? "Ich trainiere mit Equipment" : "I train with equipment", isOn: $hasEquipment)
                            .disabled(goal != .muscle)
                            .opacity(goal == .muscle ? 1 : 0.45)
                    }

                    sectionCard {
                        Toggle(store.t("theme"), isOn: Binding(
                            get: { store.state.settings.theme == .light },
                            set: { store.updateTheme($0 ? .light : .dark) }
                        ))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(store.t("difficulty"))
                            Slider(
                                value: Binding(
                                    get: { Double(store.state.settings.difficulty) },
                                    set: { store.updateDifficulty(Int($0.rounded())) }
                                ),
                                in: 1...5,
                                step: 1
                            )
                            Text("\(store.state.settings.difficulty)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Button {
                        store.completeOnboarding(name: name, hasEquipment: hasEquipment, trainingGoal: goal)
                    } label: {
                        Text(store.state.settings.language == .de ? "Abenteuer starten" : "Start Adventure")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .buttonStyle(.borderedProminent)
                    .padding(.top, 4)
                }
                .padding(16)
            }
            .onAppear {
                name = store.state.character.name == "Unknown Hunter" ? "" : store.state.character.name
                goal = store.state.settings.goal
            }
        }
    }

    @ViewBuilder
    private func sectionCard(@ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 12, content: content)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }
}
