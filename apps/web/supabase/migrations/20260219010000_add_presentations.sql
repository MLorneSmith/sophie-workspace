-- Presentations table
-- Top-level persistent entity for the presentation creation wizard.

CREATE TABLE IF NOT EXISTS public.presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Presentation',
  current_step text NOT NULL DEFAULT 'profile' CHECK (
    current_step IN ('profile', 'assemble', 'outline', 'storyboard', 'generate')
  ),
  completed_steps text[] NOT NULL DEFAULT '{}'::text[],
  template_id text,
  audience_profile_id uuid REFERENCES public.audience_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.presentations IS 'Top-level presentation project that tracks wizard step progression.';

-- Permissions
REVOKE ALL ON public.presentations FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.presentations TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_presentations_user_id ON public.presentations (user_id);
CREATE INDEX IF NOT EXISTS ix_presentations_account_id ON public.presentations (account_id);
CREATE INDEX IF NOT EXISTS ix_presentations_audience_profile_id ON public.presentations (audience_profile_id);

-- Triggers
DROP TRIGGER IF EXISTS presentations_set_timestamps ON public.presentations;
CREATE TRIGGER presentations_set_timestamps
BEFORE INSERT OR UPDATE ON public.presentations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS presentations_read ON public.presentations;
CREATE POLICY presentations_read
ON public.presentations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS presentations_insert ON public.presentations;
CREATE POLICY presentations_insert
ON public.presentations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS presentations_update ON public.presentations;
CREATE POLICY presentations_update
ON public.presentations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS presentations_delete ON public.presentations;
CREATE POLICY presentations_delete
ON public.presentations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
