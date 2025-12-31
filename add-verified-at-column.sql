-- Add verified_at column to verification_codes table
-- Run this in Supabase SQL Editor

ALTER TABLE public.verification_codes 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN public.verification_codes.verified_at IS 'Timestamp when the code was successfully verified';
