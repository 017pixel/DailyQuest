import SwiftUI

struct ShopView: View {
    @EnvironmentObject private var store: GameStore

    enum ShopFilter: String, CaseIterable, Identifiable {
        case all
        case weapon
        case armor
        case consumable
        case streakFreeze

        var id: String { rawValue }
    }

    @State private var filter: ShopFilter = .all

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text(store.t("shop"))
                        .font(.title3.bold())
                    Spacer()
                    Text("\(store.t("gold")): \(store.state.character.gold)")
                        .font(.subheadline.weight(.semibold))
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(ShopFilter.allCases) { entry in
                            Button(title(for: entry)) {
                                filter = entry
                            }
                            .buttonStyle(.bordered)
                            .tint(filter == entry ? .accentColor : .secondary)
                        }
                    }
                    .padding(.vertical, 2)
                }

                LazyVStack(spacing: 10) {
                    ForEach(filteredItems) { item in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(item.name)
                                .font(.headline)
                            Text(item.description)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            HStack {
                                Text("\(item.cost) Gold")
                                    .fontWeight(.semibold)
                                Spacer()
                                Button(store.t("shop_buy")) {
                                    store.buyItem(item)
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(store.state.character.gold < item.cost)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .padding(16)
        }
    }

    private var filteredItems: [ShopItem] {
        let base = store.state.shopItems
        let result: [ShopItem]

        switch filter {
        case .all:
            result = base
        case .weapon:
            result = base.filter { $0.type == .weapon }
        case .armor:
            result = base.filter { $0.type == .armor }
        case .consumable:
            result = base.filter { $0.type == .consumable }
        case .streakFreeze:
            result = base.filter { $0.type == .streak_freeze }
        }

        return result.sorted { $0.id < $1.id }
    }

    private func title(for filter: ShopFilter) -> String {
        switch filter {
        case .all:
            return store.state.settings.language == .de ? "Alle" : "All"
        case .weapon:
            return store.state.settings.language == .de ? "Waffen" : "Weapons"
        case .armor:
            return store.state.settings.language == .de ? "Rüstung" : "Armor"
        case .consumable:
            return store.state.settings.language == .de ? "Mana" : "Mana"
        case .streakFreeze:
            return store.state.settings.language == .de ? "Weiteres" : "Other"
        }
    }
}
