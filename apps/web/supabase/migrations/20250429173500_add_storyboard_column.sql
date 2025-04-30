-- Add storyboard column to building_blocks_submissions table
ALTER TABLE public.building_blocks_submissions
ADD COLUMN IF NOT EXISTS storyboard JSONB;
