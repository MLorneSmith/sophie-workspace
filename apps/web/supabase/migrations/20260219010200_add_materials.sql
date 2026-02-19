-- Materials table
-- Stores uploaded/attached materials for a presentation.

CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('upload', 'braindump', 'link')),
  name text NOT NULL,
  content text,
  mime_type text,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.materials IS 'Uploaded/attached materials for a presentation.';

-- Permissions
REVOKE ALL ON public.materials FROM authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.materials TO authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS ix_materials_presentation_id ON public.materials (presentation_id);
CREATE INDEX IF NOT EXISTS ix_materials_user_id ON public.materials (user_id);

-- Triggers
DROP TRIGGER IF EXISTS materials_set_timestamps ON public.materials;
CREATE TRIGGER materials_set_timestamps
BEFORE INSERT OR UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();

-- RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS materials_read ON public.materials;
CREATE POLICY materials_read
ON public.materials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS materials_insert ON public.materials;
CREATE POLICY materials_insert
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS materials_update ON public.materials;
CREATE POLICY materials_update
ON public.materials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS materials_delete ON public.materials;
CREATE POLICY materials_delete
ON public.materials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
