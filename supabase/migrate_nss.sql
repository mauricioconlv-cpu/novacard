-- Migrating NSS to Company Name
-- Run this in Supabase SQL Editor

ALTER TABLE public.users 
RENAME COLUMN nss TO company_name;
