-- Assemble Outputs table
-- Stores the Assemble step artifact (presentation framing + argument map).

CREATE TABLE IF NOT EXISTS public.assemble_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  presentation_type text NOT NULL CHECK (
    presentation_type IN ('general', 'sales', 'consulting', 'fundraising')
  ),
  situation text NOT NULL DEFAULT '',
  complication text NOT NULL DEFAULT '',
  question_type text NOT NULL CHECK (
    question_type IN (
      'strategy',
      'assessment',
      'implementation',
      'diagnostic',
      'alternatives',
      'postmortem'
    )
  ),
  argument_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assemble_outputs IS 'Assemble step artifact (presentation framing + argument map).';

-- Permissions
REVOKE ALL ON public.assemble_outputs FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assemble_outputs TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_assemble_outputs_presentation_id ON public.assemble_outputs (presentation_id);
CREATE INDEX IF NOT EXISTS ix_assemble_outputs_user_id ON public.assemble_outputs (user_id);
CREATE INDEX IF NOT EXISTS ix_assemble_outputs_account_id ON public.assemble_outputs (account_id);

-- Triggers
DROP TRIGGER IF EXISTS assemble_outputs_set_timestamps ON public.assemble_outputs;
CREATE TRIGGER assemble_outputs_set_timestamps
BEFORE INSERT OR UPDATE ON public.assemble_outputs
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.assemble_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assemble_outputs_read ON public.assemble_outputs;
CREATE POLICY assemble_outputs_read
ON public.assemble_outputs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS assemble_outputs_insert ON public.assemble_outputs;
CREATE POLICY assemble_outputs_insert
ON public.assemble_outputs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS assemble_outputs_update ON public.assemble_outputs;
CREATE POLICY assemble_outputs_update
ON public.assemble_outputs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS assemble_outputs_delete ON public.assemble_outputs;
CREATE POLICY assemble_outputs_delete
ON public.assemble_outputs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
