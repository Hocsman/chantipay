-- =====================================================
-- Migration: Historique des générations IA
-- Description: Table pour stocker l'historique des devis générés par IA
-- =====================================================

-- Table principale pour l'historique IA
CREATE TABLE IF NOT EXISTS public.ai_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contexte de la génération
  description TEXT NOT NULL,
  trade VARCHAR(50),
  vat_rate NUMERIC(5, 2),
  agent VARCHAR(50),
  
  -- Résultat de la génération (items du devis)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Statistiques optionnelles
  items_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(items)) STORED,
  total_ht NUMERIC(10, 2)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_ai_history_user_id ON public.ai_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_created_at ON public.ai_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_history_user_created ON public.ai_history(user_id, created_at DESC);

-- Activer RLS
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne peuvent voir que leur propre historique
CREATE POLICY "Users can view their own AI history"
  ON public.ai_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leur propre historique
CREATE POLICY "Users can create their own AI history"
  ON public.ai_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leur propre historique
CREATE POLICY "Users can delete their own AI history"
  ON public.ai_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour nettoyer automatiquement l'ancien historique (garder les 50 dernières entrées par utilisateur)
CREATE OR REPLACE FUNCTION cleanup_old_ai_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les entrées au-delà des 50 plus récentes pour cet utilisateur
  DELETE FROM public.ai_history
  WHERE id IN (
    SELECT id FROM public.ai_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nettoyer après chaque insertion
DROP TRIGGER IF EXISTS trigger_cleanup_ai_history ON public.ai_history;
CREATE TRIGGER trigger_cleanup_ai_history
  AFTER INSERT ON public.ai_history
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_ai_history();

-- Commentaires
COMMENT ON TABLE public.ai_history IS 'Historique des générations de devis par IA';
COMMENT ON COLUMN public.ai_history.description IS 'Description du travail envoyée à l''IA';
COMMENT ON COLUMN public.ai_history.trade IS 'Métier sélectionné (plomberie, electricite, etc.)';
COMMENT ON COLUMN public.ai_history.agent IS 'Type d''agent IA utilisé';
COMMENT ON COLUMN public.ai_history.items IS 'Lignes du devis générées (JSON array)';
COMMENT ON COLUMN public.ai_history.total_ht IS 'Total HT calculé des items';
