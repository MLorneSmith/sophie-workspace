CREATE TABLE IF NOT EXISTS public.onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Profile data
  full_name TEXT,
  first_name TEXT, -- Parsed from full_name
  last_name TEXT,  -- Parsed from full_name

  -- Goals data
  primary_goal TEXT CHECK (primary_goal IN ('work', 'personal', 'school')),
  secondary_goals JSONB, -- Store the boolean values for learn, automate, feedback

  -- Conditional goal details
  work_role TEXT,
  work_industry TEXT,
  personal_project TEXT,
  school_level TEXT,
  school_major TEXT,

  -- Theme preference
  theme_preference TEXT CHECK (theme_preference IN ('dark', 'light')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_onboarding
  ON public.onboarding
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY insert_onboarding
  ON public.onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY update_onboarding
  ON public.onboarding
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
