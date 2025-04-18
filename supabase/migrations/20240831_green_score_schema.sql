-- Create users table for storing green scores and profiles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  clerk_id TEXT,
  full_name TEXT,
  username TEXT,
  profile_url TEXT,
  green_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create route_history table for storing detailed route information
CREATE TABLE IF NOT EXISTS public.route_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_lat NUMERIC,
  start_lng NUMERIC,
  end_lat NUMERIC,
  end_lng NUMERIC,
  distance NUMERIC,
  duration TEXT,
  co2_emission NUMERIC,
  vehicle_type TEXT,
  route_type TEXT,
  green_points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all profiles"
ON public.users FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "New users can create their profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Route history policies
CREATE POLICY "Users can view all routes for leaderboard"
ON public.route_history FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert their own routes"
ON public.route_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Storage policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_green_score_idx ON public.users(green_score DESC);
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS route_history_user_id_idx ON public.route_history(user_id);
CREATE INDEX IF NOT EXISTS route_history_created_at_idx ON public.route_history(created_at DESC);