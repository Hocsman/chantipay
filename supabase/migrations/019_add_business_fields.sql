-- Migration: Add business fields for profiles, quotes and invoices
-- Description: Ajouter les champs pour TVA intracommunautaire, statut auto-entrepreneur,
--              sous-traitant, et lieu d'intervention

-- =====================================================
-- 1. AJOUTER CHAMPS AU PROFIL (profiles)
-- =====================================================

-- N° TVA intracommunautaire
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- Statut fiscal
-- 'standard' = Entreprise classique avec TVA
-- 'auto_entrepreneur' = Auto-entrepreneur (TVA non applicable, art. 293B CGI)
-- 'micro_entreprise' = Micro-entreprise avec TVA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_status TEXT DEFAULT 'standard'
  CHECK (tax_status IN ('standard', 'auto_entrepreneur', 'micro_entreprise'));

-- Activité de sous-traitance (autoliquidation de TVA)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_subcontractor BOOLEAN DEFAULT FALSE;

-- RCS (Registre du Commerce et des Sociétés) - optionnel
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rcs TEXT;

-- Code APE/NAF
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ape_code TEXT;

-- Capital social (pour les sociétés)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_capital TEXT;

-- =====================================================
-- 2. AJOUTER LIEU D'INTERVENTION AUX DEVIS (quotes)
-- =====================================================

-- Adresse du lieu d'intervention (différent de l'adresse de facturation)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS work_location TEXT;

-- =====================================================
-- 3. AJOUTER LIEU D'INTERVENTION AUX FACTURES (invoices)
-- =====================================================

-- Adresse du lieu d'intervention (différent de l'adresse de facturation)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS work_location TEXT;

-- Flag pour indiquer si c'est de la sous-traitance (autoliquidation)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_subcontracting BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 4. COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN profiles.vat_number IS 'N° TVA intracommunautaire (ex: FR12345678901)';
COMMENT ON COLUMN profiles.tax_status IS 'Statut fiscal: standard, auto_entrepreneur, micro_entreprise';
COMMENT ON COLUMN profiles.is_subcontractor IS 'Si true, l''entreprise fait de la sous-traitance (autoliquidation TVA)';
COMMENT ON COLUMN profiles.rcs IS 'N° RCS (Registre du Commerce et des Sociétés)';
COMMENT ON COLUMN profiles.ape_code IS 'Code APE/NAF de l''activité';
COMMENT ON COLUMN profiles.share_capital IS 'Capital social de l''entreprise';

COMMENT ON COLUMN quotes.work_location IS 'Adresse du lieu d''intervention (si différent de l''adresse client)';
COMMENT ON COLUMN invoices.work_location IS 'Adresse du lieu d''intervention (si différent de l''adresse client)';
COMMENT ON COLUMN invoices.is_subcontracting IS 'Si true, facture en sous-traitance avec autoliquidation TVA';

-- =====================================================
-- 5. INDEX (optionnel, pour les recherches)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_tax_status ON profiles(tax_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_subcontractor ON profiles(is_subcontractor) WHERE is_subcontractor = true;
