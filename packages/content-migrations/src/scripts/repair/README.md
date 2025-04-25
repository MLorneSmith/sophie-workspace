# Payload CMS Repair Scripts

This directory contains scripts to repair and fix various issues in the Payload CMS database and content structure.

## Database Repair Scripts

### Enhanced UUID Table Management

Located in `database/` directory:

- **enhanced-uuid-detection.ts**: Detects all UUID-pattern tables at runtime using regex
- **enhanced-column-management.ts**: Adds missing columns to UUID tables
- **fix-uuid-tables-enhanced.ts**: Main entry point that runs the complete UUID table fix

Run with:

```bash
pnpm --filter @kit/content-migrations fix:uuid-tables-enhanced
```

### Relationship Fallbacks

Located in `relationships/` directory:

- **create-relationship-fallbacks.ts**: Creates database views, functions, and JSON mapping files to provide multiple fallback mechanisms for relationship data

Run with:

```bash
pnpm --filter @kit/content-migrations create:relationship-fallbacks
```

## Quiz Management Scripts

### Comprehensive Quiz Fix

Located in `quiz-management/core/` directory:

- **comprehensive-quiz-fix.ts**: Fixes quiz-question relationships by ensuring consistent data in both quiz's questions array and relationship tables

Run with:

```bash
pnpm --filter @kit/content-migrations fix:comprehensive-quiz-fix
```

## Integration with Content Migration

To integrate these repairs into the content migration process, add the following to the appropriate phase in the `reset-and-migrate.ps1` script:

```powershell
# After schema creation
Write-Output "Fixing UUID tables..."
pnpm --filter @kit/content-migrations fix:uuid-tables-enhanced

# After content loading
Write-Output "Verifying and repairing relationship integrity..."
pnpm --filter @kit/content-migrations fix:comprehensive-quiz-fix
pnpm --filter @kit/content-migrations create:relationship-fallbacks
```

## Usage Notes

- These scripts should be run in the order listed above
- Scripts use transactions where possible to ensure database integrity
- Each script provides detailed logging to help diagnose issues
- All scripts are designed to be idempotent (can be run multiple times without side effects)

## Troubleshooting

If you encounter issues:

1. Check the database connection in `.env.development`
2. Verify that the Payload schema exists
3. Check the migration logs for specific errors
4. Run the `diagnostic:table-counts` script to get a quick overview of table status

## Further Documentation

For more details on the specific issues these scripts address and the implementation plan, see:

- `z.plan/payload-issues/payload-content-display-fix-plan.md`
- `z.plan/payload-issues/payload-content-fix-implementation-plan.md`
