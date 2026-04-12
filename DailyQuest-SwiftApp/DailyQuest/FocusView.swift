import SwiftUI

struct FocusView: View {
    @EnvironmentObject private var store: GameStore

    @State private var showLabelDialog = false
    @State private var showNewLabelPrompt = false
    @State private var newLabelName = ""

    private let quotesDE = [
        "Jeder Schritt zählt.",
        "Konzentration ist der Schlüssel.",
        "Bleib dran, du schaffst das!",
        "Eine Minute nach der anderen.",
        "Wachstum braucht Zeit und Fokus."
    ]

    private let quotesEN = [
        "Every step counts.",
        "Concentration is the key.",
        "Keep going, you can do it!",
        "One minute at a time.",
        "Growth needs time and focus."
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                Picker("Mode", selection: Binding(
                    get: { store.state.vibe.timer.mode },
                    set: { store.setFocusMode($0) }
                )) {
                    Text(store.t("timer")).tag(FocusMode.pomodoro)
                    Text(store.t("stopwatch")).tag(FocusMode.stopwatch)
                }
                .pickerStyle(.segmented)
                .disabled(store.state.vibe.timer.isSessionActive)

                Text(formattedTime)
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .padding(.top, 8)

                if store.state.vibe.timer.isSessionActive {
                    Text(randomQuote)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)
                }

                if store.state.vibe.timer.mode == .pomodoro {
                    HStack(spacing: 8) {
                        ForEach([15, 25, 50], id: \.self) { minutes in
                            Button("\(minutes) min") {
                                store.setPomodoroDuration(minutes: minutes)
                            }
                            .buttonStyle(.bordered)
                            .tint(store.state.vibe.timer.pomodoroDuration == minutes * 60 ? .accentColor : .secondary)
                            .disabled(store.state.vibe.timer.isSessionActive)
                        }
                    }
                }

                Button {
                    if store.state.vibe.timer.isSessionActive {
                        store.stopFocusSessionManually()
                    } else {
                        startFlow()
                    }
                } label: {
                    Text(store.state.vibe.timer.isSessionActive ? store.t("stop") : store.t("start"))
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .padding(.top, 4)

                Divider()

                VStack(alignment: .leading, spacing: 10) {
                    Text(store.t("focus_stats"))
                        .font(.headline)

                    let totalMinutes = store.state.vibe.sessions.reduce(0) { $0 + $1.duration }
                    HStack {
                        statBlock(title: store.state.settings.language == .de ? "Gesamtzeit" : "Total time", value: formatMinutes(totalMinutes))
                        statBlock(title: store.state.settings.language == .de ? "Sessions" : "Sessions", value: "\(store.state.vibe.sessions.count)")
                    }

                    ForEach(store.focusSummaryByLabel(), id: \.label) { summary in
                        HStack {
                            Text(summary.label)
                                .fontWeight(.medium)
                            Spacer()
                            Text("\(formatMinutes(summary.minutes)) (\(summary.sessions))")
                                .foregroundStyle(.secondary)
                        }
                    }

                    if store.focusSummaryByLabel().isEmpty {
                        Text(store.state.settings.language == .de ? "Noch keine Fokus-Sessions" : "No focus sessions yet")
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(16)
        }
        .confirmationDialog(store.t("focus_label_title"), isPresented: $showLabelDialog, titleVisibility: .visible) {
            ForEach(store.focusAllLabels, id: \.self) { label in
                Button(label) {
                    store.startFocusSession(withLabel: label)
                }
            }

            Button(store.t("focus_add_label")) {
                showNewLabelPrompt = true
            }

            Button("Cancel", role: .cancel) {}
        }
        .sheet(isPresented: $showNewLabelPrompt) {
            NavigationStack {
                Form {
                    TextField(store.t("focus_new_label"), text: $newLabelName)
                }
                .navigationTitle(store.t("focus_new_label"))
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            newLabelName = ""
                            showNewLabelPrompt = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(store.t("save")) {
                            store.addCustomFocusLabel(newLabelName)
                            let saved = newLabelName.trimmingCharacters(in: .whitespacesAndNewlines)
                            if !saved.isEmpty {
                                store.startFocusSession(withLabel: saved)
                            }
                            newLabelName = ""
                            showNewLabelPrompt = false
                        }
                    }
                }
            }
        }
    }

    private var formattedTime: String {
        let seconds: Int
        if store.state.vibe.timer.isSessionActive {
            seconds = store.state.vibe.timer.elapsedSeconds
        } else {
            seconds = store.state.vibe.timer.mode == .pomodoro ? store.state.vibe.timer.pomodoroDuration : 0
        }

        let minutes = seconds / 60
        let remaining = seconds % 60
        return String(format: "%02d:%02d", minutes, remaining)
    }

    private var randomQuote: String {
        let source = store.state.settings.language == .de ? quotesDE : quotesEN
        return source.randomElement() ?? source[0]
    }

    private func startFlow() {
        if let linked = store.state.vibe.linkedQuest,
           let labelKey = linked.labelKey {
            let label = defaultLabelFromKey(labelKey)
            store.startFocusSession(withLabel: label)
            return
        }

        showLabelDialog = true
    }

    private func defaultLabelFromKey(_ key: String) -> String {
        switch key {
        case "focus_label_reading":
            return store.state.settings.language == .de ? "Lesen" : "Reading"
        case "focus_label_meditating":
            return store.state.settings.language == .de ? "Meditieren" : "Meditating"
        default:
            return store.state.settings.language == .de ? "Lernen" : "Learning"
        }
    }

    @ViewBuilder
    private func statBlock(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
    }

    private func formatMinutes(_ mins: Int) -> String {
        let hours = mins / 60
        let minutes = mins % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}
