-- Outline Contents table
-- Stores the Outline step artifact (sections array).

CREATE TABLE IF NOT EXISTS public.outline_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.outline_contents IS 'Outline step artifact (sections array).';

-- Permissions
REVOKE ALL ON public.outline_contents FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.outline_contents TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_outline_contents_presentation_id ON public.outline_contents (presentation_id);
CREATE INDEX IF NOT EXISTS ix_outline_contents_user_id ON public.outline_contents (user_id);
CREATE INDEX IF NOT EXISTS ix_outline_contents_account_id ON public.outline_contents (account_id);

-- Triggers
DROP TRIGGER IF EXISTS outline_contents_set_timestamps ON public.outline_contents;
CREATE TRIGGER outline_contents_set_timestamps
BEFORE INSERT OR UPDATE ON public.outline_contents
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.outline_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outline_contents_read ON public.outline_contents;
CREATE POLICY outline_contents_read
ON public.outline_contents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS outline_contents_insert ON public.outline_contents;
CREATE POLICY outline_contents_insert
ON public.outline_contents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS outline_contents_update ON public.outline_contents;
CREATE POLICY outline_contents_update
ON public.outline_contents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS outline_contents_delete ON public.outline_contents;
CREATE POLICY outline_contents_delete
ON public.outline_contents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
