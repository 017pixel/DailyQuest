# DailyQuest V2 — Vollständiger Migrationsplan

> **Ziel:** Open-Source-Repo (v2.18.1) aufräumen und finalisieren, DailyQuest 2 mit Convex + Vercel als privates Repo aufsetzen, nahtlosen Übergang für User schaffen.

---

## 1. Übersicht & Architektur-Entscheidungen

### 1.1 Warum dieser Plan?

DailyQuest ist gewachsen – von einer lokalen PWA zu einer App mit optionalem Supabase-Sync. Der Code ist monolithisch, die Datenbank (JSONB-Blob) ist nicht relational, und GitHub Pages limitiert uns statisch. Für das Admin-Dashboard und zukünftige Features brauchen wir ein moderneres Setup.

### 1.2 Entscheidungen (aus den Fragen bestätigt)

| Entscheidung | Wert |
|---|---|
| **Open-Source-Repo** | Bleibt öffentlich, Supabase bleibt drin, wird aufgeräumt und finalisiert |
| **DailyQuest 2** | Neues privates Repo (`dailyquest-next`) |
| **Hosting** | Vercel (Hobby-Plan, kostenlos) – URL: `dailyquest-next.vercel.app` |
| **Datenbank** | Convex (neu, relational, statt Supabase-JSONB) |
| **Auth-Provider** | Convex Auth (built-in, kein Clerk) |
| **Frontend** | React + Vite (übernimmt DailyQuest-Design 1:1) |
| **Admin-Dashboard** | Kommt in DailyQuest 2, nicht in der Open-Source-Version |
| **Routing** | nativ über Vercel, kein Hash-Routing mehr |
| **PWA** | Beide Versionen bleiben PWAs |
| **Migration DQ1 → DQ2** | JSON-Export in DQ1 → JSON-Import in DQ2 |

### 1.3 Warum Convex statt Supabase für V2?

| Aspekt | Supabase (aktuell) | Convex (V2) |
|---|---|---|
| **Datenmodell** | JSONB-Blob (`app_data`) – schwer zu querieren | Relationale Tabellen mit Typen – sauber querybar |
| **Admin-Queries** | Nur mit `service_role`-Key + Edge Function möglich | Built-in Auth + Funktionen, einfacher zu sichern |
| **Realtime** | Supabase Realtime (WebSocket) | Convex Subscriptions (built-in, performant) |
| **Type Safety** | Kein Typescript-Zwang | Voll typisiert (Convex generiert Types) |
| **Hosting** | Separat, Edge Functions nötig | Läuft direkt bei Convex, Deployment via git |
| **Admin-Dashboard** | Aufwändig zu sichern | Auth + Rollen systembedingt einfacher |

---

## 2. Phase 1: Open-Source-Repo aufräumen & finalisieren

> **Dauer:** 2-3 Sessions
> **Status:** 🟡 Lokal umgesetzt, Release-Tag ausstehend

### 2.1 Repository Cleanup

| Task | Beschreibung | Priorität |
|---|---|---|
| `supabase/.temp/` löschen + zu `.gitignore` hinzufügen | 9 maschinengenerierte Dateien, die nicht in git gehören | 🔴 Hoch |
| `supabase/functions/` löschen | Leeres Verzeichnis (Edge Function wurde gelöscht) | 🔴 Hoch |
| `dist/` bereinigen | Build-Output, bereits in `.gitignore`, ggf. aus git history entfernen | 🟡 Mittel |
| `.vscode/settings.json` anpassen | `"supabase/functions"` aus Deno-Paths entfernen (toter Pfad) | 🟢 Niedrig |
| `supabase/config.toml` bereinigen | Kommentarzeilen über gelöschte Edge Function entfernen | 🟢 Niedrig |
| `Screenshots für README/desktop.ini` löschen | Windows-Müll-Datei | 🟢 Niedrig |
| `.gitignore` ergänzen | `supabase/.temp/` hinzufügen | 🔴 Hoch |

### 2.2 Dokumentation entrümpeln

| Task | Beschreibung |
|---|---|
| `plans/` Ordner | Alte Planungsdoks (Admin-Dashboard-Plan, wger-Plan, KI-Prompt-Plan) können bleiben oder in `archive/` |
| `Jugendforscht-Bericht/` | Kann bleiben (Projekt-Historie), evtl. in `docs/` verschieben |
| `Funktion-Erklaerungen/` | Kann als Dokumentation bleiben, ggf. in `docs/` bündeln |
| `README.md` prüfen | Aktualisieren mit Hinweis auf DailyQuest V2 |

**Vorschlag:** Ein `docs/`-Ordner erstellen und `info/`, `Funktion-Erklaerungen/`, `Jugendforscht-Bericht/`, `Screenshots für README/` dort rein. Oder alles so lassen und nur `.gitignore`-relevantes machen.

### 2.3 Code Cleanup (optional, nicht-breaking)

| Task | Beschreibung | Risiko |
|---|---|---|
| Alte Migrations-Guards in `database.js` | `focus_labels` Migration (< v21) kann vereinfacht werden | 🟢 Kein Risiko |
| Dead Comments in `main.js` | "Bug H Fix" etc. entfernen | 🟢 Kein Risiko |
| Tests laufen lassen | `node tests/run.js` – prüfen, ob alles grün ist | 🔴 Muss passen vor Release |

### 2.4 Supabase-Integration im Open-Source-Repo BELASSEN

Das Open-Source-Repo **behält** Supabase-Sync, wie es ist. Keine Entfernung. Gründe:
- Bestehende User nutzen den Sync aktiv
- Das Repo soll eine funktionierende, stabile Version bleiben
- Sonst müssten wir Auth-Screen, Sync-Logik, Settings-UI, Service Worker etc. umbauen → zu viel Risiko

### 2.5 Settings: Link zu DailyQuest V2 einbauen

> **Wichtigster Punkt dieser Phase!**

In den Einstellungen (`index.html` → Settings-Bereich) wird ein neuer Eintrag hinzugefügt:

```
══════════════════════════════
  🔄 DailyQuest V2
  Eine neue Version von DailyQuest ist verfügbar!
  ➜ [Zur neuen Version] (Platzhalter-Link)
  ─────────────────────────
  Neue Features: Verbessertes Dashboard,
  Admin-Bereich, neue Datenbank und mehr!
══════════════════════════════
```

**Details:**
- Ein neuer Eintrag im Settings-Menü (`#settingsContainer` in `index.html`)
- Ein Link-Button (zunächst `href="#"` oder `href="https://dailyquest-v2.vercel.app"`)
- Übersetzungen (DE/EN) in `data/translations.js` ergänzen
- CSS-Stil: Leicht hervorgehoben (z.B. farbiger Kasten oder Badge "Neu!")
- Sichtbar für ALLE User, unabhängig vom Auth-Status

**Dateien, die geändert werden müssen:**
- `index.html` – Settings-UI
- `data/translations.js` – DE/EN-Übersetzungen
- `css/` – ggf. neues Styling

### 2.6 Open-Source-Release taggen

```bash
git tag -a v2.18.1 -m "v2.18.1 - Final open-source release before DailyQuest V2"
git push origin v2.18.1
```

Optional: Ein GitHub-Release mit CHANGELOG erstellen.

**Hinweis:** Der Release-Tag wird erst nach Commit/Push-Freigabe erstellt.

---

## 3. Phase 2: DailyQuest 2 (dailyquest-next) aufsetzen

> **Dauer:** 8-10 Sessions (aufgeteilt in 9 Sub-Schritte)
> **Status:** ⬜ Nicht begonnen

### 3.1 Privates Repo + React/Vite/Convex-Scaffold + Vercel

**DQ2 wird komplett neu scaffoldet**, kein Fork. Der alte Code dient als Design-Referenz, wird aber nicht kopiert (da Vanilla JS vs React ein anderer Stack ist).

```bash
# 1. Neues privates Repo auf GitHub: dailyquest-next (PRIVAT!)

# 2. Convex-Template für React + Vite nutzen (lokal scaffolden)
npm create convex@latest dailyquest-next -- -t react-vite-shadcn
cd dailyquest-next
npm install
npx convex dev --once

# 3. Git init + mit private Repo verbinden
git init
git add .
git commit -m "Initial scaffold: React + Vite + Convex"
git remote add origin https://github.com/017pixel/dailyquest-next.git
git push -u origin main

# 4. Auf vercel.com anmelden → "New Project" → dailyquest-next importieren
# Framework wird automatisch erkannt (Vite + React)
# Build: npm run build → Output: dist
# → Fertige URL: https://dailyquest-next.vercel.app
```

**Wichtig:** Das Design der App (Farben, Layout, Dark-Theme, RPG-Ästhetik) wird **1:1** aus DQ1 übernommen. Der Code wird React-komponentisiert, aber visuell sieht alles gleich aus. Die alten CSS-Dateien aus DQ1 dienen als Vorlage.

**Projektstruktur:**
```
dailyquest-next/
├── convex/                  # Convex Backend
│   ├── schema.ts            # Relationales Schema
│   ├── auth.config.ts       # Convex Auth
│   ├── users.ts             # User-Funktionen
│   ├── quests.ts            # Quest-Funktionen
│   ├── admin.ts             # Admin-Funktionen
│   └── _generated/          # Auto-generiert
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── layout/          # App-Layout, Navigation
│   │   ├── pages/           # Seiten (Dashboard, Character, etc.)
│   │   └── ui/              # Design-System-Componenten
│   ├── styles/              # CSS (aus DQ1 übernommen)
│   ├── lib/                 # Hilfsfunktionen
│   ├── main.tsx             # Entry Point
│   └── App.tsx              # App-Root
├── public/
│   ├── manifest.json        # PWA-Manifest
│   └── service-worker.js    # PWA-Service Worker
├── package.json
└── vite.config.ts
```

### 3.2 Convex Auth + User-Tabelle

Statt Supabase-Auth kommt **Convex Auth** (built-in):
- Email/Password-Registrierung (inkl. Verifizierung)
- Session-Handling über Convex
- Admin-Rolle über `isAdmin`-Feld in `users`-Tabelle

**Schema (relational statt JSONB):**

```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    email: v.string(),
    displayName: v.string(),
    isAdmin: v.boolean(),
    joinedAt: v.number(),
    lastActiveAt: v.number(),
    streak: v.number(),
    maxStreak: v.number(),
    level: v.number(),
    totalMana: v.number(),
    totalGold: v.number(),
    stats: v.object({
      strength: v.number(),
      endurance: v.number(),
      agility: v.number(),
      willpower: v.number(),
      persistence: v.number(),
    }),
    equipment: v.array(v.string()),
    achievements: v.array(v.string()),
    // ... weitere Felder
  }).index("email", ["email"]),

  activityLog: defineTable({
    userId: v.id("users"),
    eventType: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  quests: defineTable({
    userId: v.id("users"),
    date: v.string(),
    title: v.string(),
    completed: v.boolean(),
    category: v.string(),
    manaReward: v.number(),
    goldReward: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  dailyStats: defineTable({
    date: v.string(),
    totalUsers: v.number(),
    activeUsers: v.number(),
    newUsers: v.number(),
    totalQuestsCompleted: v.number(),
    averageStreak: v.number(),
  }).index("by_date", ["date"]),
});
```

### 3.3 Design-Portierung: DQ1-Look in React

Das DailyQuest-Design wird in React-Komponenten übersetzt:

| DQ1 (Vanilla) | DQ2 (React) |
|---|---|
| `index.html` + `css/` | `src/components/ui/` – Design-System |
| `main.js` (DQ_CONFIG) | `src/lib/config.ts` + Convex Functions |
| `database.js` (IndexedDB) | Convex DB + lokaler State (React) |
| `supabase-client.js` | `convex/auth.config.ts` |
| `js/` Module als Globals | `src/components/pages/` – React-Komponenten |

**Ziel:** Ein normaler User sieht KEINEN visuellen Unterschied zwischen DQ1 und DQ2. Gleiche Farben, gleiches Layout, gleiche Schriftarten.

### 3.4 Schrittweise Convex-Migration (Sub-Schritte)

Nicht alles auf einmal – jeder Schritt ist deployt und lauffähig:

| Schritt | Was passiert | Status |
|---|---|---|
| **3.4.1** | Auth: Login/Registrierung mit Convex Auth | ⬜ |
| **3.4.2** | User-Tabelle: Character-Daten speichern | ⬜ |
| **3.4.3** | Quest-System: Quests in Convex statt IndexedDB | ⬜ |
| **3.4.4** | Aktivitäts-Logging in Convex | ⬜ |
| **3.4.5** | Shop + Inventar nach Convex migrieren | ⬜ |
| **3.4.6** | Training-Pläne + Log nach Convex | ⬜ |
| **3.4.7** | Admin-Rollen + Admin-Seite | ⬜ |
| **3.4.8** | Alte IndexedDB/Supabase-Logik entfernen | ⬜ |
| **3.4.9** | PWA + Service Worker für DQ2 anpassen | ⬜ |

### 3.5 Admin-Dashboard (in DailyQuest Next)

Das Admin-Dashboard wird **Teil von DailyQuest Next**, nicht mehr separat. Es nutzt:
- Convex Auth (Admin-Check via `isAdmin`-Flag in `users`-Tabelle)
- Convex Queries für alle Statistiken (live, kein Batch-Job nötig)
- Eigene Route: `/admin` in der React App
- Design: DailyQuest-Farbwelt + Notion-ähnliche Tabellen

**Admin-Routen:**
```
/admin                  → Dashboard-Startseite (KPI-Übersicht)
/admin/users            → User-Tabelle mit Filter/Suche
/admin/users/:id        → User-Detail
/admin/analytics        → Aktivitäts-Charts
```

---

## 4. Phase 3: User-Übergang & Daten-Migration

### 4.1 Übersicht Migration DQ1 → DQ2

Jeder User in DQ1 hat seine Daten in **IndexedDB** (lokal) + optional in **Supabase** (Cloud-Sync). Damit User zu DQ2 wechseln können, brauchen sie einen Export-Import-Weg.

**Kein automatischer Cloud-Transfer.** Aus Sicherheitsgründen (und weil DQ2 Convex statt Supabase nutzt) läuft die Migration über einen manuellen Export/Import:

```
DQ1 App                        DQ2 App
─────────────────              ─────────────────
IndexedDB (alle Daten)         
       │                               
       ▼                               
  Export-Knopf                    Import-Knopf
  in Settings                     in Settings
       │                               
       ▼                               
  Lädt .json herunter   ──────>  Lädt .json hoch
                                   │
                                   ▼
                              Convex-Datenbank
                              (relationale Tabellen)
```

### 4.2 Export-Funktion in DQ1 (Open-Source-Repo)

Ein neuer Button in den Settings: **"Nach DailyQuest 2 migrieren"**

**Ablauf Export:**
1. User klickt auf "Daten exportieren"
2. Ein Popup erscheint mit Infotext (siehe unten)
3. Beim Klick auf "Exportieren" wird ein JSON-Dump aller IndexedDB-Stores erstellt
4. Die Datei `dailyquest-export-2024-01-01.json` wird heruntergeladen
5. Optional: Hinweis, dass der User den Link zu DQ2 besuchen und dort importieren soll

**Welche Daten werden exportiert:**

| Daten | Quelle | Wichtig für DQ2 |
|---|---|---|
| Character (Level, Stats, Gold, Mana) | IndexedDB `character` | Ja |
| Settings (Sprache, Theme, Goal, Ausrüstung) | IndexedDB `settings` | Ja |
| Daily Quests (Verlauf) | IndexedDB `daily_quests` | Ja |
| Streak-Daten | localStorage | Ja |
| Training Activity Log | IndexedDB `training_activity_log` | Optional |
| Achievements | IndexedDB (charakter-intern) | Ja |
| Shop-Historie | IndexedDB `shop_history` | Optional |
| Level-Up-Historie | IndexedDB `level_up_history` | Optional |
| Weight-Entries | IndexedDB `weight_entries` | Optional |
| Custom Plans | IndexedDB `custom_plans` | Ja |
| wger-Import-Status | IndexedDB `wger_exercises` | Nein (wird neu geladen) |
| Dungeon-Progess | IndexedDB `dungeon_progress` | Optional |

**Popup-Design (Settings-Bereich):**
```
┌──────────────────────────────────────┐
│  🔄 Zu DailyQuest 2 wechseln         │
│                                      │
│  DailyQuest 2 ist da! Eine neue      │
│  Version mit verbessertem Dashboard, │
│  Admin-Bereich und moderner Technik. │
│                                      │
│  Deine Daten kannst du einfach       │
│  mitnehmen:                          │
│                                      │
│  [📥 Daten exportieren]              │
│                                      │
│  Danach auf DailyQuest 2 besuchen    │
│  und dort importieren:               │
│  ➜ [Zu DailyQuest 2] (Link)         │
│                                      │
│  ⚠️ Hinweis: DQ1 bleibt nutzbar.     │
│     Deine Daten werden hier nicht    │
│     gelöscht.                        │
└──────────────────────────────────────┘
```

**Dateien für Export-Funktion in DQ1:**
- `js/export-manager.js` (neu) – Export-Logik
- `index.html` – UI in Settings 
- `data/translations.js` – DE/EN-Texte
- `css/` – Styling

### 4.3 Import-Funktion in DQ2

Ein neuer Bereich in den DQ2-Settings: **"Von DailyQuest 1 importieren"**

**Ablauf Import:**
1. User ist in DQ2 eingeloggt (Convex Auth)
2. Geht zu Settings → "Von DQ1 importieren"
3. Wählt die heruntergeladene `.json`-Datei aus (File-Input)
4. Das JS parsed das JSON und mapped die Felder auf das Convex-Schema
5. Die Daten werden per Convex-Mutation in die DB geschrieben
6. Erfolgsmeldung + Redirect zum Dashboard

**Mapping DQ1-Format → Convex-Schema:**

```javascript
// Beispiel: Character-Daten mappen
function migrateCharacterData(exportJson, convexMutation) {
  const character = exportJson.character;
  return {
    level: character.level || 1,
    mana: character.mana || 0,
    gold: character.gold || 0,
    stats: {
      strength: character.strength || 10,
      endurance: character.endurance || 10,
      agility: character.agility || 10,
      // ...
    },
    // ...
  };
}
```

**Popup-Design (DQ2-Settings):**
```
┌──────────────────────────────────────┐
│  📥 Von DailyQuest 1 importieren     │
│                                      │
│  Hast du bereits DQ1 genutzt? Dann   │
│  exportiere deine Daten dort und     │
│  lade sie hier hoch.                 │
│                                      │
│  [Datei auswählen] (.json)           │
│                                      │
│  [📥 Import starten]                 │
│                                      │
│  ⚠️ Vorhandene DQ2-Daten werden      │
│     überschrieben.                   │
└──────────────────────────────────────┘
```

**Dateien für Import-Funktion in DQ2:**
- `js/import-manager.js` (neu) – Import-Logik + Mapping
- `convex/users.ts` – Convex Mutation für Import
- `index.html` – UI in Settings
- `data/translations.js` – DE/EN-Texte

### 4.4 Migration mit Supabase-Cloud-Daten (optional)

Falls ein User in DQ1 mit E-Mail-Account gesynct hat:

1. Export aus DQ1 (wie oben) enthält ALLE Daten – auch Cloud-Sync-Daten
2. Der Export lädt das aktuellste `app_data` aus IndexedDB (welches via Sync aktuell gehalten wird)
3. **Kein separater Cloud-Export nötig** – der lokale Export reicht

**Alternative für später:** Ein direkter "Von Supabase zu Convex"-Migrationsjob über eine Edge Function, die `service_role` nutzt. Das ist aber deutlich komplexer und erst dann sinnvoll, wenn viele User migrieren wollen.

### 4.5 Was passiert mit Supabase nach der Migration?

- **DQ1-Betrieb:** Supabase bleibt aktiv, solange DQ1 läuft
- **Kein automatisches Löschen:** User-Daten in Supabase bleiben erhalten
- **DQ2 startet sauber:** Convex-DB ist anfangs leer, User migrieren freiwillig
- **Spätere Option:** Nach einer Übergangsfrist (z.B. 6 Monate) kann der Supabase-Service eingestellt werden

### 4.6 Kommunikation & Link

| Element | Beschreibung |
|---|---|
| **Settings-Link DQ1** (Phase 1) | "DailyQuest V2" mit Platzhalter-URL |
| **Settings-Link DQ1** (nach DQ2-Launch) | Echte URL + Export-Button |
| **Settings DQ2** | Import-Button + Hinweis |
| **README.md** (DQ1) | Hinweis auf DQ2 und Migration |
| **GitHub Release** (DQ1) | "Final Release – Empfehlung: Zu DQ2 wechseln" |

---

## 5. Dateien & Konfiguration

### 5.1 Änderungen im Open-Source-Repo (Phase 1)

| Datei | Änderung |
|---|---|
| `.gitignore` | `supabase/.temp/` hinzufügen |
| `supabase/.temp/*` | Löschen + git rm |
| `supabase/functions/` | Leeres Verzeichnis löschen |
| `supabase/config.toml` | Kommentare bereinigen |
| `.vscode/settings.json` | `"supabase/functions"` aus Deno-Paths |
| `index.html` | Settings: DailyQuest V2 Link hinzufügen |
| `data/translations.js` | Übersetzungen für V2-Link |
| `css/` | Styling für V2-Link |
| `tests/` | Prüfen, ob Tests grün sind |

### 5.2 Neues in DailyQuest 2 (Phase 2)

| Komponente | Technologie |
|---|---|
| Hosting | Vercel (Hobby/Free) – URL: `dailyquest-next.vercel.app` |
| Datenbank | Convex (relational) |
| Auth | Convex Auth (built-in) |
| Frontend | React + Vite (Design 1:1 aus DQ1 übernommen) |
| Admin-Dashboard | Convex Queries + eigene UI |
| Admin-Auth | `isAdmin`-Flag in `users`-Tabelle |
| PWA | Service Worker (wie bisher) |
| Deployment | Auto-Deploy via `git push` |

---

## 6. Offene Fragen & Risiken

### 6.1 Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Massnahme |
|---|---|---|---|
| Convex-Lock-in (kein Supabase mehr) | 🟡 Mittel | 🟡 Mittel – aber Convex ist flexibel genug | Daten immer exportierbar halten |
| User verwirrt durch zwei Versionen | 🟢 Niedrig | 🟢 Niedrig – Settings-Link reicht | Klar kommunizieren |
| Vercel Hobby-Limits erreicht | 🟢 Niedrig | 🟡 Mittel – bei 1M Functions/Monat weit weg | Überwachen, ggf. auf Pro upgraden |
| Convex Auth zu komplex für einfaches Setup | 🟡 Mittel | 🟢 Niedrig – Convex Auth ist gut dokumentiert | Planung + Tests vor Deployment |
| Alte User wollen keine Migration | 🟡 Mittel | 🟢 Niedrig – alte App bleibt nutzbar | Nicht erzwingen |

### 6.2 Nächste konkrete Schritte

Nachdem dieser Plan steht:

1. Phase 1 umsetzen (Repo-Cleanup)
2. Private Repo erstellen + Vercel verbinden
3. Convex aufsetzen + Auth
4. User-Tabellen + Quests migrieren
5. Admin-Dashboard bauen (separater Detail-Plan)
6. Settings-Link setzen + Release taggen

### 6.3 Noch zu klärendes

- [x] **Auth-Provider** → Convex Auth (built-in)
- [x] **DQ2 Frontend** → React + Vite (Design 1:1 aus DQ1 übernommen)
- [x] **Migrationspfad** → JSON-Export/Import über Settings
- [x] **Repo-Name** → `dailyquest-next`
- [x] **DQ2 URL** → `https://dailyquest-next.vercel.app`
- [ ] **Open Source Lizenz** – bleibt die aktuelle Lizenz bestehen oder änderst du was?

---

## 7. Zeitplan (Schätzung)

| Phase | Sessions | Beschreibung |
|---|---|---|
| **Phase 1:** Repo-Cleanup | 1 Session | Aufräumen, .gitignore, Settings-Link (Platzhalter) |
| **Phase 2:** dailyquest-next aufsetzen | | |
| 3.1 Repo + Scaffold + Vercel | 1 Session | Scaffold + Deploy + erste URL |
| 3.2 Convex Auth + User-Tabelle | 1 Session | Auth-Setup, erstes Schema |
| 3.3 Design-Portierung DQ1 → React | 1-2 Sessions | CSS übernehmen, Komponenten bauen |
| 3.4.1-3.4.4 Convex-Migration (Auth, User, Quests, Logging) | 2 Sessions | Schrittweise Daten-Convex |
| 3.4.5-3.4.6 Shop, Training-Pläne | 1-2 Sessions | Restliche Features migrieren |
| 3.4.7 Admin-Rollen + Admin-Seite | 1 Session | Admin-Dashboard bauen |
| 3.4.8-3.4.9 Alte Logik entfernen + PWA | 1 Session | Cleanup |
| **Phase 3:** User-Übergang | | |
| 4.2 Export-Funktion in DQ1 | 1 Session | JSON-Export bauen |
| 4.3 Import-Funktion in DQ2 | 1 Session | JSON-Import bauen |
| 4.6 Release & Kommunikation | 1 Session | Link setzen, taggen, README |

**Gesamt:** Ca. 13-16 Sessions (aufgeteilt in kleine, deploy-fähige Schritte)
