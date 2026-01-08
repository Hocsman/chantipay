-- Migration: Add interventions and tasks tables
-- Description: Tables pour gérer les interventions (chantiers) et les tâches

-- Table interventions (chantiers/interventions)
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL, -- Nom du client (dénormalisé pour historique)
  type TEXT NOT NULL, -- Type d'intervention (Installation, Dépannage, Maintenance, etc.)
  description TEXT,
  address TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER, -- Durée estimée en minutes
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'canceled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_interventions_user_id ON interventions(user_id);
CREATE INDEX idx_interventions_client_id ON interventions(client_id);
CREATE INDEX idx_interventions_date ON interventions(date);
CREATE INDEX idx_interventions_status ON interventions(status);

-- Trigger pour updated_at
CREATE TRIGGER update_interventions_updated_at
  BEFORE UPDATE ON interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres interventions
CREATE POLICY interventions_select_own
  ON interventions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres interventions
CREATE POLICY interventions_insert_own
  ON interventions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres interventions
CREATE POLICY interventions_update_own
  ON interventions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres interventions
CREATE POLICY interventions_delete_own
  ON interventions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Table tasks (tâches à faire)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  related_type TEXT CHECK (related_type IN ('quote', 'client', 'intervention')), -- Type de relation
  related_id UUID, -- ID de l'entité liée (devis, client, intervention)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_related ON tasks(related_type, related_id);

-- Trigger pour updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour auto-remplir completed_at quand status devient 'done'
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_set_completed_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_completed_at();

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres tâches
CREATE POLICY tasks_select_own
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres tâches
CREATE POLICY tasks_insert_own
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres tâches
CREATE POLICY tasks_update_own
  ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres tâches
CREATE POLICY tasks_delete_own
  ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires sur les tables
COMMENT ON TABLE interventions IS 'Interventions et chantiers planifiés';
COMMENT ON TABLE tasks IS 'Tâches et actions à faire';
COMMENT ON COLUMN interventions.client_name IS 'Nom du client dénormalisé pour conserver l''historique même si le client est supprimé';
COMMENT ON COLUMN tasks.related_type IS 'Type de relation optionnelle (quote, client, intervention)';
COMMENT ON COLUMN tasks.related_id IS 'ID de l''entité liée optionnelle';
