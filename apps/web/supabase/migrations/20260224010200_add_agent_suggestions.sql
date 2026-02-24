-- Agent Suggestions table
-- Stores structured suggestions produced by agent runs.

CREATE TABLE IF NOT EXISTS public.agent_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  slide_id text NOT NULL,
  type text NOT NULL,
  summary text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agent_suggestions IS 'Structured suggestions produced by agent runs.';

-- Permissions
REVOKE ALL ON public.agent_suggestions FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_suggestions TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_agent_suggestions_agent_run_id ON public.agent_suggestions (agent_run_id);
CREATE INDEX IF NOT EXISTS ix_agent_suggestions_presentation_id ON public.agent_suggestions (presentation_id);
CREATE INDEX IF NOT EXISTS ix_agent_suggestions_user_id ON public.agent_suggestions (user_id);
CREATE INDEX IF NOT EXISTS ix_agent_suggestions_slide_id ON public.agent_suggestions (slide_id);

-- Triggers
DROP TRIGGER IF EXISTS agent_suggestions_set_timestamps ON public.agent_suggestions;
CREATE TRIGGER agent_suggestions_set_timestamps
BEFORE INSERT OR UPDATE ON public.agent_suggestions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.agent_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_suggestions_read ON public.agent_suggestions;
CREATE POLICY agent_suggestions_read
ON public.agent_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS agent_suggestions_insert ON public.agent_suggestions;
CREATE POLICY agent_suggestions_insert
ON public.agent_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.agent_runs ar
    WHERE ar.id = agent_run_id
      AND ar.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS agent_suggestions_update ON public.agent_suggestions;
CREATE POLICY agent_suggestions_update
ON public.agent_suggestions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.agent_runs ar
    WHERE ar.id = agent_run_id
      AND ar.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS agent_suggestions_delete ON public.agent_suggestions;
CREATE POLICY agent_suggestions_delete
ON public.agent_suggestions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
