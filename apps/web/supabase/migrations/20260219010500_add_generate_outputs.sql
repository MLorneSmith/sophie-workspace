-- Generate Outputs table
-- Stores the Generate step artifact (template selection + export metadata).

CREATE TABLE IF NOT EXISTS public.generate_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  export_format text CHECK (export_format IN ('pptx', 'pdf')),
  export_url text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.generate_outputs IS 'Generate step artifact (template selection + export metadata).';

-- Permissions
REVOKE ALL ON public.generate_outputs FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.generate_outputs TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_generate_outputs_presentation_id ON public.generate_outputs (presentation_id);
CREATE INDEX IF NOT EXISTS ix_generate_outputs_user_id ON public.generate_outputs (user_id);
CREATE INDEX IF NOT EXISTS ix_generate_outputs_account_id ON public.generate_outputs (account_id);

-- Triggers
DROP TRIGGER IF EXISTS generate_outputs_set_timestamps ON public.generate_outputs;
CREATE TRIGGER generate_outputs_set_timestamps
BEFORE INSERT OR UPDATE ON public.generate_outputs
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.generate_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS generate_outputs_read ON public.generate_outputs;
CREATE POLICY generate_outputs_read
ON public.generate_outputs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS generate_outputs_insert ON public.generate_outputs;
CREATE POLICY generate_outputs_insert
ON public.generate_outputs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS generate_outputs_update ON public.generate_outputs;
CREATE POLICY generate_outputs_update
ON public.generate_outputs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS generate_outputs_delete ON public.generate_outputs;
CREATE POLICY generate_outputs_delete
ON public.generate_outputs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
