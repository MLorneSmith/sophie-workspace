-- Add enable_courses column to config table
-- Controls visibility of Course and Assessment features during alpha testing

-- Add the new column with default false (safest for alpha testing)
ALTER TABLE public.config
ADD COLUMN IF NOT EXISTS enable_courses BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.config.enable_courses IS 'Enable Course and Assessment features in the UI (default: false for alpha testing)';

-- Grant update permission on config table (select already granted)
GRANT UPDATE ON TABLE public.config TO authenticated, service_role;

-- Create update policy for super admins (depends on is_super_admin function from earlier migration)
CREATE POLICY "super_admins_update_config"
ON public.config
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
