-- Fixing the infinite recursion on the public.users SELECT policy

DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.users;

-- Create a secure function to check admin without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Apply the new policy
CREATE POLICY "Users can view their own profile or admins can view all" 
ON public.users FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

