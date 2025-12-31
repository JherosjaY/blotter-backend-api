-- Add email column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add unique constraint on email
ALTER TABLE public.users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
