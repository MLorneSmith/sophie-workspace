# Seeding Payload

<context>

1. Read .claude/context/data/migrations/overview.md
2. Read .claude/context/tools/cli/supabase-cli.md
3. Read .claude/context/data/relationship-tables-management.md
4. Read .claude/context/data/migrations/patterns.md

</context>

<situation>

## Our goal and previous challenges

In the past we have run into difficulties seeding the payload schema with our payload data. We have run into all sorts of nextjs errors. Additionally, various collections have relationships with other payload collections - setting this up correctly has been a challenge.

Our task is to implement an approach which successfully seeds the payload schema of supabase locally.

## Resetting Payload Locally

We have a Payload Reset claude code slash command (.claude/commands/database/supabase-reset.md) that works at resetting the local database (we have not yet tested resetting the remote instance of supabase). The database is reset without errors.

Our next task is to ensure payload is properly setup to seed the payload schema with the correct data.

## Previous Progress

We have worked on this task previously, but progress was incomplete. We have conducted an audit of the current situation

Read reports/2025-09-30/payload-seed-audit-report.md

We have also assessed two approachs for seeding supabase: SQL or the payload api

- Read reports/2025-09-30/payload-seeding-approach-analysis.md

### Existing Payload Seed data

We have data in three 'states' that flow into one another in a pipeline:

raw data -> json files -> sql files

- The raw data for these seed files is here: apps/payload/src/seed/seed-data-raw
- We have payload json seed data files here: apps/payload/src/seed/seed-data.
- The tools we have used to process the raw data are here: apps/payload/src/seed/seed-conversion
- We have payload sql files here: .claude/scratch/payload-seed-working

It is unclear if these sql files were generated from the json files in apps/payload/src/seed/seed-data

## Key Constraints & Context

1. **Existing Infrastructure**
   - Database reset commands already exist and are maintained separately
   - Media and download files are already stored in Cloudflare R2
   - Payload is configured with S3 adapter for R2 integration
   - PostgreSQL database with UUID-based IDs

2. **Payload-Specific Considerations**
   - Payload automatically manages complex table structures (main tables, relationships, locales, versions)
   - Direct database manipulation would bypass Payload's internal logic
   - Payload's Local API ensures data integrity and proper handling of all features

3. **Collection Dependencies**

   ```
   Users (independent)
   Media (independent - references R2 files)
   Downloads (independent - references R2 files)
   Posts (depends on Media)
   Documentation (depends on Media)
   Courses (depends on Media, Downloads)
   CourseLessons (depends on Courses, Downloads)
   CourseQuizzes (depends on CourseLessons)
   QuizQuestions (depends on CourseQuizzes)
   Surveys (depends on CourseLessons)
   SurveyQuestions (depends on Surveys)
   ```

</situation>

<instructions>

## Your Task

1. Validate the audit conclusions in reports/2025-09-30/payload-seed-audit-report.md. I want you to validate the current state of the json files
2. Validate the conclusion of reports/2025-09-30/payload-seeding-approach-analysis.md that we should adopt the API approach

</instructions>
