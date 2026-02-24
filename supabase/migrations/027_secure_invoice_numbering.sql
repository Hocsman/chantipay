-- =====================================================
-- Migration 027: Secure chronological invoice numbering
-- Description: Atomic invoice numbering + uniqueness per user
-- =====================================================

-- 1) Sequence table per user/year to avoid race conditions
CREATE TABLE IF NOT EXISTS public.invoice_number_sequences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, year),
  CHECK (last_number >= 0)
);

-- Trigger for updated_at on sequence rows
DROP TRIGGER IF EXISTS update_invoice_number_sequences_updated_at ON public.invoice_number_sequences;
CREATE TRIGGER update_invoice_number_sequences_updated_at
  BEFORE UPDATE ON public.invoice_number_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Backfill counters from existing invoices (max suffix per user/year)
WITH existing_invoice_numbers AS (
  SELECT
    i.user_id,
    COALESCE(EXTRACT(YEAR FROM i.issue_date), EXTRACT(YEAR FROM i.created_at))::INTEGER AS year,
    i.invoice_number
  FROM public.invoices i
  WHERE i.user_id IS NOT NULL
)
INSERT INTO public.invoice_number_sequences (user_id, year, last_number)
SELECT
  e.user_id,
  e.year,
  COALESCE(
    MAX(
      CASE
        WHEN e.invoice_number ~ ('^FAC-' || e.year::TEXT || '-[0-9]+$')
          THEN CAST(SUBSTRING(e.invoice_number FROM '([0-9]+)$') AS INTEGER)
        ELSE 0
      END
    ),
    0
  ) AS last_number
FROM existing_invoice_numbers e
GROUP BY e.user_id, e.year
ON CONFLICT (user_id, year) DO UPDATE
SET last_number = GREATEST(
  public.invoice_number_sequences.last_number,
  EXCLUDED.last_number
);

-- 3) Replace invoice trigger function with atomic increment
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
BEGIN
  -- Keep manual number if explicitly provided
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot generate invoice number without user_id';
  END IF;

  v_year := COALESCE(EXTRACT(YEAR FROM NEW.issue_date), EXTRACT(YEAR FROM CURRENT_DATE))::INTEGER;

  INSERT INTO public.invoice_number_sequences (user_id, year, last_number)
  VALUES (NEW.user_id, v_year, 1)
  ON CONFLICT (user_id, year) DO UPDATE
  SET last_number = public.invoice_number_sequences.last_number + 1,
      updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  NEW.invoice_number := 'FAC-' || v_year::TEXT || '-' || LPAD(v_next_number::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it points to latest function definition
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON public.invoices;
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

-- 4) Enforce uniqueness per user/account (legal numbering scope)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.invoices
    WHERE invoice_number IS NOT NULL AND invoice_number <> ''
    GROUP BY user_id, invoice_number
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate invoice numbers detected for the same user. Clean up duplicates before applying unique constraint (user_id, invoice_number).';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_user_invoice_number_unique
  ON public.invoices(user_id, invoice_number);

-- 5) RLS for sequence table (trigger may run in authenticated context)
ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_number_sequences_select_own ON public.invoice_number_sequences;
CREATE POLICY invoice_number_sequences_select_own
  ON public.invoice_number_sequences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS invoice_number_sequences_insert_own ON public.invoice_number_sequences;
CREATE POLICY invoice_number_sequences_insert_own
  ON public.invoice_number_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS invoice_number_sequences_update_own ON public.invoice_number_sequences;
CREATE POLICY invoice_number_sequences_update_own
  ON public.invoice_number_sequences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.invoice_number_sequences IS
'Stores invoice numbering counters per user and year to guarantee chronological numbering without duplicates.';

COMMENT ON FUNCTION public.generate_invoice_number() IS
'Generates invoice numbers atomically per user/year (FAC-YYYY-NNN) to avoid race conditions.';
