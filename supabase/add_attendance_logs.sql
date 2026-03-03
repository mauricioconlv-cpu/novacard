-- 1. Create attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Admins can insert attendance for their employees
CREATE POLICY "Admins can insert attendance for their employees" ON public.attendance_logs 
FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Admins can view attendance logs for their employees
CREATE POLICY "Admins can view attendance for their employees" ON public.attendance_logs 
FOR SELECT USING (auth.uid() = admin_id);

-- Employees can view their own attendance logs (optional, but good practice)
CREATE POLICY "Employees can view own attendance" ON public.attendance_logs 
FOR SELECT USING (auth.uid() = employee_id);
