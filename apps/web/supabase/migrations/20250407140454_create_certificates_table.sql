-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Add RLS policies for security
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- RLS policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own certificates
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow authenticated users to insert certificates
CREATE POLICY "Authenticated users can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
