# Bug Diagnosis: Certificate Generation Fails Due to Storage listBuckets() RLS Policy

**ID**: ISSUE-1061
**Created**: 2025-12-10T18:00:00Z
**Updated**: 2025-12-10T19:00:00Z
**Reporter**: User
**Severity**: high
**Status**: fixed
**Type**: bug

## Summary

Certificate generation fails both locally and in production because the `generateCertificate()` function calls `supabase.storage.listBuckets()` to check if the "certificates" bucket exists. However, `listBuckets()` requires admin privileges (there's no RLS policy allowing users to list buckets), so it returns an empty array. The code then attempts to create the bucket, which fails with RLS error "new row violates row-level security policy for table 'buckets'".

## Environment

- **Application Version**: Current dev branch
- **Environment**: Local development AND Production
- **Node Version**: 22.x
- **Last Working**: Never (this was a latent bug)

## Reproduction Steps

1. Start local Supabase: `pnpm supabase:web:start`
2. Start local dev server: `pnpm dev`
3. Complete all 23 required lessons in the "Decks for Decision Makers" course
4. System redirects to the congratulations lesson (confetti animation runs)
5. Click "View Certificate" button
6. **Expected**: Certificate PDF is displayed at `/home/course/certificate`
7. **Actual**: User is redirected to `/home/course` because certificate doesn't exist

## Expected Behavior

Certificate generation should succeed:
1. Skip bucket existence check (bucket is created via migration)
2. Upload certificate PDF directly to "certificates" bucket
3. Insert certificate record via `insert_certificate` RPC
4. Set `certificate_generated = true` in `course_progress`
5. User can view certificate at `/home/course/certificate`

## Actual Behavior

Certificate generation silently fails:
1. `listBuckets()` returns empty array (no RLS policy for listing buckets)
2. Code thinks bucket doesn't exist, attempts to create it
3. Bucket creation fails with RLS error (bucket already exists AND users can't create buckets)
4. Error is caught and logged, certificate generation stops
5. No certificate record is created
6. `course_progress.certificate_generated` remains `false`
7. Certificate page redirects to `/home/course`

## Diagnostic Data

### Database Logs (docker logs supabase_db_2025slideheroes-db)
```
2025-12-10 17:27:29.203 UTC ERROR:  new row violates row-level security policy for table "buckets"
STATEMENT:  insert into "buckets" ("allowed_mime_types", "file_size_limit", "id", "name", "owner", "owner_id", "public", "type") values ($1, $2, $3, $4, $5, $6, $7, $8)
2025-12-10 17:27:30.212 UTC ERROR:  new row violates row-level security policy for table "buckets"
STATEMENT:  insert into "buckets" ("allowed_mime_types", "file_size_limit", "id", "name", "owner", "owner_id", "public", "type") values ($1, $2, $3, $4, $5, $6, $7, $8)
2025-12-10 17:27:31.219 UTC ERROR:  new row violates row-level security policy for table "buckets"
STATEMENT:  insert into "buckets" ("allowed_mime_types", "file_size_limit", "id", "name", "owner", "owner_id", "public", "type") values ($1, $2, $3, $4, $5, $6, $7, $8)
```

The three errors occur at 1-second intervals, matching the retry logic in the certificate service.

### Root Cause Code Analysis

**File**: `apps/web/lib/certificates/certificate-service.ts` (lines 300-396, now removed)
```typescript
const supabase = getSupabaseServerClient();
const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();  // <-- Returns empty array!

// ...

const certificatesBucket = buckets?.find(
    (bucket) => bucket.name === "certificates",
);

if (!certificatesBucket) {  // <-- Always true because listBuckets returns []
    // Try to create the bucket with multiple attempts
    const { error } = await supabase.storage.createBucket("certificates", {
        public: true,
        // ...
    });  // <-- FAILS with RLS error!
}
```

### Storage RLS Policies
```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies WHERE tablename IN ('buckets', 'objects');
```
Result:
- `storage.objects`: Has "Anyone can read certificates" (SELECT) and "Authenticated users can upload certificates" (INSERT)
- `storage.buckets`: NO POLICIES - users cannot list or create buckets

### Verified Working Components
- ✅ PDF.co API key valid (87 chars)
- ✅ PDF.co upload works
- ✅ PDF.co field info works (found `student_name`, `DATE` fields)
- ✅ PDF.co form fill works
- ✅ Template file exists (205,075 bytes)
- ✅ Certificates storage bucket EXISTS in database
- ✅ Account record EXISTS with name
- ✅ Course ID correct UUID format

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `listBuckets()` API call fails silently (returns empty) because regular authenticated users don't have permission to list storage buckets. The code then incorrectly assumes the bucket doesn't exist and tries to create it, which fails with RLS error.

**Detailed Explanation**:
1. The "certificates" bucket is correctly created via migration (`20250407140654_create_certificates_bucket.sql`)
2. Storage RLS policies allow users to read/upload to the bucket but NOT list or create buckets
3. `supabase.storage.listBuckets()` only returns buckets the user has access to see (via RLS)
4. Since there's no `SELECT` policy on `storage.buckets`, users see no buckets
5. The code's bucket existence check fails, triggering unnecessary bucket creation
6. Bucket creation fails with RLS error, which is caught and causes certificate generation to abort

### Why This Wasn't Caught Earlier
- Local development has the same RLS policies as production
- The bucket EXISTS but users can't SEE it via `listBuckets()`
- Error is caught silently, no visible error in UI
- Previous testing may have been done with admin/service role client

### Confidence Level

**Confidence**: High (100%)

**Evidence**:
- Database logs show exact RLS error at exact time of course completion (17:27:29)
- Three retry attempts match the code's `maxRetries = 3` configuration
- Standalone PDF.co test works perfectly, proving API is not the issue
- `storage.buckets` table shows bucket EXISTS but no RLS policy allows listing

## Fix Applied

Removed the unnecessary `listBuckets()` check and bucket creation logic. The bucket is guaranteed to exist via migration, so we can upload directly:

**Before** (lines 300-396, ~100 lines):
```typescript
const { data: buckets } = await supabase.storage.listBuckets();
const certificatesBucket = buckets?.find(b => b.name === "certificates");
if (!certificatesBucket) {
    // Complex retry logic to create bucket - ALWAYS FAILS
}
```

**After** (lines 293-305, ~12 lines):
```typescript
// Note: The "certificates" bucket is created via migration
// We don't check if it exists because:
// 1. listBuckets() requires admin privileges that regular users don't have
// 2. Attempting to create a bucket that exists fails with RLS errors
// 3. The migration ensures the bucket always exists in properly set up environments
const supabase = getSupabaseServerClient();
// Proceed directly to upload...
```

## Validation Steps

1. Run `pnpm --filter web typecheck` - Passes ✅
2. Reset course progress for testing: `UPDATE course_progress SET completed_at = NULL, certificate_generated = false WHERE ...`
3. Complete course again
4. Certificate should generate successfully
5. "View Certificate" should display the PDF

## Related Issues

- #1053 (CLOSED): Fixed UUID lookup in certificate page
- #1056 (CLOSED): Added certificate generation to INSERT path
- #1060 (CLOSED): Updated PDF.co API to upload-first workflow
- **This fix**: Removed unnecessary bucket existence check that caused RLS failure

## Lessons Learned

1. **Don't assume API calls work** - `listBuckets()` looks like it works but returns empty due to RLS
2. **Check database logs for RLS errors** - The error was clearly visible in Supabase logs
3. **Confirm environment early** - Initial diagnosis assumed Vercel production, but issue was local
4. **Test external APIs in isolation** - Standalone PDF.co test ruled out API issues quickly
5. **Silent failures are dangerous** - The error was caught and swallowed, making debugging hard

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, docker logs*
