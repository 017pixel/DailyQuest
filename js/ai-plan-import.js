/**
 * @file ai-plan-import.js
 * @description Prompt, Validierung und Import fuer extern generierte 7-Tage-KI-Trainingsplaene.
 */
const DQ_AI_PLAN_IMPORT = {
    SCHEMA_VERSION: 2,
    SCHEMA_V1: 1,
    CYCLE_LENGTH: 7,
    TRAINING_EXERCISES_PER_DAY: 6,
    MAX_TEXT_LENGTH: 900,
    VALID_TYPES: ['reps', 'time', 'check'],
    VALID_STATS: ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'],
    MAX_PHASES: 8,
    EQUIPMENT_ALIASES: {
        dumbbell: 'dumbbell', dumbbells: 'dumbbell', hantel: 'dumbbell', hanteln: 'dumbbell', kurzhantel: 'dumbbell', kurzhanteln: 'dumbbell',
        barbell: 'barbell', langhantel: 'barbell',
        pullupbar: 'pullupBar', pullup_bar: 'pullupBar', klimmzugstange: 'pullupBar',
        bench: 'bench', bank: 'bench', trainingsbank: 'bench',
        kettlebell: 'kettlebell', kugelhantel: 'kettlebell'
    },

    getLang() {
        return (typeof DQ_CONFIG !== 'undefined' && DQ_CONFIG.userSettings?.language) || 'de';
    },

    t(key, fallback = key) {
        const lang = this.getLang();
        return (typeof DQ_DATA !== 'undefined' && DQ_DATA.translations?.[lang]?.[key]) || fallback;
    },

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    },

    buildPrompt() {
        return `Du hilfst dabei, einen DailyQuest Trainingsplan als JSON zu erstellen.

Wichtig zum Ablauf:
- Stelle zuerst Rueckfragen, bevor du JSON generierst.
- Frage nach Trainingsziel (z.B. Muskelaufbau, Fettabbau, Ausdauer, Mobility), gewuenschten Uebungsarten (Timer, Wiederholungen, Gewichte), Equipment, Anzahl und Lage der Restdays, Fokus-Muskelgruppen und zu vermeidenden Uebungen.
- Der User kann konkrete Wuensche nennen, z.B. "Oberkoerper, Beine und Core mit 3 Restdays pro Woche".
- Wenn der User keine festen Restday-Tage nennt, verteile die Restdays sinnvoll im 7-Tage-Plan.
- Erst wenn diese Punkte geklaert sind, gib das finale JSON aus.

Wichtig fuer die finale JSON-Antwort:
- Gib dann ausschliesslich valides JSON zurueck.
- Keine Markdown-Codeblocks.
- Keine Erklaerung vor oder nach dem JSON.
- Der Plan ist immer auf exakt 7 Tage begrenzt. Nicht mehr und nicht weniger.
- Trainingstage haben exakt 6 Uebungen.
- Restdays werden im JSON als eigene Tage konfiguriert: kind: "rest", exercises: [].
- Restdays duerfen label, restFocus und summaryDe enthalten.
- schemaVersion MUSS 2 sein.

Erlaubte Uebungstypen:
- reps: braucht sets und reps
- time: braucht durationSeconds in Sekunden
- check: einfache Aufgabe zum Abhaken

Jede Uebung braucht:
- id als kurzer slug ohne Leerzeichen
- nameDe
- nameEn
- descriptionDe
- type
- category
- muscles
- equipment
- statPoints
- manaReward
- goldReward

Erlaubte statPoints Keys:
- kraft
- ausdauer
- beweglichkeit
- durchhaltevermoegen
- willenskraft

Phasen (schemaVersion 2):
Jeder Plan kann Phasen definieren, die die Belastung ueber mehrere Wochen steuern.
Jede Phase braucht:
- labelDe: Name der Phase (z.B. "Grundlage", "Aufbau", "Intensiv")
- labelEn: Englischer Name
- summaryDe: Kurzbeschreibung (1 Satz)
- weeks: Wie viele Wochen diese Phase dauert
- repsMultiplier: Wert zwischen 0.8 und 1.5 (1.0 = Normal)
- timeMultiplier: Wert zwischen 0.8 und 1.5 (1.0 = Normal)
- rewardMultiplier: Wert zwischen 0.8 und 1.5 (1.0 = Normal)
- setsAdd: Zusaetzliche Saetze (0 = normal)

Wenn keine Phasen gewuenscht sind, setze phases: [] oder die letzte Phase auf weeks: 9999.

Nutze exakt dieses JSON-Format:
{
  "schemaVersion": 2,
  "planName": "7-Tage Kraft und Mobility",
  "language": "de",
  "cycleLength": 7,
  "phases": [
    {
      "labelDe": "Grundlage",
      "labelEn": "Foundation",
      "summaryDe": "Saubere Technik und moderates Volumen.",
      "weeks": 2,
      "repsMultiplier": 1,
      "timeMultiplier": 1,
      "rewardMultiplier": 1,
      "setsAdd": 0
    },
    {
      "labelDe": "Intensiv",
      "labelEn": "Intense",
      "summaryDe": "Maximale Belastung mit hoeheren Wiederholungen.",
      "weeks": 9999,
      "repsMultiplier": 1.2,
      "timeMultiplier": 1.1,
      "rewardMultiplier": 1.15,
      "setsAdd": 1
    }
  ],
  "days": [
    {
      "day": 1,
      "kind": "training",
      "label": "Oberkoerper Kraft",
      "exercises": [
        {
          "id": "push_up_controlled",
          "nameDe": "Kontrollierte Liegestuetze",
          "nameEn": "Controlled Push-Up",
          "descriptionDe": "Langsam absenken, kurz halten, sauber hochdruecken.",
          "type": "reps",
          "sets": 3,
          "reps": 10,
          "category": "Chest",
          "muscles": ["chest", "triceps", "shoulders"],
          "equipment": [],
          "statPoints": { "kraft": 1 },
          "manaReward": 20,
          "goldReward": 6
        }
      ]
    },
    {
      "day": 2,
      "kind": "rest",
      "label": "Mobility Restday",
      "restFocus": "mobility",
      "summaryDe": "Aktive Erholung mit leichtem Stretching und Spaziergang.",
      "exercises": []
    }
  ]
}

Nachdem du die Rueckfragen beantwortet bekommen hast: Erstelle einen vollstaendigen 7-Tage-Plan mit schemaVersion 2, exakt 7 day-Objekten. Trainingstage brauchen exakt 6 Uebungen. Restdays werden im JSON mit kind: "rest", label, optional restFocus, optional summaryDe und exercises: [] konfiguriert. Optional phases-Array mit progressiver Steigerung.`;
    },

    stripCodeFence(raw) {
        let text = String(raw || '').trim();
        if (text.startsWith('```')) {
            text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }
        return text;
    },

    parseJsonInput(raw) {
        const text = this.stripCodeFence(raw);
        if (!text) throw new Error(this.t('ai_plan_error_empty', 'Bitte fuege zuerst das JSON der KI ein.'));

        try {
            return JSON.parse(text);
        } catch (firstError) {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return JSON.parse(text.slice(start, end + 1));
                } catch (secondError) {
                    throw new Error(this.t('ai_plan_error_invalid_json', 'Das eingefuegte JSON ist nicht gueltig.'));
                }
            }
            throw new Error(this.t('ai_plan_error_invalid_json', 'Das eingefuegte JSON ist nicht gueltig.'));
        }
    },

    normalizeSlug(value, fallback) {
        const raw = String(value || fallback || 'exercise')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 48);
        return raw || 'exercise';
    },

    cleanText(value, maxLength = this.MAX_TEXT_LENGTH) {
        return String(value || '')
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, maxLength);
    },

    asNumber(value, fallback = null) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    },

    clamp(number, min, max) {
        return Math.max(min, Math.min(max, number));
    },

    normalizeMuscles(value) {
        if (!Array.isArray(value)) return [];
        return value
            .map(item => this.cleanText(item, 40).toLowerCase().replace(/\s+/g, '_'))
            .filter(Boolean)
            .slice(0, 8);
    },

    normalizeEquipment(value) {
        if (!Array.isArray(value)) return [];
        const result = [];
        value.forEach(item => {
            const key = this.cleanText(item, 40).toLowerCase().replace(/[^a-z0-9]+/g, '_');
            const normalized = this.EQUIPMENT_ALIASES[key] || this.EQUIPMENT_ALIASES[key.replace(/_/g, '')];
            if (normalized && !result.includes(normalized)) result.push(normalized);
        });
        return result;
    },

    normalizeStatPoints(value, type, category, muscles) {
        const result = {};
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(value).forEach(([key, raw]) => {
                const normalizedKey = key === 'durchhaltevermögen' ? 'durchhaltevermoegen' : String(key || '').toLowerCase();
                if (!this.VALID_STATS.includes(normalizedKey)) return;
                const number = this.asNumber(raw, 0);
                if (number > 0) result[normalizedKey] = this.clamp(number, 0.25, 3);
            });
        }
        if (Object.keys(result).length > 0) return result;
        if (type === 'time') return { ausdauer: 1 };
        if (type === 'check') return { willenskraft: 0.5 };
        if (String(category || '').toLowerCase().includes('cardio') || muscles.includes('legs')) return { ausdauer: 0.5, kraft: 0.5 };
        return { kraft: 1 };
    },

    getDefaultRewards(type, baseValue) {
        const base = Math.max(5, Math.round((baseValue || 10) * 1.5));
        if (type === 'time') return { manaReward: Math.max(15, base + 5), goldReward: Math.max(4, Math.round(baseValue / 5)) };
        if (type === 'check') return { manaReward: 12, goldReward: 4 };
        return { manaReward: Math.max(12, base), goldReward: Math.max(4, Math.round(baseValue * 0.5)) };
    },

    normalizePhases(rawPhases) {
        if (!Array.isArray(rawPhases) || rawPhases.length === 0) return [];
        const normalized = [];
        rawPhases.forEach((phase, index) => {
            if (!phase || typeof phase !== 'object') return;
            const labelDe = this.cleanText(phase.labelDe, 60) || `Phase ${index + 1}`;
            const labelEn = this.cleanText(phase.labelEn, 60) || labelDe;
            const summaryDe = this.cleanText(phase.summaryDe, 300) || '';
            const weeks = this.clamp(Math.round(this.asNumber(phase.weeks, 9999) || 9999), 1, 9999);
            const repsMultiplier = this.clamp(this.asNumber(phase.repsMultiplier, 1) || 1, 0.5, 2);
            const timeMultiplier = this.clamp(this.asNumber(phase.timeMultiplier, 1) || 1, 0.5, 2);
            const rewardMultiplier = this.clamp(this.asNumber(phase.rewardMultiplier, 1) || 1, 0.5, 2);
            const setsAdd = this.clamp(Math.round(this.asNumber(phase.setsAdd, 0) || 0), 0, 4);
            normalized.push({ labelDe, labelEn, summaryDe, weeks, repsMultiplier, timeMultiplier, rewardMultiplier, setsAdd });
        });
        return normalized;
    },

    validatePayload(payload) {
        const errors = [];
        const addError = (path, message) => errors.push({ path, message });

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return { valid: false, errors: [{ path: 'root', message: 'Das JSON muss ein Objekt sein.' }], normalized: null };
        }

        const schemaVersion = this.asNumber(payload.schemaVersion, 1);
        if (schemaVersion !== this.SCHEMA_VERSION && schemaVersion !== this.SCHEMA_V1) {
            addError('schemaVersion', `schemaVersion muss ${this.SCHEMA_V1} oder ${this.SCHEMA_VERSION} sein.`);
        }

        const planName = this.cleanText(payload.planName, 60);
        if (!planName) addError('planName', 'planName fehlt oder ist leer.');

        if (payload.cycleLength != null && Number(payload.cycleLength) !== this.CYCLE_LENGTH) {
            addError('cycleLength', 'cycleLength muss exakt 7 sein.');
        }

        if (!Array.isArray(payload.days)) {
            addError('days', 'days muss ein Array sein.');
            return { valid: false, errors, normalized: null };
        }

        if (payload.days.length !== this.CYCLE_LENGTH) {
            addError('days', `Der Plan braucht exakt ${this.CYCLE_LENGTH} Tage.`);
        }

        const rawPhases = Array.isArray(payload.phases) ? payload.phases : [];
        if (rawPhases.length > this.MAX_PHASES) {
            addError('phases', `Maximal ${this.MAX_PHASES} Phasen erlaubt.`);
        }

        rawPhases.forEach((phase, index) => {
            const phasePath = `phases[${index}]`;
            if (!phase.labelDe && !phase.labelEn) {
                addError(`${phasePath}.labelDe`, `Phase ${index + 1} braucht labelDe.`);
            }
            const weeks = this.asNumber(phase.weeks, null);
            if (weeks !== null && (!Number.isInteger(weeks) || weeks < 1 || weeks > 9999)) {
                addError(`${phasePath}.weeks`, `Phase ${index + 1} braucht weeks >= 1.`);
            }
        });

        const seenDays = new Set();
        const seenSlugs = new Map();
        const normalizedDays = [];
        const normalizedExercises = [];
        const importKey = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

        payload.days.forEach((rawDay, dayIndex) => {
            const dayPath = `days[${dayIndex}]`;
            const dayNumber = this.asNumber(rawDay?.day, dayIndex + 1);
            const kind = String(rawDay?.kind || '').toLowerCase();
            const label = this.cleanText(rawDay?.label, 60) || (kind === 'rest' ? 'Restday' : `Tag ${dayNumber}`);
            const restFocus = this.cleanText(rawDay?.restFocus || rawDay?.focus, 60);
            const summaryDe = this.cleanText(rawDay?.summaryDe || rawDay?.summary || rawDay?.descriptionDe, 300);
            const summaryEn = this.cleanText(rawDay?.summaryEn || rawDay?.descriptionEn, 300);
            const rawExercises = Array.isArray(rawDay?.exercises) ? rawDay.exercises : [];

            if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > this.CYCLE_LENGTH) {
                addError(`${dayPath}.day`, `Tag ${dayIndex + 1} braucht day zwischen 1 und 7.`);
            }
            if (seenDays.has(dayNumber)) addError(`${dayPath}.day`, `Tag ${dayNumber} ist doppelt vorhanden.`);
            seenDays.add(dayNumber);

            if (!['training', 'rest'].includes(kind)) {
                addError(`${dayPath}.kind`, 'kind muss training oder rest sein.');
            }

            if (kind === 'rest' && rawExercises.length > 0) {
                addError(`${dayPath}.exercises`, `Tag ${dayNumber} ist Restday und darf keine Uebungen enthalten.`);
            }
            if (kind === 'training' && rawExercises.length !== this.TRAINING_EXERCISES_PER_DAY) {
                addError(`${dayPath}.exercises`, `Tag ${dayNumber} braucht exakt ${this.TRAINING_EXERCISES_PER_DAY} Uebungen.`);
            }

            const exerciseIds = [];
            rawExercises.forEach((rawExercise, exerciseIndex) => {
                const exercisePath = `${dayPath}.exercises[${exerciseIndex}]`;
                const nameDe = this.cleanText(rawExercise?.nameDe || rawExercise?.name || rawExercise?.title, 80);
                const nameEn = this.cleanText(rawExercise?.nameEn || rawExercise?.nameEnglish || nameDe, 80);
                const descriptionDe = this.cleanText(rawExercise?.descriptionDe || rawExercise?.description || rawExercise?.instructions, 700);
                const type = String(rawExercise?.type || '').toLowerCase();
                const category = this.cleanText(rawExercise?.category, 40) || 'General';
                const muscles = this.normalizeMuscles(rawExercise?.muscles);
                const musclesSecondary = this.normalizeMuscles(rawExercise?.musclesSecondary || rawExercise?.secondaryMuscles);
                const requiredEquipment = this.normalizeEquipment(rawExercise?.equipment || rawExercise?.requiredEquipment);

                if (!nameDe) addError(`${exercisePath}.nameDe`, `Uebung ${exerciseIndex + 1} an Tag ${dayNumber} braucht nameDe.`);
                if (!descriptionDe || descriptionDe.length < 12) addError(`${exercisePath}.descriptionDe`, `${nameDe || 'Uebung'} braucht eine klare Beschreibung.`);
                if (!this.VALID_TYPES.includes(type)) addError(`${exercisePath}.type`, `${nameDe || 'Uebung'} hat ungueltigen type. Erlaubt: reps, time, check.`);
                if (muscles.length === 0) addError(`${exercisePath}.muscles`, `${nameDe || 'Uebung'} braucht mindestens eine Muskelgruppe.`);

                let baseValue = 1;
                let sets = null;
                let reps = null;
                let timerDuration = null;
                if (type === 'reps') {
                    sets = this.asNumber(rawExercise?.sets, null);
                    reps = this.asNumber(rawExercise?.reps ?? rawExercise?.baseValue, null);
                    if (!Number.isInteger(sets) || sets < 1 || sets > 6) addError(`${exercisePath}.sets`, `${nameDe || 'Uebung'} braucht sets zwischen 1 und 6.`);
                    if (!Number.isInteger(reps) || reps < 1 || reps > 200) addError(`${exercisePath}.reps`, `${nameDe || 'Uebung'} braucht reps zwischen 1 und 200.`);
                    baseValue = this.clamp(Math.round(reps || 1), 1, 200);
                } else if (type === 'time') {
                    timerDuration = this.asNumber(rawExercise?.durationSeconds ?? rawExercise?.timerDuration ?? rawExercise?.baseValue, null);
                    if (!Number.isInteger(timerDuration) || timerDuration < 10 || timerDuration > 7200) addError(`${exercisePath}.durationSeconds`, `${nameDe || 'Uebung'} braucht durationSeconds zwischen 10 und 7200.`);
                    baseValue = this.clamp(Math.round(timerDuration || 30), 10, 7200);
                } else if (type === 'check') {
                    baseValue = 1;
                }

                const slugBase = this.normalizeSlug(rawExercise?.id || nameEn || nameDe, `day_${dayNumber}_${exerciseIndex + 1}`);
                const slugCount = seenSlugs.get(slugBase) || 0;
                seenSlugs.set(slugBase, slugCount + 1);
                const slug = slugCount === 0 ? slugBase : `${slugBase}_${slugCount + 1}`;
                const importId = `ai:${importKey}:${slug}`;
                const nameKey = `ai_${slug}`;
                const defaults = this.getDefaultRewards(type, baseValue);
                const manaReward = this.clamp(Math.round(this.asNumber(rawExercise?.manaReward, defaults.manaReward)), 5, 150);
                const goldReward = this.clamp(Math.round(this.asNumber(rawExercise?.goldReward, defaults.goldReward)), 1, 80);
                const statPoints = this.normalizeStatPoints(rawExercise?.statPoints, type, category, muscles);

                const exercise = {
                    id: importId,
                    source: 'ai_generated',
                    nameKey,
                    nameDe,
                    nameEn,
                    displayName: nameDe,
                    description: descriptionDe,
                    descriptionDe,
                    descriptionEn: this.cleanText(rawExercise?.descriptionEn || descriptionDe, 700),
                    type,
                    baseValue,
                    sets,
                    reps,
                    timerDuration: type === 'time' ? baseValue : timerDuration,
                    category,
                    muscles,
                    musclesSecondary,
                    equipment: [],
                    requiredEquipment,
                    needsEquipment: requiredEquipment.length > 0,
                    manaReward,
                    goldReward,
                    mana: manaReward,
                    gold: goldReward,
                    statPoints,
                    hasImage: false,
                    imageUrl: '',
                    imageThumbSm: '',
                    imageThumbMd: '',
                    videos: [],
                    createdAt: Date.now()
                };

                exerciseIds.push(importId);
                normalizedExercises.push(exercise);
            });

            normalizedDays.push({
                day: dayNumber,
                kind: kind || 'training',
                label,
                restFocus: kind === 'rest' ? restFocus : '',
                summaryDe,
                summaryEn,
                exerciseIds
            });
        });

        for (let day = 1; day <= this.CYCLE_LENGTH; day++) {
            if (!seenDays.has(day)) addError('days', `Tag ${day} fehlt.`);
        }

        normalizedDays.sort((a, b) => a.day - b.day);
        const normalized = {
            schemaVersion: schemaVersion,
            planName: planName || 'KI Trainingsplan',
            language: this.cleanText(payload.language, 8) || this.getLang(),
            cycleLength: this.CYCLE_LENGTH,
            days: normalizedDays,
            exercises: normalizedExercises,
            phases: this.normalizePhases(payload.phases)
        };

        return { valid: errors.length === 0, errors, normalized };
    },

    buildFollowUpPrompt(errors, originalJson = '') {
        const errorList = (errors || []).map(error => `- ${error.path}: ${error.message}`).join('\n') || '- Das JSON entspricht nicht dem DailyQuest Format.';
        const clippedJson = String(originalJson || '').slice(0, 12000);
        return `Korrigiere das folgende DailyQuest JSON.

Regeln:
- Gib ausschliesslich valides JSON zurueck.
- Keine Markdown-Codeblocks.
- Keine Erklaerung vor oder nach dem JSON.
- schemaVersion muss 1 oder 2 sein (2 fuer Phasen-Unterstuetzung).
- Der Plan muss exakt 7 Tage enthalten.
- Trainingstage brauchen exakt 6 Uebungen.
- Restdays werden direkt im JSON konfiguriert und muessen kind: "rest" sowie exercises: [] haben.
- Restdays duerfen label, restFocus und summaryDe enthalten.
- Erlaubte type Werte sind nur reps, time oder check.
- Phasen (nur schemaVersion 2): labelDe, labelEn, summaryDe, weeks, repsMultiplier, timeMultiplier, rewardMultiplier, setsAdd.

Diese Fehler muessen behoben werden:
${errorList}

JSON zum Korrigieren:
${clippedJson}`;
    },

    async copyText(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        return ok;
    },

    async saveAsCustomPlan(normalizedPayload) {
        if (!normalizedPayload || !Array.isArray(normalizedPayload.exercises)) {
            throw new Error('Kein gueltiger KI-Plan zum Speichern.');
        }
        if (!DQ_DB.db?.objectStoreNames.contains('custom_user_exercises')) {
            throw new Error('Custom-Uebungsdatenbank ist nicht verfuegbar.');
        }

        const exerciseIds = normalizedPayload.exercises.map(ex => ex.id);
        await new Promise((resolve, reject) => {
            const tx = DQ_DB.db.transaction(['custom_user_exercises'], 'readwrite');
            const store = tx.objectStore('custom_user_exercises');
            normalizedPayload.exercises.forEach(exercise => store.put(exercise));
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });

        const metadata = {
            source: 'ai_generated',
            schemaVersion: normalizedPayload.schemaVersion || this.SCHEMA_VERSION,
            aiSchedule: {
                cycleLength: this.CYCLE_LENGTH,
                days: normalizedPayload.days.map(day => ({ ...day }))
            }
        };

        if (Array.isArray(normalizedPayload.phases) && normalizedPayload.phases.length > 0) {
            metadata.aiPhases = normalizedPayload.phases;
        }

        if (typeof DQ_MANUAL_PLAN === 'undefined' || typeof DQ_MANUAL_PLAN.savePlan !== 'function') {
            throw new Error('Trainingsplan-System ist nicht verfuegbar.');
        }
        return await DQ_MANUAL_PLAN.savePlan(normalizedPayload.planName, exerciseIds, metadata);
    }
};

if (typeof window !== 'undefined') {
    window.DQ_AI_PLAN_IMPORT = DQ_AI_PLAN_IMPORT;
} else if (typeof globalThis !== 'undefined') {
    globalThis.DQ_AI_PLAN_IMPORT = DQ_AI_PLAN_IMPORT;
}
