-- Migration: Add 'dexchange' to payment_method CHECK constraints
-- Run this in the Supabase SQL editor before using the Dexchange integration.

-- Update subscriptions table constraint
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_method_check
  CHECK (payment_method IN ('om', 'wave', 'card', 'mock', 'dexchange'));

-- Update payments table constraint
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('om', 'wave', 'card', 'mock', 'dexchange'));
