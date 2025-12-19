-- Migration: Add deposit tracking columns to quotes table
-- These columns track when and how a deposit was paid (manual tracking, no Stripe)

-- Add column for when the deposit was paid
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ NULL;

-- Add column for the payment method used
-- Values: 'virement' | 'cash' | 'cheque' | 'autre'
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS deposit_method TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN quotes.deposit_paid_at IS 'Timestamp when the deposit was marked as paid';
COMMENT ON COLUMN quotes.deposit_method IS 'Payment method for deposit: virement, cash, cheque, autre';
