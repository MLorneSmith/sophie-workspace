# MinIO Integration for Payload Seed System

**Date**: 2025-10-07
**Status**: Complete
**Integration**: Added to `/database:supabase-reset` slash command

## Problem Statement

The Payload seed system was uploading media (30 files) and downloads (24 PDFs) to Cloudflare R2 via the configured R2 endpoint (`http://localhost:9000`), but no local object storage was running, causing all file uploads to fail silently. The R2 buckets remained empty.

## Root Cause

1. **File upload system exists and works**: The `MediaProcessor` and `DownloadsProcessor` in the seed engine correctly read files from `apps/payload/src/seed/seed-assets/` and call Payload's S3 storage adapter
2. **Configuration points to MinIO**: The `.env` file configures `R2_ENDPOINT=http://localhost:9000` (MinIO)
3. **MinIO container missing**: No MinIO container was defined or running in the Docker setup
4. **Silent failures**: Upload failures weren't obvious because seeding continued without errors (the database records were created, but file URLs pointed to non-existent objects)

## Solution Implemented

### 1. MinIO Docker Compose Configuration

**File**: `docker-compose.minio.yml` (project root)

**Components**:

- **minio** service: S3-compatible object storage (ports 9000-9001)
- **minio-init** service: Creates buckets on startup and sets public policy

**Features**:

- Persistent storage with Docker volume
- Health checks for reliability
- Automatic bucket creation (test-media-bucket, test-files-bucket)
- Public read access for media bucket

### 2. MinIO Startup Script

**File**: `.claude/scripts/database/start-minio.sh`

**Functionality**:

- Checks if MinIO is already running
- Starts MinIO via docker-compose if needed
- Waits for health check to pass (up to 30 seconds)
- Verifies bucket initialization succeeded
- Provides detailed status output with connection info
- Supports `--force-restart` flag

**Usage**:

```bash
bash .claude/scripts/database/start-minio.sh
bash .claude/scripts/database/start-minio.sh --force-restart
```

### 3. Supabase Reset Command Integration

**File**: `.claude/commands/database/supabase-reset.md`

**Changes**:

- Added Phase 2: "Start MinIO Object Storage" (new phase)
- Calls `start-minio.sh` before database reset
- Renumbered subsequent phases (3-6)
- Updated error handling with MinIO-specific errors
- Updated success criteria to include file upload verification
- Updated final status report with MinIO endpoints

**New Workflow**:

1. Phase 1: Validate environment
2. **Phase 2: Start MinIO** ← NEW
3. Phase 3: Reset Supabase
4. Phase 4: Setup Payload schema
5. Phase 5: Seed data + upload files
6. Phase 6: Verify database

### 4. Cleanup

**Deleted**: `.claude/scripts/database/supabase-reset.ts`

- Unused TypeScript implementation (745 lines)
- Not called by the slash command
- Only referenced in documentation
- Slash command uses inline bash scripts instead

## Files Modified

| File | Action | Lines | Purpose |
|------|--------|-------|---------|
| `docker-compose.minio.yml` | Created | 88 | MinIO container definition |
| `.claude/scripts/database/start-minio.sh` | Created | 267 | MinIO startup automation |
| `.claude/commands/database/supabase-reset.md` | Updated | ~50 changes | Integrated MinIO into workflow |
| `.claude/scripts/database/supabase-reset.ts` | Deleted | -745 | Removed unused script |

## Testing Instructions

### Test the Complete Workflow

```bash
# 1. Run the supabase reset with seeding
/database:supabase-reset

# 2. Verify MinIO is running
docker ps | grep minio
# Should show: slideheroes-minio (healthy)

# 3. Check buckets exist
docker exec -it slideheroes-minio mc ls local/
# Should show:
#   test-media-bucket
#   test-files-bucket

# 4. Verify files were uploaded
docker exec -it slideheroes-minio mc ls local/test-media-bucket/
# Should show ~30 image files

docker exec -it slideheroes-minio mc ls local/test-files-bucket/
# Should show ~24 PDF files

# 5. Open MinIO Console
open http://localhost:9001
# Login with: test_access_key / test_secret_key
# Browse buckets and verify files

# 6. Verify database records reference correct URLs
psql "$DATABASE_URL" -c "SELECT filename, url FROM payload.media LIMIT 5;"
# URLs should start with: http://localhost:9000/test-media-bucket/
```

### Expected Results

**After successful reset**:

- ✅ MinIO container running and healthy
- ✅ 2 buckets created (media, files)
- ✅ ~30 media files uploaded to test-media-bucket
- ✅ ~24 PDF files uploaded to test-files-bucket
- ✅ Database records have correct file URLs
- ✅ Files accessible via URLs (e.g., <http://localhost:9000/test-media-bucket/hero-image.jpg>)

## Connection Information

**MinIO Endpoints**:

- S3 API: `http://localhost:9000`
- Console UI: `http://localhost:9001`

**Credentials** (from `.env`):

- Access Key: `test_access_key`
- Secret Key: `test_secret_key`

**Buckets**:

- `test-media-bucket` (public read)
- `test-files-bucket` (private)

## Configuration

**Environment Variables** (in `apps/payload/.env`):

```bash
R2_ACCESS_KEY_ID=test_access_key
R2_SECRET_ACCESS_KEY=test_secret_key
R2_ACCOUNT_ID=test_account_id
R2_MEDIA_BUCKET=test-media-bucket
R2_FILES_BUCKET=test-files-bucket
R2_ENDPOINT=http://localhost:9000
R2_REGION=auto
```

## Integration Points

**Payload Configuration** (`apps/payload/src/payload.config.ts`):

- Uses `@payloadcms/storage-s3` adapter
- Configured with R2 settings (which MinIO implements)
- Automatic file upload during `payload.create({ file: ... })`

**Seed Processors**:

- `MediaProcessor`: Reads from `seed-assets/media/`, uploads to R2
- `DownloadsProcessor`: Reads from `seed-assets/downloads/`, uploads to R2

## Benefits

1. **Local Development Parity**: Files stored locally just like in production (R2)
2. **No External Dependencies**: Doesn't require Cloudflare account for development
3. **Automatic Integration**: Part of standard reset workflow
4. **Persistent Storage**: Files survive container restarts (Docker volume)
5. **Inspectable**: MinIO console provides UI for browsing files

## Future Enhancements (Optional)

- [ ] Add MinIO to `docker-compose.yml` for full stack startup
- [ ] Create script to sync files from production R2 to local MinIO
- [ ] Add MinIO health check to development startup scripts
- [ ] Document switching between MinIO (local) and R2 (production)

## References

- MinIO Documentation: <https://min.io/docs/>
- Payload S3 Storage Adapter: <https://payloadcms.com/docs/upload/storage-adapters>
- Cloudflare R2 API Compatibility: <https://developers.cloudflare.com/r2/api/s3/>
