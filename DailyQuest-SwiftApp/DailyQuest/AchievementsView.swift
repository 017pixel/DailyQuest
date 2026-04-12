import SwiftUI

struct AchievementsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(store.achievementsList()) { entry in
                        AchievementCard(entry: entry)
                    }
                }
                .padding(16)
            }
            .navigationTitle(store.t("achievements"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct AchievementCard: View {
    @EnvironmentObject private var store: GameStore

    let entry: AchievementViewModel

    var body: some View {
        let info = store.achievementProgress(for: entry.id)
        let progressValue = info.goalValue > 0 ? Double(min(info.currentValue, info.goalValue)) / Double(info.goalValue) : 0

        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: entry.definition.icon)
                    .font(.title3)
                    .frame(width: 28, height: 28)
                    .foregroundStyle(Color.accentColor)

                VStack(alignment: .leading, spacing: 4) {
                    Text(store.achievementText(entry.definition.nameKey))
                        .font(.headline)
                    Text(store.achievementText(entry.definition.descriptionKey))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 8)
                Text("Tier \(info.currentTier)/\(info.totalTiers)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            ProgressView(value: progressValue)
                .tint(entry.status == .completed ? .green : .accentColor)

            HStack {
                Text("\(min(info.currentValue, info.goalValue)) / \(info.goalValue)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if entry.status == .claimable {
                    Button(store.t("claim")) {
                        store.claimAchievement(entry.id)
                    }
                    .buttonStyle(.borderedProminent)
                } else if entry.status == .completed {
                    Text(store.state.settings.language == .de ? "Abgeschlossen" : "Completed")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.green)
                } else {
                    Text(store.state.settings.language == .de ? "In Arbeit" : "In progress")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
    }
}
