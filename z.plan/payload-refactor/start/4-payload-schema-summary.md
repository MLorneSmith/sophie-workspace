# Payload Schema Summary (Supabase)

This document summarizes the tables and columns found within the `payload` schema in the Supabase database, based on a query of `information_schema.columns`.

## Views

### `payload.course_content_view`
- `course_id` (uuid)
- `course_title` (text)
- `lesson_id` (uuid)
- `lesson_title` (text)
- `lesson_order` (text)
- `quiz_id` (uuid)
- `quiz_title` (text)

### `payload.course_quiz_questions_view`
- `quiz_id` (uuid)
- `quiz_title` (text)
- `question_id` (uuid)
- `question_title` (text)
- `question_type` (text)
- `question_order` (integer)

### `payload.downloads_diagnostic`
- `id` (uuid)
- `title` (text)
- `filename` (text)
- `url` (text)
- `mimetype` (text)
- `filesize` (integer)
- `width` (integer)
- `height` (integer)
- `sizes_thumbnail_url` (text)
- `lesson_count` (bigint)
- `related_lessons` (ARRAY)

### `payload.downloads_relationships_view`
- `download_id` (uuid)
- `download_title` (text)
- `filename` (text)
- `url` (text)
- `parent_type` (text)
- `parent_id` (uuid)
- `parent_title` (text)

### `payload.invalid_relationships_view`
- `relationship_type` (text)
- `source_id` (uuid)
- `target_id` (uuid)
- `path` (text)
- `issue_type` (text)
- `source_name` (text)

### `payload.lesson_quiz_view`
- `lesson_id` (uuid)
- `lesson_title` (text)
- `quiz_id` (uuid)
- `quiz_title` (text)

### `payload.survey_questions_view`
- `survey_id` (uuid)
- `survey_title` (text)
- `question_id` (uuid)
- `question_prompt` (text)
- `question_order` (integer)

### `payload.uuid_tables_scan`
- `table_name` (name)
- `id_column` (text)
- `parent_id_column` (text)
- `path_column` (text)
- `private_id_column` (text)

## Tables

### `payload.course_lessons`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `content` (text) - *Note: Likely Lexical JSONB, but reported as text*
- `lesson_number` (integer)
- `estimated_duration` (integer)
- `published_at` (timestamp with time zone)
- `quiz_id` (uuid) - *Note: Likely deprecated/redundant*
- `quiz_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `course_id` (uuid) - *Note: Likely deprecated/redundant*
- `course_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `media_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `bunny_video_id` (text)
- `bunny_library_id` (text)
- `todo_complete_quiz` (boolean)
- `todo_watch_content` (text)
- `todo_read_content` (text)
- `todo_course_project` (text)
- `survey_id` (uuid) - *Note: Likely deprecated/redundant*
- `survey_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `todo` (text) - *Note: Likely Lexical JSONB, but reported as text*
- `youtube_video_id` (text)
- `video_source_type` (text)
- `parent_id` (text) - *Note: Payload internal?*
- `path` (text) - *Note: Payload internal?*
- `private_id` (text) - *Note: Payload internal?*
- `order` (text) - *Note: Payload internal?*
- `course_lessons_id` (text) - *Note: Payload internal?*
- `course_quizzes_id` (text) - *Note: Payload internal?*
- `surveys_id` (text) - *Note: Payload internal?*
- `survey_questions_id` (text) - *Note: Payload internal?*
- `posts_id` (text) - *Note: Payload internal?*
- `documentation_id` (text) - *Note: Payload internal?*

### `payload.course_lessons__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `course_lessons.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- `path` (text) - *Payload internal?*
- `private_id` (text) - *Payload internal?*
- `course_id` (text) - *Payload internal?*
- `course_lessons_id` (text) - *Payload internal?*
- `course_quizzes_id` (text) - *Payload internal?*
- `surveys_id` (text) - *Payload internal?*
- `survey_questions_id` (text) - *Payload internal?*
- `posts_id` (text) - *Payload internal?*
- `documentation_id` (text) - *Payload internal?*

### `payload.course_lessons_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `lesson_id` (uuid)
- `download_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.course_lessons_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `course_lessons.id`*
- `field` (character varying) - *Name of the relationship field in `course_lessons`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'course_id', 'quiz_id'*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (uuid) - *ID of related download*
- `posts_id` (uuid) - *ID of related post*
- `documentation_id` (uuid) - *ID of related documentation*
- `surveys_id` (uuid) - *ID of related survey*
- `survey_questions_id` (uuid) - *ID of related survey question*
- `courses_id` (uuid) - *ID of related course*
- `course_lessons_id` (uuid) - *ID of related lesson (self-ref?)*
- `course_quizzes_id` (uuid) - *ID of related quiz*
- `quiz_questions_id` (uuid) - *ID of related quiz question*
- `quiz_id_id` (uuid) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.course_quizzes`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `passing_score` (integer) - *Note: Likely deprecated/redundant*
- `media_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `course_id_id` (text) - *Note: Likely deprecated/redundant*
- `pass_threshold` (integer)
- `questions` (jsonb) - *Stores array of question relationships*
- `_status` (character varying) - *Payload versioning status*
- *Plus several Payload internal columns*

### `payload.course_quizzes__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `course_quizzes.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.course_quizzes_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `course_quizzes.id`*
- `field` (character varying) - *Name of the relationship field in `course_quizzes`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'questions'*
- `quiz_questions_id` (uuid) - *ID of related quiz question*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.courses`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `show_progress_bar` (boolean)
- `estimated_duration` (integer)
- `status` (text)
- `published_at` (timestamp with time zone)
- `intro_content` (jsonb) - *Likely Lexical*
- `completion_content` (jsonb) - *Likely Lexical*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `content` (jsonb) - *Likely Lexical*
- *Plus several Payload internal columns*

### `payload.courses__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `courses.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.courses_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `courses.id`*
- `field` (character varying) - *Name of the relationship field in `courses`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'lessons'*
- `course_lessons_id` (uuid) - *ID of related lesson*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.documentation`
- `id` (uuid)
- `title` (character varying)
- `slug` (character varying)
- `status` (character varying)
- `content` (jsonb) - *Likely Lexical*
- `parent` (uuid) - *Note: Likely deprecated/redundant*
- `parent_id` (uuid) - *Self-referencing ID for hierarchy*
- `description` (text)
- `order` (numeric) - *Note: Likely deprecated/redundant*
- `_order` (numeric) - *Payload order*
- `published_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.documentation__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `documentation.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.documentation_breadcrumbs` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `doc` (uuid) - *Note: Likely deprecated/redundant*
- `doc_id` (uuid) - *ID of related documentation page*
- `label` (character varying)
- `url` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_categories` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `category` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `documentation_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `documentation_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.documentation_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `field` (character varying) - *Name of the relationship field in `documentation`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `path` (character varying) - *Path/field name, e.g., 'parent'*
- `documentation_id` (uuid) - *ID of related documentation (self-ref)*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.documentation_tags` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `documentation.id`*
- `tag` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.downloads`
- `id` (uuid)
- `filename` (text)
- `url` (text)
- `description` (text)
- `lesson_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `title` (text)
- `type` (text)
- `key` (text)
- `filesize` (integer)
- `mimetype` (text)
- `thumbnail_u_r_l` (text) - *Note: Likely deprecated/redundant*
- `mime_type` (text) - *Note: Likely deprecated/redundant*
- `mime` (text) - *Note: Likely deprecated/redundant*
- `alt_text` (text)
- `filename_original` (text)
- `width` (integer)
- `height` (integer)
- `focal_x` (numeric)
- `focal_y` (numeric)
- `sizes` (jsonb) - *Payload image sizes*
- `sizes_srcsets` (jsonb) - *Payload image sizes*
- `sizes_thumbnail_url` (text)
- `sizes_thumbnail_width` (integer)
- `sizes_thumbnail_height` (integer)
- `sizes_thumbnail_mime_type` (text)
- `sizes_thumbnail_filesize` (integer)
- `sizes_thumbnail_filename` (text)
- `sizes_card_url` (text)
- `sizes_card_width` (integer)
- `sizes_card_height` (integer)
- `sizes_card_mime_type` (text)
- `sizes_card_filesize` (integer)
- `sizes_card_filename` (text)
- `sizes_tablet_url` (text)
- `sizes_tablet_width` (integer)
- `sizes_tablet_height` (integer)
- `sizes_tablet_mime_type` (text)
- `sizes_tablet_filesize` (integer)
- `sizes_tablet_filename` (text)
- `caption` (text)
- `created_by` (text)
- `updated_by` (text)
- *Plus several Payload internal columns*

### `payload.downloads_relationships` (Utility Table?)
- `collection_id` (text)
- `download_id` (text)
- `collection_type` (text)
- `table_name` (text)

### `payload.downloads_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `downloads.id`*
- `field` (text) - *Name of the relationship field in `downloads`*
- `value` (text) - *Note: Likely deprecated/redundant*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- `path` (text) - *Path/field name*
- `courses_id` (uuid) - *ID of related course*
- `course_lessons_id` (uuid) - *ID of related lesson*
- `course_quizzes_id` (uuid) - *ID of related quiz*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.dynamic_uuid_tables` (Utility Table)
- `table_name` (text)
- `primary_key` (text)
- `created_at` (timestamp with time zone)
- `needs_path_column` (boolean)
- `id` (text)
- *Plus several Payload internal columns*

### `payload.media` (Likely Deprecated/Replaced by `downloads`)
- `id` (uuid)
- `alt` (character varying)
- `filename` (character varying)
- `mime_type` (character varying)
- `filesize` (numeric)
- `width` (numeric)
- `height` (numeric)
- `url` (character varying)
- `thumbnail_u_r_l` (character varying)
- `focal_x` (numeric)
- `focal_y` (numeric)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.payload_locked_documents` (Payload Internal)
- `id` (uuid)
- `collection` (character varying)
- `document_id` (character varying)
- `lock_expiration` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `global_slug` (character varying)
- *Plus several Payload internal columns and potential related ID columns*

### `payload.payload_locked_documents_rels` (Payload Internal Relationship Table)
- `id` (uuid)
- `order` (integer)
- `parent_id` (uuid) - *Refers to `payload_locked_documents.id`*
- `path` (character varying)
- `users_id` (uuid) - *ID of related user*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.payload_migrations` (Payload Internal)
- `id` (integer)
- `name` (character varying)
- `batch` (numeric)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.payload_preferences` (Payload Internal)
- `id` (uuid)
- `user` (uuid) - *Note: Likely deprecated/redundant*
- `key` (character varying)
- `value` (jsonb)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.payload_preferences_rels` (Payload Internal Relationship Table)
- `id` (uuid)
- `order` (integer)
- `parent_id` (uuid) - *Refers to `payload_preferences.id`*
- `path` (character varying)
- `users_id` (uuid) - *ID of related user*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.posts`
- `id` (uuid)
- `title` (character varying)
- `slug` (character varying)
- `status` (character varying)
- `content` (jsonb) - *Likely Lexical*
- `description` (text)
- `image_id` (uuid) - *Note: Likely deprecated/redundant*
- `image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `published_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.posts__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `posts.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.posts_categories` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `posts.id`*
- `category` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.posts_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `posts_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.posts_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `posts_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.posts_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `posts.id`*
- `field` (character varying) - *Name of the relationship field in `posts`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `path` (character varying) - *Path/field name, e.g., 'featured_image'*
- `media_id` (uuid) - *ID of related media/download*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.posts_tags` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `posts.id`*
- `tag` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private` (Private Posts Collection)
- `id` (uuid)
- `title` (character varying)
- `slug` (character varying)
- `description` (text)
- `content` (jsonb) - *Likely Lexical*
- `status` (character varying)
- `published_at` (timestamp with time zone)
- `image_id` (uuid) - *Note: Likely deprecated/redundant*
- `image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id` (uuid) - *Note: Likely deprecated/redundant*
- `featured_image_id_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- `path` (text) - *Note: Payload internal?*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `_order` (integer) - *Payload relationship order*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_categories` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `category` (character varying)
- `path` (text) - *Note: Payload internal?*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `private_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `private_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.private_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `field` (text) - *Name of the relationship field in `private`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `media_id` (uuid) - *ID of related media/download*
- `path` (text) - *Path/field name*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.private_tags` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `_parent_id` (uuid) - *Refers to `private.id`*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `tag` (character varying)
- `path` (text) - *Note: Payload internal?*
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.quiz_question_relationships` (Utility Table?)
- `quiz_id` (text)
- `question_id` (text)
- `created_at` (timestamp without time zone)

### `payload.quiz_questions`
- `id` (uuid)
- `question` (text)
- `options` (jsonb) - *Stores array of options, e.g., `[{"id": "uuid", "text": "Option A", "isCorrect": false}]`*
- `correct_answer` (text) - *Note: Stores the UUID of the correct option*
- `type` (text) - *e.g., 'multiple_choice'*
- `explanation` (text)
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload order*
- `media_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.quiz_questions_options` (Likely Array Block Data - Deprecated?)
- `id` (uuid)
- `_order` (integer)
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_parent_id` (uuid) - *Refers to `quiz_questions.id`*
- `text` (character varying)
- `is_correct` (boolean)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.quiz_questions_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `quiz_questions.id`*
- `field` (character varying) - *Name of the relationship field in `quiz_questions`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'quiz_id'*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `course_quizzes_id` (uuid) - *ID of related quiz*
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.survey_questions`
- `id` (uuid)
- `question` (text)
- `options` (jsonb) - *Stores array of options, e.g., `[{"id": "uuid", "option": "Option A"}]`*
- `text` (character varying) - *Note: Likely deprecated/redundant*
- `type` (character varying) - *e.g., 'multiple_choice', 'text'*
- `description` (text)
- `required` (boolean)
- `category` (character varying)
- `questionspin` (integer) - *Note: Typo? Likely 'position'*
- `position` (integer) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload order*
- `surveys_id` (uuid) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.survey_questions_options` (Likely Array Block Data)
- `id` (uuid)
- `_order` (integer)
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_parent_id` (uuid) - *Refers to `survey_questions.id`*
- `option` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.survey_questions_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `survey_questions.id`*
- `field` (character varying) - *Name of the relationship field in `survey_questions`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `surveys_id` (uuid) - *ID of related survey*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'survey_id'*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.surveys`
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `start_message` (text)
- `end_message` (text)
- `show_progress_bar` (boolean)
- `summary_content` (jsonb) - *Likely Lexical*
- `status` (character varying)
- `published_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `downloads_id` (ARRAY) - *Note: Likely deprecated/redundant*
- *Plus several Payload internal columns*

### `payload.surveys__downloads` (Many-to-Many Join Table)
- `id` (uuid)
- `parent_id` (text) - *Refers to `surveys.id`*
- `downloads_id` (uuid) - *Refers to `downloads.id`*
- `order_column` (integer) - *Note: Likely deprecated/redundant*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `order` (integer) - *Payload relationship order*
- *Plus several Payload internal columns*

### `payload.surveys_downloads` (Many-to-Many Join Table - Likely Deprecated)
- `id` (uuid)
- `surveys_id` (uuid)
- `downloads_id` (uuid)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.surveys_downloads_rels` (Relationship Join Table - Likely Deprecated)
- `id` (text)
- `_parent_id` (text)
- `field` (text)
- `value` (text)
- `parent_id` (text)
- `order` (integer)
- `_order` (integer)
- `path` (text)
- `surveys_id` (text)
- `downloads_id` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.surveys_rels` (Relationship Join Table)
- `id` (uuid)
- `_parent_id` (uuid) - *Refers to `surveys.id`*
- `field` (character varying) - *Name of the relationship field in `surveys`*
- `value` (uuid) - *Note: Likely deprecated/redundant*
- `parent_id` (uuid) - *Note: Likely deprecated/redundant*
- `order` (integer) - *Note: Likely deprecated/redundant*
- `_order` (integer) - *Payload relationship order*
- `path` (character varying) - *Path/field name, e.g., 'questions'*
- `survey_questions_id` (uuid) - *ID of related survey question*
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- *Plus several other potential related ID columns and Payload internal columns*

### `payload.users` (Payload Users)
- `id` (uuid)
- `email` (character varying)
- `reset_password_token` (character varying)
- `reset_password_expiration` (timestamp with time zone)
- `salt` (character varying)
- `hash` (character varying)
- `login_attempts` (numeric)
- `lock_until` (timestamp with time zone)
- `first_name` (character varying)
- `last_name` (character varying)
- `updated_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- *Plus several Payload internal columns*

### `payload.uuid_table_monitor` (Utility Table)
- `id` (integer)
- `table_name` (text)
- `created_at` (timestamp without time zone)
- `monitoring_status` (text)
- *Plus several Payload internal columns*
