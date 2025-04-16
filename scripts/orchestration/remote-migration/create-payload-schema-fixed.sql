-- Create payload schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payload;

-- Create basic tracking table for UUID tables
CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
    uuid_table_name TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    managed BOOLEAN DEFAULT TRUE,
    has_path BOOLEAN DEFAULT FALSE,
    has_parent_id BOOLEAN DEFAULT FALSE,
    has_downloads_id BOOLEAN DEFAULT FALSE,
    has_media_id BOOLEAN DEFAULT FALSE,
    has_private_id BOOLEAN DEFAULT FALSE
);
