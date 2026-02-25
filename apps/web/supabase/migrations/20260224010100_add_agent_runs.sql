-- Agent Runs table
-- Stores AI agent execution runs and outputs for a presentation.

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error text,
  model_id text,
  token_usage jsonb,
  duration_ms integer,
  storyboard_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agent_runs IS 'AI agent execution runs and outputs for a presentation.';

-- Permissions
REVOKE ALL ON public.agent_runs FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.agent_runs TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_agent_runs_presentation_id ON public.agent_runs (presentation_id);
CREATE INDEX IF NOT EXISTS ix_agent_runs_user_id ON public.agent_runs (user_id);
CREATE INDEX IF NOT EXISTS ix_agent_runs_account_id ON public.agent_runs (account_id);
CREATE INDEX IF NOT EXISTS ix_agent_runs_agent_id ON public.agent_runs (agent_id);
CREATE INDEX IF NOT EXISTS ix_agent_runs_presentation_agent_created_at ON public.agent_runs (presentation_id, agent_id, created_at DESC);

-- Triggers
DROP TRIGGER IF EXISTS agent_runs_set_timestamps ON public.agent_runs;
CREATE TRIGGER agent_runs_set_timestamps
BEFORE INSERT OR UPDATE ON public.agent_runs
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_runs_read ON public.agent_runs;
CREATE POLICY agent_runs_read
ON public.agent_runs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS agent_runs_insert ON public.agent_runs;
CREATE POLICY agent_runs_insert
ON public.agent_runs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
);

DROP POLICY IF EXISTS agent_runs_update ON public.agent_runs;
CREATE POLICY agent_runs_update
ON public.agent_runs
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
)
WITH CHECK (
  auth.uid() = user_id
  AND account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
);

DROP POLICY IF EXISTS agent_runs_delete ON public.agent_runs;
CREATE POLICY agent_runs_delete
ON public.agent_runs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
