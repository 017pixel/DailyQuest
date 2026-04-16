//
//  DailyQuestApp.swift
//  DailyQuest
//
//  Created by Noah R on 17.03.26.
//

import SwiftUI

@main
struct DailyQuestApp: App {
    @StateObject private var store = GameStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
