# Database Health Check Command

## Overview
Comprehensive health check for both local and remote Supabase instances, including Payload schema validation.

## Usage
```
/db-healthcheck [local|remote|all]
```

## Health Check Components

### 1. Core Database Connectivity
- **PostgreSQL Connection**: Test basic connectivity to database
- **Response Time**: Measure query latency
- **Connection Pool**: Check active/idle connections
- **Database Version**: Verify PostgreSQL version compatibility

### 2. Supabase Schema Health
- **Schema Existence**: Verify public, auth, storage, extensions schemas
- **Table Count Validation**: 
  - Public schema: 29-31 tables expected
  - Auth schema: ~16 tables expected
- **RLS Policy Check**: Ensure Row Level Security is enabled
- **Migration Status**: Check pending/failed migrations
- **Seed Data Verification**: Confirm test users exist

### 3. Payload Schema Health
- **Schema Existence**: Verify payload schema exists
- **Table Structure**: Check all Payload collections tables
- **Relationship Integrity**: Verify foreign key constraints
- **UUID Tables**: Check _uuid suffix tables for relationships
- **Migration Status**: Check Payload migration tracking
- **Collection Access**: Test read/write to each collection

### 4. API Endpoint Health
- **Supabase API**: Test REST API connectivity
- **Payload Admin API**: Test /api/health endpoint
- **GraphQL Endpoint**: Verify GraphQL schema loads
- **Storage API**: Check file upload/download capability

### 5. Critical Table Checks
```sql
-- Tables that must exist for proper operation
- payload.payload_migrations
- payload.payload_preferences
- payload.users
- payload.posts
- payload.categories
- payload.media
- public.accounts
- public.subscriptions
- auth.users
```

### 6. Performance Metrics
- **Index Usage**: Check for missing indexes
- **Table Bloat**: Identify tables needing vacuum
- **Slow Queries**: Recent queries >100ms
- **Lock Conflicts**: Check for blocking queries

## Implementation

### Agent Configuration
```yaml
name: db-healthcheck-agent
description: Database health check orchestrator
tools: [Bash, Read, Grep, WebFetch, Task]
```

### Execution Flow

1. **Parse Arguments**
   - Determine scope: local, remote, or all
   - Set environment variables accordingly

2. **Local Health Check**
   ```bash
   # Check Docker/Supabase status
   docker ps | grep supabase
   cd apps/web && pnpm supabase:status
   
   # Direct PostgreSQL tests
   psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT 1"
   
   # Schema verification
   psql -c "SELECT schema_name, COUNT(*) FROM information_schema.tables GROUP BY schema_name"
   
   # Payload schema check
   psql -c "SELECT COUNT(*) FROM payload.payload_migrations"
   ```

3. **Remote Health Check**
   ```bash
   # Use Supabase service role for remote checks
   curl -X GET "$SUPABASE_URL/rest/v1/" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
   
   # Payload health endpoint
   curl -X GET "$PAYLOAD_PUBLIC_SERVER_URL/api/health"
   ```

4. **Payload-Specific Tests**
   ```typescript
   // Test collection accessibility
   const collections = ['posts', 'categories', 'media', 'users'];
   for (const collection of collections) {
     await payload.find({ collection, limit: 1 });
   }
   
   // Verify relationships
   const post = await payload.findByID({ 
     collection: 'posts', 
     id: 'test-id',
     depth: 2 
   });
   ```

5. **Report Generation**
   ```markdown
   ## Database Health Report
   
   ### Summary
   - Status: ✅ Healthy | ⚠️ Warning | ❌ Critical
   - Timestamp: 2025-08-25T10:00:00Z
   - Environment: local/remote
   
   ### Connectivity
   - PostgreSQL: ✅ Connected (12ms)
   - Supabase API: ✅ Available
   - Payload Admin: ✅ Responding
   
   ### Schema Status
   - Public Tables: 30/30 ✅
   - Auth Tables: 16/16 ✅  
   - Payload Tables: 25/25 ✅
   - RLS Policies: 45 active ✅
   
   ### Issues Found
   - ⚠️ Missing index on posts.created_at
   - ⚠️ Table bloat in media (12% bloat)
   
   ### Recommendations
   - Run VACUUM ANALYZE on media table
   - Create index: CREATE INDEX idx_posts_created ON posts(created_at)
   ```

## Error Conditions

### Critical Errors (Stop Immediately)
- Cannot connect to PostgreSQL
- Payload schema missing
- Auth schema corrupted
- More than 5 missing tables

### Warnings (Continue with Caution)
- Missing indexes
- Table bloat >10%
- Slow query detected
- Missing seed data

### Info (Log Only)
- Migration pending
- Cache needs refresh
- Statistics outdated

## Integration with Reset Commands

After any database reset, automatically run:
```bash
/db-healthcheck local --post-reset
```

This will:
1. Verify reset completed successfully
2. Check all schemas rebuilt correctly
3. Confirm seed data loaded
4. Test Payload collections accessible
5. Generate post-reset validation report

## Monitoring Command
```bash
/db-healthcheck --monitor
```

Runs health check every 5 minutes and alerts on:
- Connection failures
- Schema changes
- Performance degradation
- Payload collection errors