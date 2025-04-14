# Database Utilities

This directory contains utilities for database operations used throughout the content migration system.

## Purpose

These utilities provide a common interface for:

1. Executing SQL queries and transactions
2. Managing database connections
3. Validating schema structures
4. Checking for table and column existence

## Key Utilities

- `execute-sql.ts`: Core utility for executing SQL queries against the database
- `check-column-exists.ts`: Utility to check if specific columns exist in database tables

## Usage Examples

### Executing SQL Queries

```typescript
import { executeSQL } from '../db/execute-sql';

// Simple query
const result = await executeSQL('SELECT COUNT(*) FROM payload.courses');
console.log(`Found ${result.rows[0].count} courses`);

// Query with parameters
await executeSQL('INSERT INTO payload.courses (id, title) VALUES ($1, $2)', [
  '3f7b8c9d-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
  'New Course Title',
]);

// Transaction example
await executeSQL('BEGIN');
try {
  await executeSQL('UPDATE payload.courses SET title = $1 WHERE id = $2', [
    'Updated Title',
    courseId,
  ]);
  await executeSQL(
    'UPDATE payload.course_lessons SET course_id = $1 WHERE id = $2',
    [courseId, lessonId],
  );
  await executeSQL('COMMIT');
} catch (error) {
  await executeSQL('ROLLBACK');
  throw error;
}
```

### Checking Column Existence

```typescript
import { checkColumnExists } from '../check-column-exists';

// Check if a column exists in a table
const hasColumn = await checkColumnExists('payload', 'course_lessons', 'todo');

if (!hasColumn) {
  console.log('Todo column does not exist, adding it...');
  await executeSQL('ALTER TABLE payload.course_lessons ADD COLUMN todo JSONB');
}
```

## Connection Management

The database utilities automatically manage connections using environment variables:

- `DATABASE_URI`: The PostgreSQL connection string (format: `postgresql://user:password@host:port/database?schema=schema`)

These variables are loaded from `.env.development` or `.env.production` based on the `NODE_ENV` environment variable.

## Error Handling

Database utilities include robust error handling:

- Detailed error messages with SQL context
- Connection retry logic for transient failures
- Proper transaction management
- Logging of query execution times

## Best Practices

When using these utilities:

1. Always use parameterized queries to prevent SQL injection
2. Use transactions for operations that modify multiple tables
3. Handle errors appropriately and avoid swallowing exceptions
4. Close connections explicitly when performing large operations
5. Consider using the validation utilities to check schema/table/column existence
