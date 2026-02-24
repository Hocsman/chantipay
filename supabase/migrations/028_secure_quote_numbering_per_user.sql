-- =====================================================
-- Migration 028: Secure quote numbering per user
-- Description: Atomic chronological quote numbering per user/year
-- =====================================================

-- 1) New sequence table scoped by user + year
CREATE TABLE IF NOT EXISTS public.quote_number_sequences_by_user (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, year),
  CHECK (last_number >= 0)
);

DROP TRIGGER IF EXISTS update_quote_number_sequences_by_user_updated_at ON public.quote_number_sequences_by_user;
CREATE TRIGGER update_quote_number_sequences_by_user_updated_at
  BEFORE UPDATE ON public.quote_number_sequences_by_user
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Backfill counters from existing quotes
WITH existing_quotes AS (
  SELECT
    q.user_id,
    COALESCE(
      NULLIF(SUBSTRING(q.quote_number FROM '^DEV-([0-9]{4})-'), '')::INTEGER,
      EXTRACT(YEAR FROM q.created_at)::INTEGER
    ) AS year,
    q.quote_number
  FROM public.quotes q
  WHERE q.user_id IS NOT NULL
)
INSERT INTO public.quote_number_sequences_by_user (user_id, year, last_number)
SELECT
  e.user_id,
  e.year,
  COALESCE(
    MAX(
      CASE
        WHEN e.quote_number ~ ('^DEV-' || e.year::TEXT || '-[0-9]+$')
          THEN CAST(SUBSTRING(e.quote_number FROM '([0-9]+)$') AS INTEGER)
        ELSE 0
      END
    ),
    0
  ) AS last_number
FROM existing_quotes e
GROUP BY e.user_id, e.year
ON CONFLICT (user_id, year) DO UPDATE
SET last_number = GREATEST(
  public.quote_number_sequences_by_user.last_number,
  EXCLUDED.last_number
);

-- 3) Replace quote number trigger function with atomic increment per user/year
CREATE OR REPLACE FUNCTION public.generate_quote_number_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
BEGIN
  -- Keep manual quote number if explicitly provided
  IF NEW.quote_number IS NOT NULL AND NEW.quote_number <> '' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot generate quote number without user_id';
  END IF;

  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  INSERT INTO public.quote_number_sequences_by_user (user_id, year, last_number)
  VALUES (NEW.user_id, v_year, 1)
  ON CONFLICT (user_id, year) DO UPDATE
  SET last_number = public.quote_number_sequences_by_user.last_number + 1,
      updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  NEW.quote_number := 'DEV-' || v_year::TEXT || '-' || LPAD(v_next_number::TEXT, 5, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quote_number_trigger ON public.quotes;
CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number_trigger();

-- 4) Change uniqueness scope from global to per user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.quotes
    WHERE quote_number IS NOT NULL AND quote_number <> ''
    GROUP BY user_id, quote_number
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate quote numbers detected for the same user. Clean up duplicates before applying unique constraint (user_id, quote_number).';
  END IF;
END $$;

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_quote_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_user_quote_number_unique
  ON public.quotes(user_id, quote_number);

-- 5) RLS for the new sequence table
ALTER TABLE public.quote_number_sequences_by_user ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_number_sequences_by_user_select_own ON public.quote_number_sequences_by_user;
CREATE POLICY quote_number_sequences_by_user_select_own
  ON public.quote_number_sequences_by_user
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quote_number_sequences_by_user_insert_own ON public.quote_number_sequences_by_user;
CREATE POLICY quote_number_sequences_by_user_insert_own
  ON public.quote_number_sequences_by_user
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS quote_number_sequences_by_user_update_own ON public.quote_number_sequences_by_user;
CREATE POLICY quote_number_sequences_by_user_update_own
  ON public.quote_number_sequences_by_user
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.quote_number_sequences_by_user IS
'Stores quote numbering counters per user and year to guarantee chronological numbering without duplicates.';

COMMENT ON FUNCTION public.generate_quote_number_trigger() IS
'Generates quote numbers atomically per user/year (DEV-YYYY-XXXXX) to avoid race conditions.';
