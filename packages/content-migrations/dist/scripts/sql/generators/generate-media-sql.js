/**
 * Generator for media SQL
 */
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { lessonImageMappings, postImageMappings, } from '../../../data/mappings/image-mappings.js';
import { getMimeType } from '../../utils/mime-type-helper.js';
/**
 * Generates SQL for media entries based on image mappings
 * @returns SQL for media entries
 */
export function generateMediaSql() {
    // Start building the SQL
    let sql = `-- Seed data for the media table
-- This file should be run after the migrations to ensure the media table exists

-- Start a transaction
BEGIN;

`;
    // Create a map to store media IDs by frontmatter path
    const mediaIds = {};
    global.mediaIds = mediaIds;
    // Process lesson images
    Object.entries(lessonImageMappings).forEach(([frontmatterPath, actualFilename]) => {
        const mediaId = uuidv4();
        mediaIds[frontmatterPath] = mediaId;
        sql += `-- Insert media for ${frontmatterPath}
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '${mediaId}',
  '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${getMimeType(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    });
    // Process post images
    Object.entries(postImageMappings).forEach(([frontmatterPath, actualFilename]) => {
        const mediaId = uuidv4();
        mediaIds[frontmatterPath] = mediaId;
        sql += `-- Insert media for ${frontmatterPath}
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '${mediaId}',
  '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${getMimeType(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    });
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
