# Chore: Update building_blocks_submissions seed data

## Chore Description

Update the seed data for the `building_blocks_submissions` table to reflect the current entry in the local database. The existing seed entry (assigned to `f47ac10b-58cc-4372-a567-0e02b2c3d479` / test2@slideheroes.com) should be replaced with the new entry (assigned to `31a03e74-1639-45b6-bfa7-77447f1a4762` / test1@slideheroes.com) which uses the updated TipTap JSON format for the situation, complication, and answer fields.

## Relevant Files

Use these files to resolve the chore:

- **`apps/web/supabase/seeds/01_main_seed.sql`** - Main seed file containing the `building_blocks_submissions` INSERT statement (lines 394-400). This is the primary file that needs updating.
- **`apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`** - Table schema definition for reference. Shows the structure with columns: id, user_id, title, audience, presentation_type, question_type, situation, complication, answer, outline, created_at, updated_at.

## Impact Analysis

### Dependencies Affected

- No code dependencies affected - this is purely a seed data update
- No TypeScript types need regeneration - table schema unchanged
- No application code changes required

### Risk Assessment

**Low Risk**:
- Simple seed data update affecting only local development environment
- No schema changes involved
- No migration required
- Only affects `pnpm supabase:web:reset` behavior

### Backward Compatibility

- Fully backward compatible - only changes initial seed data
- Existing databases unaffected (seed only runs on reset)
- No migration path needed

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/update-blocks-seed-data`
- [ ] Verify local Supabase is running
- [ ] Backup current seed file (optional - git tracked)

## Documentation Updates Required

- None - this is a seed data update only

## Rollback Plan

- Revert the changes to `01_main_seed.sql` via git
- Run `pnpm supabase:web:reset` to restore previous seed data

## Step by Step Tasks

### Step 1: Update the building_blocks_submissions seed INSERT

Replace the existing `building_blocks_submissions` INSERT statement in `apps/web/supabase/seeds/01_main_seed.sql` (lines 394-400) with the new data.

**Current data (to be replaced):**
- User: `f47ac10b-58cc-4372-a567-0e02b2c3d479` (test2@slideheroes.com)
- Audience: `Executives`
- JSON format: Lexical editor format (`{"root":{"children":[...]}}`)

**New data:**
- User: `31a03e74-1639-45b6-bfa7-77447f1a4762` (test1@slideheroes.com)
- Audience: `Board of Directors`
- JSON format: TipTap editor format (`{"type":"doc","content":[...]}`)
- Note: `outline` and `storyboard` fields are NULL in the new entry

**New INSERT statement:**
```sql
INSERT INTO "public"."building_blocks_submissions" ("id", "user_id", "title", "audience", "presentation_type", "question_type", "situation", "complication", "answer", "outline", "created_at", "updated_at") VALUES
  ('164470db-3d9c-4940-9968-40a93078d0f8', '31a03e74-1639-45b6-bfa7-77447f1a4762', 'Turnaround plan for Global Universal Bank', 'Board of Directors', 'Consulting Presentation', 'What should we do?',
  '{"type":"doc","content":[{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Global Universal Bank is 150 years old and one of the largest banks in the world."}]}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Global Universal Bank''s revenue growth has stalled, expenses ballooned, and ROE is bad."}]}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Rumors are flying that the CEO and the CFO could be fired by the Board."}]}]}]}]}',
  '{"type":"doc","content":[{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"There is a Board meeting next month and they want answers"}]}]}]}]}',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Global Universal Bank can cut costs by close to $50 million per year"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Streamline central functional activities to save $25MM per year"}]}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Close 25% of rural, low use branches to save $15MM"}]}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Increase branch efficiencies to save $10MM per year"}]}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Outsource IT functions to save $5MM per year"}]}]}]}]}',
  NULL,
  '2025-12-11 15:22:33.936274+00', '2025-12-11 15:22:33.936274+00');
```

### Step 2: Reset database and verify seed

Run the database reset to verify the seed applies correctly:

```bash
pnpm supabase:web:reset
```

### Step 3: Verify seed data loaded correctly

Query the database to confirm the new seed entry is present:

```bash
docker exec supabase_db_2025slideheroes-db psql -U postgres -c "SELECT id, user_id, title, audience FROM public.building_blocks_submissions;"
```

Expected output:
- ID: `164470db-3d9c-4940-9968-40a93078d0f8`
- User: `31a03e74-1639-45b6-bfa7-77447f1a4762`
- Title: `Turnaround plan for Global Universal Bank`
- Audience: `Board of Directors`

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Reset database with new seed
pnpm supabase:web:reset

# 2. Verify seed data loaded
docker exec supabase_db_2025slideheroes-db psql -U postgres -c "SELECT id, user_id, title, audience FROM public.building_blocks_submissions;"

# 3. Run typecheck to ensure no breaking changes
pnpm typecheck

# 4. Run lint to verify SQL formatting (if applicable)
pnpm lint
```

## Notes

- The JSON format changed from Lexical (`{"root":{"children":[...]}}`) to TipTap (`{"type":"doc","content":[...]}`) format. This reflects the actual editor format being used in the application.
- The `outline` field is now NULL instead of containing a TipTap document - this may be intentional based on the current application state.
- The `storyboard` column exists in the schema but is NULL in this entry.
- User assignment changed from test2 to test1 user - ensure this aligns with intended test scenarios.
