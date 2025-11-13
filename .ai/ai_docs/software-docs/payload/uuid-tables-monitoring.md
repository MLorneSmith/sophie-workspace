# UUID Tables Monitoring System

## Overview

This document explains the UUID Tables Monitoring System that was implemented to fix the "column X.path does not exist" errors that occur in Payload CMS when using dynamic relationship tables.

## How It Works

The system consists of three main components:

1. **Tracking Table**: `payload.dynamic_uuid_tables` stores information about UUID-named tables.
2. **Scanner Function**: `payload.scan_and_fix_uuid_tables()` adds required columns to UUID tables.
3. **Event Trigger** (optional): `payload_new_uuid_table_trigger` automatically fixes new tables as they're created.

## Event Trigger Warning

During migration, you may see this warning:

```
Could not create event trigger - may require superuser privileges
This is not critical as the scanner function will still work
```

### Why This Happens

The event trigger requires PostgreSQL superuser privileges to create, which are typically not available in:

- Local development environments
- Managed PostgreSQL services
- Supabase environments

### Is This a Problem?

**No**. The warning is normal and expected. The system is designed to work without the event trigger:

1. The migration automatically runs the scanner on all existing tables
2. The `fix-uuid-tables.ts` script can be run manually if needed
3. The `run-uuid-tables-fix.ts` script runs during migrations

### What If Tables Aren't Fixed?

If you encounter "column X.path does not exist" errors:

1. Run the migration again: `pnpm --filter=payload migrate`
2. Or run the fix script: `pnpm --filter=@kit/content-migrations run fix:uuid-tables`

## Version Compatibility

This system works with Payload CMS 3.32.0 and later. It's fully compatible with Payload CMS 3.33.0.
