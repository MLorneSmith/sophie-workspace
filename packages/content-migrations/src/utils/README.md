# Utilities

This directory contains utility functions that support the content migration system.

## Purpose

These utilities provide common functionality used across different scripts in the migration system:

1. Database access and SQL execution
2. File operations
3. Payload CMS client interactions
4. Environment variable management

## Subdirectories

- **db/**: Database utilities for SQL execution and schema management
- **file/**: File system utilities for reading, writing, and processing files
- **payload/**: Utilities for interacting with Payload CMS API

## Key Utilities

- `enhanced-payload-client.ts`: A robust client for interacting with Payload CMS with retry logic
- `run-sql-file.ts`: Utility for executing SQL files against the database
- `execute-sql-file.ts`: Core function for SQL file execution
- `check-column-exists.ts`: Utility to check if a column exists in a database table

## Usage Examples

### Executing SQL

```typescript
import { executeSQL } from './db/execute-sql';

// Execute a SQL query
await executeSQL('SELECT * FROM payload.courses LIMIT 1');
```

### Using the Payload Client

```typescript
import { getEnhancedPayloadClient } from './payload/enhanced-payload-client';

// Get a Payload client
const client = await getEnhancedPayloadClient();

// Find documents
const result = await client.find({
  collection: 'courses',
  limit: 10,
});
```

### File Operations

```typescript
import { executeSqlFile } from './file/execute-sql-file';

// Execute a SQL file
await executeSqlFile('path/to/sql/file.sql');
```

## Dependencies

These utilities may require configuration through environment variables in `.env.development` or `.env.production`.
