-- Migration: Add siret column to profiles table
-- This column stores the French business registration number (SIRET)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS siret TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.siret IS 'French business registration number (SIRET) - 14 digits';
