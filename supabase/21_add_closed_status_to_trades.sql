-- Migration: Add 'closed' status to trades table
-- This allows trades to be marked as 'closed' when they are completed

-- Drop the existing CHECK constraint
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_status_check;

-- Add the new CHECK constraint with 'closed' included
ALTER TABLE public.trades ADD CONSTRAINT trades_status_check 
  CHECK (status IN ('open', 'win', 'loss', 'tie', 'closed'));

