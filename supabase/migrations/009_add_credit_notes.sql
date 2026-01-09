-- Migration: Add credit notes (avoirs) table
-- Description: Table pour gérer les avoirs (notes de crédit pour annulation de factures)

-- Ajout du champ sent_at à quotes s'il n'existe pas
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Mise à jour des statuts de devis pour inclure "refused"
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status IN ('draft', 'sent', 'signed', 'refused', 'deposit_paid', 'completed', 'canceled'));

-- Mise à jour des statuts de factures pour inclure "finalized"
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check
  CHECK (payment_status IN ('draft', 'sent', 'finalized', 'paid', 'partial', 'overdue', 'canceled'));

-- Table credit_notes (avoirs)
CREATE TABLE IF NOT EXISTS credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- Lien vers la facture d'origine
  credit_note_number TEXT NOT NULL, -- Numéro d'avoir (AV-2026-001)
  
  -- Informations client (dénormalisées pour historique)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_siret TEXT,
  
  -- Montants (négatifs)
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'finalized')),
  
  -- Dates
  issue_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  
  -- Notes
  reason TEXT, -- Raison de l'avoir
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table credit_note_items (lignes d'avoir)
CREATE TABLE IF NOT EXISTS credit_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Sera négatif
  total DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Sera négatif
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_credit_notes_user_id ON credit_notes(user_id);
CREATE INDEX idx_credit_notes_client_id ON credit_notes(client_id);
CREATE INDEX idx_credit_notes_invoice_id ON credit_notes(invoice_id);
CREATE INDEX idx_credit_notes_status ON credit_notes(status);
CREATE INDEX idx_credit_notes_issue_date ON credit_notes(issue_date);
CREATE INDEX idx_credit_notes_credit_note_number ON credit_notes(credit_note_number);

CREATE INDEX idx_credit_note_items_credit_note_id ON credit_note_items(credit_note_id);

-- Trigger pour updated_at
CREATE TRIGGER update_credit_notes_updated_at
  BEFORE UPDATE ON credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer automatiquement le numéro d'avoir
CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  next_num INTEGER;
  new_number TEXT;
BEGIN
  -- Extraire l'année de la date d'émission
  year := EXTRACT(YEAR FROM NEW.issue_date)::TEXT;
  
  -- Trouver le prochain numéro pour cette année
  SELECT COALESCE(MAX(
    CASE 
      WHEN credit_note_number LIKE 'AV-' || year || '-%' 
      THEN CAST(SUBSTRING(credit_note_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 
  INTO next_num
  FROM credit_notes
  WHERE user_id = NEW.user_id;
  
  -- Générer le nouveau numéro (AV-2026-001)
  new_number := 'AV-' || year || '-' || LPAD(next_num::TEXT, 3, '0');
  
  -- Assigner si pas déjà défini
  IF NEW.credit_note_number IS NULL OR NEW.credit_note_number = '' THEN
    NEW.credit_note_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_credit_note_number_trigger
  BEFORE INSERT ON credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION generate_credit_note_number();

-- Row Level Security
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour credit_notes
CREATE POLICY credit_notes_select_own
  ON credit_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY credit_notes_insert_own
  ON credit_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY credit_notes_update_own
  ON credit_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY credit_notes_delete_own
  ON credit_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour credit_note_items
CREATE POLICY credit_note_items_select_own
  ON credit_note_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credit_notes
      WHERE credit_notes.id = credit_note_items.credit_note_id
      AND credit_notes.user_id = auth.uid()
    )
  );

CREATE POLICY credit_note_items_insert_own
  ON credit_note_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM credit_notes
      WHERE credit_notes.id = credit_note_items.credit_note_id
      AND credit_notes.user_id = auth.uid()
    )
  );

CREATE POLICY credit_note_items_update_own
  ON credit_note_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM credit_notes
      WHERE credit_notes.id = credit_note_items.credit_note_id
      AND credit_notes.user_id = auth.uid()
    )
  );

CREATE POLICY credit_note_items_delete_own
  ON credit_note_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM credit_notes
      WHERE credit_notes.id = credit_note_items.credit_note_id
      AND credit_notes.user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE credit_notes IS 'Avoirs (notes de crédit) pour annulation/correction de factures';
COMMENT ON TABLE credit_note_items IS 'Lignes des avoirs';
COMMENT ON COLUMN credit_notes.invoice_id IS 'Référence optionnelle à la facture d''origine';
COMMENT ON COLUMN credit_notes.credit_note_number IS 'Numéro unique d''avoir généré automatiquement (AV-2026-001)';
COMMENT ON COLUMN credit_notes.status IS 'Statut: draft, sent, finalized';
COMMENT ON COLUMN credit_notes.reason IS 'Raison de l''émission de l''avoir';
