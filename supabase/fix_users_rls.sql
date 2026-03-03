-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Since the layout needs to fetch the user role immediately on login,
-- and RLS with "auth.uid() = id" sometimes blocks if the trigger was delayed,
-- we need a simple robust policy.

-- 1. Everyone authenticated can read profiles (Needed for cards anyway!)
CREATE POLICY "Authenticated can read profiles" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 3. Users can insert their own profile (Fallback for layout.tsx rescuing)
CREATE POLICY "Users can insert own profile" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- MAKE SURE TO RELOAD SCHEMA CACHE AFTER!
NOTIFY pgrst, 'reload schema';
