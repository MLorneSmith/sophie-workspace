# Payload CMS Schema Testing Plan

## Overview

This plan outlines a strategy for safely testing historical commits that require schema changes to the Supabase database, while ensuring we can restore the current branch and database state afterward.

## Background

During our investigation of the Payload CMS custom component importMap issue, we encountered schema compatibility issues with three of the four commits we tested:

1. cd19c9 (Remove Cloudflare R2 Configuration)
2. 496c4b (payload custom components)
3. eedae5 (Survey system: Self-Assessment)

These commits showed schema change warnings that would result in data loss, preventing us from fully testing the custom components functionality.

## Approach: Using Content Migration System

We can leverage the existing content migration system to:

1. Backup the current database content
2. Apply schema changes for testing historical commits
3. Restore the original database content after testing

## Detailed Plan

### 1. Preparation Phase

#### 1.1 Create a Backup Database

```bash
# Create a backup database in Supabase
supabase db dump -f backup_before_testing.sql
```

#### 1.2 Backup Current Content

```bash
# Create a content backup using the migration system
pnpm --filter @kit/content-migrations backup:content
```

This will require creating a new script in the content-migrations package:

```typescript
// packages/content-migrations/src/scripts/backup-content.ts
import fs from 'fs';
import path from 'path';

import { getPayloadClient } from '../utils/payload-client.js';

const COLLECTIONS_TO_BACKUP = [
  'documentation',
  'posts',
  'testimonials',
  // Add other collections as needed
];

async function backupContent() {
  console.log('Starting content backup...');

  const client = await getPayloadClient('development');
  const backupDir = path.resolve(__dirname, '../../backups');

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Backup each collection
  for (const collection of COLLECTIONS_TO_BACKUP) {
    console.log(`Backing up collection: ${collection}`);

    try {
      const { docs } = await client.find({ collection, limit: 1000 });

      // Write backup to file
      const backupFile = path.join(backupDir, `${collection}_backup.json`);
      fs.writeFileSync(backupFile, JSON.stringify(docs, null, 2));

      console.log(
        `Backed up ${docs.length} documents from ${collection} to ${backupFile}`,
      );
    } catch (error) {
      console.error(`Error backing up collection ${collection}:`, error);
    }
  }

  console.log('Content backup completed!');
}

backupContent().catch(console.error);
```

### 2. Testing Historical Commits

For each commit we want to test:

#### 2.1 Checkout the Historical Commit

```bash
# Checkout the historical commit
git checkout <commit-hash>

# Install dependencies
pnpm install
```

#### 2.2 Apply Schema Changes

```bash
# Apply schema changes to the database
cd apps/payload
pnpm payload migrate:refresh
```

This will reset the database schema to match the schema defined in the historical commit.

#### 2.3 Test Custom Components

Now we can test the custom components functionality without schema compatibility issues:

```bash
# Start the Payload CMS server
pnpm dev
```

#### 2.4 Document Findings

Document the findings for each commit, focusing on:

- Whether the custom component input card displays correctly
- Whether saved content with components can be viewed
- Any errors related to the importMap

### 3. Restoration Phase

After testing, we need to restore the current branch and database state:

#### 3.1 Return to Main Branch

```bash
# Return to the main branch
git checkout main

# Install dependencies
pnpm install
```

#### 3.2 Restore Database Schema

```bash
# Apply current schema to the database
cd apps/payload
pnpm payload migrate:refresh
```

#### 3.3 Restore Content

Create a new script to restore the content from our backup:

```typescript
// packages/content-migrations/src/scripts/restore-content.ts
import fs from 'fs';
import path from 'path';

import { getPayloadClient } from '../utils/payload-client.js';

const COLLECTIONS_TO_RESTORE = [
  'documentation',
  'posts',
  'testimonials',
  // Add other collections as needed
];

async function restoreContent() {
  console.log('Starting content restoration...');

  const client = await getPayloadClient('development');
  const backupDir = path.resolve(__dirname, '../../backups');

  // Restore each collection
  for (const collection of COLLECTIONS_TO_RESTORE) {
    console.log(`Restoring collection: ${collection}`);

    try {
      const backupFile = path.join(backupDir, `${collection}_backup.json`);

      if (!fs.existsSync(backupFile)) {
        console.warn(`Backup file not found for collection ${collection}`);
        continue;
      }

      const docs = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

      // Clear existing content
      console.log(`Clearing existing content from ${collection}...`);
      // This would require implementing a deleteAll method or similar

      // Restore content from backup
      console.log(`Restoring ${docs.length} documents to ${collection}...`);

      for (const doc of docs) {
        const { id, ...data } = doc;
        await client.create({ collection, data });
      }

      console.log(`Restored ${docs.length} documents to ${collection}`);
    } catch (error) {
      console.error(`Error restoring collection ${collection}:`, error);
    }
  }

  console.log('Content restoration completed!');
}

restoreContent().catch(console.error);
```

Run the restoration script:

```bash
# Restore content from backup
pnpm --filter @kit/content-migrations restore:content
```

### 4. Alternative Approach: Using a Separate Test Database

If the above approach is too risky or complex, we can use a separate test database:

#### 4.1 Create a Test Database

```bash
# Create a new test database in Supabase
supabase db create test_database
```

#### 4.2 Configure Environment Variables

Create a `.env.test` file in the content-migrations package:

```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/test_database
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
```

#### 4.3 Test with the Test Database

Update the Payload CMS configuration to use the test database when testing historical commits.

## Implementation Plan

1. Create the backup and restore scripts in the content-migrations package
2. Test the backup and restore process with a small subset of data
3. Create a shell script to automate the testing process for each commit
4. Execute the testing process for each commit
5. Document findings and compare results

## Risks and Mitigations

| Risk                                          | Mitigation                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Data loss during schema changes               | Create comprehensive backups before testing                                           |
| Incompatible data structures between versions | Use the transformData option in the migration system to handle structural differences |
| Time-consuming process                        | Automate as much as possible with scripts                                             |
| Complex restoration process                   | Test the restoration process thoroughly before applying to production data            |

## Conclusion

This plan provides a structured approach to safely testing historical commits that require schema changes, while ensuring we can restore the current branch and database state afterward. By leveraging the existing content migration system, we can minimize risks and maximize the effectiveness of our testing.
