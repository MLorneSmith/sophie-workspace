# Payload CMS Custom Component ImportMap Issue: Comprehensive Analysis and Testing Plan

## Problem Statement

We've encountered a persistent issue with custom components in the Payload CMS Lexical editor. The issue manifests as a "Catch-22" situation where:

**Scenario 1: Editable But Can't View Saved Content**

- When the importMap lacks `"./Component#default": BunnyVideoComponent`
- ✅ Input card renders properly in editor, allowing users to add/edit components
- ❌ Error when viewing saved content: `Error: getFromImportMap: PayloadComponent not found in importMap {key: "./Component#default"...}`

**Scenario 2: Can View Saved Content But Can't Edit**

- When the importMap includes `"./Component#default": BunnyVideoComponent`
- ✅ Saved content loads without errors
- ❌ Input card doesn't display in editor, making it impossible to add/edit new components

This issue affects all three custom components: BunnyVideo, CallToAction, and TestBlock.

## Root Cause Analysis

The root cause appears to be a **dual component resolution system** in Payload CMS 3.29.0:

1. **UI Field Component Resolution**:

   - During editing, Payload renders components as UI fields with specific props
   - These components are resolved using the path specified in `admin.components.Block`
   - They receive UI field props including schema information

2. **Block Data Component Resolution**:

   - When viewing saved content, Payload renders components with the actual block data
   - These components are resolved using a fixed path pattern `"./Component#default"`
   - They receive the block data directly

3. **ImportMap Conflict**:
   - The importMap can only map `"./Component#default"` to a single component
   - When multiple components need this same mapping, a conflict occurs

## Investigation Approach

We've investigated whether previous commits had working custom components by:

1. Creating branches from specific historical commits
2. Testing each branch for component functionality
3. Documenting findings to identify when/if components worked correctly

### Commits Investigated

| Commit | Description                        | Schema Compatible | Input Card Displays | View Saved Content | Notes                                     |
| ------ | ---------------------------------- | ----------------- | ------------------- | ------------------ | ----------------------------------------- |
| cd19c9 | Remove Cloudflare R2 Configuration | ❌ No             | Not tested          | Not tested         | Schema changes prevented testing          |
| 496c4b | payload custom components          | ❌ No             | Not tested          | Not tested         | Schema changes prevented testing          |
| eedae5 | Survey system: Self-Assessment     | ❌ No             | Not tested          | Not tested         | Schema changes prevented testing          |
| 940f4f | Course system                      | ✅ Yes            | ✅ Yes              | ❌ No              | ImportMap error for viewing saved content |

### Key Findings

1. **Commit 940f4f (Course system)** shows the most promising results:

   - The custom component input card displays correctly in the editor
   - However, there's an importMap error when trying to view saved content
   - This matches "Scenario 1" from our issue analysis

2. **Schema Compatibility Issues**:

   - Three of the four commits had schema compatibility issues that prevented full testing
   - This suggests significant database schema changes between these commits and the current state

3. **ImportMap Error Pattern**:
   - The error in commit 940f4f is consistent with the described issue:
     ```
     Error: getFromImportMap: PayloadComponent not found in importMap {
       key: "./Component#default"
       PayloadComponent: "./Component#default"
       schemaPath: "./Component#default"
     }
     ```

### Test Results Documentation

We have completed testing for commit 940f4fba6f3b4b83fe935b7856067c257a350cdb and documented our findings in detail at:

- [940f4fba Test Results](../z.test/payload-component-test/940f4fba-test-results.md)

The test results confirm our analysis of Scenario 1 (components are editable but saved content can't be viewed). Key findings include:

1. Custom components can be successfully added to posts in the Payload CMS admin interface.
2. The components are properly saved in the database and included in the API response.
3. However, there are errors in the console logs about the importMap not being generated correctly:
   ```
   getFromImportMap: PayloadComponent not found in importMap
   You may need to run the `payload generate:importmap` command to generate the importMap ahead of runtime.
   ```

This confirms that the issue is specifically with the importMap generation process, not with the overall custom components functionality.

## Comprehensive Testing Plan for Schema-Changing Commits

To fully evaluate all commits, including those requiring schema changes, we need a safe way to test without risking data loss in our production database.

### Approach: Using Content Migration System

We can leverage the existing content migration system to:

1. Backup the current database content
2. Apply schema changes for testing historical commits
3. Restore the original database content after testing

### Detailed Testing Plan

#### 1. Preparation Phase

##### 1.1 Backup Database Schema and Data

We can use the Supabase CLI to create a complete backup of the local database:

```bash
# Create a full backup (schema and data) of the local database
supabase db dump -f backup_before_testing.sql
```

This command creates a SQL dump file that contains both the schema and data, which can be used to restore the database later.

##### 1.2 Backup with Additional Options (Optional)

For more control over the backup process, you can use additional options:

```bash
# Backup only data (no schema)
supabase db dump --data-only -f data_backup.sql

# Backup specific schemas
supabase db dump -s public,auth -f schema_backup.sql

# Exclude specific tables
supabase db dump --data-only -x public.large_table1,public.large_table2 -f filtered_backup.sql

# Use COPY statements for faster data loading during restore
supabase db dump --use-copy -f fast_restore_backup.sql
```

#### 2. Testing Historical Commits

For each commit we want to test:

##### 2.1 Checkout the Historical Commit

```bash
# Checkout the historical commit
git checkout <commit-hash>

# Install dependencies
pnpm install
```

##### 2.2 Apply Schema Changes

```bash
# Apply schema changes to the database
cd apps/payload
pnpm payload migrate:refresh
```

This will reset the database schema to match the schema defined in the historical commit.

##### 2.3 Test Custom Components

Now we can test the custom components functionality without schema compatibility issues:

```bash
# Start the Payload CMS server
pnpm dev
```

##### 2.4 Document Findings

Document the findings for each commit, focusing on:

- Whether the custom component input card displays correctly
- Whether saved content with components can be viewed
- Any errors related to the importMap

#### 3. Restoration Phase

After testing, we need to restore the current branch and database state:

##### 3.1 Return to Main Branch

```bash
# Return to the main branch
git checkout main

# Install dependencies
pnpm install
```

##### 3.2 Restore Database Schema

```bash
# Apply current schema to the database
cd apps/payload
pnpm payload migrate:refresh
```

##### 3.3 Restore Database from Backup

After testing, we can restore the database from our backup:

```bash
# Stop the Supabase stack
supabase stop

# Start Supabase with a clean slate
supabase start

# Restore from the backup file
psql --single-transaction --variable ON_ERROR_STOP=1 --file backup_before_testing.sql --dbname "postgresql://postgres:postgres@localhost:54322/postgres"
```

The `psql` command restores the database from the SQL dump file we created earlier. The `--single-transaction` flag ensures that the restore is atomic, and the `ON_ERROR_STOP=1` variable makes sure the process stops if any errors occur.

#### 4. Alternative Approach: Using a Separate Test Environment

If the above approach is too risky or complex, we can use a separate test environment:

##### 4.1 Set Up a Separate Local Development Environment

Create a separate directory for testing:

```bash
# Create a test directory
mkdir payload-test
cd payload-test

# Clone the repository
git clone https://github.com/your-repo/your-project.git .

# Initialize Supabase
supabase init

# Start Supabase
supabase start
```

##### 4.2 Configure Environment Variables

Create a `.env.test` file in the content-migrations package:

```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
```

##### 4.3 Test with the Separate Environment

This approach provides complete isolation from your main development environment, allowing you to freely test historical commits without risking data loss.

##### 4.4 Schema Prefixing (Alternative)

Another approach is to use schema prefixing within the same database:

```sql
-- Create a test schema
CREATE SCHEMA test;

-- Set the search path to use the test schema
SET search_path TO test, public;
```

This allows you to keep test data separate from your main data while using the same database.

## Next Steps

1. **Implement the Schema Testing Plan**

   - Create the backup and restore scripts in the content-migrations package
   - Test the backup and restore process with a small subset of data
   - Create a shell script to automate the testing process for each commit

2. **Focus on Commit 940f4f**

   - Examine the custom component implementation in this commit in detail
   - Understand how components are registered and how the importMap is generated
   - Identify what makes the input card display correctly

3. **Test with a Separate Database**
   - Set up a separate test database for safely testing historical commits
   - Configure the environment variables to use the test database
   - Test the solution with the test database before applying to production

## Technical Context for AI Coding Assistant

### Project Structure

This is a Next.js 15 application using Turborepo with Payload CMS integrated. The key directories are:

- `apps/payload/`: Contains the Payload CMS application
- `apps/web/`: Contains the Next.js web application
- `packages/cms/payload/`: Contains the Payload CMS integration package
- `packages/content-migrations/`: Contains utilities for migrating content

### Payload CMS Custom Components

Custom components in Payload CMS are used in the Lexical rich text editor. They allow for specialized content blocks like videos, call-to-actions, etc. The components need to work in two contexts:

1. **Editing Mode**: When users are adding/editing components in the admin UI
2. **Viewing Mode**: When the saved content is displayed in the frontend

### ImportMap System

Payload CMS uses an importMap to resolve components at runtime. The importMap is generated during the build process and maps component paths to their implementations. The issue we're facing is that the importMap has different requirements for editing mode vs. viewing mode.

### Content Migration System

The content migration system provides utilities for migrating content between environments. It includes:

- A PayloadClient that can interact with the Payload CMS API
- Scripts for migrating collections from local to remote databases
- Utilities for transforming content during migration

This system can be leveraged to safely test historical commits by backing up and restoring content.

### Database Schema Changes

The schema changes between commits include:

- Adding/removing tables for courses, lessons, quizzes, surveys, etc.
- Modifying existing tables with new columns or constraints
- Changing relationships between tables

These changes can result in data loss if applied without proper migration, which is why we need a careful testing approach.
