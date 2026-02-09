-- Migration: Add quote/invoice relations to visit_reports
-- Description: Rattacher les rapports de visite aux devis et factures
--              + Ajouter le flag pour l'envoi par email

-- =====================================================
-- 1. AJOUTER LES COLONNES DE RELATION
-- =====================================================

-- Lien optionnel vers un devis
ALTER TABLE visit_reports ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

-- Lien optionnel vers une facture
ALTER TABLE visit_reports ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Email envoyé au client
ALTER TABLE visit_reports ADD COLUMN IF NOT EXISTS sent_to_email TEXT;
ALTER TABLE visit_reports ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- =====================================================
-- 2. INDEX POUR LES RECHERCHES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_visit_reports_quote_id ON visit_reports(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visit_reports_invoice_id ON visit_reports(invoice_id) WHERE invoice_id IS NOT NULL;

-- =====================================================
-- 3. COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN visit_reports.quote_id IS 'Devis associé au rapport de visite (optionnel)';
COMMENT ON COLUMN visit_reports.invoice_id IS 'Facture associée au rapport de visite (optionnel)';
COMMENT ON COLUMN visit_reports.sent_to_email IS 'Email du client auquel le rapport a été envoyé';
COMMENT ON COLUMN visit_reports.sent_at IS 'Date/heure de l''envoi du rapport par email';
