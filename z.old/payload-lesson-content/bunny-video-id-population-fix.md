# Bunny Video ID Population Fix

## Issue

The `bunny_video_id` field in the `payload.course_lessons` table was not being properly populated during content migration. This field is required to properly display Bunny.net videos in course lessons.

## Root Cause Analysis

1. After examining the codebase, we found that the YAML lesson metadata file (`packages/content-migrations/src/data/raw/lesson-metadata.yaml`) correctly contained bunny video IDs in the following structure:

   ```yaml
   lessons:
     - slug: 'lesson-0'
       bunnyVideo:
         id: '2620df68-c2a8-4255-986e-24c1d4c1dbf2'
   ```

2. However, the SQL generator (`packages/content-migrations/src/scripts/sql/generators/yaml-generate-lessons-sql.ts`) did not include logic to extract and populate the `bunny_video_id` field in the generated SQL.

## Solution Implemented

We created a two-part solution:

1. **Immediate fix**: A direct SQL script (`fix-bunny-video-ids.sql`) that updates all lesson records with their corresponding bunny video IDs based on the slug.

2. **Integration into migration pipeline**: A hook script (`add-bunny-video-ids-hook.ts`) that runs the SQL fix as part of the migration process. This ensures that bunny video IDs are populated every time the database is reset and migrations are run.

3. **Integration into the reset-and-migrate process**: Updated the loading phase in `scripts/orchestration/phases/loading.ps1` to include the bunny video ID fix in the relationship fixing step.

## Implementation Details

### SQL Fix Script

Located at `packages/content-migrations/src/scripts/repair/fix-bunny-video-ids.sql`, this script:

- Contains explicit UPDATE statements for each lesson with its corresponding bunny video ID
- Runs within a transaction for safety
- Includes verification to check the number of updated records

### Hook Script

Located at `packages/content-migrations/src/scripts/repair/add-bunny-video-ids-hook.ts`, this script:

- Is a TypeScript module that can be run directly or imported
- Uses the project's existing SQL file execution utilities
- Includes proper error handling and logging

### npm Script

Added a new script in `packages/content-migrations/package.json`:

```json
"fix:bunny-video-ids": "tsx src/scripts/repair/add-bunny-video-ids-hook.ts"
```

### Integration into Reset-and-Migrate Process

Updated `scripts/orchestration/phases/loading.ps1` to include the fix in the `Fix-Relationships` function:

```powershell
# Fix bunny_video_id fields in course_lessons table
Log-Message "Fixing bunny_video_id fields in course_lessons table..." "Yellow"
Exec-Command -command "pnpm run fix:bunny-video-ids" -description "Fixing bunny video IDs" -continueOnError
```

## Verification

After running the fix, we confirmed that:

- 19 course lessons now have the correct bunny_video_id values in the database
- The fix script runs successfully as part of the content migration process
- The bunny_video_id values persist after database resets

## Future Improvements

For a more complete solution, consider updating the YAML-to-SQL generator to handle the bunny_video_id field directly during SQL generation. This would eliminate the need for a separate fix step.
