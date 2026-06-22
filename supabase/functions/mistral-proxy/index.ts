const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const DAILY_LIMIT = 3;
const MISTRAL_MAX_ATTEMPTS = 3;
const MISTRAL_RETRY_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

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

const EXISTING_NAMEKEY_DETAILS: Record<string, { displayName: string; description: string }> = {
  bicep_curls: { displayName: "Bizeps-Curls", description: "Beuge die Arme kontrolliert und senke das Gewicht langsam wieder ab." },
  dumbbell_rows: { displayName: "Hantel-Rudern", description: "Ziehe die Hantel eng am Koerper nach oben und halte den Ruecken stabil." },
  push_ups_narrow: { displayName: "Enge Liegestuetze", description: "Fuehre Liegestuetze mit engen Haenden fuer Brust und Trizeps aus." },
  weighted_squats: { displayName: "Kniebeugen mit Gewicht", description: "Beuge Knie und Huefte kontrolliert und druecke dich kraftvoll nach oben." },
  barbell_rows: { displayName: "Langhantel-Rudern", description: "Ziehe die Langhantel mit stabilem Oberkoerper Richtung Bauch." },
  dumbbell_press: { displayName: "Hantel-Druecken", description: "Druecke die Hanteln kontrolliert nach oben und senke sie sauber ab." },
  shoulder_press: { displayName: "Schulterdruecken", description: "Druecke das Gewicht ueber Kopf, ohne ins Hohlkreuz zu fallen." },
  deadlifts: { displayName: "Kreuzheben", description: "Hebe das Gewicht mit geradem Ruecken aus Huefte und Beinen." },
  pistol_squats: { displayName: "Pistol Squats", description: "Gehe einbeinig kontrolliert in die Kniebeuge und richte dich stabil auf." },
  pike_push_ups: { displayName: "Pike Push-ups", description: "Druecke dich aus der Pike-Position nach oben und belaste vor allem die Schultern." },
  diamond_push_ups: { displayName: "Diamant-Liegestuetze", description: "Setze die Haende eng zusammen und arbeite kontrolliert aus Brust und Trizeps." },
  single_leg_glute_bridge: { displayName: "Einbeinige Glute Bridge", description: "Hebe die Huefte einbeinig an und halte das Becken stabil." },
  burpees: { displayName: "Burpees", description: "Kombiniere Kniebeuge, Stuetzposition und Sprung zu einer dynamischen Ganzkoerperuebung." },
  jumping_jacks: { displayName: "Hampelmaenner", description: "Springe rhythmisch in den Graetschstand und fuehre die Arme ueber Kopf." },
  high_knees: { displayName: "Kniehebelauf", description: "Laufe auf der Stelle und ziehe die Knie aktiv nach oben." },
  step_ups: { displayName: "Step-ups", description: "Steige kontrolliert auf eine stabile Erhoehung und wieder herunter." },
  jump_squats: { displayName: "Sprungkniebeugen", description: "Springe aus der Kniebeuge explosiv nach oben und lande weich." },
  leg_raises: { displayName: "Beinheben", description: "Hebe und senke die Beine langsam, ohne den unteren Ruecken zu ueberlasten." },
  russian_twists: { displayName: "Russian Twists", description: "Rotiere den Oberkoerper kontrolliert von Seite zu Seite." },
  hollow_body_hold: { displayName: "Hollow Body Hold", description: "Halte die Rumpfspannung mit angehobenen Armen und Beinen." },
  wall_sit: { displayName: "Wandsitz", description: "Halte die Sitzposition an der Wand mit aktiver Beinspannung." },
  jogging: { displayName: "Joggen", description: "Laufe in lockerem Tempo und halte eine gleichmaessige Atmung." },
  running: { displayName: "Laufen", description: "Laufe zuegig und kontrolliert mit stabilem Rhythmus." },
  mountain_climbers: { displayName: "Mountain Climbers", description: "Ziehe im Stuetz abwechselnd die Knie Richtung Brust." },
  interval_sprint: { displayName: "Intervall-Sprint", description: "Wechsle kurze intensive Sprintphasen mit Erholung." },
  walking_lunges: { displayName: "Gehende Ausfallschritte", description: "Mache kontrollierte Ausfallschritte im Gehen und halte den Oberkoerper aufrecht." },
  plank: { displayName: "Plank", description: "Halte den Unterarmstuetz mit fester Rumpfspannung." },
  situps: { displayName: "Sit-ups", description: "Richte den Oberkoerper kontrolliert auf und senke ihn langsam ab." },
  knee_push_ups: { displayName: "Knie-Liegestuetze", description: "Fuehre Liegestuetze auf den Knien mit sauberer Koerperspannung aus." },
  tricep_dips_chair: { displayName: "Trizeps-Dips am Stuhl", description: "Beuge und strecke die Arme am Stuhl kontrolliert." },
  lunges: { displayName: "Ausfallschritte", description: "Setze einen Schritt nach vorn und senke das hintere Knie kontrolliert ab." },
  sumo_squats: { displayName: "Sumo-Kniebeugen", description: "Gehe mit breitem Stand in die Kniebeuge und halte die Knie stabil." },
  glute_bridges: { displayName: "Glute Bridges", description: "Hebe die Huefte aus der Rueckenlage und spanne das Gesaess oben an." },
  tricep_extensions: { displayName: "Trizepsheben", description: "Strecke die Arme kontrolliert und halte die Oberarme ruhig." },
  side_plank: { displayName: "Seitstuetz", description: "Halte den seitlichen Stuetz mit stabiler Huefte." },
  bicycle_crunch: { displayName: "Bicycle Crunches", description: "Fuehre Ellenbogen und gegenueberliegendes Knie kontrolliert zusammen." },
  reverse_flys: { displayName: "Reverse Flys", description: "Fuehre die Arme seitlich nach hinten und aktiviere den oberen Ruecken." },
  push_ups_normal: { displayName: "Liegestuetze", description: "Senke den Koerper kontrolliert ab und druecke dich kraftvoll hoch." },
  push_ups_wide: { displayName: "Breite Liegestuetze", description: "Fuehre Liegestuetze mit breitem Griff fuer staerkeren Brustfokus aus." },
  squats: { displayName: "Kniebeugen", description: "Beuge Knie und Huefte sauber und richte dich stabil wieder auf." }
};

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
  "exercises": [24 BIS 30 gute Objekte, Ziel: 30],
  "stages": [GENAU 4 Objekte]
}

JEDE EXERCISE (alle Felder pflicht):
- nameKey: string - bevorzugt einer der EXISTING_NAMEKEYS; nur wenn noetig NEU mit "custom_" Prefix
- displayName: string (schoener deutscher Anzeigename, NIEMALS snake_case, NIEMALS nameKey)
- description: string (konkrete deutsche Ausfuehrungsbeschreibung, NIEMALS leer, NIEMALS Platzhalter)
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
1. Ziel sind 30 exercises. Wenn du unsicher bist: lieber 24-29 echte, sinnvolle Uebungen als Fuellobjekte.
2. MINDESTENS 4 exercises mit isRest: true (fuer Rest Days)
3. Mindestens 5 verschiedene Tag-Gruppen vertreten (push/pull/legs/core/cardio)
4. Die LETZTE stage MUSS weeks: 9999 haben (unendlich/Endgame)
5. Nutze so viele EXISTING_NAMEKEYS wie moeglich (mindestens 18). Bekannte Basics sind besser als erfundene Namen.
6. Verboten: displayName/nameKey wie "custom_ai_fill_29", "custom_standing_calf_raises", "Bonus-Uebung", "Uebung 12" oder andere Platzhalter.
7. Neue custom_ Uebungen muessen trotzdem displayName und description als echte deutsche Texte haben.
8. Antworte NUR mit dem JSON. KEINE Erklaerung. KEIN Markdown.

EXISTING_NAMEKEYS: ${EXISTING_NAMEKEYS.join(", ")}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), { status, headers: CORS_HEADERS });
}

function supabaseHeaders(token: string) {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMistralChat(payload: Record<string, unknown>) {
  let lastStatus = 0;
  let lastDetail = "";

  for (let attempt = 0; attempt < MISTRAL_MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        return { ok: true as const, data: await resp.json() };
      }

      lastStatus = resp.status;
      lastDetail = (await resp.text().catch(() => "")).slice(0, 500);
      if (!MISTRAL_RETRY_STATUSES.has(resp.status) || attempt === MISTRAL_MAX_ATTEMPTS - 1) {
        break;
      }
    } catch (e) {
      lastStatus = 0;
      lastDetail = (e as Error).message;
      if (attempt === MISTRAL_MAX_ATTEMPTS - 1) break;
    }

    await sleep(500 * (attempt + 1));
  }

  return { ok: false as const, status: lastStatus, detail: lastDetail };
}

async function getUserIdFromToken(token: string): Promise<{ userId?: string; error?: string }> {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: supabaseHeaders(token)
  });
  const body = await resp.json().catch(() => null);
  if (!resp.ok || !body?.id) {
    return { error: body?.msg || body?.message || `Auth failed (${resp.status})` };
  }
  return { userId: body.id };
}

async function getGenerationCount(token: string, userId: string, day: string): Promise<number> {
  const url = `${SUPABASE_URL}/rest/v1/dq_ai_generations?select=count&user_id=eq.${encodeURIComponent(userId)}&day=eq.${encodeURIComponent(day)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: supabaseHeaders(token)
  });
  if (!resp.ok) {
    throw new Error(`Rate-Limit SELECT failed (${resp.status})`);
  }
  const rows = await resp.json().catch(() => []);
  return Array.isArray(rows) && typeof rows[0]?.count === "number" ? rows[0].count : 0;
}

async function upsertGenerationCount(token: string, userId: string, day: string, count: number) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/dq_ai_generations?on_conflict=user_id,day`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(token),
      "Prefer": "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({ user_id: userId, day, count, updated_at: new Date().toISOString() })
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`Rate-Limit UPSERT failed (${resp.status}): ${detail.slice(0, 200)}`);
  }
}

function prettifyNameKey(nameKey: string) {
  const withoutPrefix = String(nameKey || "")
    .replace(/^custom_ai_(rest_)?fill_\d+$/i, "")
    .replace(/^custom_+/i, "")
    .replace(/_\d+$/g, "")
    .trim();
  if (!withoutPrefix) return "";

  const known: Record<string, string> = {
    standing_calf_raises: "Wadenheben stehend",
    calf_raises: "Wadenheben",
    standing_side_bends: "Seitbeugen stehend",
    standing_arm_raises: "Armheben stehend",
    standing_bicycle_crunch: "Bicycle Crunches stehend",
    progressive_walking: "Zuegiges Gehen",
    hamstring_curls: "Beinbeuger-Curls",
    standing_hamstring_curls: "Beinbeuger-Curls stehend",
    arm_circles: "Armkreisen",
    reverse_lunges: "Rueckwaerts-Ausfallschritte",
    incline_push_ups: "Erhoehte Liegestuetze",
    bear_crawl: "Bear Crawl",
    dead_bug: "Dead Bug",
    bird_dog: "Bird Dog"
  };
  if (known[withoutPrefix]) return known[withoutPrefix];

  return withoutPrefix
    .split("_")
    .filter(Boolean)
    .map((part) => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function defaultDescription(displayName: string, isRest: boolean) {
  if (isRest) return `${displayName} ruhig ausfuehren und bewusst locker bleiben.`;
  return `${displayName} kontrolliert ausfuehren und auf saubere Technik achten.`;
}

function isPlaceholderText(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  return !text ||
    text === "n/a" ||
    text === "todo" ||
    text === "test" ||
    text === "bonus" ||
    text === "ki-generierte uebung" ||
    text.startsWith("uebung ") ||
    text.startsWith("bonus-uebung") ||
    /^custom(_|-)/.test(text) ||
    /^custom_ai_(rest_)?fill_\d+$/.test(text);
}

function isPlaceholderExercise(ex: any) {
  if (!ex || typeof ex !== "object") return true;
  const key = String(ex.nameKey || "").trim();
  if (!key) return true;
  if (/^custom_ai_(rest_)?fill_\d+$/i.test(key)) return true;
  if (isPlaceholderText(ex.displayName) && isPlaceholderText(ex.description)) return true;
  return false;
}

function trimExercisesPreservingRest(exercises: any[], maxCount = 30) {
  if (!Array.isArray(exercises) || exercises.length <= maxCount) return exercises;
  const rest = exercises.filter((ex: any) => ex?.isRest === true);
  const training = exercises.filter((ex: any) => ex?.isRest !== true);
  const restToKeep = rest.slice(0, Math.min(rest.length, maxCount));
  const trainingToKeep = training.slice(0, Math.max(0, maxCount - restToKeep.length));
  return trainingToKeep.concat(restToKeep);
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
    if (plan.exercises.length < 24 || plan.exercises.length > 30) {
      errors.push(`need 24-30 exercises, got ${plan.exercises.length}`);
    }
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

function normalizePlanShape(plan: any, userContext: any) {
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.exercises)) return plan;

  const tagAliases: Record<string, string> = {
    strength: "push",
    kraft: "push",
    upper_body: "push",
    oberkoerper: "push",
    back: "pull",
    ruecken: "pull",
    legs: "legs",
    beine: "legs",
    abs: "core",
    core_training: "core",
    bauch: "core",
    endurance: "cardio",
    ausdauer: "cardio",
    hiit: "cardio",
    recovery: "rest",
    erholung: "rest",
    stretching: "mobility",
    mobilitaet: "mobility",
    mobility: "mobility",
    ganzkoerper: "full_body",
    fullbody: "full_body"
  };

  const keyAliases: Record<string, string> = {
    jumpingjacks: "jumping_jacks",
    custom_jumpingjacks: "jumping_jacks",
    custom_push_ups: "push_ups_normal",
    custom_pushups: "push_ups_normal",
    custom_squats: "squats",
    custom_lunges: "lunges",
    custom_plank: "plank",
    custom_bicycle_crunch: "bicycle_crunch",
    custom_standing_bicycle_crunch: "bicycle_crunch",
    custom_mountain_climbers: "mountain_climbers",
    custom_high_knees: "high_knees",
    custom_calf_raises: "custom_standing_calf_raises",
    custom_hamstring_curls: "custom_standing_hamstring_curls"
  };

  plan.exercises = plan.exercises.filter((ex: any) => !isPlaceholderExercise(ex)).map((ex: any, index: number) => {
    const normalized = ex && typeof ex === "object" ? { ...ex } : {};
    const originalKey = String(normalized.nameKey || "").trim();
    if (keyAliases[originalKey]) normalized.nameKey = keyAliases[originalKey];

    const rawTags = Array.isArray(normalized.tags) ? normalized.tags : [];
    const validTags = rawTags
      .map((tag: unknown) => String(tag || "").trim().toLowerCase())
      .map((tag: string) => VALID_TAGS.includes(tag as any) ? tag : tagAliases[tag])
      .filter((tag: unknown): tag is string => typeof tag === "string" && VALID_TAGS.includes(tag as any));

    const isRest = normalized.isRest === true || validTags.includes("rest");
    normalized.isRest = isRest;
    normalized.tags = validTags.length > 0 ? Array.from(new Set(validTags)) : (isRest ? ["rest", "mobility"] : ["full_body"]);
    if (isRest && !normalized.tags.includes("rest")) normalized.tags.unshift("rest");
    if (!VALID_TYPES.includes(normalized.type)) normalized.type = isRest ? "check" : "reps";
    if (typeof normalized.baseValue !== "number" || normalized.baseValue < 1) normalized.baseValue = isRest ? 1 : 10;
    if (typeof normalized.nameKey !== "string" || !normalized.nameKey) normalized.nameKey = `custom_generated_${index}`;
    if (!EXISTING_NAMEKEYS.includes(normalized.nameKey) && !normalized.nameKey.startsWith("custom_")) {
      normalized.nameKey = `custom_${normalized.nameKey.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    }
    const knownDetails = EXISTING_NAMEKEY_DETAILS[normalized.nameKey];
    const prettyName = knownDetails?.displayName || prettifyNameKey(normalized.nameKey);
    if (isPlaceholderText(normalized.displayName)) normalized.displayName = prettyName || `Training ${index + 1}`;
    if (isPlaceholderText(normalized.description)) {
      normalized.description = knownDetails?.description || defaultDescription(normalized.displayName, isRest);
    }
    if (userContext?.hasEquipment === false) normalized.needsEquipment = false;
    if (typeof normalized.needsEquipment !== "boolean") normalized.needsEquipment = false;
    if (!Array.isArray(normalized.muscles)) normalized.muscles = ["general"];
    if (!normalized.statPoints || typeof normalized.statPoints !== "object") normalized.statPoints = { durchhaltevermoegen: 1 };
    for (const key of Object.keys(normalized.statPoints)) {
      if (!VALID_STATS.includes(key as any)) delete normalized.statPoints[key];
    }
    if (Object.keys(normalized.statPoints).length === 0) normalized.statPoints = { durchhaltevermoegen: 1 };
    if (typeof normalized.mana !== "number" || normalized.mana < 1) normalized.mana = 20;
    if (typeof normalized.gold !== "number" || normalized.gold < 1) normalized.gold = 10;
    return normalized;
  });

  let restCount = plan.exercises.filter((ex: any) => ex?.isRest === true).length;
  let fillIndex = 0;
  while (restCount < 4) {
    plan.exercises.unshift({
      nameKey: `custom_active_recovery_${fillIndex}`,
      displayName: ["Aktive Erholung", "Sanfte Mobilitaet", "Atemfokus", "Locker Dehnen"][fillIndex] || "Aktive Erholung",
      description: [
        "Bewege dich locker und halte die Intensitaet bewusst niedrig.",
        "Mobilisiere Schultern, Ruecken und Huefte ohne Druck.",
        "Atme ruhig, entspanne die Schultern und fahre bewusst herunter.",
        "Dehne die grossen Muskelgruppen sanft und kontrolliert."
      ][fillIndex] || "Erhole dich aktiv und achte auf lockere Atmung.",
      type: "check",
      baseValue: 1,
      tags: ["rest", "mobility"],
      isRest: true,
      needsEquipment: false,
      muscles: ["general"],
      statPoints: { durchhaltevermoegen: 1 },
      mana: 15,
      gold: 5
    });
    restCount++;
    fillIndex++;
  }

  plan.exercises = trimExercisesPreservingRest(plan.exercises, 30);

  const seenKeys = new Set<string>();
  plan.exercises = plan.exercises.map((ex: any, index: number) => {
    let key = String(ex.nameKey || `custom_generated_${index}`);
    if (seenKeys.has(key)) key = `${key}_${index}`;
    seenKeys.add(key);
    return { ...ex, nameKey: key };
  });

  return plan;
}

Deno.serve(async (req: Request) => {
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

  const authResult = await getUserIdFromToken(token);
  if (!authResult.userId) {
    return json(401, { error: "Unauthorized: invalid token", detail: authResult.error });
  }
  const userId = authResult.userId;

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
  let currentGenerationCount = 0;
  try {
    currentGenerationCount = await getGenerationCount(token, userId, today);
    if (currentGenerationCount >= DAILY_LIMIT) {
      return json(429, { error: "Tageslimit erreicht (max 3/Tag)", limit: DAILY_LIMIT });
    }
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
- 24 BIS 30 echte exercises, Ziel 30
- GENAU 4 stages
- letzte stage weeks:9999
- mindestens 4 isRest:true
- nur erlaubte type/tags/statPoints
- unbekannte nameKeys nur mit custom_ Prefix
- displayName und description muessen echte deutsche Texte sein, kein snake_case, keine Platzhalter
- bei Equipment nein: ALLE needsEquipment:false
Antworte NUR mit JSON.`;

      const mistralResult = await fetchMistralChat({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: repairMessage }
        ],
        response_format: { type: "json_object" },
        temperature: attempt === 0 ? 0.7 : 0.25,
        max_tokens: 12000
      });

      if (!mistralResult.ok) {
        console.error("Mistral API error:", mistralResult.status, mistralResult.detail);
        return json(502, { error: "Mistral API error", status: mistralResult.status || "network" });
      }

      const data = mistralResult.data;
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

      plan = normalizePlanShape(plan, userContext);

      // Server-side Validation als Defense-in-Depth.
      const errors = validatePlanShape(plan);
      if (errors.length > 0) {
        lastValidationErrors = errors;
        console.warn("Mistral-Plan Validation fehlgeschlagen:", errors);
        continue;
      }

      try {
        await upsertGenerationCount(token, userId, today, currentGenerationCount + 1);
      } catch (e) {
        console.warn("Rate-Limit Update nach erfolgreicher Generierung fehlgeschlagen:", (e as Error).message);
      }

      return json(200, plan);
    }

    return json(422, { error: "Plan validation failed", details: lastValidationErrors.slice(0, 10) });
  } catch (e) {
    console.error("Edge function intern:", e);
    return json(500, { error: "Internal error", detail: (e as Error).message });
  }
});
