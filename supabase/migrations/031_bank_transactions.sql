-- =============================================
-- 031: Transactions bancaires + rapprochement
-- =============================================

CREATE TABLE bank_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference TEXT,
  bank_name TEXT,
  import_batch TEXT NOT NULL,
  -- Rapprochement
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  reconciled_at TIMESTAMPTZ,
  reconciled_method TEXT,
  -- Anti-doublon
  raw_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bank_tx_user ON bank_transactions(user_id, transaction_date DESC);
CREATE UNIQUE INDEX idx_bank_tx_hash ON bank_transactions(user_id, raw_hash);

-- RLS
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON bank_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON bank_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON bank_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON bank_transactions FOR DELETE USING (auth.uid() = user_id);
