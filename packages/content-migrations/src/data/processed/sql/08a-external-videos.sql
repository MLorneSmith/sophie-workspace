-- Script to update external video information for specific lessons

BEGIN;

-- Update Storyboards in Film to use YouTube video
UPDATE payload.course_lessons 
SET 
  video_source_type = 'youtube',
  youtube_video_id = 'BSOJiSUI0z8'
WHERE 
  slug = 'storyboards-film';

-- Update Overview of the Fundamental Elements of Design to use Vimeo video
UPDATE payload.course_lessons 
SET 
  video_source_type = 'vimeo',
  youtube_video_id = '32944253' 
WHERE 
  slug = 'fundamental-design-overview';

COMMIT;
