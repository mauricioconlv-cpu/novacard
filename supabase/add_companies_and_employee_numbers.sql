-- 1. Alter users table first to avoid circular reference on creation
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS employee_number TEXT;

-- Update existing admins to have employee number 0001
UPDATE public.users SET employee_number = '0001' WHERE role = 'admin' AND employee_number IS NULL;

-- 2. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add the foreign key constraint to users
ALTER TABLE public.users
ADD CONSTRAINT fk_company
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE SET NULL;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage their companies" ON public.companies FOR ALL USING (auth.uid() = admin_id);
CREATE POLICY "Employees can view their company" ON public.companies FOR SELECT USING (
    id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) OR auth.uid() = admin_id
);

-- 3. Update trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_employee_number TEXT;
    max_num INTEGER;
    passed_role TEXT;
    passed_admin_id UUID;
    passed_company_id UUID;
BEGIN
    passed_role := COALESCE(new.raw_user_meta_data->>'role', 'employee');

    IF new.raw_user_meta_data->>'admin_id' IS NOT NULL THEN
        passed_admin_id := (new.raw_user_meta_data->>'admin_id')::UUID;
    END IF;

    IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
        passed_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
    END IF;

    IF passed_role = 'admin' THEN
        new_employee_number := '0001';
    ELSE
        -- Automatically generate the next employee number for this admin
        IF passed_admin_id IS NOT NULL THEN
            SELECT COALESCE(MAX(NULLIF(regexp_replace(employee_number, '\D', '', 'g'), '')::INTEGER), 1)
            INTO max_num
            FROM public.users
            WHERE id = passed_admin_id OR admin_id = passed_admin_id;

            new_employee_number := LPAD((max_num + 1)::TEXT, 4, '0');
        END IF;
    END IF;

    INSERT INTO public.users (id, email, full_name, role, admin_id, company_id, employee_number)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        passed_role,
        passed_admin_id,
        passed_company_id,
        new_employee_number
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
