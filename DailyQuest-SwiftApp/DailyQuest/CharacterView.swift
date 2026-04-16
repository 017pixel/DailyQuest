import SwiftUI
import Charts

struct CharacterView: View {
    @EnvironmentObject private var store: GameStore

    enum CharacterTab: String, CaseIterable, Identifiable {
        case stats
        case inventory

        var id: String { rawValue }
    }

    @State private var selectedTab: CharacterTab = .stats
    @State private var showAddWeightSheet = false
    @State private var weightInput = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                CharacterHeaderCard()

                CharacterVitalsCard()

                Picker("Tab", selection: $selectedTab) {
                    Text(store.t("base_stats")).tag(CharacterTab.stats)
                    Text(store.t("inventory")).tag(CharacterTab.inventory)
                }
                .pickerStyle(.segmented)

                if selectedTab == .stats {
                    statsTab
                } else {
                    inventoryTab
                }
            }
            .padding(16)
        }
        .sheet(isPresented: $showAddWeightSheet) {
            NavigationStack {
                Form {
                    TextField(store.state.settings.language == .de ? "Gewicht" : "Weight", text: $weightInput)
                        .keyboardType(.decimalPad)
                }
                .navigationTitle(store.t("add_weight"))
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            weightInput = ""
                            showAddWeightSheet = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button(store.t("save")) {
                            let normalized = weightInput.replacingOccurrences(of: ",", with: ".")
                            if let value = Double(normalized), value > 0 {
                                store.addWeightEntry(value)
                            }
                            weightInput = ""
                            showAddWeightSheet = false
                        }
                    }
                }
            }
        }
    }

    private var statsTab: some View {
        VStack(spacing: 14) {
            StatsRadarCard()

            FocusStatsCard()

            if store.state.character.weightTrackingEnabled {
                WeightTrackingCard(showAddWeightSheet: $showAddWeightSheet)
            }
        }
    }

    private var inventoryTab: some View {
        VStack(spacing: 14) {
            EquipmentCard()
            InventoryCard()
        }
    }
}

private struct CharacterHeaderCard: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        let char = store.state.character
        let manaPercentage = char.manaToNextLevel > 0 ? Double(char.mana) / Double(char.manaToNextLevel) : 0
        let label = store.calculateCharacterLabel()

        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(char.name)
                        .font(.title3.bold())
                    Text("\(store.t("level")): \(char.level)")
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(label.name)
                    .font(.caption.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color(hex: label.colorHex).opacity(0.2), in: Capsule())
            }

            Text("\(store.t("mana")): \(char.mana) / \(char.manaToNextLevel)")
                .font(.subheadline)

            ProgressView(value: manaPercentage)
                .tint(.accentColor)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct CharacterVitalsCard: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        let stats = store.equipmentStats

        HStack(spacing: 10) {
            SmallStat(title: store.t("gold"), value: "\(store.state.character.gold)", icon: "dollarsign.circle")
            SmallStat(title: store.t("attack"), value: "\(stats.angriff)", icon: "sword")
            SmallStat(title: store.t("protection"), value: "\(stats.schutz)", icon: "shield")
            SmallStat(title: store.t("streak"), value: "\(store.state.streak.streak)", icon: "flame")
        }
    }
}

private struct SmallStat: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 3) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
    }
}

private struct StatsRadarCard: View {
    @EnvironmentObject private var store: GameStore

    private let order: [StatKey] = [.kraft, .ausdauer, .beweglichkeit, .durchhaltevermoegen, .willenskraft]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(store.t("base_stats"))
                .font(.headline)

            RadarChart(stats: store.state.character.stats)
                .frame(height: 270)

            VStack(spacing: 8) {
                ForEach(order, id: \.self) { key in
                    HStack {
                        Text(statName(key))
                        Spacer()
                        Text(String(format: "%.1f", store.state.character.stats[key] ?? 0))
                            .fontWeight(.semibold)
                    }
                }
            }
            .font(.subheadline)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    private func statName(_ key: StatKey) -> String {
        switch key {
        case .kraft: return store.state.settings.language == .de ? "Kraft" : "Strength"
        case .ausdauer: return store.state.settings.language == .de ? "Ausdauer" : "Endurance"
        case .beweglichkeit: return store.state.settings.language == .de ? "Beweglichkeit" : "Agility"
        case .durchhaltevermoegen: return store.state.settings.language == .de ? "Durchhaltevermögen" : "Stamina"
        case .willenskraft: return store.state.settings.language == .de ? "Willenskraft" : "Willpower"
        }
    }
}

private struct RadarChart: View {
    let stats: [StatKey: Double]

    private let order: [StatKey] = [.kraft, .ausdauer, .beweglichkeit, .durchhaltevermoegen, .willenskraft]

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) * 0.32

            let maxValue = max(20, (stats.values.max() ?? 5) + 5)

            for level in 1...4 {
                let r = radius * CGFloat(level) / 4.0
                var path = Path()
                for i in 0..<order.count {
                    let angle = angleFor(index: i)
                    let point = CGPoint(x: center.x + r * cos(angle), y: center.y + r * sin(angle))
                    if i == 0 {
                        path.move(to: point)
                    } else {
                        path.addLine(to: point)
                    }
                }
                path.closeSubpath()
                context.stroke(path, with: .color(.secondary.opacity(0.25)), lineWidth: 1)
            }

            for i in 0..<order.count {
                let angle = angleFor(index: i)
                var axis = Path()
                axis.move(to: center)
                axis.addLine(to: CGPoint(x: center.x + radius * cos(angle), y: center.y + radius * sin(angle)))
                context.stroke(axis, with: .color(.secondary.opacity(0.2)), lineWidth: 1)
            }

            var shape = Path()
            for (i, key) in order.enumerated() {
                let value = stats[key] ?? 0
                let r = radius * CGFloat(value / maxValue)
                let angle = angleFor(index: i)
                let point = CGPoint(x: center.x + r * cos(angle), y: center.y + r * sin(angle))
                if i == 0 {
                    shape.move(to: point)
                } else {
                    shape.addLine(to: point)
                }
            }
            shape.closeSubpath()
            context.fill(shape, with: .color(.accentColor.opacity(0.25)))
            context.stroke(shape, with: .color(.accentColor), lineWidth: 2)
        }
    }

    private func angleFor(index: Int) -> CGFloat {
        (CGFloat(index) / CGFloat(order.count)) * (.pi * 2) - .pi / 2
    }
}

private struct FocusStatsCard: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(store.t("focus_stats"))
                .font(.headline)

            let totalMinutes = store.state.vibe.sessions.reduce(0) { $0 + $1.duration }
            HStack {
                Text(store.state.settings.language == .de ? "Gesamtzeit" : "Total")
                Spacer()
                Text(formatMinutes(totalMinutes))
                    .fontWeight(.semibold)
            }

            HStack {
                Text(store.state.settings.language == .de ? "Sessions" : "Sessions")
                Spacer()
                Text("\(store.state.vibe.sessions.count)")
                    .fontWeight(.semibold)
            }

            ForEach(store.focusSummaryByLabel(), id: \.label) { item in
                HStack {
                    Text(item.label)
                    Spacer()
                    Text("\(formatMinutes(item.minutes)) (\(item.sessions))")
                        .foregroundStyle(.secondary)
                }
            }

            if store.focusSummaryByLabel().isEmpty {
                Text(store.state.settings.language == .de ? "Noch keine Fokus-Sessions" : "No focus sessions yet")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    private func formatMinutes(_ mins: Int) -> String {
        let h = mins / 60
        let m = mins % 60
        if h > 0 {
            return "\(h)h \(m)m"
        }
        return "\(m)m"
    }
}

private struct WeightTrackingCard: View {
    @EnvironmentObject private var store: GameStore

    @Binding var showAddWeightSheet: Bool

    var body: some View {
        let entries = store.state.weightEntries.sorted { $0.time < $1.time }
        let latest = entries.last

        VStack(alignment: .leading, spacing: 10) {
            Text(store.t("weight_history"))
                .font(.headline)

            HStack {
                weightBlock(title: store.t("current"), value: latest.map { String(format: "%.1f kg", $0.weight) } ?? "-")
                weightBlock(title: store.t("target"), value: store.state.character.targetWeight.map { String(format: "%.1f kg", $0) } ?? "-")
            }

            if entries.count >= 2 {
                Chart(entries) { entry in
                    LineMark(
                        x: .value("Time", entry.time),
                        y: .value("Weight", entry.weight)
                    )
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Time", entry.time),
                        y: .value("Weight", entry.weight)
                    )
                }
                .frame(height: 180)
            } else if let only = entries.first {
                Text(String(format: "%.1f kg", only.weight))
                    .font(.title3.bold())
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 24)
                    .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
            } else {
                Text(store.state.settings.language == .de ? "Füge deinen ersten Eintrag hinzu." : "Add your first entry.")
                    .foregroundStyle(.secondary)
            }

            ForEach(entries.suffix(5).reversed()) { entry in
                HStack {
                    Text(entry.time.formatted(date: .abbreviated, time: .shortened))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(String(format: "%.1f kg", entry.weight))
                        .fontWeight(.semibold)
                }
                .font(.subheadline)
            }

            Button(store.t("add_weight")) {
                showAddWeightSheet = true
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    @ViewBuilder
    private func weightBlock(title: String, value: String) -> some View {
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
}

private struct EquipmentCard: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(store.t("equipment"))
                .font(.headline)

            if store.state.character.equipment.weapons.isEmpty && store.state.character.equipment.armor == nil {
                Text(store.state.settings.language == .de ? "Keine Ausrüstung angelegt." : "No equipment equipped.")
                    .foregroundStyle(.secondary)
            }

            ForEach(store.state.character.equipment.weapons) { weapon in
                InventoryItemRow(
                    item: weapon,
                    primaryTitle: store.t("unequip"),
                    primaryAction: { store.unequipWeapon(weapon.id) },
                    secondaryTitle: store.t("sell"),
                    secondaryAction: { store.sellEquippedWeapon(weapon.id) }
                )
            }

            if let armor = store.state.character.equipment.armor {
                InventoryItemRow(
                    item: armor,
                    primaryTitle: store.t("unequip"),
                    primaryAction: { store.unequipArmor() },
                    secondaryTitle: store.t("sell"),
                    secondaryAction: { store.sellEquippedArmor() }
                )
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct InventoryCard: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(store.t("inventory"))
                .font(.headline)

            if store.state.character.inventory.isEmpty {
                Text(store.state.settings.language == .de ? "Inventar ist leer." : "Inventory is empty.")
                    .foregroundStyle(.secondary)
            }

            ForEach(store.state.character.inventory, id: \.id) { item in
                row(for: item)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))
    }

    @ViewBuilder
    private func row(for item: ItemInstance) -> some View {
        switch item.type {
        case .consumable:
            InventoryItemRow(
                item: item,
                primaryTitle: store.t("use"),
                primaryAction: { store.useInventoryItem(item.id) },
                secondaryTitle: store.t("sell"),
                secondaryAction: { store.sellInventoryItem(item.id) }
            )
        case .streak_freeze:
            InventoryItemRow(
                item: item,
                primaryTitle: store.state.settings.language == .de ? "Aktiv" : "Active",
                primaryDisabled: true,
                primaryAction: {},
                secondaryTitle: store.t("sell"),
                secondaryAction: { store.sellInventoryItem(item.id) }
            )
        case .weapon, .armor:
            InventoryItemRow(
                item: item,
                primaryTitle: store.t("equip"),
                primaryAction: { store.equipInventoryItem(item.id) },
                secondaryTitle: store.t("sell"),
                secondaryAction: { store.sellInventoryItem(item.id) }
            )
        }
    }
}

private struct InventoryItemRow: View {
    let item: ItemInstance
    let primaryTitle: String
    var primaryDisabled: Bool = false
    let primaryAction: () -> Void
    let secondaryTitle: String
    let secondaryAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(item.name)
                .font(.headline)
            Text(item.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 8) {
                Button(primaryTitle) { primaryAction() }
                    .buttonStyle(.borderedProminent)
                    .disabled(primaryDisabled)
                Button(secondaryTitle) { secondaryAction() }
                    .buttonStyle(.bordered)
            }
        }
        .padding(10)
        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
    }
}

private extension Color {
    init(hex: String) {
        let cleaned = hex.replacingOccurrences(of: "#", with: "")
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)

        let r = Double((value >> 16) & 0xFF) / 255.0
        let g = Double((value >> 8) & 0xFF) / 255.0
        let b = Double(value & 0xFF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}
