# Logger Migration Scripts

This directory contains scripts to help migrate from `console.log` statements to the enhanced logger system.

## Overview

The migration replaces console statements with appropriate logger calls:

- `console.log()` → `logger.info()`
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`
- `console.debug()` → `logger.debug()`
- `console.info()` → `logger.info()`

## Scripts Available

### 1. `find-console-logs.sh`

Finds all TypeScript/JavaScript files containing console statements.

```bash
./scripts/find-console-logs.sh
```

This will:

- Search for all `.ts`, `.tsx`, `.js`, `.jsx` files
- Exclude `node_modules`, `dist`, `build`, `.next`, etc.
- Save the file list to `console-files.txt`
- Show a count and preview of files found

### 2. `migrate-to-logger.js`

Basic migration script using regex patterns. Fast and handles most common cases.

```bash
# Migrate specific files
node scripts/migrate-to-logger.js src/file1.ts src/file2.ts

# Migrate from a file list
node scripts/migrate-to-logger.js --from-file console-files.txt
```

Features:

- Automatically determines service name based on file location
- Adds logger import if not present
- Preserves message structure and context
- Handles various console patterns

### 3. `migrate-to-logger-advanced.js`

Advanced migration using AST transformation for more accurate results.

```bash
# First install required dependencies
npm install --save-dev @babel/parser @babel/traverse @babel/generator @babel/types

# Then run migration
node scripts/migrate-to-logger-advanced.js src/file1.ts src/file2.ts
```

Features:

- Uses Abstract Syntax Tree (AST) for precise transformations
- Better handling of complex expressions
- Preserves code formatting better
- More accurate context preservation

## Migration Examples

### Simple String Message

```typescript
// Before
console.log('User logged in');

// After
logger.info('User logged in');
```

### Message with Data

```typescript
// Before
console.log('Processing request', requestId, userId);

// After
logger.info('Processing request', { requestId, userId });
```

### Error Logging

```typescript
// Before
console.error('Failed to process', error);

// After
logger.error('Failed to process', { error });
```

### Object Logging

```typescript
// Before
console.log({ status: 'success', data: result });

// After
logger.info('Log output', { data: { status: 'success', data: result } });
```

## Service Name Mapping

The scripts automatically determine service names based on file paths:

- `apps/web/app/home/(user)/ai/canvas/` → `ai-canvas`
- `apps/web/app/admin/users/` → `admin-users`
- `apps/web/app/api/billing/` → `api-billing`
- `packages/ai-gateway/` → `ai-gateway`
- `packages/billing/stripe/` → `billing-stripe`
- `packages/features/auth/` → `feature-auth`

## Workflow Recommendation

1. **Find all files with console statements:**

   ```bash
   ./scripts/find-console-logs.sh
   ```

2. **Review the file list:**

   ```bash
   cat console-files.txt
   ```

3. **Test on a few files first:**

   ```bash
   # Pick a few files to test
   node scripts/migrate-to-logger.js src/test-file1.ts src/test-file2.ts
   ```

4. **Review the changes:**

   ```bash
   git diff src/test-file1.ts src/test-file2.ts
   ```

5. **If satisfied, migrate in batches:**

   ```bash
   # Migrate by package/feature
   grep "packages/ai-gateway" console-files.txt > ai-gateway-files.txt
   node scripts/migrate-to-logger.js --from-file ai-gateway-files.txt
   ```

6. **Or migrate all at once:**

   ```bash
   node scripts/migrate-to-logger.js --from-file console-files.txt
   ```

## Manual Review Required

After migration, review files for:

1. **Context appropriateness** - The script makes educated guesses about context
2. **Message clarity** - Ensure log messages are still meaningful
3. **Sensitive data** - Check that no sensitive data is being logged
4. **Error handling** - Verify error contexts are preserved correctly

## Rollback

If you need to rollback changes:

```bash
git checkout -- path/to/modified/files
```

## Troubleshooting

### AST Parsing Errors

If the advanced script fails with parsing errors, use the basic script instead:

```bash
node scripts/migrate-to-logger.js problematic-file.ts
```

### Import Conflicts

If a file already has a `logger` variable, you may need to manually adjust the import or variable name.

### Complex Console Patterns

Some complex console patterns may need manual migration:

- Console methods with spread operators
- Dynamic console method calls
- Console calls inside template literals

## Next Steps

After migration:

1. Run your tests to ensure functionality is preserved
2. Check that log outputs are working as expected
3. Configure log levels in your environment variables
4. Set up monitoring integration if needed
