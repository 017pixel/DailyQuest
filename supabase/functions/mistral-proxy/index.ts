import "@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const DAILY_LIMIT = 3;

// Erlaubte Typen / Tags / Stats - hier fest verdrahtet, damit Validierung
// sowohl client- als auch serverseitig deterministisch ist.
const VALID_TYPES = ["reps", "time", "check", "focus"] as const;
const VALID_TAGS = ["push", "pull", "legs", "core", "cardio", "rest", "mobility", "full_body"] as const;
const VALID_STATS = ["kraft", "ausdauer", "beweglichkeit", "durchhaltevermoegen", "willenskraft"] as const;

// Bekannte nameKeys aus dem exercisePool. Spiegel der client-seitigen Liste,
// damit Mistral existierende nutzt und nur Variationen custom_ erfindet.
const EXISTING_NAMEKEYS = [
  "bicep_curls", "dumbbell_rows", "push_ups_narrow", "weighted_squats", "barbell_rows",
  "dumbbell_press", "shoulder_press", "deadlifts", "pistol_squats", "pike_push_ups",
  "diamond_push_ups", "single_leg_glute_bridge",
  "burpees", "jumping_jacks", "high_knees", "step_ups", "jump_squats", "leg_raises",
  "russian_twists", "hollow_body_hold", "wall_sit", "jogging", "running",
  "mountain_climbers", "interval_sprint", "walking_lunges",
  "plank", "situps", "knee_push_ups", "tricep_dips_chair", "lunges",
  "sumo_squats", "glute_bridges", "tricep_extensions", "side_plank",
  "bicycle_crunch", "reverse_flys", "push_ups_normal", "push_ups_wide", "squats"
];

const PRESET_PROMPTS: Record<string, string> = {
  kraft: "Erstelle einen Trainingsplan fuer Kraft und Muskelaufbau. Fokus auf Hypertrophie und progressive Belastung.",
  ausdauer: "Erstelle einen Trainingsplan fuer Ausdauer und Cardio-Training. Fokus auf HIIT und Konditionsaufbau.",
  abnehmen: "Erstelle einen Trainingsplan fuer Gewichtsverlust und Fatburn. Mix aus Kraft und Cardio."
};

// System-Prompt traegt das vollstaendige JSON-Schema und die Liste der Tags/Types -
// damit das User-Feld nur Personalisierungs-Kontext enthaelt (Bugfix C).
const SYSTEM_PROMPT = `Du bist ein erfahrener Fitness-Coach fuer die deutsche DailyQuest App.
Erstelle IMMER einen vollstaendigen Trainingsplan als valides JSON ohne Kommentare oder Markdown.

PFLICHT-SCHEMA:
{
  "planName": string (kurzer, praegnanter Name, deutsch),
  "planDescription": string (1-2 Saetze auf deutsch),
  "exercises": [GENAU 30 Objekte],
  "stages": [GENAU 4 Objekte]
}

JEDE EXERCISE (alle Felder pflicht):
- nameKey: string - einer der EXISTING_NAMEKEYS oder NEU mit "custom_" Prefix (z.B. "custom_push_Xk3f9")
- displayName: string (deutscher Anzeigename)
- description: string (1 Satz, deutsch)
- type: string - EINES VON: ${VALID_TYPES.join(", ")}
- baseValue: number >= 1
- tags: array of strings aus: ${VALID_TAGS.join(", ")}, mindestens 1 Eintrag
- isRest: boolean (true NUR fuer Erholungsuebungen)
- needsEquipment: boolean
- muscles: array of strings (z.B. ["chest","triceps"])
- statPoints: object mit Keys aus: ${VALID_STATS.join(", ")}
- mana: number >= 1
- gold: number >= 1

JEDE STAGE (alle Felder pflicht):
- label: string (z.B. "Einstieg", "Aufbau", "Peak", "Meister")
- weeks: number >= 1
- sets: number >= 1
- reps: number >= 1

REGELN:
1. GENAU 30 exercises - nicht 29, nicht 31
2. MINDESTENS 4 exercises mit isRest: true (fuer Rest Days)
3. Mindestens 5 verschiedene Tag-Gruppen vertreten (push/pull/legs/core/cardio)
4. Die LETZTE stage MUSS weeks: 9999 haben (unendlich/Endgame)
5. Nutze EXISTING_NAMEKEYS wo passend, custom_ fuer eigene Ideen
6. Antworte NUR mit dem JSON. KEINE Erklaerung. KEIN Markdown.

EXISTING_NAMEKEYS: ${EXISTING_NAMEKEYS.join(", ")}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), { status, headers: CORS_HEADERS });
}

function validatePlanShape(plan: any): string[] {
  const errors: string[] = [];

  if (!plan || typeof plan !== "object") {
    return ["Plan ist kein Objekt"];
  }
  if (typeof plan.planName !== "string" || !plan.planName) errors.push("planName fehlt");
  if (typeof plan.planDescription !== "string") errors.push("planDescription fehlt");
  if (!Array.isArray(plan.exercises)) {
    errors.push("exercises kein Array");
  } else {
    if (plan.exercises.length !== 30) errors.push(`need 30 exercises, got ${plan.exercises.length}`);
    const seen = new Set<string>();
    let restCount = 0;
    for (const [i, ex] of plan.exercises.entries()) {
      if (!ex || typeof ex !== "object") {
        errors.push(`exercise[${i}] kein Objekt`);
        continue;
      }
      if (typeof ex.nameKey !== "string" || !ex.nameKey) {
        errors.push(`exercise[${i}].nameKey fehlt`);
      } else {
        if (seen.has(ex.nameKey)) errors.push(`exercise[${i}].nameKey doppelt: ${ex.nameKey}`);
        seen.add(ex.nameKey);
        const isKnown = EXISTING_NAMEKEYS.includes(ex.nameKey);
        if (!isKnown && !ex.nameKey.startsWith("custom_")) {
          errors.push(`exercise[${i}].nameKey braucht custom_-Prefix oder existiert: ${ex.nameKey}`);
        }
      }
      if (typeof ex.displayName !== "string") errors.push(`exercise[${i}].displayName fehlt`);
      if (typeof ex.description !== "string") errors.push(`exercise[${i}].description fehlt`);
      if (!VALID_TYPES.includes(ex.type)) errors.push(`exercise[${i}].type invalid: ${ex.type}`);
      if (typeof ex.baseValue !== "number" || ex.baseValue < 1) {
        errors.push(`exercise[${i}].baseValue invalid: ${ex.baseValue}`);
      }
      if (!Array.isArray(ex.tags) || ex.tags.length === 0 ||
        !ex.tags.every((t: unknown) => typeof t === "string" && VALID_TAGS.includes(t as any))) {
        errors.push(`exercise[${i}].tags invalid`);
      }
      if (typeof ex.isRest !== "boolean") errors.push(`exercise[${i}].isRest invalid`);
      if (typeof ex.needsEquipment !== "boolean") errors.push(`exercise[${i}].needsEquipment invalid`);
      if (!Array.isArray(ex.muscles)) errors.push(`exercise[${i}].muscles fehlt`);
      if (ex.mana !== undefined && (typeof ex.mana !== "number" || ex.mana < 1)) {
        errors.push(`exercise[${i}].mana invalid`);
      }
      if (ex.gold !== undefined && (typeof ex.gold !== "number" || ex.gold < 1)) {
        errors.push(`exercise[${i}].gold invalid`);
      }
      if (ex.statPoints && typeof ex.statPoints === "object") {
        for (const k of Object.keys(ex.statPoints)) {
          if (!VALID_STATS.includes(k as any)) errors.push(`exercise[${i}].statPoints key invalid: ${k}`);
        }
      }
      if (ex.isRest === true) restCount++;
    }
    if (restCount < 4) errors.push(`mindestens 4 isRest noetig, got ${restCount}`);
  }

  if (!Array.isArray(plan.stages)) {
    errors.push("stages kein Array");
  } else {
    if (plan.stages.length !== 4) errors.push(`genau 4 stages noetig, got ${plan.stages.length}`);
    const last = plan.stages[plan.stages.length - 1];
    if (!last || typeof last.weeks !== "number" || last.weeks < 9999) {
      errors.push("letzte stage braucht weeks: 9999");
    }
    for (const [i, s] of plan.stages.entries()) {
      if (!s || typeof s !== "object") {
        errors.push(`stage[${i}] kein Objekt`);
        continue;
      }
      if (typeof s.weeks !== "number" || s.weeks < 1) errors.push(`stage[${i}].weeks invalid`);
      if (typeof s.sets !== "number" || s.sets < 1) errors.push(`stage[${i}].sets invalid`);
      if (typeof s.reps !== "number" || s.reps < 1) errors.push(`stage[${i}].reps invalid`);
      if (typeof s.label !== "string") errors.push(`stage[${i}].label fehlt`);
    }
  }

  return errors;
}

export default async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (!MISTRAL_API_KEY) {
    return json(500, { error: "Mistral API key not configured" });
  }

  // B: Echte JWT-Verifikation ueber Supabase auth.getUser (Bug B Fix).
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json(401, { error: "Unauthorized: missing Bearer token" });
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json(401, { error: "Unauthorized: empty Bearer token" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json(401, { error: "Unauthorized: invalid token", detail: userErr?.message });
  }
  const userId = userData.user.id;

  // Body parsen
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  const { prompt, userContext } = body ?? {};
  if (!prompt || typeof prompt !== "string") {
    return json(400, { error: "prompt is required (string)" });
  }

  // D: Server-side Rate-Limit (Bug D Fix) - Tabelle dq_ai_generations
  // speichert (user_id, day, count). Fallback ohne DB-Fehler bricht nicht ab,
  // loggt nur. Wenn Tabelle fehlt (Deployment vor Migration), limit nicht erzwungen.
  const today = new Date().toISOString().split("T")[0];
  try {
    const { data: rl } = await supabase
      .from("dq_ai_generations")
      .select("count")
      .eq("user_id", userId)
      .eq("day", today)
      .maybeSingle();

    const current = (rl && typeof rl.count === "number") ? rl.count : 0;
    if (current >= DAILY_LIMIT) {
      return json(429, { error: "Tageslimit erreicht (max 3/Tag)", limit: DAILY_LIMIT });
    }

    await supabase.from("dq_ai_generations").upsert(
      { user_id: userId, day: today, count: current + 1, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day" }
    );
  } catch (e) {
    // Tabelle fehlt moeglicherweise - Migration noch nicht ausgefuehrt.
    // Wir loggen nur und machen weiter; Client-Seite limit ist aktiv.
    console.warn("Rate-Limit Lookup fehlgeschlagen (Tabelle fehlt?):", (e as Error).message);
  }

  // User-Message: nur Personalisierungs-Kontext, KEIN Schema (Bug C Fix).
  const contextParts: string[] = [];
  if (userContext) {
    if (userContext.age) contextParts.push(`Alter: ${userContext.age}`);
    if (userContext.hasEquipment !== undefined) {
      contextParts.push(`Equipment: ${userContext.hasEquipment ? "ja" : "nein"}`);
    }
    if (userContext.difficulty) contextParts.push(`Schwierigkeit: ${userContext.difficulty}/5`);
    if (userContext.restDays !== undefined) contextParts.push(`Rest Days: ${userContext.restDays}/Woche`);
  }
  const presetHint = PRESET_PROMPTS[prompt] ? ` (Preset: ${prompt})` : "";
  const equipmentRule = userContext?.hasEquipment === false
    ? " WICHTIG: Der User hat KEIN Equipment. Jede Exercise MUSS needsEquipment:false haben und ohne Hanteln/Langhantel machbar sein."
    : "";
  const userMessage = `${prompt}${presetHint}. Persoenlicher Kontext: ${contextParts.join(", ") || "keiner"}.${equipmentRule}`;

  // Mistral API Call mit response_format: json_object (Bug C Fix).
  try {
    let lastValidationErrors: string[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const repairMessage = attempt === 0 ? userMessage : `${userMessage}

Deine letzte Antwort war nicht nutzbar. Repariere den Plan strikt:
- GENAU 30 exercises
- GENAU 4 stages
- letzte stage weeks:9999
- mindestens 4 isRest:true
- nur erlaubte type/tags/statPoints
- unbekannte nameKeys nur mit custom_ Prefix
- bei Equipment nein: ALLE needsEquipment:false
Antworte NUR mit JSON.`;

      const mistralResp = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: repairMessage }
          ],
          response_format: { type: "json_object" },
          temperature: attempt === 0 ? 0.7 : 0.25,
          max_tokens: 4000
        })
      });

      if (!mistralResp.ok) {
        const errText = await mistralResp.text();
        console.error("Mistral API error:", mistralResp.status, errText.slice(0, 500));
        return json(502, { error: "Mistral API error", status: mistralResp.status });
      }

      const data = await mistralResp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        lastValidationErrors = ["Empty Mistral response"];
        continue;
      }

      const cleaned = content.replace(/```json?/gi, "").replace(/```/g, "").trim();
      let plan: any;
      try {
        plan = JSON.parse(cleaned);
      } catch {
        lastValidationErrors = ["Mistral returned non-JSON"];
        continue;
      }

      // Server-side Validation als Defense-in-Depth.
      const errors = validatePlanShape(plan);
      if (errors.length > 0) {
        lastValidationErrors = errors;
        console.warn("Mistral-Plan Validation fehlgeschlagen:", errors);
        continue;
      }

      return json(200, plan);
    }

    return json(422, { error: "Plan validation failed", details: lastValidationErrors.slice(0, 10) });
  } catch (e) {
    console.error("Edge function intern:", e);
    return json(500, { error: "Internal error", detail: (e as Error).message });
  }
};
