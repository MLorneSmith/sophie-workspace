# Payload Migration Rationalization Plan 2025

## Current Issues

The Payload CMS migrations in `apps/payload/src/migrations` need to be rationalized to help with future debugging. Currently, there are several issues:

1. Tables are created in one migration (`base_schema.ts`), but many fields are added later in separate migrations (`add_missing_columns.ts`)
2. Some tables are entirely missing from the base schema and added later (`add_missing_tables.ts`)
3. Field naming issues are fixed in a separate migration (`field_naming.ts`) rather than being correct from the start
4. The migrations are not well organized, making debugging difficult

## Current Migration Structure

Here's the current migration sequence:

1. `20250402_100000_schema_creation.ts` - Creates the payload schema and migrations table
2. `20250402_300000_base_schema.ts` - Creates core tables but with incomplete fields
3. `20250402_305000_seed_course_data.ts` - Seeds initial course data
4. `20250402_310000_relationship_structure.ts` - Creates relationship tables
5. `20250402_320000_field_naming.ts` - Fixes field naming issues (quiz_id_id → quiz_id)
6. `20250402_330000_bidirectional_relationships.ts` - Establishes bidirectional relationships
7. `20250402_340000_add_users_table.ts` - Adds users table and related tables
8. `20250402_350000_create_admin_user.ts` - Creates admin user
9. `20250402_360000_add_missing_tables.ts` - Adds tables that were missing (media, documentation, posts, etc.)
10. `20250402_370000_add_missing_columns.ts` - Adds columns that were missing from existing tables

## Rationalization Plan

We will reorganize these migrations to ensure all SQL related to a specific table is in the same migration file:

1. **Keep schema creation migration unchanged** (`20250402_100000_schema_creation.ts`)

   - This creates the payload schema and migrations table

2. **Enhance base schema migration** (`20250402_300000_base_schema.ts`)

   - Move all table creation SQL from `add_missing_tables.ts` here
   - Move all column additions from `add_missing_columns.ts` to their respective table creation statements
   - Fix field naming issues directly in the table creation (no \_id suffix issues)

3. **Keep seed course data migration unchanged** (`20250402_305000_seed_course_data.ts`)

4. **Enhance relationship structure migration** (`20250402_310000_relationship_structure.ts`)

   - Move relationship table creation from `add_missing_tables.ts` here
   - Include all necessary columns from the start
   - Use correct field names (no \_id suffix issues)

5. **Remove field naming migration** (`20250402_320000_field_naming.ts`)

   - This won't be needed as fields will be correctly named from the start

6. **Keep bidirectional relationships migration** (`20250402_330000_bidirectional_relationships.ts`)

   - But update it to use the correct field names

7. **Keep users table migration unchanged** (`20250402_340000_add_users_table.ts`)

8. **Keep create admin user migration unchanged** (`20250402_350000_create_admin_user.ts`)

9. **Remove add missing tables migration** (`20250402_360000_add_missing_tables.ts`)

   - All tables will be created in the base schema or relationship structure migrations

10. **Remove add missing columns migration** (`20250402_370000_add_missing_columns.ts`)
    - All columns will be added when their tables are created

## Implementation Steps

1. Create backup copies of all migration files
2. Update the base schema migration to include all tables and fields
3. Update the relationship structure migration to include all relationship tables and fields
4. Update the bidirectional relationships migration to use correct field names
5. Remove the field naming, add missing tables, and add missing columns migrations
6. Test the migrations by running the reset-and-migrate.ps1 script

## Benefits

This approach will make the migrations more logical, easier to debug, and ensure that each table is created with all its necessary fields from the start. It will also make future migrations easier to create and maintain.
