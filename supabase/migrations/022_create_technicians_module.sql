-- Migration: Create technicians module
-- Description: Module Technicien avec profils et système de pointage (GPS + photos)

-- =====================================================
-- 1. TABLE DES TECHNICIENS
-- =====================================================

CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Informations personnelles
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,

    -- Statut
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),

    -- Spécialités (array de métiers)
    specialties TEXT[] DEFAULT '{}',

    -- Photo de profil
    avatar_url TEXT,

    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABLE DES POINTAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,

    -- Type de pointage
    entry_type TEXT NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),

    -- Horodatage
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Géolocalisation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2), -- en mètres
    location_address TEXT, -- Adresse reverse-geocodée

    -- Photo du chantier (optionnel)
    photo_url TEXT,

    -- Lien optionnel avec une tâche
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

    -- Notes
    notes TEXT,

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABLE DES SESSIONS DE TRAVAIL (calculée)
-- =====================================================

CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,

    -- Période
    date DATE NOT NULL,
    clock_in_id UUID REFERENCES time_entries(id),
    clock_out_id UUID REFERENCES time_entries(id),

    -- Durées calculées (en minutes)
    total_work_minutes INTEGER DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,

    -- Statut
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'validated')),

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON technicians(user_id);
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_technician_id ON time_entries(technician_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_timestamp ON time_entries(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_technician_id ON work_sessions(technician_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON work_sessions(date DESC);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Technicians
CREATE POLICY "Users can view own technicians"
    ON technicians FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own technicians"
    ON technicians FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own technicians"
    ON technicians FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own technicians"
    ON technicians FOR DELETE
    USING (auth.uid() = user_id);

-- Time Entries
CREATE POLICY "Users can view own time_entries"
    ON time_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time_entries"
    ON time_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time_entries"
    ON time_entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time_entries"
    ON time_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Work Sessions
CREATE POLICY "Users can view own work_sessions"
    ON work_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own work_sessions"
    ON work_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work_sessions"
    ON work_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_technicians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_technicians_updated_at
    BEFORE UPDATE ON technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_technicians_updated_at();

CREATE TRIGGER trigger_work_sessions_updated_at
    BEFORE UPDATE ON work_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_technicians_updated_at();

-- =====================================================
-- 7. STORAGE BUCKET (pour photos de pointage)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('time-entries', 'time-entries', false)
ON CONFLICT (id) DO NOTHING;

-- Policy pour le bucket
CREATE POLICY "Users can upload time entry photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'time-entries' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own time entry photos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'time-entries' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own time entry photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'time-entries' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- 8. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE technicians IS 'Profils des techniciens de l''entreprise';
COMMENT ON COLUMN technicians.specialties IS 'Liste des spécialités (plomberie, electricite, etc.)';

COMMENT ON TABLE time_entries IS 'Pointages avec géolocalisation et photos';
COMMENT ON COLUMN time_entries.entry_type IS 'clock_in, clock_out, break_start, break_end';
COMMENT ON COLUMN time_entries.latitude IS 'Latitude GPS du pointage';
COMMENT ON COLUMN time_entries.longitude IS 'Longitude GPS du pointage';

COMMENT ON TABLE work_sessions IS 'Sessions de travail journalières calculées';
