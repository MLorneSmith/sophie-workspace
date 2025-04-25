-- Unified Relationships View
-- 
-- This view combines all relationship tables into a single unified view,
-- making it easier to query and analyze relationships across collections.

CREATE OR REPLACE VIEW payload.unified_relationships_view AS
WITH collection_rels AS (
  SELECT
    'course_quizzes' AS source_collection,
    parent_id AS source_id,
    id AS target_id,
    path AS relationship_path,
    "order" AS sort_order
  FROM payload.course_quizzes_rels
  
  UNION ALL
  
  SELECT
    'course_lessons' AS source_collection,
    parent_id AS source_id,
    id AS target_id,
    path AS relationship_path,
    "order" AS sort_order
  FROM payload.course_lessons_rels
  
  UNION ALL
  
  SELECT
    'surveys' AS source_collection,
    parent_id AS source_id,
    id AS target_id,
    path AS relationship_path,
    "order" AS sort_order
  FROM payload.surveys_rels
  
  UNION ALL
  
  SELECT
    'courses' AS source_collection,
    parent_id AS source_id,
    id AS target_id,
    path AS relationship_path,
    "order" AS sort_order
  FROM payload.courses_rels
)
SELECT
  cr.source_collection,
  cr.source_id,
  CASE
    WHEN path = 'questions' AND source_collection = 'course_quizzes' THEN 'quiz_questions'
    WHEN path = 'quiz' AND source_collection = 'course_lessons' THEN 'course_quizzes'
    WHEN path = 'questions' AND source_collection = 'surveys' THEN 'survey_questions'
    WHEN path = 'downloads' THEN 'downloads'
    WHEN path = 'images' THEN 'media'
    ELSE 'unknown'
  END AS target_collection,
  cr.target_id,
  cr.relationship_path,
  cr.sort_order,
  CASE
    WHEN path = 'quiz' THEN 'hasOne'
    ELSE 'hasMany'
  END AS relation_type,
  -- Determine if the target item exists in its expected collection
  CASE
    WHEN path = 'questions' AND source_collection = 'course_quizzes' AND EXISTS (
      SELECT 1 FROM payload.quiz_questions WHERE id = cr.target_id
    ) THEN true
    WHEN path = 'quiz' AND source_collection = 'course_lessons' AND EXISTS (
      SELECT 1 FROM payload.course_quizzes WHERE id = cr.target_id
    ) THEN true
    WHEN path = 'questions' AND source_collection = 'surveys' AND EXISTS (
      SELECT 1 FROM payload.survey_questions WHERE id = cr.target_id
    ) THEN true
    WHEN path = 'downloads' AND EXISTS (
      SELECT 1 FROM payload.downloads WHERE id = cr.target_id
    ) THEN true
    WHEN path = 'images' AND EXISTS (
      SELECT 1 FROM payload.media WHERE id = cr.target_id
    ) THEN true
    ELSE false
  END AS target_exists,
  -- Check if the direct field also contains this relationship
  CASE
    WHEN path = 'questions' AND source_collection = 'course_quizzes' AND EXISTS (
      SELECT 1 FROM payload.course_quizzes 
      WHERE id = cr.source_id AND 
      (questions IS NOT NULL AND questions @> jsonb_build_array(cr.target_id))
    ) THEN true
    WHEN path = 'quiz' AND source_collection = 'course_lessons' AND EXISTS (
      SELECT 1 FROM payload.course_lessons 
      WHERE id = cr.source_id AND quiz = cr.target_id
    ) THEN true
    WHEN path = 'questions' AND source_collection = 'surveys' AND EXISTS (
      SELECT 1 FROM payload.surveys 
      WHERE id = cr.source_id AND 
      (questions IS NOT NULL AND questions @> jsonb_build_array(cr.target_id))
    ) THEN true
    WHEN path = 'downloads' AND source_collection = 'course_lessons' AND EXISTS (
      SELECT 1 FROM payload.course_lessons 
      WHERE id = cr.source_id AND 
      (downloads IS NOT NULL AND downloads @> jsonb_build_array(cr.target_id))
    ) THEN true
    WHEN path = 'downloads' AND source_collection = 'courses' AND EXISTS (
      SELECT 1 FROM payload.courses 
      WHERE id = cr.source_id AND 
      (downloads IS NOT NULL AND downloads @> jsonb_build_array(cr.target_id))
    ) THEN true
    ELSE false
  END AS in_direct_field
FROM collection_rels cr
ORDER BY cr.source_collection, cr.relationship_path, cr.source_id, cr.sort_order;

-- Comments on the unified view
COMMENT ON VIEW payload.unified_relationships_view IS 'A unified view of all relationships across collections';
COMMENT ON COLUMN payload.unified_relationships_view.source_collection IS 'The source collection (e.g. course_quizzes)';
COMMENT ON COLUMN payload.unified_relationships_view.source_id IS 'The ID of the source object';
COMMENT ON COLUMN payload.unified_relationships_view.target_collection IS 'The target collection derived from the relationship path';
COMMENT ON COLUMN payload.unified_relationships_view.target_id IS 'The ID of the target object';
COMMENT ON COLUMN payload.unified_relationships_view.relationship_path IS 'The relationship path in the source object';
COMMENT ON COLUMN payload.unified_relationships_view.sort_order IS 'The order of the relationship';
COMMENT ON COLUMN payload.unified_relationships_view.relation_type IS 'The type of relationship (hasOne or hasMany)';
COMMENT ON COLUMN payload.unified_relationships_view.target_exists IS 'Whether the target object exists in its expected collection';
COMMENT ON COLUMN payload.unified_relationships_view.in_direct_field IS 'Whether the relationship is also in the direct field of the source object';
