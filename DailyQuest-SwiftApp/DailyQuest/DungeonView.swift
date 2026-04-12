import SwiftUI

struct DungeonView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    @State private var reps: [String: Int] = [:]

    var body: some View {
        NavigationStack {
            if let encounter = store.activeDungeon {
                ScrollView {
                    VStack(spacing: 14) {
                        monsterCard(encounter)
                        taskCard(encounter)
                        playerCard(encounter)
                    }
                    .padding(16)
                }
                .navigationTitle("Dungeon")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") {
                            dismiss()
                        }
                    }
                }
                .onAppear {
                    for task in encounter.dungeon.tasks {
                        reps[task.id] = max(1, reps[task.id] ?? 1)
                    }
                }
            } else {
                VStack(spacing: 12) {
                    Text(store.state.settings.language == .de ? "Kein aktiver Dungeon." : "No active dungeon.")
                    Button("Close") {
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .navigationTitle("Dungeon")
            }
        }
    }

    private func monsterCard(_ encounter: DungeonEncounter) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(encounter.monster.name)
                    .font(.title3.bold())
                Spacer()
                Text("Lvl \(encounter.level)")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            HStack {
                Text(store.state.settings.language == .de ? "Monster HP" : "Monster HP")
                Spacer()
                Text("\(encounter.monsterHp) / \(encounter.monsterHpMax)")
                    .fontWeight(.semibold)
            }
            ProgressView(value: encounter.monsterHpMax > 0 ? Double(encounter.monsterHp) / Double(encounter.monsterHpMax) : 0)
                .tint(.red)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    private func taskCard(_ encounter: DungeonEncounter) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(store.state.settings.language == .de ? "Aktionen" : "Actions")
                .font(.headline)

            ForEach(encounter.dungeon.tasks) { task in
                VStack(alignment: .leading, spacing: 8) {
                    Text(task.label)
                        .font(.subheadline.weight(.semibold))

                    HStack {
                        Stepper(value: Binding(
                            get: { reps[task.id] ?? 1 },
                            set: { reps[task.id] = max(1, $0) }
                        ), in: 1...999) {
                            Text("\(reps[task.id] ?? 1) reps")
                                .font(.subheadline)
                        }

                        Spacer()

                        Button("OK") {
                            let value = reps[task.id] ?? 1
                            store.performDungeonAction(task: task, reps: value)
                            if store.activeDungeon == nil {
                                dismiss()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
                .padding(10)
                .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    private func playerCard(_ encounter: DungeonEncounter) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(store.state.settings.language == .de ? "Dein Status" : "Your status")
                .font(.headline)

            HStack {
                Text(store.state.settings.language == .de ? "HP" : "HP")
                Spacer()
                Text("\(encounter.playerHp) / \(encounter.playerHpMax)")
                    .fontWeight(.semibold)
            }
            ProgressView(value: encounter.playerHpMax > 0 ? Double(encounter.playerHp) / Double(encounter.playerHpMax) : 0)
                .tint(.green)

            HStack {
                Text("\(store.t("attack")): \(encounter.attack)")
                Spacer()
                Text("\(store.t("protection")): \(encounter.protection)")
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }
}
