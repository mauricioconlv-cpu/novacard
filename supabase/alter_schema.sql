-- Migration script to add onboarding fields to users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS nss TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Example of JSONB structure for emergency_contact:
-- { "name": "Maria Perez", "relation": "Esposa", "phone": "555-1234" }
