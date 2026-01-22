-- =====================================================
-- Migration: Système de relance des factures impayées
-- Description: Tables pour gérer les rappels de factures non payées
-- =====================================================

-- Table pour suivre les relances envoyées
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations de relance
  reminder_number INTEGER NOT NULL DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent_to TEXT NOT NULL,

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice ON public.invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_user ON public.invoice_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_sent ON public.invoice_reminders(sent_at DESC);

-- Activer RLS
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own invoice reminders"
  ON public.invoice_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoice reminders"
  ON public.invoice_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table pour les préférences de relance factures utilisateur
CREATE TABLE IF NOT EXISTS public.invoice_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Configuration des relances (jours après échéance)
  enabled BOOLEAN NOT NULL DEFAULT true,
  first_reminder_days INTEGER NOT NULL DEFAULT 7,   -- 7 jours après échéance
  second_reminder_days INTEGER NOT NULL DEFAULT 14, -- 14 jours après échéance
  third_reminder_days INTEGER NOT NULL DEFAULT 30,  -- 30 jours après échéance
  max_reminders INTEGER NOT NULL DEFAULT 3,

  -- Personnalisation du message
  custom_message TEXT,
  
  -- Taux de pénalités (par défaut 3x taux légal ≈ 10.57% en 2024)
  late_payment_rate DECIMAL(5,2) DEFAULT 10.57,
  recovery_fee DECIMAL(10,2) DEFAULT 40.00, -- Indemnité forfaitaire

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.invoice_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own invoice reminder settings"
  ON public.invoice_reminder_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoice reminder settings"
  ON public.invoice_reminder_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice reminder settings"
  ON public.invoice_reminder_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.invoice_reminders IS 'Historique des relances de factures envoyées';
COMMENT ON TABLE public.invoice_reminder_settings IS 'Préférences de relance factures par utilisateur';
