-- Add account_id to materials table
-- Brings materials in line with peer tables (outline_contents, assemble_outputs)

ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Index for efficient queries by account
CREATE INDEX IF NOT EXISTS ix_materials_account_id ON public.materials (account_id);

-- Backfill account_id from presentations for existing rows
UPDATE public.materials m
SET account_id = p.account_id
FROM public.presentations p
WHERE p.id = m.presentation_id AND m.account_id IS NULL;

-- Update RLS policies to use subquery pattern for account-based access
-- Note: Keep existing user_id policies for backwards compatibility

-- New policy: users can read materials for presentations they own via account
DROP POLICY IF EXISTS materials_read_account ON public.materials;
CREATE POLICY materials_read_account
ON public.materials
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
);

-- New policy: users can insert materials for presentations they own via account
DROP POLICY IF EXISTS materials_insert_account ON public.materials;
CREATE POLICY materials_insert_account
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
);

-- New policy: users can update materials for presentations they own via account
DROP POLICY IF EXISTS materials_update_account ON public.materials;
CREATE POLICY materials_update_account
ON public.materials
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
);

-- New policy: users can delete materials for presentations they own via account
DROP POLICY IF EXISTS materials_delete_account ON public.materials;
CREATE POLICY materials_delete_account
ON public.materials
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR account_id = (SELECT p.account_id FROM public.presentations p WHERE p.id = presentation_id)
);
