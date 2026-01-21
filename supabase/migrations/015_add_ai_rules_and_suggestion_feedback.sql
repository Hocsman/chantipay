-- =====================================================
-- Migration: Regles IA dynamiques + feedback suggestions
-- Description: Stocke les normes metier et l'acceptation des suggestions
-- =====================================================

-- Table des regles metier (normes, obligations)
CREATE TABLE IF NOT EXISTS public.ai_compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  reason TEXT,
  reference TEXT,
  category VARCHAR(20) NOT NULL DEFAULT 'obligatoire',
  priority VARCHAR(10) NOT NULL DEFAULT 'high',
  estimated_price_ht NUMERIC(10, 2) NOT NULL DEFAULT 60,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_compliance_rules_trade ON public.ai_compliance_rules(trade);
CREATE INDEX IF NOT EXISTS idx_ai_compliance_rules_active ON public.ai_compliance_rules(active);

ALTER TABLE public.ai_compliance_rules ENABLE ROW LEVEL SECURITY;

-- Lecture ouverte (pour permettre l'IA meme en mode anonyme)
CREATE POLICY "AI compliance rules are readable"
  ON public.ai_compliance_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Table de feedback/acceptation des suggestions
CREATE TABLE IF NOT EXISTS public.ai_suggestion_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id TEXT NOT NULL,
  trade VARCHAR(50),
  description TEXT,
  category VARCHAR(20),
  estimated_price_ht NUMERIC(10, 2),
  vat_rate NUMERIC(5, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestion_acceptances_user ON public.ai_suggestion_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestion_acceptances_trade ON public.ai_suggestion_acceptances(trade);
CREATE INDEX IF NOT EXISTS idx_ai_suggestion_acceptances_created ON public.ai_suggestion_acceptances(accepted_at DESC);

ALTER TABLE public.ai_suggestion_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own suggestion acceptances"
  ON public.ai_suggestion_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own suggestion acceptances"
  ON public.ai_suggestion_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Donnees initiales (exemples de normes)
INSERT INTO public.ai_compliance_rules (trade, title, reason, reference, category, priority, estimated_price_ht, vat_rate)
VALUES
  ('electricite', 'Protection differentielle 30mA type A', 'Securite electrique obligatoire', 'NF C 15-100', 'obligatoire', 'high', 85, 10),
  ('electricite', 'Verification mise a la terre', 'Indispensable pour la securite des personnes', 'NF C 15-100', 'recommande', 'high', 150, 10),
  ('electricite', 'Detecteur de fumee (DAAF)', 'Obligatoire dans tous les logements depuis 2015', 'Decret 2011-36', 'obligatoire', 'high', 25, 10),
  ('plomberie', 'Groupe de securite neuf', 'Obligatoire sur ballon d''eau chaude', 'DTU 60.1', 'recommande', 'high', 45, 10),
  ('plomberie', 'Essais d''etancheite', 'Controle des installations apres intervention', 'DTU 60.1', 'recommande', 'medium', 60, 10),
  ('menuiserie', 'Verification conformite DTU menuiseries', 'Controle pose et etancheite', 'DTU 36.5', 'recommande', 'medium', 70, 10),
  ('peinture', 'Controle preparation support', 'Assure durabilite du revetement', 'DTU 59.1', 'recommande', 'medium', 50, 10)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.ai_compliance_rules IS 'Regles et normes metier utilisees par l''IA';
COMMENT ON TABLE public.ai_suggestion_acceptances IS 'Historique des suggestions acceptees pour personnalisation';
