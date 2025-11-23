/**
 * @file tutorial_triggers.js
 * @description Helper-Funktionen um Sub-Feature Tutorials zu triggern
 * z.B. wenn User auf Daily Quest klickt, auf Inventory Tab wechselt, etc.
 */

const DQ_TUTORIAL_TRIGGERS = {
    /**
     * Trigger für Daily Quests - wird aufgerufen wenn User erste Daily Quest sieht
     */
    async triggerDailyQuests() {
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;
        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('dailyQuests');
    },

    /**
     * Trigger für Free Training - wird aufgerufen wenn User scrollt/zum freien Training geht
     */
    async triggerFreeTraining() {
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;
        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('freeTraining');
    },

    /**
     * Trigger für Stats - wird aufgerufen wenn Character-Page geladen wird und Stats sichtbar sind
     */
    async triggerStats() {
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;
        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('stats');
    },

    /**
     * Trigger für Streak - wird aufgerufen wenn Character-Page geladen wird
     */
    async triggerStreak() {
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;
        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('streak');
    },

    /**
     * Trigger für Inventory Tab - wird aufgerufen wenn User zum Inventar wechselt
     */
    async triggerInventory() {
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;
        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('inventory');
    },

    /**
     * Trigger für Dungeon - wird aufgerufen wenn erstes Mal ein Dungeon erscheint
     */
    async triggerDungeon() {
        if (typeof DQ_TUTORIAL_PROGRESSIVE === 'undefined') return;
        await DQ_TUTORIAL_PROGRESSIVE.showFeatureTutorial('dungeon');
    }
};

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_TRIGGERS = DQ_TUTORIAL_TRIGGERS;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_TRIGGERS:', e);
}
