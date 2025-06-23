# Comprehensive Content Migration System Guide

## System Overview

The content migration system is designed to reliably transfer content from various sources into the Payload CMS database. It follows a structured approach with distinct phases to ensure data integrity and consistency.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Setup Phase   │────>│ Processing Phase│────>│  Loading Phase  │────>│Verification Phase│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │                       │
        ▼                       ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Database Reset  │     │  Data Processing│     │Content Migration │     │  Data Integrity │
│ Schema Creation │     │  SQL Generation │     │Relationship Fixes│     │    Verification │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Core Components

### Main Orchestration Script

The `reset-and-migrate.ps1` script is the primary entry point for the migration process:

```powershell
./scripts/reset-and-migrate.ps1 [options]
```

Options:

- `-ForceRegenerate`: Force regeneration of processed data
- `-SkipVerification`: Skip verification steps
- `-Verbose`: Enable verbose output

### Phase Modules

#### Setup Phase

The setup phase prepares the database environment:

```powershell
./scripts/orchestration/phases/setup.ps1
```

Key functions:

- `Reset-SupabaseDatabase`: Reset the Supabase database
- `Reset-PayloadSchema`: Reset the Payload schema
- `Run-PayloadMigrations`: Run Payload migrations

#### Processing Phase

The processing phase transforms raw data into SQL seed files:

```powershell
./scripts/orchestration/phases/processing.ps1 [options]
```

Options:

- `-ForceRegenerate`: Force regeneration of processed data

Key functions:

- `Process-RawData`: Process raw data files
- `Generate-SqlSeedFiles`: Generate SQL seed files
- `Fix-References`: Fix references between entities

#### Loading Phase

The loading phase populates the database with content:

```powershell
./scripts/orchestration/phases/loading.ps1 [options]
```

Options:

- `-SkipVerification`: Skip verification steps

Key functions:

- `Run-ContentMigrations`: Run content migrations
- `Migrate-BlogPosts`: Migrate blog posts
- `Fix-UuidTables`: Fix UUID tables
- `Fix-Relationships`: Fix relationships

#### Verification Phase

The verification phase ensures data integrity:

```powershell
./scripts/orchestration/phases/verification.ps1
```

Key functions:

- `Verify-DatabaseState`: Verify database state
- `Verify-PostsContent`: Verify posts content
- `Verify-Relationships`: Verify relationships

## Remote Migration

For migrating content to remote environments:

```powershell
./scripts/remote-migration/content/migrate-content-progressive.ps1 [options]
```

Options:

- `-SkipCore`: Skip core tables migration
- `-SkipPosts`: Skip posts migration
- `-SkipDocumentation`: Skip documentation migration
- `-SkipCourses`: Skip courses migration
- `-SkipQuizzes`: Skip quizzes migration
- `-SkipSurveys`: Skip surveys migration
- `-SkipDownloads`: Skip downloads migration
- `-SkipUUIDTables`: Skip UUID tables processing
- `-SkipVerify`: Skip verification
- `-UseSupabaseCLI`: Use Supabase CLI for operations
- `-ForceRecreate`: Force recreation of tables

## Relationship Repair

For fixing relationship inconsistencies:

```powershell
./scripts/orchestration/phases/relationship-repair.ps1 [options]
```

Options:

- `-SkipVerification`: Skip verification
- `-ContinueOnError`: Continue on error
- `-VerboseOutput`: Enable verbose output

For better performance:

```powershell
./scripts/orchestration/phases/relationship-repair-simplified.ps1 [options]
```

Options:

- `-SkipVerification`: Skip verification
- `-SkipFallback`: Skip fallback repair
- `-VerboseOutput`: Enable verbose output

## Verification Tools

For verifying remote content:

```powershell
./scripts/remote-migration/content/verify-remote-content.ps1 [options]
```

Options:

- `-VerifyCore`: Verify core tables
- `-VerifyPosts`: Verify posts
- `-VerifyDocumentation`: Verify documentation
- `-VerifyCourses`: Verify courses
- `-VerifyQuizzes`: Verify quizzes
- `-VerifySurveys`: Verify surveys
- `-VerifyDownloads`: Verify downloads
- `-VerifyUUIDTables`: Verify UUID tables
- `-VerifyAll`: Verify all content
- `-VerboseOutput`: Enable verbose output

## Database Reset

For complete database reset:

```bash
./scripts/database-reset/complete-reset-procedure.sh
```

For applying Payload migrations:

```bash
./scripts/database-reset/apply-payload-migrations.sh
```

## WSL Support

For running in Windows Subsystem for Linux:

```bash
./apps/payload/start-wsl.sh
```

## Advanced Features

### Incremental Migration

For large datasets, use incremental migration to process content in manageable chunks:

```powershell
# Step 1: Migrate core tables
./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipPosts -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys -SkipDownloads

# Step 2: Migrate posts
./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipCore -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys -SkipDownloads

# Step 3: Migrate documentation
./scripts/remote-migration/content/migrate-content-progressive.ps1 -SkipCore -SkipPosts -SkipCourses -SkipQuizzes -SkipSurveys -SkipDownloads

# Continue with other content types
```

### Batch Processing

For improved performance with large collections:

```powershell
# Run batch processing with custom batch size
pnpm --filter @kit/content-migrations run migrate:batch-size=100
```

### Parallel Processing

For multi-core systems, enable parallel processing:

```powershell
# Enable parallel processing
pnpm --filter @kit/content-migrations run migrate:parallel
```

### Selective Content Migration

Migrate specific content types or collections:

```powershell
# Migrate only blog posts
pnpm --filter @kit/content-migrations run migrate:collection=posts

# Migrate specific content by ID
pnpm --filter @kit/content-migrations run migrate:id=123456
```

## Performance Optimization

### Database Optimization

Optimize database performance during migration:

```sql
-- Disable triggers temporarily
ALTER TABLE payload.posts DISABLE TRIGGER ALL;

-- Run migration operations

-- Re-enable triggers
ALTER TABLE payload.posts ENABLE TRIGGER ALL;
```

### Memory Management

For large datasets, manage memory usage:

```powershell
# Set memory limit for Node.js
$env:NODE_OPTIONS="--max-old-space-size=8192"
./scripts/reset-and-migrate.ps1
```

### Indexing Strategy

Optimize indexing for faster migrations:

```sql
-- Drop indexes before bulk operations
DROP INDEX IF EXISTS payload.idx_posts_title;

-- Run migration operations

-- Recreate indexes after bulk operations
CREATE INDEX idx_posts_title ON payload.posts(title);
```

## Monitoring and Logging

### Enhanced Logging

Enable detailed logging for troubleshooting:

```powershell
# Enable verbose logging
./scripts/reset-and-migrate.ps1 -Verbose
```

### Progress Tracking

Monitor migration progress:

```powershell
# Track migration progress
pnpm --filter @kit/content-migrations run migrate:with-progress
```

### Performance Metrics

Collect performance metrics during migration:

```powershell
# Enable performance metrics
pnpm --filter @kit/content-migrations run migrate:with-metrics
```

## Security Considerations

### Sensitive Data Handling

Handle sensitive data securely during migration:

```powershell
# Migrate with data masking
pnpm --filter @kit/content-migrations run migrate:with-masking
```

### Access Control

Ensure proper access control during migration:

```powershell
# Run migration with restricted permissions
pnpm --filter @kit/content-migrations run migrate:restricted
```

## Integration with CI/CD

### Automated Migration

Integrate migration with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Content Migration
on:
  workflow_dispatch:
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: ./scripts/reset-and-migrate.ps1
```

### Scheduled Migration

Schedule regular migrations:

```yaml
# Example GitHub Actions scheduled workflow
name: Scheduled Migration
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday at midnight
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: ./scripts/reset-and-migrate.ps1
```

## Best Practices

1. **Use Single Source of Truth**: Always use designated SSOT files for content relationships
2. **Run Full Migration First**: Run the full migration process before attempting incremental updates
3. **Verify After Migration**: Always verify after migration to ensure data integrity
4. **Backup Before Migration**: Always create a backup before running migration scripts
5. **Use Progressive Migration**: For large datasets, use progressive migration
6. **Monitor Performance**: Monitor system performance during migration
7. **Handle Errors Gracefully**: Implement proper error handling
8. **Document Custom Steps**: Document any custom migration steps
9. **Test in Development**: Test migration scripts in development before production
10. **Keep Dependencies Updated**: Keep all dependencies updated

## Troubleshooting

For common issues and solutions, refer to:

- [Content Migration Troubleshooting](./content-migration-troubleshooting.md)
- [Quiz Relationship Troubleshooting](./quiz-relationship-troubleshooting.md)
- [WSL Troubleshooting](./wsl-troubleshooting.md)
- [Database Verification and Repair](./database-verification-repair.md)

## Appendix

### Environment Variables

Key environment variables used by the migration system:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
PAYLOAD_SECRET=your-payload-secret
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Dependency Graph

The migration system has the following key dependencies:

```
reset-and-migrate.ps1
├── setup.ps1
│   ├── database.ps1
│   └── schema.ps1
├── processing.ps1
│   ├── data-processing.ps1
│   └── sql-generation.ps1
├── loading.ps1
│   ├── content-migration.ps1
│   ├── relationship-fix.ps1
│   └── uuid-tables.ps1
└── verification.ps1
    ├── database-verification.ps1
    └── relationship-verification.ps1
```

### Common Error Codes

| Error Code | Description                | Resolution                                |
| ---------- | -------------------------- | ----------------------------------------- |
| E001       | Database connection failed | Check database credentials and connection |
| E002       | Schema creation failed     | Check database permissions                |
| E003       | Data processing failed     | Check raw data format                     |
| E004       | SQL generation failed      | Check SQL templates                       |
| E005       | Content migration failed   | Check migration scripts                   |
| E006       | Relationship fix failed    | Run relationship repair script            |
| E007       | Verification failed        | Check verification logs                   |
