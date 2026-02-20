-- Audience Profiles table
-- Stores the Audience Brief artifact (Profile step) and supports reuse across presentations.

CREATE TABLE IF NOT EXISTS public.audience_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  -- Nullable: profiles can be reused across multiple presentations.
  presentation_id uuid NULL,
  person_name text NOT NULL,
  company text,
  title text,
  linkedin_url text,
  enrichment_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  adaptive_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Generated editable brief (markdown / rich text string).
  brief_text text,
  -- Structured internal representation used for downstream context injection.
  brief_structured jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audience_profiles IS 'Saved audience profiles (Audience Brief) that can be reused across presentations.';

-- Permissions
REVOKE ALL ON public.audience_profiles FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audience_profiles TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_audience_profiles_user_id ON public.audience_profiles (user_id);
CREATE INDEX IF NOT EXISTS ix_audience_profiles_account_id ON public.audience_profiles (account_id);
CREATE INDEX IF NOT EXISTS ix_audience_profiles_presentation_id ON public.audience_profiles (presentation_id);

-- Triggers
DROP TRIGGER IF EXISTS audience_profiles_set_timestamps ON public.audience_profiles;
CREATE TRIGGER audience_profiles_set_timestamps
BEFORE INSERT OR UPDATE ON public.audience_profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.audience_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audience_profiles_read ON public.audience_profiles;
CREATE POLICY audience_profiles_read
ON public.audience_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS audience_profiles_insert ON public.audience_profiles;
CREATE POLICY audience_profiles_insert
ON public.audience_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS audience_profiles_update ON public.audience_profiles;
CREATE POLICY audience_profiles_update
ON public.audience_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS audience_profiles_delete ON public.audience_profiles;
CREATE POLICY audience_profiles_delete
ON public.audience_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
