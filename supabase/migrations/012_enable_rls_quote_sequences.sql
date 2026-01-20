-- ===========================================
-- Migration 012: Activer RLS sur quote_number_sequences
-- ===========================================
-- Cette migration active Row Level Security sur la table quote_number_sequences
-- pour corriger l'avertissement de sécurité Supabase

-- Activer RLS sur la table
ALTER TABLE public.quote_number_sequences ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés (lecture seule)
-- Cette table est utilisée en interne par le trigger, pas directement par les utilisateurs
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les séquences"
  ON public.quote_number_sequences
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour le service role (accès complet)
-- Le trigger s'exécute avec les permissions du créateur, donc il a accès
-- Pas besoin de politique INSERT/UPDATE car le trigger fonctionne avec SECURITY DEFINER implicitement

-- Alternative: Si le trigger ne fonctionne pas, on peut ajouter une politique INSERT/UPDATE
-- pour les utilisateurs authentifiés (le trigger s'exécute dans leur contexte)
CREATE POLICY "Les utilisateurs authentifiés peuvent incrémenter les séquences"
  ON public.quote_number_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent mettre à jour les séquences"
  ON public.quote_number_sequences
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commentaire
COMMENT ON TABLE public.quote_number_sequences IS
'Table de séquences pour générer des numéros de devis uniques par année. RLS activé.';
