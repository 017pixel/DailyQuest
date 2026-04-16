import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: GameStore

    @State private var showSettings = false
    @State private var showAchievements = false

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                TabView(selection: $store.selectedTab) {
                    ExercisesView()
                        .tag(MainTab.exercises)
                        .tabItem {
                            Label(store.tabTitle(.exercises), systemImage: "figure.strengthtraining.traditional")
                        }

                    FocusView()
                        .tag(MainTab.focus)
                        .tabItem {
                            Label(store.tabTitle(.focus), systemImage: "timer")
                        }

                    CharacterView()
                        .tag(MainTab.character)
                        .tabItem {
                            Label(store.tabTitle(.character), systemImage: "person.crop.circle")
                        }

                    ShopView()
                        .tag(MainTab.shop)
                        .tabItem {
                            Label(store.tabTitle(.shop), systemImage: "bag")
                        }

                    ExtraQuestView()
                        .tag(MainTab.extraQuest)
                        .tabItem {
                            Label(store.tabTitle(.extraQuest), systemImage: "bolt.fill")
                        }
                }

                if store.state.dungeonProgress.activeDungeon && store.activeDungeon == nil {
                    Button {
                        store.openDungeon()
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "location.circle.fill")
                            Text(store.t("dungeon_spawn"))
                                .lineLimit(1)
                            Text(store.t("dungeon_go"))
                                .fontWeight(.bold)
                        }
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(.ultraThinMaterial, in: Capsule())
                        .overlay(
                            Capsule()
                                .stroke(Color.accentColor.opacity(0.35), lineWidth: 1)
                        )
                        .shadow(radius: 6, y: 2)
                    }
                    .padding(.bottom, 62)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle(store.tabTitle(store.selectedTab))
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        showAchievements = true
                    } label: {
                        Image(systemName: "trophy")
                    }

                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .onChange(of: store.selectedTab) { _, newTab in
                switch newTab {
                case .exercises:
                    store.maybeShowFeatureTip(.exercises)
                case .focus:
                    store.maybeShowFeatureTip(.focus)
                case .character:
                    store.maybeShowFeatureTip(.character)
                case .shop:
                    store.maybeShowFeatureTip(.shop)
                case .extraQuest:
                    store.maybeShowFeatureTip(.extraQuest)
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showAchievements) {
                AchievementsView()
            }
            .fullScreenCover(
                isPresented: Binding(
                    get: { store.activeDungeon != nil },
                    set: { isPresented in
                        if !isPresented {
                            store.activeDungeon = nil
                        }
                    }
                )
            ) {
                DungeonView()
            }
            .fullScreenCover(isPresented: $store.showOnboarding) {
                OnboardingView()
            }
            .alert(item: $store.showingFeatureTip) { tip in
                Alert(
                    title: Text(tip.title),
                    message: Text(tip.text),
                    dismissButton: .default(Text("OK"))
                )
            }
            .overlay(alignment: .top) {
                if let toast = store.toast {
                    ToastView(text: toast.text, isPenalty: toast.isPenalty)
                        .padding(.top, 8)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .animation(.spring(duration: 0.25), value: store.toast)
            .animation(.spring(duration: 0.25), value: store.state.dungeonProgress.activeDungeon)
        }
        .preferredColorScheme(store.state.settings.theme == .dark ? .dark : .light)
    }
}

private struct ToastView: View {
    let text: String
    let isPenalty: Bool

    var body: some View {
        Text(text)
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .multilineTextAlignment(.center)
            .background(isPenalty ? Color.red.opacity(0.2) : Color.accentColor.opacity(0.2), in: Capsule())
            .overlay(
                Capsule()
                    .stroke(isPenalty ? Color.red.opacity(0.5) : Color.accentColor.opacity(0.4), lineWidth: 1)
            )
            .padding(.horizontal, 18)
    }
}
