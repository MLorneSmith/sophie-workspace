-- Create survey_responses table in public schema
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id TEXT NOT NULL,
  responses JSONB DEFAULT '[]'::jsonb, -- Store actual responses here
  category_scores JSONB DEFAULT '{}'::jsonb, -- Store category scores
  highest_scoring_category TEXT,
  lowest_scoring_category TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, survey_id)
);

-- Row Level Security
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Users can see only their own responses
CREATE POLICY "Users can view their own responses"
  ON public.survey_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own responses
CREATE POLICY "Users can create their own responses"
  ON public.survey_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update their own responses"
  ON public.survey_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a function to check if a user is a super admin
-- This function has elevated privileges to access auth.users
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid() AND is_super_admin = true
  );
$$;

-- Admin users can access all responses
CREATE POLICY "Admin users can access all responses"
  ON public.survey_responses
  FOR ALL
  USING (public.is_super_admin());

-- Create survey_progress table in public schema
CREATE TABLE IF NOT EXISTS public.survey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id TEXT NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  progress_percentage NUMERIC DEFAULT 0,
  last_answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, survey_id)
);

-- Row Level Security
ALTER TABLE public.survey_progress ENABLE ROW LEVEL SECURITY;

-- Users can see only their own progress
CREATE POLICY "Users can view their own progress"
  ON public.survey_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own progress
CREATE POLICY "Users can create their own progress"
  ON public.survey_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
  ON public.survey_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin users can access all progress
CREATE POLICY "Admin users can access all progress"
  ON public.survey_progress
  FOR ALL
  USING (public.is_super_admin());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_progress_user_id ON public.survey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_progress_survey_id ON public.survey_progress(survey_id);
