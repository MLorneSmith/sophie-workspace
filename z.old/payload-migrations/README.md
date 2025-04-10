# Payload Migrations

This directory contains documentation of past migration efforts and solutions for Payload CMS.

## Latest Solution: Proactive UUID Table Monitoring

The most recent solution (documented in `18-proactive-uuid-table-trigger-and-multi-tier-fallback-plan.md`) comprehensively fixes the "column X.path does not exist" errors in Payload CMS. This error occurs because Payload dynamically creates UUID-named tables for relationships, but they sometimes lack required columns.

### Solution Components:

1. **Proactive PostgreSQL Trigger**:

   - Monitors table creation events in real-time
   - Automatically adds required columns (`path`, etc.) to UUID pattern tables
   - Tracks all UUID tables in a registry for monitoring
   - Eliminates the timing issue by acting at creation time

2. **View-Based Access Pattern**:

   - Creates a unified `downloads_relationships` view for relationship data
   - Abstracts away complex UUID table structure
   - Provides consistent access even as tables change

3. **Multi-Tiered Fallback Strategy**:
   - Implements four-tiered access approach in helper functions
   - Gracefully falls back if primary method fails
   - Always returns valid results instead of throwing errors

### Implementation Files:

- **Migration Files**:

  - `apps/payload/src/migrations/20250410_120500_relationship_columns_fix.ts`
  - `apps/payload/src/migrations/20250420_100000_master_relationship_migration.ts`
  - `apps/payload/src/migrations/20250420_100000_master_relationship_view.ts`
  - `apps/payload/src/migrations/20250425_100000_proactive_uuid_table_monitoring.ts`

- **Helper Functions**:

  - `apps/payload/src/db/relationship-helpers.ts`
  - `apps/payload/src/db/downloads.ts`

- **Diagnostic Tool**:
  - `apps/payload/src/scripts/diagnose-downloads.ts`

### Usage

After deploying the fix:

1. The `reset-and-migrate.ps1` script will automatically apply all migrations
2. Existing UUID tables will be fixed retroactively
3. New UUID tables will get required columns at creation time
4. Helper functions will gracefully handle any remaining edge cases

For diagnostics, use:

```
pnpm tsx apps/payload/src/scripts/diagnose-downloads.ts <collection_type> <collection_id>
```

## Previous Solutions

This directory contains documentation of several previous attempts to fix the UUID table issue:

- `01-downloads-relationship-fix-implementation-plan.md` - Initial approach
- `02-downloads-relationship-uuid-tables-fix-plan.md` - UUID tables specific fix
- ...
- `17-multi-tiered-direct-uuid-approach-implementation-plan.md` - Predecessor to current solution

Each document represents an evolution in our understanding and approach to solving the problem.
