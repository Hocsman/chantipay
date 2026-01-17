-- ===========================================
-- Migration 011: Correction race condition quote_number
-- ===========================================
-- Cette migration corrige le problème de duplication de numéro de devis
-- en utilisant une table de séquence avec verrouillage

-- Table pour stocker les compteurs par année
CREATE TABLE IF NOT EXISTS public.quote_number_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Fonction améliorée pour générer le numéro de devis
CREATE OR REPLACE FUNCTION public.generate_quote_number_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_quote_number TEXT;
BEGIN
  -- Si le quote_number est déjà fourni, le garder
  IF NEW.quote_number IS NOT NULL AND NEW.quote_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Insérer ou mettre à jour le compteur avec verrouillage
  -- Cette requête est atomique et évite les race conditions
  INSERT INTO public.quote_number_sequences (year, last_number)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET last_number = public.quote_number_sequences.last_number + 1
  RETURNING last_number INTO v_next_number;

  -- Format: DEV-2025-00001
  v_quote_number := 'DEV-' || v_year::TEXT || '-' || LPAD(v_next_number::TEXT, 5, '0');

  NEW.quote_number := v_quote_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS set_quote_number_trigger ON public.quotes;
CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number_trigger();

-- Initialiser le compteur avec le nombre de devis existants
INSERT INTO public.quote_number_sequences (year, last_number)
SELECT
  EXTRACT(YEAR FROM created_at)::INTEGER as year,
  COUNT(*) as last_number
FROM public.quotes
WHERE quote_number IS NOT NULL
GROUP BY EXTRACT(YEAR FROM created_at)::INTEGER
ON CONFLICT (year) DO UPDATE
SET last_number = GREATEST(
  public.quote_number_sequences.last_number,
  EXCLUDED.last_number
);

-- Ajouter aussi un index unique pour garantir l'unicité (si pas déjà présent)
-- L'erreur mentionne quotes_quote_number_key, donc l'index existe déjà

-- Commentaire
COMMENT ON TABLE public.quote_number_sequences IS
'Table de séquences pour générer des numéros de devis uniques par année';

COMMENT ON FUNCTION public.generate_quote_number_trigger() IS
'Génère automatiquement un numéro de devis unique au format DEV-YYYY-XXXXX avec verrouillage atomique';
