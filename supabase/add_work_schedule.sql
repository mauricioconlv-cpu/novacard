-- Alter users table to add work_schedule
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS work_schedule TEXT DEFAULT '8h';

-- Optional: Add a check constraint to ensure only valid schedules are entered
-- ALTER TABLE public.users 
-- ADD CONSTRAINT valid_work_schedule CHECK (work_schedule IN ('8h', '9h', '10h', '12h', '24x24', '48h'));

-- Update handle_new_user trigger function to include default schedule
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, work_schedule)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE(new.raw_user_meta_data->>'work_schedule', '8h')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
