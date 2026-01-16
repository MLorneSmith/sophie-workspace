-- Add phase column to tasks table
ALTER TABLE public.tasks ADD COLUMN phase text;

-- Migrate existing data: extract phase from description
-- Pattern: [Phase N: Phase Name] -> extract "Phase Name"
UPDATE public.tasks
SET phase = regexp_replace(
  description,
  '^\[Phase \d+: ([^\]]+)\].*$',
  '\1'
)
WHERE description ~ '^\[Phase \d+:';

-- Clean description: remove phase prefix
UPDATE public.tasks
SET description = regexp_replace(
  description,
  '^\[Phase \d+: [^\]]+\]\s*',
  ''
)
WHERE description ~ '^\[Phase \d+:';

-- Drop image_url column
ALTER TABLE public.tasks DROP COLUMN image_url;
