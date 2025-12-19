-- Migration: Add subscription fields to profiles table
-- These columns track Stripe subscription details for SaaS billing

-- Add subscription ID column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

-- Add subscription plan column (solo, team)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NULL;

-- Add current period end column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NULL;

-- Ensure subscription_status has default value 'trial'
-- (This column likely already exists, but we ensure it has the right default)
ALTER TABLE profiles
ALTER COLUMN subscription_status SET DEFAULT 'trial';

-- Add comments for documentation
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID for SaaS billing';
COMMENT ON COLUMN profiles.subscription_plan IS 'Current subscription plan: solo, team';
COMMENT ON COLUMN profiles.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: trial, active, past_due, canceled';
