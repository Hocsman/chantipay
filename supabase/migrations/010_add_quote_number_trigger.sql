-- ===========================================
-- Migration 010: Trigger automatique pour quote_number
-- ===========================================
-- Cette migration ajoute un trigger qui génère automatiquement
-- le quote_number lors de l'insertion d'un devis, évitant les race conditions

-- Fonction pour générer le numéro de devis
CREATE OR REPLACE FUNCTION public.generate_quote_number_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
  v_max_attempts INTEGER := 10;
  v_attempt INTEGER := 0;
BEGIN
  -- Si le quote_number est déjà fourni, le garder
  IF NEW.quote_number IS NOT NULL AND NEW.quote_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Boucle pour gérer les collisions potentielles
  WHILE v_attempt < v_max_attempts LOOP
    -- Compter les devis existants de cette année
    SELECT COUNT(*) + 1 INTO v_count
    FROM public.quotes
    WHERE quote_number LIKE 'DEV-' || v_year || '-%';
    
    -- Format: DEV-2025-00001
    v_number := 'DEV-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    
    -- Vérifier que ce numéro n'existe pas déjà
    PERFORM 1 FROM public.quotes WHERE quote_number = v_number;
    
    -- Si le numéro n'existe pas, l'utiliser
    IF NOT FOUND THEN
      NEW.quote_number := v_number;
      RETURN NEW;
    END IF;
    
    -- Sinon, réessayer
    v_attempt := v_attempt + 1;
  END LOOP;
  
  -- Fallback avec timestamp si échec après max_attempts
  v_number := 'DEV-' || v_year || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 5, '0');
  NEW.quote_number := v_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger BEFORE INSERT
DROP TRIGGER IF EXISTS set_quote_number_trigger ON public.quotes;
CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number_trigger();

-- Commentaire
COMMENT ON FUNCTION public.generate_quote_number_trigger() IS 
'Génère automatiquement un numéro de devis unique au format DEV-YYYY-XXXXX lors de l''insertion';
