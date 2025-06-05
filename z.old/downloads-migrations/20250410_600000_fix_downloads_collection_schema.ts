import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

/**
 * Migration to fix the Downloads collection schema
 *
 * This adds all required fields for downloads to properly support:
 * - File metadata (filename, mimetype, filesize)
 * - Image-specific fields (width, height, focal points)
 * - Additional metadata (title, type, url)
 * - Size variants for image transformations
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Check if downloads table exists, create it if not
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.downloads (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

		// Add basic file metadata columns
		await db.execute(sql`
      DO $$
      BEGIN
        -- Basic file metadata
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'filename') THEN
          ALTER TABLE payload.downloads ADD COLUMN filename TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'url') THEN
          ALTER TABLE payload.downloads ADD COLUMN url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'title') THEN
          ALTER TABLE payload.downloads ADD COLUMN title TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'type') THEN
          ALTER TABLE payload.downloads ADD COLUMN type TEXT;
        END IF;
      END
      $$;
    `);

		// Add MIME type fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- MIME type fields (both snake_case and camelCase for compatibility)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'mime_type') THEN
          ALTER TABLE payload.downloads ADD COLUMN mime_type TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'mimeType') THEN
          ALTER TABLE payload.downloads ADD COLUMN "mimeType" TEXT;
        END IF;
      END
      $$;
    `);

		// Add file size fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- File size fields (both snake_case and camelCase for compatibility)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'filesize') THEN
          ALTER TABLE payload.downloads ADD COLUMN filesize INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'fileSize') THEN
          ALTER TABLE payload.downloads ADD COLUMN "fileSize" INTEGER;
        END IF;
      END
      $$;
    `);

		// Add image dimension fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- Image dimensions and focal point
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'width') THEN
          ALTER TABLE payload.downloads ADD COLUMN width INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'height') THEN
          ALTER TABLE payload.downloads ADD COLUMN height INTEGER;
        END IF;
      END
      $$;
    `);

		// Add focal point fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- Focal point fields (both snake_case and camelCase for compatibility)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'focal_x') THEN
          ALTER TABLE payload.downloads ADD COLUMN focal_x INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'focal_y') THEN
          ALTER TABLE payload.downloads ADD COLUMN focal_y INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'focalX') THEN
          ALTER TABLE payload.downloads ADD COLUMN "focalX" INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'focalY') THEN
          ALTER TABLE payload.downloads ADD COLUMN "focalY" INTEGER;
        END IF;
      END
      $$;
    `);

		// Add thumbnail URL fields - all variations that Payload might use
		await db.execute(sql`
      DO $$
      BEGIN
        -- Add thumbnail URL fields in all possible formats that Payload CMS might use
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'thumbnail_url') THEN
          ALTER TABLE payload.downloads ADD COLUMN thumbnail_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'thumbnailURL') THEN
          ALTER TABLE payload.downloads ADD COLUMN "thumbnailURL" TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'thumbnail_u_r_l') THEN
          ALTER TABLE payload.downloads ADD COLUMN "thumbnail_u_r_l" TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'thumbnailUrl') THEN
          ALTER TABLE payload.downloads ADD COLUMN "thumbnailUrl" TEXT;
        END IF;
      END
      $$;
    `);

		// Add source fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- Add source fields based on Payload's naming conventions
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'source') THEN
          ALTER TABLE payload.downloads ADD COLUMN source TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sourceUrl') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sourceUrl" TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'source_url') THEN
          ALTER TABLE payload.downloads ADD COLUMN source_url TEXT;
        END IF;
      END
      $$;
    `);

		// Add alt text and other metadata fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- Alt text and additional metadata fields
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'alt') THEN
          ALTER TABLE payload.downloads ADD COLUMN alt TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'caption') THEN
          ALTER TABLE payload.downloads ADD COLUMN caption TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'description') THEN
          ALTER TABLE payload.downloads ADD COLUMN description TEXT;
        END IF;
      END
      $$;
    `);

		// Add Payload CMS status fields
		await db.execute(sql`
      DO $$
      BEGIN
        -- Status fields for Payload CMS content
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'status') THEN
          ALTER TABLE payload.downloads ADD COLUMN status TEXT;
        END IF;
      END
      $$;
    `);

		// Add size variant columns for image transformations (thumbnail)
		await db.execute(sql`
      DO $$
      BEGIN
        -- Thumbnail size fields
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_url') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_width') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_width INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_height') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_height INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_mime_type') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_mime_type TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_file_size') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_file_size INTEGER;
        END IF;
        
        -- Alternative URL format for sizes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_u_r_l') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_u_r_l TEXT;
        END IF;
        
        -- Snake_case file_size
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_filesize') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_filesize INTEGER;
        END IF;
        
        -- CamelCase mimeType
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_mimeType') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sizes_thumbnail_mimeType" TEXT;
        END IF;
        
        -- CamelCase fileSize
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_fileSize') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sizes_thumbnail_fileSize" INTEGER;
        END IF;
        
        -- Add filename for the thumbnail
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_thumbnail_filename') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_thumbnail_filename TEXT;
        END IF;
      END
      $$;
    `);

		// Add size variant columns for image transformations (medium)
		await db.execute(sql`
      DO $$
      BEGIN
        -- Medium size fields
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_url') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_width') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_width INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_height') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_height INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_mime_type') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_mime_type TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_file_size') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_file_size INTEGER;
        END IF;
        
        -- Alternative URL format for sizes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_u_r_l') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_u_r_l TEXT;
        END IF;
        
        -- Snake_case file_size
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_filesize') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_filesize INTEGER;
        END IF;
        
        -- CamelCase mimeType
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_mimeType') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sizes_medium_mimeType" TEXT;
        END IF;
        
        -- CamelCase fileSize
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_fileSize') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sizes_medium_fileSize" INTEGER;
        END IF;
        
        -- Add filename for the medium size
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_medium_filename') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_medium_filename TEXT;
        END IF;
      END
      $$;
    `);

		// Add size variant columns for image transformations (large)
		await db.execute(sql`
      DO $$
      BEGIN
        -- Large size fields
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_url') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_width') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_width INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_height') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_height INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_mime_type') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_mime_type TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_file_size') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_file_size INTEGER;
        END IF;
        
        -- Alternative URL format for sizes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_u_r_l') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_u_r_l TEXT;
        END IF;
        
        -- Snake_case file_size
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_filesize') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_filesize INTEGER;
        END IF;
        
        -- CamelCase mimeType
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_mimeType') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sizes_large_mimeType" TEXT;
        END IF;
        
        -- CamelCase fileSize
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_fileSize') THEN
          ALTER TABLE payload.downloads ADD COLUMN "sizes_large_fileSize" INTEGER;
        END IF;
        
        -- Add filename for the large size
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'sizes_large_filename') THEN
          ALTER TABLE payload.downloads ADD COLUMN sizes_large_filename TEXT;
        END IF;
      END
      $$;
    `);

		// Commit transaction
		await db.execute(sql`COMMIT;`);
		console.log("Migration completed: Fixed Downloads collection schema");
	} catch (error) {
		// Rollback on error
		await db.execute(sql`ROLLBACK;`);
		console.error("Error in downloads schema migration:", error);
		throw error;
	}
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
	// We don't want to drop the downloads table or remove columns in case there's existing data
	// Instead, log a message that manual intervention is required if this needs to be undone
	console.log(
		"This migration does not support down migration. Manual intervention required to undo schema changes.",
	);
}
