# Bunny Video ID Fix Implementation

## Problem Description

The `bunny_video_id` field in the `payload.course_lessons` table was not being populated during the content migration process. This field is essential for connecting lessons to their associated Bunny.net video content.

## Root Cause Analysis

After reviewing the code, I identified that there was an existing SQL script at `packages/content-migrations/src/scripts/repair/fix-bunny-video-ids.sql` that contained the correct mappings between lesson slugs and Bunny video IDs. However, this script wasn't being properly executed during the migration process.

The issue was that the hook script referenced in the package.json was missing. It should have been pointing to a PowerShell hook integration script that would execute the SQL file.

## Fix Implementation

### 1. Created a Run SQL Utility

I added a new `run-sql.ts` utility to execute SQL queries directly:

```typescript
// packages/content-migrations/src/utils/run-sql.ts
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../.env.development');
console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

async function runSql(query: string): Promise<void> {
  // Execute SQL query implementation
  // ...
}

export default runSql;
```

### 2. Added NPM Scripts

Added the following scripts to package.json:

```json
"fix:bunny-video-ids": "powershell -ExecutionPolicy Bypass -File src/scripts/repair/hook-integration-script.ps1",
"utils:run-sql": "tsx src/utils/run-sql.ts"
```

### 3. Hook Integration Script

Created a PowerShell hook integration script (`hook-integration-script.ps1`) that:

1. Locates the SQL file
2. Executes it using the run-sql-file utility
3. Verifies the results using the run-sql utility

### 4. Testing & Verification

I verified that the fix worked by:

1. Running `reset-and-migrate.ps1 -ForceRegenerate`
2. Querying the database using the postgres MCP server

Query results showed that 19 lessons now have `bunny_video_id` values, confirming the fix was successful:

```sql
SELECT COUNT(*) FROM payload.course_lessons WHERE bunny_video_id IS NOT NULL;
-- Result: 19

SELECT title, bunny_video_id FROM payload.course_lessons WHERE bunny_video_id IS NOT NULL LIMIT 5;
-- Results:
-- "Welcome to DDM", "2620df68-c2a8-4255-986e-24c1d4c1dbf2"
-- "Our Process", "70b1f616-8e55-4c58-8898-c5cefa05417b"
-- "The Who", "8e80b4f3-76d4-44a3-994b-29937ee870ec"
-- "The Why: Building the Introduction", "eaa1e745-ec67-42c4-b474-e34bd6bdc830"
-- "The Why: Next Steps", "22511e58-40ce-4f11-9961-90070c1a3e94"
```

## Summary

The fix properly integrated the existing Bunny video ID mappings into the content migration process. All 19 lesson videos now have their corresponding Bunny.net video IDs properly set in the database.
