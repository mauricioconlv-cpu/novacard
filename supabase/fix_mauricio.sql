-- Run this in your Supabase SQL Editor to manually sync the auth.users to public.users for any missing records
INSERT INTO public.users (id, email, full_name, role, onboarding_completed)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    'admin', -- Force your role to admin directly
    true     -- Force onboarding to true just in case
FROM auth.users
WHERE email = 'mauriciolvargas@outlook.com'
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin', 
    onboarding_completed = EXCLUDED.onboarding_completed;
