-- =============================================
-- Migration 025: Ajout horaire et assignation aux tâches
-- =============================================
-- Ajoute les colonnes scheduled_time et assigned_to
-- pour planifier les tâches et les attribuer à un technicien

-- Horaire de la tâche (ex: "09:00", "14:30")
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT NULL;

-- Technicien assigné
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID DEFAULT NULL REFERENCES technicians(id) ON DELETE SET NULL;

-- Index pour les requêtes par technicien
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
