# Content Migration

## Migration System

Our content migration system consists of several components:

1. **PowerShell Orchestration**: `reset-and-migrate.ps1` script
2. **Phase Modules**: Setup, Processing, Loading, Verification
3. **Migration Scripts**: SQL and TypeScript migrations
4. **Verification Tools**: Database state verification

## Migration Workflow

The migration process follows these phases:

1. **Setup Phase**
   - Reset Supabase database
   - Run web app migrations
   - Reset Payload schema
   - Run Payload migrations

2. **Processing Phase**
   - Process raw data
   - Generate SQL seed files
   - Fix references

3. **Loading Phase**
   - Run content migrations
   - Migrate specialized content
   - Fix UUID tables
   - Import downloads
   - Fix relationships

4. **Verification Phase**
   - Verify database state
   - Create storage buckets
   - Verify content integrity

## Running Migrations

Use the main orchestration script:

```powershell
./scripts/reset-and-migrate.ps1
```

With options:

```powershell
./scripts/reset-and-migrate.ps1 -ForceRegenerate -SkipVerification
```

## Remote Migration

For migrating to remote environments:

```powershell
./scripts/remote-migration/content/migrate-content-progressive.ps1
```

With options:

```powershell
./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipCore -SkipPosts -SkipVerify
```

## Migration Scripts

### Payload Migrations

Payload migrations are TypeScript files that modify the database schema:

```typescript
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.schema.alterTable('posts', (table) => {
    table.string('seo_title').nullable();
    table.text('seo_description').nullable();
  });
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.schema.alterTable('posts', (table) => {
    table.dropColumn('seo_title');
    table.dropColumn('seo_description');
  });
}
```

### SQL Seed Files

SQL seed files populate the database with initial content:

```sql
-- Insert categories
INSERT INTO payload.categories (id, title, created_at, updated_at)
VALUES 
  ('cat_001', 'Technology', NOW(), NOW()),
  ('cat_002', 'Business', NOW(), NOW()),
  ('cat_003', 'Design', NOW(), NOW());

-- Insert posts
INSERT INTO payload.posts (id, title, content, author, category, status, created_at, updated_at)
VALUES 
  ('post_001', 'Getting Started', '{"type":"doc","content":[...]}', 'user_001', 'cat_001', 'published', NOW(), NOW());
```

### Relationship Repair

Scripts to fix relationship inconsistencies:

```typescript
import { getPayloadClient } from '../utils/payload-client';

async function repairRelationships() {
  const payload = await getPayloadClient();
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    depth: 0,
  });
  
  // Fix category relationships
  for (const post of posts.docs) {
    if (post.category) {
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          category: post.category,
        },
      });
      
      console.log(`Fixed category relationship for post ${post.id}`);
    }
  }
}

repairRelationships().catch(console.error);
```

## Verification Tools

Tools to verify database state after migration:

```typescript
import { getPayloadClient } from '../utils/payload-client';
import { getSupabaseClient } from '../utils/supabase-client';

async function verifyContentIntegrity() {
  const payload = await getPayloadClient();
  const supabase = getSupabaseClient();
  
  // Verify posts
  const posts = await payload.find({
    collection: 'posts',
    depth: 0,
  });
  
  console.log(`Found ${posts.docs.length} posts`);
  
  // Verify relationships
  const { data: relationships, error } = await supabase
    .from('payload_posts_rels')
    .select('*');
    
  if (error) {
    console.error('Error fetching relationships:', error);
    process.exit(1);
  }
  
  console.log(`Found ${relationships.length} post relationships`);
  
  // Check for inconsistencies
  const missingRelationships = posts.docs.filter(post => 
    post.category && !relationships.some(rel => 
      rel.parent_id === post.id && rel.path === 'category'
    )
  );
  
  if (missingRelationships.length > 0) {
    console.error(`Found ${missingRelationships.length} posts with missing relationships`);
    process.exit(1);
  }
  
  console.log('All content verified successfully');
}

verifyContentIntegrity().catch(console.error);
```

## Best Practices

1. **Single Source of Truth**: Use designated SSOT files for content relationships
2. **Atomic Operations**: Ensure relationship data is consistent between tables
3. **Verification**: Always verify database state after migration
4. **Idempotency**: Make migrations idempotent to allow for retries
5. **Rollback**: Implement rollback mechanisms for failed migrations
6. **Progressive Migration**: Use progressive migration for large datasets
7. **Logging**: Implement detailed logging for debugging
8. **Error Handling**: Handle errors gracefully and provide clear error messages
