# Seeding Payload

<role>
Read .claude/context/team/roles/data-engineer.md
</role>

<context>

1. Read .claude/context/data/migrations/overview.md
2. Read .claude/context/tools/cli/supabase-cli.md
3. Read .claude/context/data/relationship-tables-management.md
4. Read .claude/context/data/migrations/patterns.md

</context>

<situation>
## Our goal and previous challenges
In the past we have run into difficulties seeding the payload schema with our payload data. We have run into all sorts of nextjs errors. Additionally, various collections have relationships with other payload collections - setting this up correctly has been a challenge.

Our task is to implement an approach which successfully seeds the payload schema of supabase locally through SQL files.

## Resetting Payload Locally

We have a Payload Reset claude code slash command (.claude/commands/database/supabase-reset.md) that works at resetting the local database (we have not yet tested resetting the remote instance of supabase). The database is reset without errors.

Our next task is to ensure payload is properly setup to seed the payload schema with the correct data.

## Previous Progress

We have worked on this task previously, but it is unclear exaclty how far we got at completing the work. We have an old document which is likely to be quite out of date.

Read: .claude/scratch/payload-seed-protocol-design.md

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

Use the .claude/agents/database/supabase-expert.md subagent as necessary

## Your Task

1. Conduct an audit of what has been completed so far
   1. Is apps/payload/src/seed/seed-data an accurate dataset based on the data in apps/payload/src/seed/seed-data-raw? If not, is it partially complete? Does it include relationships? What is it's status?
   2. Do the sql files in .claude/scratch/payload-seed-working come from the data in apps/payload/src/seed/seed-data? Are they complete? What are their status?
2. Evaluate .claude/scratch/payload-seed-protocol-design.md. What is the document describing? How out of date is it? Is it necessary and should we update it?
3. What stage of the raw data -> json files -> sql files pipeline do we need to focus on fixing?
4. Based on what dataset is accurate and complete we then need to develop a plan for creating complete and accurate sql files

</instructions>
