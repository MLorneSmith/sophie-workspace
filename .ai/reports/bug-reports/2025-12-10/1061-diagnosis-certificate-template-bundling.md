# Bug Diagnosis: Certificate Template Not Bundled in Vercel Serverless Function

**ID**: ISSUE-1061
**Created**: 2025-12-10T18:00:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The certificate generation fails in production (Vercel) because the certificate template PDF file (`lib/certificates/templates/ddm_certificate_form.pdf`) is not included in the serverless function bundle. When `generateCertificate()` attempts to read the file using `fs.readFileSync()`, it fails because the file doesn't exist in the deployed environment.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Production (Vercel)
- **Node Version**: 20.x
- **Last Working**: Never worked in production (template bundling was never configured)

## Reproduction Steps

1. Deploy the application to Vercel
2. Complete all 23 required lessons in the "Decks for Decision Makers" course
3. System redirects to the congratulations lesson (confetti animation runs)
4. Click "View Certificate" button
5. **Expected**: Certificate PDF is displayed at `/home/course/certificate`
6. **Actual**: User is redirected to `/home/course` because certificate doesn't exist

## Expected Behavior

Certificate generation should succeed in production:
1. Template file should be bundled with serverless function
2. `generateCertificate()` should read the template successfully
3. Certificate should be generated, uploaded to storage, and database record created
4. User should be able to view certificate

## Actual Behavior

Certificate generation silently fails in production:
1. Template file is NOT bundled with serverless function
2. `fs.readFileSync()` throws an error (file not found)
3. Error is caught and logged, but certificate generation stops
4. No database record is created in `certificates` table
5. `course_progress.certificate_generated` remains `false`
6. Certificate page redirects to `/home/course` because no certificate exists

## Diagnostic Data

### Console Output
```
Error: Certificate template file not found at path: /var/task/lib/certificates/templates/ddm_certificate_form.pdf
```

### Root Cause Code Analysis

**File**: `apps/web/lib/certificates/certificate-service.ts` (lines 130-160)
```typescript
const fs = require("node:fs");
const path = require("node:path");
const templatePath = path.join(
  process.cwd(),
  "lib",
  "certificates",
  "templates",
  "ddm_certificate_form.pdf",
);

// Check if the file exists
if (!fs.existsSync(templatePath)) {
  const error = new Error(
    `Certificate template file not found at path: ${templatePath}`,
  );
  logger.error("Certificate template file not found", {
    operation: "template_check",
    templatePath,
    error,
  });
  throw error;  // <-- Execution stops here in production
}
```

**File**: `apps/web/next.config.mjs` (lines 55-57)
```javascript
outputFileTracingIncludes: {
  "/*": ["./content/**/*"],  // <-- Only content/ is included, NOT lib/certificates/
},
```

## Error Stack Traces
```
Error: Certificate template file not found at path: /var/task/lib/certificates/templates/ddm_certificate_form.pdf
    at generateCertificate (certificate-service.ts:151)
    at updateCourseProgressAction (server-actions.ts:71)
```

## Related Code
- **Affected Files**:
  - `apps/web/lib/certificates/certificate-service.ts:130-160` - File reading that fails
  - `apps/web/next.config.mjs:55-57` - Missing `outputFileTracingIncludes` entry
  - `apps/web/lib/certificates/templates/ddm_certificate_form.pdf` - Template file that needs bundling
- **Recent Changes**: None to file bundling configuration
- **Suspected Functions**: `generateCertificate()` at the file reading step

## Related Issues & Context

### Direct Predecessors
- #1053 (CLOSED): "Bug Fix: Certificate Not Generated on Course Completion" - Fixed UUID lookup but didn't address bundling
- #1056 (CLOSED): "Bug Fix: Certificate Generation Not Called for New Course Progress Records" - Added INSERT path but template still not bundled
- #1060 (CLOSED): "Bug Fix: Certificate Generation API Update for PDF.co Deprecation" - Fixed API calls but template still not bundled

### Historical Context
All three previous fixes addressed different aspects of certificate generation but none addressed the serverless bundling issue. The certificate template file has never been properly bundled for production deployment.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The certificate template PDF is not included in Vercel's serverless function bundle because it's missing from `outputFileTracingIncludes` configuration.

**Detailed Explanation**:
In Next.js with Vercel deployment, serverless functions only include files that are:
1. Explicitly imported via ES modules
2. Listed in `outputFileTracingIncludes` in `next.config.mjs`

The certificate service uses Node.js `fs.readFileSync()` to read the PDF template at runtime. This dynamic file access is not detected by Next.js's automatic file tracing, so the file must be explicitly included in `outputFileTracingIncludes`.

Currently, the config only includes `./content/**/*`:
```javascript
outputFileTracingIncludes: {
  "/*": ["./content/**/*"],
},
```

The certificate template at `lib/certificates/templates/ddm_certificate_form.pdf` is NOT included.

**Supporting Evidence**:
- Local development works because files are directly available on disk
- Production fails because the file doesn't exist in `/var/task/`
- The error "Certificate template file not found" is thrown at line 151
- All previous fixes (#1053, #1056, #1060) worked in dev but certificate still fails in production

### How This Causes the Observed Behavior

1. User completes course -> `updateCourseProgressAction` is called
2. Server action calls `generateCertificate()`
3. `generateCertificate()` tries to read PDF template using `fs.readFileSync()`
4. File doesn't exist in Vercel serverless function directory
5. Error is thrown and caught by try-catch in server action
6. `certificate_generated` flag is NOT set to `true`
7. No certificate record is created in database
8. When user visits `/home/course/certificate`, no certificate is found
9. Page redirects user to `/home/course`

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly indicates the file is not found at the expected path
- The `outputFileTracingIncludes` configuration clearly doesn't include the certificate templates directory
- This is a well-known issue with Vercel/Next.js serverless functions and dynamic file access
- All other aspects of the certificate generation pipeline have been verified working (UUID lookup, API calls, INSERT path, etc.)

## Fix Approach (High-Level)

Add the certificate templates directory to `outputFileTracingIncludes` in `next.config.mjs`:

```javascript
outputFileTracingIncludes: {
  "/*": ["./content/**/*", "./lib/certificates/templates/**/*"],
},
```

This tells Next.js to include all files in the templates directory when bundling for serverless deployment.

## Diagnosis Determination

The root cause is definitively identified: the certificate template PDF file is not bundled in the Vercel serverless function because it's missing from `outputFileTracingIncludes`. This is a configuration issue, not a code logic issue.

All previous fixes (#1053, #1056, #1060) addressed various aspects of the certificate generation pipeline but none addressed the fundamental issue of the template file not being available in production.

## Additional Context

### Why This Wasn't Caught Earlier
- Local development doesn't require `outputFileTracingIncludes` because files are directly accessible
- CI/CD tests may run with full file access
- The error is silently caught, so no visible error in the user interface

### Alternative Approaches
1. Store template in Supabase Storage and fetch at runtime (more complex, adds latency)
2. Base64 encode template and embed in code (increases bundle size, harder to maintain)
3. **Recommended**: Add to `outputFileTracingIncludes` (simplest, follows existing pattern)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, Task (Explore agents)*
