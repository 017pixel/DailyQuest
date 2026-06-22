/**
 * Test 12: KI-Trainingsplan End-to-End Flow
 *
 * Standardlauf: prueft die komplette Verdrahtung ohne Netzwerk/API-Kosten.
 * Echter Backendlauf: DQ_RUN_REAL_AI_FLOW=1 node tests/run.js
 *
 * Der echte Lauf ruft Supabase Auth + die deployed Edge Function mistral-proxy auf.
 * Der Mistral API Key wird dabei NICHT lokal gebraucht; er muss als Supabase Secret
 * MISTRAL_API_KEY auf dem Backend gesetzt sein.
 */
const fs = require('fs');
const path = require('path');
const { TestRunner, BASE, loadData } = require('./helpers');

function loadMistralClient() {
    const code = fs.readFileSync(path.join(BASE, 'js', 'mistral-client.js'), 'utf8')
        .replace(/^const\s+DQ_MISTRAL\s*=\s*\{/m, 'global.DQ_MISTRAL = {');
    new Function(code)();
}

function loadSupabaseConfig() {
    const code = fs.readFileSync(path.join(BASE, 'js', 'supabase-config.js'), 'utf8');
    const url = code.match(/URL:\s*'([^']+)'/)?.[1];
    const key = code.match(/KEY:\s*'([^']+)'/)?.[1];
    return { url, key };
}

function setupStorageAndConfig() {
    const storage = new Map();
    global.localStorage = {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, value) { storage.set(key, String(value)); },
        removeItem(key) { storage.delete(key); }
    };

    global.DQ_CONFIG = {
        userSettings: {
            id: 1,
            language: 'de',
            difficulty: 4,
            restDays: 2,
            hasEquipment: false,
            age: 34,
            planType: 'predefined',
            customPlanId: null
        },
        getTodayString() { return '2026-06-21'; }
    };
}

function createLocalPlanStore(t) {
    const calls = {
        savePlan: [],
        setActivePlan: [],
        triggerSync: 0
    };

    global.DQ_CUSTOM_PLAN = {
        async savePlan(plan, sourcePrompt) {
            const validation = DQ_MISTRAL.validatePlan(plan);
            t.ok(validation.valid === true, 'Planspeicherung: nur ein validierter Plan wird gespeichert');
            calls.savePlan.push({ plan, sourcePrompt });
            return 77;
        },
        async setActivePlan(planId) {
            calls.setActivePlan.push(planId);
            global.DQ_CONFIG.userSettings.planType = 'custom';
            global.DQ_CONFIG.userSettings.customPlanId = planId;
        }
    };

    return calls;
}

function createStaticApiResponse() {
    const tags = ['push', 'pull', 'legs', 'core', 'cardio', 'full_body'];
    return {
        planName: 'Static Flow Plan',
        planDescription: 'Statischer Testplan fuer den Frontend-Flow.',
        exercises: Array.from({ length: 30 }, (_, i) => ({
            nameKey: `custom_flow_${i}`,
            displayName: `Flow Uebung ${i + 1}`,
            description: 'Statische Test-Uebung.',
            type: i >= 26 ? 'check' : (i % 5 === 0 ? 'time' : 'reps'),
            baseValue: i >= 26 ? 1 : 10 + i,
            tags: i >= 26 ? ['rest', 'mobility'] : [tags[i % tags.length]],
            isRest: i >= 26,
            needsEquipment: false,
            muscles: ['general'],
            statPoints: { kraft: 1 },
            mana: 20,
            gold: 10
        })),
        stages: [
            { label: 'Einstieg', weeks: 2, sets: 2, reps: 8 },
            { label: 'Aufbau', weeks: 4, sets: 3, reps: 10 },
            { label: 'Peak', weeks: 4, sets: 3, reps: 12 },
            { label: 'Meister', weeks: 9999, sets: 4, reps: 12 }
        ]
    };
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        const text = await res.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
        return { ok: res.ok, status: res.status, body };
    } finally {
        clearTimeout(timeout);
    }
}

async function signInAnonymously(url, key) {
    const res = await fetchJsonWithTimeout(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: {}, gotrue_meta_security: {} })
    }, 20000);

    if (!res.ok || !res.body?.access_token || !res.body?.user) {
        throw new Error(`Anonymous Supabase Auth fehlgeschlagen (${res.status}): ${JSON.stringify(res.body).slice(0, 300)}`);
    }

    return {
        access_token: res.body.access_token,
        user: res.body.user
    };
}

function setupRealSupabaseClient(url, key, calls) {
    let session = null;
    global.DQ_SUPABASE = {
        currentUser: null,
        client: {
            auth: {
                async getSession() {
                    calls.getSession++;
                    return { data: { session }, error: null };
                }
            },
            functions: {
                async invoke(name, payload) {
                    calls.invoke.push({ name, payload });
                    const res = await fetchJsonWithTimeout(`${url}/functions/v1/${name}`, {
                        method: 'POST',
                        headers: {
                            apikey: key,
                            Authorization: `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload.body)
                    }, 90000);

                    if (!res.ok) {
                        return {
                            data: res.body,
                            error: new Error(`HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`)
                        };
                    }
                    return { data: res.body, error: null };
                }
            }
        },
        async signInAnonymously() {
            calls.signInAnonymously++;
            session = await signInAnonymously(url, key);
            this.currentUser = session.user;
            return { data: { session }, error: null };
        },
        triggerSync() { calls.triggerSync++; }
    };
}

function setupMockedSupabaseClient(apiResponse, calls) {
    global.DQ_SUPABASE = {
        currentUser: null,
        client: {
            auth: {
                async getSession() {
                    calls.getSession++;
                    return { data: { session: null }, error: null };
                }
            },
            functions: {
                async invoke(name, payload) {
                    calls.invoke.push({ name, payload });
                    return { data: apiResponse, error: null };
                }
            }
        },
        async signInAnonymously() {
            calls.signInAnonymously++;
            return {
                data: {
                    session: {
                        access_token: 'mock-token',
                        user: { id: 'mock-user', is_anonymous: true }
                    }
                },
                error: null
            };
        },
        triggerSync() { calls.triggerSync++; }
    };
}

async function runFlow(t, mode) {
    setupStorageAndConfig();
    loadMistralClient();
    const calls = createLocalPlanStore(t);
    calls.getSession = 0;
    calls.signInAnonymously = 0;
    calls.invoke = [];

    if (mode === 'real') {
        const { url, key } = loadSupabaseConfig();
        t.ok(!!url && !!key, 'Real Flow: Supabase URL und Anon Key sind konfiguriert');
        setupRealSupabaseClient(url, key, calls);
    } else {
        setupMockedSupabaseClient(createStaticApiResponse(), calls);
    }

    const userContext = {
        age: DQ_CONFIG.userSettings.age,
        hasEquipment: DQ_CONFIG.userSettings.hasEquipment !== false,
        difficulty: DQ_CONFIG.userSettings.difficulty,
        restDays: DQ_CONFIG.userSettings.restDays
    };

    const result = await DQ_MISTRAL.generateAndSavePlan('kraft', userContext, {
        timeoutMs: mode === 'real' ? 150000 : 1000
    });

    t.ok(result.success === true, `${mode}: generateAndSavePlan liefert success=true (${result.error || 'ok'})`);
    t.equal(calls.getSession, 1, `${mode}: vorhandene Supabase-Session wird geprueft`);
    t.equal(calls.signInAnonymously, 1, `${mode}: ohne Session wird anonym angemeldet`);
    t.equal(calls.invoke.length, 1, `${mode}: Edge Function wird genau einmal aufgerufen`);
    t.equal(calls.invoke[0].name, 'mistral-proxy', `${mode}: richtige Supabase Function wird genutzt`);
    t.deepEqual(calls.invoke[0].payload.body, { prompt: 'kraft', userContext, repair: false }, `${mode}: Prompt, User-Kontext und Repair-Flag werden uebergeben`);
    if (!result.success) {
        return;
    }
    t.equal(calls.savePlan.length, 1, `${mode}: Plan wird gespeichert`);
    t.equal(calls.savePlan[0].sourcePrompt, 'kraft', `${mode}: Source Prompt wird gespeichert`);
    t.equal(calls.setActivePlan[0], 77, `${mode}: gespeicherter Plan wird aktiviert`);
    t.equal(DQ_CONFIG.userSettings.planType, 'custom', `${mode}: planType wird auf custom gesetzt`);
    t.equal(DQ_CONFIG.userSettings.customPlanId, 77, `${mode}: customPlanId wird gesetzt`);
    t.equal(calls.triggerSync, 1, `${mode}: Supabase Sync wird nach Aktivierung angestossen`);
    t.equal(DQ_MISTRAL.getRegenerationCount(), 1, `${mode}: erfolgreiche Generierung erhoeht Tageszaehler`);

    const validation = DQ_MISTRAL.validatePlan(result.plan);
    t.ok(validation.valid === true, `${mode}: Antwort ist ein valider DailyQuest-Plan`);
    t.ok(result.plan.exercises.length >= 24 && result.plan.exercises.length <= 30, `${mode}: Plan hat 24-30 Uebungen (${result.plan.exercises.length})`);
    t.equal(result.plan.stages.length, 4, `${mode}: Plan hat genau 4 Phasen`);
    t.ok(result.plan.exercises.filter(ex => ex.isRest).length >= 4, `${mode}: Plan hat mindestens 4 Rest-Uebungen`);
}

async function run() {
    const t = new TestRunner('KI-Plan Flow E2E');
    loadData();

    const htmlCode = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8');
    const mainCode = fs.readFileSync(path.join(BASE, 'main.js'), 'utf8');
    const edgeCode = fs.readFileSync(path.join(BASE, 'supabase', 'functions', 'mistral-proxy', 'index.ts'), 'utf8');

    t.ok(htmlCode.includes('id="goal-regenerate-button"'), 'Frontend: Einstieg-Button fuer neuen Plan existiert');
    t.ok(htmlCode.includes('data-preset="kraft"') && htmlCode.includes('id="custom-plan-prompt"'), 'Frontend: Presets und Custom Prompt sind verdrahtet');
    t.ok(mainCode.includes('handlePlanGeneration') && mainCode.includes('userContext'), 'Frontend: handlePlanGeneration baut User-Kontext');
    t.ok(mainCode.includes('hasEquipment: DQ_CONFIG.userSettings.hasEquipment !== false'), 'Config: Equipment-Setting fliesst in User-Kontext');
    t.ok(mainCode.includes('difficulty: DQ_CONFIG.userSettings.difficulty') && mainCode.includes('restDays: DQ_CONFIG.userSettings.restDays'), 'Config: Schwierigkeit und Rest Days fliessen in User-Kontext');
    t.ok(edgeCode.includes('Deno.serve') && edgeCode.includes('/auth/v1/user'), 'Backend: Supabase Edge Function prueft JWT');
    t.ok(edgeCode.includes('MISTRAL_URL') && edgeCode.includes('response_format'), 'Backend: Edge Function ruft Mistral im JSON-Modus auf');
    t.ok(edgeCode.includes('validatePlanShape') && edgeCode.includes('dq_ai_generations'), 'Backend: Validierung und Rate-Limit sind im API-Pfad');
    t.ok(edgeCode.includes('apikey') && edgeCode.includes('x-client-info'), 'Backend: CORS erlaubt Supabase-Browser-Header');

    await runFlow(t, 'mock');

    if (process.env.DQ_RUN_REAL_AI_FLOW === '1') {
        await runFlow(t, 'real');
    } else {
        t.ok(true, 'Real Flow: uebersprungen. Aktivieren mit DQ_RUN_REAL_AI_FLOW=1 node tests/run.js');
    }

    return t;
}

module.exports = { run };
