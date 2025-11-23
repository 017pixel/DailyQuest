// Dungeon data (Phase 3)
const DQ_DUNGEONS = {
    list: [
        {
            id: 'forest-trial',
            name: 'Waldprüfung',
            monsters: [
                { id: 'wolf', name: 'Schattenwolf', image: 'Bilder-Dungeon-Monster/Wolf-ohne-Bg.png', baseHp: 30, baseDmg: 8 },
                { id: 'bear', name: 'Höhlenbär', image: 'Bilder-Dungeon-Monster/Bär-ohne-Bg.png', baseHp: 36, baseDmg: 9 },
                { id: 'zombie', name: 'Morast-Zombie', image: 'Bilder-Dungeon-Monster/Zombie-ohne-Bg.png', baseHp: 28, baseDmg: 7 }
            ],
            tasks: [
                { id: 'pushups', label: 'Liegestütze', baseDamage: 10 },
                { id: 'squats', label: 'Squats', baseDamage: 6 },
                { id: 'situps', label: 'Sit-Ups', baseDamage: 5 }
            ],
            rewards: { xp: 50, manaStones: 3 }
        }
    ],
    getById(id) { return this.list.find(d => d.id === id) || this.list[0]; }
};


