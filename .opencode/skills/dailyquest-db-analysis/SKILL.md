---
name: dailyquest-db-analysis
description: Anleitung zur Analyse der DailyQuest Supabase-Datenbank mit der Supabase CLI. Enthält den kompletten Workflow: CLI installieren, authentifizieren, Projekt verknüpfen, Schema untersuchen, Nutzerdaten analysieren und gezielte Queries ausführen.
---

## Voraussetzungen

1. **Supabase CLI** installieren und Projekt verknüpfen
2. **Access Token** vom Benutzer anfordern (unter `supabase.com/dashboard/account/tokens` erstellbar)
3. **Projekt-Ref** aus `js/supabase-config.js` oder `supabase projects list` entnehmen

## Schritt 1: CLI pruefen, ggf. installieren und authentifizieren

**ZUERST** pruefen, ob die Supabase CLI bereits installiert ist:

```bash
npx supabase --version
```

- **Wenn der Befehl fehlschlaegt** (CLI nicht gefunden): CLI installieren:
  ```bash
  npx -y supabase@latest --version
  ```

- **Wenn der Befehl erfolgreich ist**: Pruefen, ob ein Update verfuegbar ist. Die CLI gibt selbst einen Hinweis aus wie `A new version of Supabase CLI is available: vX.X.X`. Falls ein Update verfuegbar ist:
  ```bash
  npx -y supabase@latest --version
  ```

Danach authentifizieren:

```bash
# Mit Access Token einloggen (Token vom Benutzer erfragen)
npx supabase login --token <ACCESS_TOKEN>

# Alle Projekte auflisten, um den Projekt-Ref zu finden
npx supabase projects list
```

## Schritt 2: Projekt verknüpfen

Im Projekt-Root-Verzeichnis ausfuehren:

```bash
npx supabase link --project-ref <PROJECT_REF>
```

Ab jetzt kann `--linked` fuer alle Queries verwendet werden.

## Schritt 3: Schema analysieren

### Tabellen auflisten

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Spalten einer Tabelle untersuchen

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_data'
ORDER BY ordinal_position;
```

### Indizes pruefen

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_data';
```

### RLS-Policies pruefen

```sql
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_data'
ORDER BY policyname;
```

### Trigger pruefen

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_data';
```

## Schritt 4: Nutzer- und Datenstatistiken

### Grundlegende Zaehlung

```sql
SELECT
    COUNT(*) as total_rows,
    COUNT(CASE WHEN is_deleted = false OR is_deleted IS NULL THEN 1 END) as active_rows,
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_rows,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    AVG(reset_count)::numeric(10,2) as avg_reset_count,
    MAX(reset_count) as max_reset_count
FROM user_data;
```

### Auth-User Statistik

```sql
SELECT is_anonymous, COUNT(*) as count
FROM auth.users
GROUP BY is_anonymous;
```

### Datenbankgroesse

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
```

### Tabellengroesse

```sql
SELECT
    pg_size_pretty(pg_total_relation_size('user_data')) as total_size,
    pg_size_pretty(pg_relation_size('user_data')) as table_size,
    pg_size_pretty(pg_indexes_size('user_data')) as index_size;
```

### Aktivitaetsstatistiken

```sql
SELECT
    relname as table_name,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as live_rows,
    idx_scan as index_scans
FROM pg_stat_user_tables
WHERE relname = 'user_data';
```

## Schritt 5: app_data JSONB analysieren

### Alle Top-Level-Keys in app_data

```sql
SELECT jsonb_object_keys(app_data) as store_name
FROM user_data, lateral jsonb_object_keys(app_data)
GROUP BY store_name
ORDER BY store_name;
```

### Nutzeruebersicht mit Charakter-Daten

```sql
SELECT
    u.user_id,
    u.app_data->'character'->0->>'name' as char_name,
    u.app_data->'character'->0->>'level' as char_level,
    jsonb_array_length(COALESCE(u.app_data->'vibe_state'->0->'sessions', '[]'::jsonb)) as session_count,
    u.app_data->'settings'->0->>'goal' as training_goal,
    u.app_data->'settings'->0->>'language' as language,
    u.updated_at
FROM user_data u
WHERE u.is_deleted = false OR u.is_deleted IS NULL
ORDER BY u.updated_at DESC;
```

### Datengroesse pro Nutzer

```sql
SELECT
    user_id,
    pg_size_pretty(length(app_data::text)::bigint) as app_data_size,
    reset_count,
    is_deleted,
    created_at,
    updated_at
FROM user_data
ORDER BY updated_at DESC;
```

## Schritt 6: Spezielle Analysen

### Trainingsziel-Verteilung

```sql
SELECT
    u.app_data->'settings'->0->>'goal' as goal,
    COUNT(*) as count
FROM user_data u
GROUP BY u.app_data->'settings'->0->>'goal'
ORDER BY count DESC;
```

### Level-Verteilung

```sql
SELECT
    u.app_data->'character'->0->>'level' as level,
    COUNT(*) as count
FROM user_data u
WHERE u.is_deleted = false OR u.is_deleted IS NULL
GROUP BY u.app_data->'character'->0->>'level'
ORDER BY (u.app_data->'character'->0->>'level')::int;
```

### Schwierigkeitsgrad-Verteilung

```sql
SELECT
    u.app_data->'settings'->0->>'difficulty' as difficulty,
    COUNT(*) as count
FROM user_data u
GROUP BY u.app_data->'settings'->0->>'difficulty'
ORDER BY count DESC;
```

### Fokus-Session-Statistiken

```sql
SELECT
    SUM(jsonb_array_length(COALESCE(u.app_data->'vibe_state'->0->'sessions', '[]'::jsonb))) as total_focus_sessions,
    AVG(jsonb_array_length(COALESCE(u.app_data->'vibe_state'->0->'sessions', '[]'::jsonb)))::numeric(10,1) as avg_sessions_per_user
FROM user_data u;
```

### Streak-Daten

```sql
SELECT
    u.app_data->'character'->0->>'name' as name,
    u.streak_data->>'streak' as streak,
    u.streak_data->>'lastDate' as last_streak_date
FROM user_data u
WHERE u.streak_data->>'streak' IS NOT NULL
    AND (u.streak_data->>'streak')::int > 0
ORDER BY (u.streak_data->>'streak')::int DESC;
```

### Aktive Nutzer (Level > 1) mit Stats

```sql
SELECT
    u.user_id,
    u.app_data->'character'->0->>'name' as name,
    u.app_data->'character'->0->>'gold' as gold,
    u.app_data->'character'->0->>'mana' as mana,
    u.app_data->'character'->0->'stats'->>'kraft' as kraft,
    u.app_data->'character'->0->'stats'->>'ausdauer' as ausdauer,
    u.app_data->'character'->0->'stats'->>'durchhaltevermoegen' as durchhalte
FROM user_data u
WHERE (u.app_data->'character'->0->>'level')::int > 1
ORDER BY (u.app_data->'character'->0->>'level')::int DESC;
```

## Wichtige Hinweise

### Datenstruktur verstehen

- **Lokale DB**: IndexedDB (`VibeCodenDB`, Version 35) mit 20+ Object Stores
- **Cloud DB**: Supabase hat nur **1 Tabelle** (`user_data`) - der gesamte App-State wird als JSONB in `app_data` gespeichert
- **app_data** ist ein Objekt mit Array-Werten: Jeder Key (= IndexedDB Store-Name) enthaelt ein Array von Records
- **Zugriffspfad**: `app_data->'storeName'->0->>'fieldName'` (meist Index 0 fuer Einzel-Records wie character/settings)

### Bekannte Stores in app_data

| Store | Inhalt |
|-------|--------|
| character | Charakterdaten (Name, Level, Stats, Gold, Mana, Inventory, Equipment) |
| settings | Nutzereinstellungen (goal, difficulty, language, weightTrackingEnabled) |
| vibe_state | Fokus-Sessions (sessions-Array mit date, duration, label) |
| daily_quests | Taegliche Quests |
| exercises | Freies Training Uebungspool |
| shop | Shop-Items |
| training_plan_state | Trainingsplan-Phasenstatus |
| training_activity_log | Trainingsaktivitaeten |
| weight_entries | Gewichtseintraege |
| dungeon_progress | Dungeon-Fortschritt |
| player_snapshots | Woechentliche Charakter-Snapshots |
| shop_history | Kauf-Historie |
| streak_data | Streak-Informationen |

### JSONB-Typ-Fallen

- Stats koennen Float-Werte enthalten (z.B. `kraft = 69.5`), daher **NICHT** nach `::int` casten ohne Fehlerbehandlung
- `inventory` ist ein Array, `equipment` ist ein Object - `jsonb_array_length` funktioniert nur bei Arrays
- `COALESCE(..., '[]'::jsonb)` verwenden, wenn ein Store oder Key fehlen kann
- Bei Verbindungs-Timeouts: Query einfach nochmal versuchen

### Daten loeschen

```sql
-- user_data Zeile loeschen
DELETE FROM user_data WHERE user_id = '<USER_ID>';

-- Zugehoerigen Auth-User loeschen
DELETE FROM auth.users WHERE id = '<USER_ID>';
```

**IMMER BEIDE** loeschen (user_data + auth.users), um keine Leichen zu hinterlassen.

### CLI Query Syntax

Alle Queries werden mit `--linked` Flag ausgefuehrt:

```bash
npx supabase db query "<SQL>" --linked
```

Bei Timeouts oder 503-Fehlern: Query einfach nochmal versuchen.
