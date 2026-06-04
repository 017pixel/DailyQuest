/**
 * Test 10: Streak-, Penalty- und Edge-Case-Logik.
 * Datengetriebene Tests fuer Penalty-Reset, Quest-Completion, Level-Up.
 */
const { TestRunner } = require('./helpers');

function run() {
    const t = new TestRunner('Streak/Penalty/Level-Up Logik');

    // ── Streak-Berechnung ────────────────────────────────────
    function getToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    function getYesterday() { const d = new Date(Date.now()-86400000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    function getDayBefore(dateStr) { const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }

    function calcStreak(streakData, todayStr, yesterdayStr) {
        const { streak, lastDate } = streakData;
        if (!lastDate) return { streak: 1, lastDate: todayStr };
        if (lastDate === yesterdayStr) return { streak: streak + 1, lastDate: todayStr };
        if (lastDate === todayStr) return { streak, lastDate: todayStr };
        return { streak: 1, lastDate: todayStr };
    }

    const today = getToday();
    const yesterday = getYesterday();

    // Erster Tag
    t.deepEqual(calcStreak({ streak: 0, lastDate: null }, today, yesterday),
        { streak: 1, lastDate: today }, 'Erster Tag → streak=1');

    // Fortsetzung
    t.deepEqual(calcStreak({ streak: 5, lastDate: yesterday }, today, yesterday),
        { streak: 6, lastDate: today }, 'Gestern gestreakt → streak+1');

    // Heute schon erledigt
    t.deepEqual(calcStreak({ streak: 3, lastDate: today }, today, yesterday),
        { streak: 3, lastDate: today }, 'Heute schon → kein Change');

    // Verpasst
    const twoDaysAgo = getDayBefore(yesterday);
    t.deepEqual(calcStreak({ streak: 7, lastDate: twoDaysAgo }, today, yesterday),
        { streak: 1, lastDate: today }, '2 Tage verpasst → streak=1');

    // ── LevelUp-Logik ────────────────────────────────────────
    function levelUpCheck(char) {
        const manaToNextLevel = 100 + (char.level - 1) * 50;
        let iterations = 0;
        while (char.mana >= manaToNextLevel && iterations < 50) {
            char.level++;
            char.mana -= manaToNextLevel;
            iterations++;
        }
        return char;
    }

    // Kein Level-Up
    const base = { level: 1, mana: 50 };
    t.deepEqual(levelUpCheck({ ...base }), { level: 1, mana: 50 }, 'mana<100 → kein Level');

    // Genau ein Level-Up
    t.deepEqual(levelUpCheck({ level: 1, mana: 150 }),
        { level: 2, mana: 50 }, 'mana=150 → level=2, rest=50');

    // Mehrere Level-Ups
    const boosted = levelUpCheck({ level: 1, mana: 350 });
    t.ok(boosted.level >= 3, `mana=350 → level=${boosted.level} (>=3)`);
    t.ok(boosted.mana < 100 + (boosted.level - 1) * 50, 'Rest-Mana < Schwellwert');

    // Edge: sehr viel Mana
    const extreme = levelUpCheck({ level: 1, mana: 99999 });
    t.ok(extreme.level > 1, 'Extrem Mana fuert zu Level-Up');
    t.ok(extreme.level < 60, `Level < 60 (${extreme.level}) wegen Iterations-Limit`);

    // ── Penalty-Reset ────────────────────────────────────────
    function applyPenalty(char, hasFreeze) {
        if (hasFreeze && char.streakFreezes > 0) {
            char.streakFreezes--;
            return { ...char, penaltyApplied: false, freezeUsed: true };
        }
        if (char.level > 1) {
            char.level--;
            char.streak = Math.max(0, char.streak - 3);
            return { ...char, penaltyApplied: true, freezeUsed: false };
        }
        char.streak = 0;
        return { ...char, penaltyApplied: true, freezeUsed: false };
    }

    // Freeze schuetzt
    const withFreeze = { level: 5, streak: 10, streakFreezes: 2 };
    const afterFreeze = applyPenalty(withFreeze, true);
    t.equal(afterFreeze.streakFreezes, 1, 'Freeze: streakFreezes -1');
    t.equal(afterFreeze.level, 5, 'Freeze: level unveraendert');
    t.equal(afterFreeze.streak, 10, 'Freeze: streak unveraendert');
    t.equal(afterFreeze.penaltyApplied, false, 'Freeze: keine Penalty');

    // Penalty reduziert Level
    const noFreeze = { level: 5, streak: 10, streakFreezes: 0 };
    const afterPen = applyPenalty(noFreeze, false);
    t.equal(afterPen.level, 4, 'Penalty: level -1');
    t.equal(afterPen.streak, 7, 'Penalty: streak -3');
    t.equal(afterPen.penaltyApplied, true, 'Penalty: applied');

    // Level 1 kann nicht sinken
    const atOne = { level: 1, streak: 5, streakFreezes: 0 };
    const afterOne = applyPenalty(atOne, false);
    t.equal(afterOne.level, 1, 'Penalty@L1: level bleibt 1');
    t.equal(afterOne.streak, 0, 'Penalty@L1: streak = 0');

    // ── processStatGains ─────────────────────────────────────
    function processStatGains(char, exercise) {
        if (!exercise || !exercise.statPoints) return char;
        for (const [stat, points] of Object.entries(exercise.statPoints)) {
            char[stat] = (char[stat] || 0) + points;
        }
        if (exercise.directStatGain) {
            for (const [stat, points] of Object.entries(exercise.directStatGain)) {
                char[stat] = (char[stat] || 0) + points;
            }
        }
        return char;
    }

    const exercise = {
        statPoints: { strength: 2, agility: 1 },
        directStatGain: { durchhaltevermoegen: 3 },
    };
    const char = { strength: 10, agility: 5, durchhaltevermoegen: 0 };
    const result = processStatGains(char, exercise);
    t.equal(result.strength, 12, 'StatGain: strength +2');
    t.equal(result.agility, 6, 'StatGain: agility +1');
    t.equal(result.durchhaltevermoegen, 3, 'DirectGain: durchhaltevermoegen +3');

    // Leere Exercise
    const result2 = processStatGains({ strength: 5 }, null);
    t.equal(result2.strength, 5, 'Null-Exercise: unveraendert');

    return t;
}

module.exports = { run, name: '10-streak-penalty' };
