import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    @State private var characterName: String = ""

    @State private var showExporter = false
    @State private var showImporter = false
    @State private var exportDocument = BackupDocument()
    @State private var alertMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                generalSection
                trainingSection
                weightSection
                tutorialSection
                dataSection
            }
            .navigationTitle(store.t("settings"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear {
                characterName = store.state.character.name
            }
            .fileExporter(
                isPresented: $showExporter,
                document: exportDocument,
                contentType: .json,
                defaultFilename: "dailyquest-backup-\(store.todayString())"
            ) { result in
                if case .failure(let error) = result {
                    alertMessage = error.localizedDescription
                }
            }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json]) { result in
                switch result {
                case .success(let url):
                    do {
                        let data = try Data(contentsOf: url)
                        try store.importData(data)
                    } catch {
                        alertMessage = error.localizedDescription
                    }
                case .failure(let error):
                    alertMessage = error.localizedDescription
                }
            }
            .alert("Error", isPresented: Binding(
                get: { alertMessage != nil },
                set: { if !$0 { alertMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }

    private var generalSection: some View {
        Section(store.t("settings")) {
            TextField(store.t("name"), text: Binding(
                get: { characterName },
                set: { newValue in
                    characterName = newValue
                    store.updateCharacterName(newValue)
                }
            ))

            Picker(store.t("language"), selection: Binding(
                get: { store.state.settings.language },
                set: { store.updateLanguage($0) }
            )) {
                ForEach(AppLanguage.allCases) { language in
                    Text(language.title).tag(language)
                }
            }

            Toggle(store.t("theme"), isOn: Binding(
                get: { store.state.settings.theme == .light },
                set: { store.updateTheme($0 ? .light : .dark) }
            ))
        }
    }

    private var trainingSection: some View {
        Section(store.state.settings.language == .de ? "Training" : "Training") {
            VStack(alignment: .leading) {
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

            Picker(store.t("goal"), selection: Binding(
                get: { store.state.settings.goal },
                set: { store.updateGoal($0) }
            )) {
                Text(store.state.settings.language == .de ? "Muskelaufbau" : "Muscle").tag(TrainingGoal.muscle)
                Text(store.state.settings.language == .de ? "Ausdauer" : "Endurance").tag(TrainingGoal.endurance)
                Text(store.state.settings.language == .de ? "Abnehmen" : "Fat Loss").tag(TrainingGoal.fatloss)
                Text(store.state.settings.language == .de ? "Kraft + Abnehmen" : "Strength + Fat Loss").tag(TrainingGoal.kraft_abnehmen)
                Text("Calisthenics").tag(TrainingGoal.calisthenics)
                Text(store.state.settings.language == .de ? "Krank" : "Sick").tag(TrainingGoal.sick)
            }

            Picker(store.t("rest_days"), selection: Binding(
                get: { store.state.settings.restDays },
                set: { store.updateRestDays($0) }
            )) {
                ForEach(0...3, id: \.self) { value in
                    Text("\(value)").tag(value)
                }
            }
        }
    }

    private var weightSection: some View {
        Section(store.t("weight_tracking")) {
            Toggle(store.t("tracking_enabled"), isOn: Binding(
                get: { store.state.character.weightTrackingEnabled },
                set: { store.updateWeightTrackingEnabled($0) }
            ))

            if store.state.character.weightTrackingEnabled {
                TextField(store.t("target_weight"), value: Binding(
                    get: { store.state.character.targetWeight },
                    set: { store.updateTargetWeight($0) }
                ), format: .number)
                .keyboardType(.decimalPad)

                Picker(store.t("goal"), selection: Binding(
                    get: { store.state.character.weightDirection },
                    set: { store.updateWeightDirection($0) }
                )) {
                    Text(store.t("goal_lose_weight")).tag(WeightDirection.lose)
                    Text(store.t("goal_gain_weight")).tag(WeightDirection.gain)
                }

                Button(role: .destructive) {
                    store.deleteWeightData()
                } label: {
                    Text(store.t("delete_weight_data"))
                }
            }
        }
    }

    private var tutorialSection: some View {
        Section("Tutorial") {
            Button(store.t("reset_tutorial")) {
                store.resetTutorial()
            }
        }
    }

    private var dataSection: some View {
        Section("Data") {
            Button(store.t("export")) {
                do {
                    exportDocument = BackupDocument(data: try store.exportData())
                    showExporter = true
                } catch {
                    alertMessage = error.localizedDescription
                }
            }

            Button(store.t("import")) {
                showImporter = true
            }
        }
    }
}
