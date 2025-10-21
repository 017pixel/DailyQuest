const DQ_DUNGEON_COMBAT = {
    state: {
        dungeonId: null,
        monsterName: null,
        monsterLevel: 1,
        monsterHpMax: 0,
        monsterHp: 0,
        playerHp: 0,
        playerHpMax: 0,
        attack: 0,
        protection: 0,
        monsterBaseDamage: 8
    },

    // Initialize with precomputed scaled monster stats
    initForDungeon(dungeon, params) {
        this.state.dungeonId = dungeon.id;
        this.state.monsterName = params && params.monsterName ? params.monsterName : null;
        this.state.monsterLevel = params && params.level ? params.level : 1;
        this.state.monsterHpMax = params && params.hpMax ? params.hpMax : 30;
        this.state.monsterHp = this.state.monsterHpMax;
        this.state.monsterBaseDamage = (params && params.baseDamage) ? params.baseDamage : 8;
        // Spielerwerte laden
        const defaults = { hpMax: 100, hpCurrent: 100, attack: 0, protection: 0 };
        const stats = this.getPlayerCombatStatsSync(defaults);
        // Apply protection bonus to max HP (+1% per protection point)
        const scaledMaxHp = Math.round((stats.hpMax || 100) * (1 + (Math.max(0, stats.protection || 0) / 100)));
        this.state.playerHpMax = scaledMaxHp;
        // Reset to full HP when entering a dungeon - ALWAYS start with full HP
        this.state.playerHp = scaledMaxHp;
        this.state.attack = stats.attack;
        this.state.protection = stats.protection;
    },

    getPlayerCombatStatsSync(fallback) {
        // Synchronous snapshot via last known character in DB; if not available, return fallback
        try {
            // We cannot block on IndexedDB synchronously; rely on cached values on window.
            const cachedChar = window.__dq_cached_char__;
            if (cachedChar && cachedChar.combat) return cachedChar.combat;
        } catch {}
        return fallback;
    },

    calculatePlayerDamage(baseDamage) {
        const { attack } = this.state;
        return Math.round(baseDamage * (1 + (attack / 100)));
    },

    calculateMonsterCounterDamage() {
        const { monsterBaseDamage, protection } = this.state;
        const mitigation = Math.max(0, Math.min(80, protection));
        return Math.round(monsterBaseDamage * (1 - mitigation / 100));
    },

    applyAction(baseDamage) {
        const playerDmg = this.calculatePlayerDamage(baseDamage);
        const monsterDmg = this.calculateMonsterCounterDamage();

        this.state.monsterHp = Math.max(0, this.state.monsterHp - playerDmg);
        this.state.playerHp = Math.max(0, this.state.playerHp - monsterDmg);

        return { playerDmg, monsterDmg, monsterHp: this.state.monsterHp, playerHp: this.state.playerHp };
    },

    isWin() { return this.state.monsterHp <= 0; },
    isLoss() { return this.state.playerHp <= 0; }
};


