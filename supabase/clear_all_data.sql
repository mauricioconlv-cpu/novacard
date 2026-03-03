-- DANGER: This script will delete ALL users, their profiles, their companies, and their cards from the database.
-- Only run this if you want to completely reset the application data.

BEGIN;

-- 1. Delete all users from Supabase Auth.
-- Because of the ON DELETE CASCADE on the public.users table (which should be set up by default in the starter template), 
-- deleting from auth.users will automatically delete the corresponding rows in public.users.
-- And because companies have `admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`, 
-- deleting public.users will also delete the companies they created.
-- Similarly for cards: `user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE`
DELETE FROM auth.users;

-- If for any reason the ON DELETE CASCADE was not set up on public.users referencing auth.users,
-- the safest way to ensure nothing is left behind is to also explicitly clear the public tables.
-- (However, because of foreign keys, we need to be careful with the order if not cascading from auth).
-- In standard Supabase setups, clearing auth.users is sufficient and the cleanest approach.

-- Just to be absolutely certain the public tables are empty if cascade failed for some reason:
TRUNCATE TABLE public.card_fields CASCADE;
TRUNCATE TABLE public.cards CASCADE;
TRUNCATE TABLE public.companies CASCADE;
TRUNCATE TABLE public.users CASCADE;

COMMIT;
