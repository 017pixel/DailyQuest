/**
 * Test 17: Export-/Import-Kompatibilitaet und zeitbezogene Restore-Regeln.
 */
const { TestRunner } = require('./helpers');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { BASE } = require('./helpers');

function loadBackup() {
    const context = { module: { exports: {} }, window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(BASE, 'js/backup.js'), 'utf8'), context);
    return { DQ_BACKUP: context.module.exports, context };
}

function createDb(storeNames, failOnPut = null) {
    const calls = { transactions: 0, names: [], clears: [], puts: [] };
    const db = {
        objectStoreNames: storeNames,
        transaction(names, mode) {
            calls.transactions++;
            calls.names = Array.from(names);
            calls.mode = mode;
            let aborted = false;
            const tx = {
                error: null,
                objectStore(name) {
                    return {
                        clear() { calls.clears.push(name); },
                        put(record) {
                            if (name === failOnPut) throw new Error('Test-Importfehler');
                            calls.puts.push({ name, record });
                        }
                    };
                },
                abort() { aborted = true; }
            };
            queueMicrotask(() => {
                if (aborted) tx.onabort?.();
                else tx.oncomplete?.();
            });
            return tx;
        }
    };
    return { db, calls };
}

async function run() {
    const t = new TestRunner('Backup/Restore Logik');
    const { DQ_BACKUP, context } = loadBackup();
    const now = new Date(2026, 6, 10, 9, 30, 0);
    const today = '2026-07-10';
    const yesterday = '2026-07-09';

    const legacyBackup = {
        character: [{ id: 1, level: 8 }],
        settings: [{ id: 1, difficulty: 3 }],
        daily_quests: [
            { questId: 1, date: yesterday, completed: true },
            { questId: 2, date: yesterday, completed: false }
        ],
        extra_quest: [{ id: 1, completed: false, deadline: '2026-07-09T18:00:00.000Z' }],
        streakData: { streak: 14, lastDate: '2026-07-08' },
        lastPenaltyCheck: '2026-07-09',
        dq_seen_app_version: '2.18.2'
    };

    const prepared = DQ_BACKUP.prepareRestore(legacyBackup, { now, today, yesterday });
    t.deepEqual(prepared.streakData, { streak: 14, lastDate: yesterday }, 'Positive Legacy-Streak wird sicher auf gestern verankert');
    t.equal(prepared.lastPenaltyCheck, today, 'Penalty-Pruefung wird auf den Importtag gesetzt');
    t.equal(prepared.stores.daily_quests.length, 2, 'Historische Daily Quests bleiben als Verlauf erhalten');
    t.equal(prepared.stores.extra_quest.length, 0, 'Abgelaufene offene Extra-Quest wird ohne Strafe entfernt');
    t.ok(!Object.prototype.hasOwnProperty.call(prepared.stores, 'lastPenaltyCheck'), 'Alte Runtime-Daten werden nicht als Store importiert');

    const sameDay = DQ_BACKUP.prepareRestore({
        character: [{ id: 1 }],
        settings: [{ id: 1 }],
        streakData: { streak: 5, lastDate: today }
    }, { now, today, yesterday });
    t.deepEqual(sameDay.streakData, { streak: 5, lastDate: today }, 'Same-Day-Import vergibt keinen kuenstlichen Folgetag');

    const noStreak = DQ_BACKUP.prepareRestore({
        character: [{ id: 1 }],
        settings: [{ id: 1 }],
        streakData: { streak: 'ungueltig', lastDate: yesterday }
    }, { now, today, yesterday });
    t.deepEqual(noStreak.streakData, { streak: 0, lastDate: null }, 'Ungueltige Streak-Werte werden sicher normalisiert');

    const nested = DQ_BACKUP.prepareRestore({
        stores: { character: [{ id: 1 }], settings: [{ id: 1 }], daily_quests: [] },
        streakData: { streak: 2, lastDate: yesterday }
    }, { now, today, yesterday });
    t.ok(Array.isArray(nested.stores.daily_quests), 'Neues stores-Containerformat wird akzeptiert');

    t.throws(() => DQ_BACKUP.prepareRestore({}, { now, today, yesterday }), 'Backup ohne Charakter und Settings wird abgelehnt');
    t.throws(() => DQ_BACKUP.prepareRestore({ character: [], settings: [] }, { now, today, yesterday }), 'Leere Pflicht-Stores werden abgelehnt');

    const exported = DQ_BACKUP.createExport({
        character: [{ id: 1 }],
        settings: [{ id: 1 }]
    }, {
        now,
        appVersion: '2.18.3',
        streakData: { streak: 14, lastDate: yesterday }
    });
    t.ok(Array.isArray(exported.character), 'DQ1-Stores bleiben fuer DailyQuest-Next auf oberster Ebene');
    t.equal(exported.backupMeta.schemaVersion, 1, 'Export enthaelt eine Backup-Formatversion');
    t.equal(exported.backupMeta.exportedLocalDate, today, 'Export enthaelt das lokale Spieldatum');
    t.equal(exported.backupMeta.appVersion, '2.18.3', 'Export enthaelt die App-Version');
    t.ok(!Object.prototype.hasOwnProperty.call(exported, 'lastPenaltyCheck'), 'Export speichert keine veraltende Penalty-Laufzeitmarke');

    const atomic = createDb(['character', 'settings', 'daily_quests']);
    await DQ_BACKUP.restoreIndexedDB(atomic.db, prepared.stores);
    t.equal(atomic.calls.transactions, 1, 'Alle Stores werden in genau einer Import-Transaktion ersetzt');
    t.deepEqual(atomic.calls.names, ['character', 'settings', 'daily_quests'], 'Atomare Transaktion umfasst alle aktuellen Stores');
    t.equal(atomic.calls.clears.length, 3, 'Jeder aktuelle Store wird vor dem Restore geleert');
    t.ok(atomic.calls.puts.some(entry => entry.name === 'character'), 'Vorbereiteter Charakter wird geschrieben');

    const failing = createDb(['character', 'settings'], 'settings');
    let rejected = false;
    try {
        await DQ_BACKUP.restoreIndexedDB(failing.db, prepared.stores);
    } catch (error) {
        rejected = error.message === 'Test-Importfehler';
    }
    t.ok(rejected, 'Fehler in einem Store verwirft die gemeinsame Import-Transaktion');
    t.equal(failing.calls.transactions, 1, 'Fehlerfall startet keine unsicheren Folge-Transaktionen');

    const values = new Map([
        ['dq_sync_conflict', 'true'],
        ['dq_cloud_updated_at', 'alt']
    ]);
    context.localStorage = {
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key),
        getItem: key => values.get(key) ?? null
    };
    DQ_BACKUP.applyLocalState(prepared, '2.18.3');
    t.deepEqual(JSON.parse(values.get('streakData')), { streak: 14, lastDate: yesterday }, 'Vorbereitete Streak wird erst nach DB-Erfolg lokal angewendet');
    t.equal(values.get('lastPenaltyCheck'), today, 'Lokaler Restore unterdrueckt rueckwirkende Tagesstrafe');
    t.equal(values.get('dq_seen_app_version'), '2.18.3', 'Import zeigt keine veraltete Update-Meldung');
    t.ok(!values.has('dq_sync_conflict') && !values.has('dq_cloud_updated_at'), 'Import entfernt veraltete Cloud-Konfliktmarker');
    delete context.localStorage;

    return t;
}

module.exports = { run, name: '17-backup-restore' };
