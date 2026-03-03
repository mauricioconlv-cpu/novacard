-- IdentityFlow Database Schema
-- Run this script in your Supabase SQL Editor to create the necessary tables and policies.

-- 1. Create Teams Table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Users Table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users & teams
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Admins can view/edit all users, employees can only view themselves
CREATE POLICY "Users can view their own profile or admins can view all" 
ON public.users FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. Create Cards Table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    design_config JSONB DEFAULT '{}'::jsonb,
    layout TEXT DEFAULT 'standard',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Card Fields Table
CREATE TABLE public.card_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- phone, email, link, pdf, social
    label TEXT,
    value TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Enable RLS on cards and fields
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_fields ENABLE ROW LEVEL SECURITY;

-- Public can view active cards, users can edit their own cards
CREATE POLICY "Cards are viewable by everyone" 
ON public.cards FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can manage their own cards" 
ON public.cards FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Card fields are viewable by everyone" 
ON public.card_fields FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.cards WHERE id = card_fields.card_id AND is_active = true));

CREATE POLICY "Users can manage their own card fields" 
ON public.card_fields FOR ALL 
USING (EXISTS (SELECT 1 FROM public.cards WHERE id = card_fields.card_id AND user_id = auth.uid()));


-- 5. Contacts Table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own contacts" 
ON public.contacts FOR ALL 
USING (auth.uid() = owner_user_id);


-- 6. Interactions Table (Analytics)
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL, -- page_view, link_click, vcard_download
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert only for public (via RPC or anon key), select only for card owner or admin
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert interaction" 
ON public.interactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view interactions for their cards" 
ON public.interactions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.cards WHERE id = interactions.card_id AND user_id = auth.uid()));


-- 7. Attendance Logs
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scan_type TEXT CHECK (scan_type IN ('check_in', 'check_out', 'scan')),
    scanned_by_ip TEXT,
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert attendance on scan" 
ON public.attendance_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Employees can view own logs, admins can view all" 
ON public.attendance_logs FOR SELECT 
USING (auth.uid() = employee_user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


-- Trigger to automatically create a user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'employee'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Storage Buckets Setup
-- 1. Create buckets
insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true);

-- 2. Storage Policies (Public read, authenticated user upload)
create policy "Public photos viewable by everyone" on storage.objects for select using ( bucket_id = 'profile-photos' );
create policy "Public logos viewable by everyone" on storage.objects for select using ( bucket_id = 'logos' );
create policy "Public attachments viewable by everyone" on storage.objects for select using ( bucket_id = 'attachments' );

create policy "Users can upload their own photos" on storage.objects for insert with check ( bucket_id = 'profile-photos' and auth.uid() = owner );
create policy "Users can upload their own logos" on storage.objects for insert with check ( bucket_id = 'logos' and auth.uid() = owner );
create policy "Users can upload their own attachments" on storage.objects for insert with check ( bucket_id = 'attachments' and auth.uid() = owner );
