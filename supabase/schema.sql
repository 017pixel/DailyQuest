-- ============================================
-- DailyQuest Supabase Schema
-- ============================================
-- Fuehre dies im Supabase SQL Editor aus (New Query)

-- Tabelle fuer alle User-Daten (eine Zeile pro User)
CREATE TABLE IF NOT EXISTS user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Gesamter App-State als JSONB (flexibel, passt sich an App-Aenderungen an)
    app_data JSONB DEFAULT '{}'::jsonb,
    streak_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Reset-Tracking: Wie oft wurde ein Neuanfang gemacht?
    reset_count INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE,
    -- Vorherige Daten bei einem Reset (Snapshot vor dem Reset)
    previous_data JSONB DEFAULT '{}'::jsonb,
    -- Soft-Delete: Account wurde geloescht (Daten bleiben fuer Analytics)
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    -- Migration-Tracking: Von welchem anonymen Account wurde migriert?
    migrated_from_anon UUID,
    -- Audit-Tracking: Wann wurden Daten exportiert/importiert?
    last_exported_at TIMESTAMP WITH TIME ZONE,
    last_imported_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- RLS aktivieren (Security first!)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policy: User koennen nur ihre EIGENEN Daten sehen (nur wenn nicht geloescht)
CREATE POLICY "Users can view own data"
    ON user_data FOR SELECT
    USING (auth.uid() = user_id AND (is_deleted IS NULL OR is_deleted = false));

-- Policy: User koennen nur ihre EIGENEN Daten einfuegen
CREATE POLICY "Users can insert own data"
    ON user_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: User koennen nur ihre EIGENEN Daten updaten
CREATE POLICY "Users can update own data"
    ON user_data FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: User koennen nur ihre EIGENEN Daten loeschen
CREATE POLICY "Users can delete own data"
    ON user_data FOR DELETE
    USING (auth.uid() = user_id);

-- Index fuer schnellen Zugriff auf user_id
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- Index fuer geloeschte Accounts (Analytics)
CREATE INDEX IF NOT EXISTS idx_user_data_deleted ON user_data(is_deleted) WHERE is_deleted = true;

-- Funktion um updated_at automatisch zu aktualisieren
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger fuer automatisches updated_at
CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
