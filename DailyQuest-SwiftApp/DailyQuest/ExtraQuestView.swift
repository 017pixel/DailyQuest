import SwiftUI

struct ExtraQuestView: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let quest = store.state.extraQuest {
                    activeQuestView(quest)
                } else {
                    inactiveView
                }
            }
            .padding(16)
        }
    }

    private var inactiveView: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(store.t("extra_quest"))
                .font(.title3.bold())

            Text(store.state.settings.language == .de
                 ? "Eine zufällige, fordernde Aufgabe. Hohes Risiko, hohe Belohnung."
                 : "A random demanding task. High risk, high reward.")
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 6) {
                penaltyRow(store.state.settings.language == .de ? "Level -1" : "Level -1")
                penaltyRow(store.state.settings.language == .de ? "150 Gold Strafe" : "150 gold penalty")
                penaltyRow(store.state.settings.language == .de ? "Stat-Verluste" : "Stat losses")
            }
            .padding(12)
            .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))

            Button(store.t("extra_start")) {
                store.startExtraQuest()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    private func activeQuestView(_ quest: ActiveExtraQuest) -> some View {
        TimelineView(.periodic(from: .now, by: 1)) { _ in
            let total = max(1, quest.deadline.timeIntervalSince(quest.startTime))
            let remaining = max(0, quest.deadline.timeIntervalSinceNow)
            let progress = remaining / total

            VStack(alignment: .leading, spacing: 14) {
                Text(store.t("extra_task"))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)

                Text(store.extraQuestName(for: quest.nameKey))
                    .font(.title3.bold())

                VStack(alignment: .leading, spacing: 6) {
                    Text(store.t("extra_time"))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text(formatRemaining(remaining))
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .monospacedDigit()

                    ProgressView(value: progress)
                        .tint(progress < 0.2 ? .red : .accentColor)
                }
                .padding(12)
                .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))

                Button(store.t("extra_complete")) {
                    store.completeExtraQuest()
                }
                .buttonStyle(.borderedProminent)
                .disabled(remaining <= 0)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
        }
    }

    @ViewBuilder
    private func penaltyRow(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
            Text(text)
                .font(.subheadline)
        }
    }

    private func formatRemaining(_ seconds: TimeInterval) -> String {
        let value = Int(seconds)
        let hours = value / 3600
        let minutes = (value % 3600) / 60
        let secs = value % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, secs)
    }
}
