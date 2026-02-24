-- Migration 026: Ajout du type de client (particulier vs professionnel)
-- Permet de distinguer les personnes physiques des personnes morales

-- 1. Ajouter les colonnes à la table clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'particulier' CHECK (client_type IN ('particulier', 'professionnel'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- 2. Ajouter les colonnes dénormalisées aux factures
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_company_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_vat_number TEXT;

-- 3. Ajouter les colonnes dénormalisées aux avoirs
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS client_company_name TEXT;
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS client_vat_number TEXT;
