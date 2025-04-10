"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMediaSql = generateMediaSql;
/**
 * Generator for media SQL
 */
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const image_mappings_js_1 = require("../../../data/mappings/image-mappings.js");
const mime_type_helper_js_1 = require("../../utils/mime-type-helper.js");
/**
 * Generates SQL for media entries based on image mappings
 * @returns SQL for media entries
 */
function generateMediaSql() {
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
    Object.entries(image_mappings_js_1.lessonImageMappings).forEach(([frontmatterPath, actualFilename]) => {
        const mediaId = (0, uuid_1.v4)();
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
  '${path_1.default.basename(actualFilename, path_1.default.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${(0, mime_type_helper_js_1.getMimeType)(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    });
    // Process post images
    Object.entries(image_mappings_js_1.postImageMappings).forEach(([frontmatterPath, actualFilename]) => {
        const mediaId = (0, uuid_1.v4)();
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
  '${path_1.default.basename(actualFilename, path_1.default.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${(0, mime_type_helper_js_1.getMimeType)(actualFilename)}',
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
