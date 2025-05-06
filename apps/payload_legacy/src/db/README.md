# Database Helpers

This directory contains database utility functions for working with Payload CMS.

## Relationship Helpers

The `relationship-helpers.ts` file implements a robust multi-tiered approach to working with relationships between collections, particularly downloads. This system was created to solve persistent "column X.path does not exist" errors with dynamic UUID tables.

### Key Functions:

- `getDownloadsForCollection`: Get all downloads related to a collection
- `collectionHasDownload`: Check if a specific download is related to a collection
- `findDownloadsForCollection`: Get full download documents related to a collection

### Multi-Tiered Approach

The system uses a four-tier fallback strategy for maximum resilience:

1. **View-Based Approach**: First tries to use the custom `downloads_relationships` view
2. **API-Based Approach**: Falls back to Payload's API with minimal depth settings
3. **Direct SQL Approach**: Falls back to direct SQL queries against specific tables
4. **Predefined Mappings**: Falls back to hardcoded relationships as last resort

### Usage

Always use these helper functions rather than direct SQL or direct Payload API calls:

```typescript
import { getDownloadsForCollection } from '../db/downloads'

async function getDownloads(payload, collectionId, collectionType) {
  // This will automatically use the most resilient approach
  const downloadIds = await getDownloadsForCollection(payload, collectionId, collectionType)

  // Do something with the download IDs
  console.log(`Found ${downloadIds.length} downloads`)
}
```

### Diagnostics

If you encounter relationship issues, use the diagnostic script:

```bash
pnpm tsx src/scripts/diagnose-downloads.ts documentation doc-123
```

This will provide a detailed report on the status of relationship tables, UUID tables, and access methods for the specified collection item.

## Implementation Details

The system relies on several database components created by migrations:

1. **Downloads Relationships View**: A unified view of all relationships
2. **Dynamic UUID Tables Tracking**: A registry of all UUID-pattern tables
3. **Helper Functions**: Database functions for relationship access
4. **PostgreSQL Trigger**: Automatic column addition for new UUID tables

For developers working on these functions, refer to the comprehensive documentation in `z.old/payload-migrations/18-proactive-uuid-table-trigger-and-multi-tier-fallback-plan.md` for design details.
