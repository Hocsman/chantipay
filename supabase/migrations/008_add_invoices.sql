-- Migration: Add invoices table
-- Description: Table pour gérer les factures (conversion des devis acceptés)

-- Table invoices (factures)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL, -- Lien optionnel vers le devis d'origine
  invoice_number TEXT NOT NULL, -- Numéro de facture (FAC-2026-001)
  
  -- Informations client (dénormalisées pour historique)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_siret TEXT,
  
  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.0, -- TVA en %
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Paiement
  payment_status TEXT NOT NULL DEFAULT 'draft' CHECK (payment_status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'canceled')),
  payment_method TEXT, -- Virement, Chèque, Espèces, CB, etc.
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  due_date DATE, -- Date limite de paiement
  
  -- Dates importantes
  issue_date DATE NOT NULL, -- Date d'émission
  sent_at TIMESTAMPTZ, -- Date d'envoi au client
  
  -- Notes et conditions
  notes TEXT,
  payment_terms TEXT, -- Conditions de paiement (ex: "Paiement à 30 jours")
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table invoice_items (lignes de facture)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Trigger pour updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour auto-remplir paid_at quand payment_status devient 'paid'
CREATE OR REPLACE FUNCTION set_invoice_paid_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    NEW.paid_at = now();
  ELSIF NEW.payment_status != 'paid' THEN
    NEW.paid_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_set_paid_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_paid_at();

-- Fonction pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
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
      WHEN invoice_number LIKE 'FAC-' || year || '-%' 
      THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 
  INTO next_num
  FROM invoices
  WHERE user_id = NEW.user_id;
  
  -- Générer le nouveau numéro (FAC-2026-001)
  new_number := 'FAC-' || year || '-' || LPAD(next_num::TEXT, 3, '0');
  
  -- Assigner si pas déjà défini
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour invoices
CREATE POLICY invoices_select_own
  ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY invoices_insert_own
  ON invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY invoices_update_own
  ON invoices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY invoices_delete_own
  ON invoices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour invoice_items
CREATE POLICY invoice_items_select_own
  ON invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_insert_own
  ON invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_update_own
  ON invoice_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_delete_own
  ON invoice_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Commentaires sur les tables
COMMENT ON TABLE invoices IS 'Factures émises aux clients';
COMMENT ON TABLE invoice_items IS 'Lignes de facturation';
COMMENT ON COLUMN invoices.quote_id IS 'Référence optionnelle au devis d''origine';
COMMENT ON COLUMN invoices.invoice_number IS 'Numéro unique de facture généré automatiquement (FAC-2026-001)';
COMMENT ON COLUMN invoices.payment_status IS 'Statut de paiement: draft, sent, paid, partial, overdue, canceled';
COMMENT ON COLUMN invoices.paid_amount IS 'Montant déjà payé (pour les paiements partiels)';
