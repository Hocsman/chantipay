-- =====================================================
-- Migration: Système de relance automatique des devis
-- Description: Tables pour gérer les rappels de devis non signés
-- =====================================================

-- Table pour suivre les relances envoyées
CREATE TABLE IF NOT EXISTS public.quote_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations de relance
  reminder_number INTEGER NOT NULL DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent_to TEXT NOT NULL,

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_quote_reminders_quote ON public.quote_reminders(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_reminders_user ON public.quote_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_reminders_sent ON public.quote_reminders(sent_at DESC);

-- Activer RLS
ALTER TABLE public.quote_reminders ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own reminders"
  ON public.quote_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.quote_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table pour les préférences de relance utilisateur
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Configuration des relances
  enabled BOOLEAN NOT NULL DEFAULT true,
  first_reminder_days INTEGER NOT NULL DEFAULT 3,  -- Jours après envoi
  second_reminder_days INTEGER NOT NULL DEFAULT 7, -- Jours après envoi
  third_reminder_days INTEGER NOT NULL DEFAULT 14, -- Jours après envoi
  max_reminders INTEGER NOT NULL DEFAULT 3,

  -- Personnalisation du message
  custom_message TEXT,

  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own settings"
  ON public.reminder_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON public.reminder_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.reminder_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour obtenir les devis à relancer
CREATE OR REPLACE FUNCTION get_quotes_to_remind(p_user_id UUID)
RETURNS TABLE (
  quote_id UUID,
  quote_number TEXT,
  client_name TEXT,
  client_email TEXT,
  total_ttc NUMERIC,
  sent_at TIMESTAMP WITH TIME ZONE,
  days_since_sent INTEGER,
  reminder_count INTEGER,
  next_reminder_due BOOLEAN
) AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- Récupérer les paramètres de l'utilisateur ou valeurs par défaut
  SELECT
    COALESCE(rs.enabled, true) as enabled,
    COALESCE(rs.first_reminder_days, 3) as first_days,
    COALESCE(rs.second_reminder_days, 7) as second_days,
    COALESCE(rs.third_reminder_days, 14) as third_days,
    COALESCE(rs.max_reminders, 3) as max_reminders
  INTO v_settings
  FROM public.reminder_settings rs
  WHERE rs.user_id = p_user_id;

  -- Utiliser les valeurs par défaut si pas de settings
  IF NOT FOUND THEN
    v_settings := ROW(true, 3, 7, 14, 3);
  END IF;

  -- Ne rien retourner si les relances sont désactivées
  IF NOT v_settings.enabled THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    q.id as quote_id,
    q.quote_number,
    q.client_name,
    q.client_email,
    q.total_ttc,
    q.sent_at,
    EXTRACT(DAY FROM NOW() - q.sent_at)::INTEGER as days_since_sent,
    COALESCE(r.count, 0)::INTEGER as reminder_count,
    CASE
      WHEN COALESCE(r.count, 0) = 0 AND EXTRACT(DAY FROM NOW() - q.sent_at) >= v_settings.first_days THEN true
      WHEN COALESCE(r.count, 0) = 1 AND EXTRACT(DAY FROM NOW() - q.sent_at) >= v_settings.second_days THEN true
      WHEN COALESCE(r.count, 0) = 2 AND EXTRACT(DAY FROM NOW() - q.sent_at) >= v_settings.third_days THEN true
      ELSE false
    END as next_reminder_due
  FROM public.quotes q
  LEFT JOIN (
    SELECT qr.quote_id, COUNT(*) as count
    FROM public.quote_reminders qr
    GROUP BY qr.quote_id
  ) r ON r.quote_id = q.id
  WHERE q.user_id = p_user_id
    AND q.status = 'sent'
    AND q.sent_at IS NOT NULL
    AND q.client_email IS NOT NULL
    AND COALESCE(r.count, 0) < v_settings.max_reminders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.quote_reminders IS 'Historique des relances de devis envoyées';
COMMENT ON TABLE public.reminder_settings IS 'Préférences de relance par utilisateur';
COMMENT ON FUNCTION get_quotes_to_remind IS 'Retourne les devis éligibles pour une relance';
