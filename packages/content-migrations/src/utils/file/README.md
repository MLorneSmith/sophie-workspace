# File Utilities

This directory contains utilities for file system operations used throughout the content migration system.

## Purpose

These file utilities provide functionality for:

1. Reading and writing files
2. Processing SQL files for execution
3. Managing file paths consistently

## Key Utilities

- `run-sql-file.ts`: Command-line utility for executing SQL files
- `execute-sql-file.ts`: Core function for parsing and executing SQL files

## Usage Examples

### Executing SQL Files

```typescript
import { executeSqlFile } from './execute-sql-file';

// Execute a SQL file
await executeSqlFile('path/to/migration.sql');

// Execute with options
await executeSqlFile('path/to/seed.sql', {
  continueOnError: true,
  logQueries: true,
});
```

### From Command Line

The `run-sql-file.ts` script can be executed directly:

```bash
# Execute a SQL file
pnpm run utils:run-sql-file "path/to/file.sql"
```

## Best Practices

When using these utilities:

1. Always provide absolute paths or paths relative to the current working directory
2. Handle file not found errors appropriately
3. Consider wrapping large SQL file executions in try/catch blocks
4. Use the `logQueries` option for debugging
5. Group related SQL statements in separate files
