# Quiz Relationship Migration Fix Report

## Problem Analysis

We identified a PostgreSQL compatibility issue in the `20250425_190000_comprehensive_quiz_jsonb_format_fix.ts` migration that was causing the migration process to fail with the error:

```
Error: set-returning functions are not allowed in FILTER
```

## Technical Root Cause

PostgreSQL doesn't allow set-returning functions (SRFs) inside a `FILTER` clause. This is a restriction in PostgreSQL's execution model. The problematic code was:

```sql
COUNT(*) FILTER (WHERE
  jsonb_typeof(questions) = 'array' AND
  jsonb_array_length(questions) > 0 AND
  jsonb_array_elements(questions) ? 'relationTo'  // THIS IS THE ISSUE
) as formatted_count
```

The `jsonb_array_elements()` function is a set-returning function, which means it can return multiple values (rows) for a single input. When used in a `FILTER` clause, it violates PostgreSQL's execution pipeline.

## Solution

We implemented the following fixes:

1. Created a new migration file `20250425_190001_comprehensive_quiz_jsonb_format_fix.ts`
2. Replaced the problematic `jsonb_array_elements` function with the JSON containment operator `@>`:

```sql
COUNT(*) FILTER (WHERE
  jsonb_typeof(questions) = 'array' AND
  jsonb_array_length(questions) > 0 AND
  questions @> '[{"relationTo": "quiz_questions"}]'
) as formatted_count
```

The JSON containment operator `@>` checks if the left JSON/JSONB document contains all key/value pairs in the right document, which achieves the same outcome without using set-returning functions.

3. Made similar changes in the verification function and all other queries using the pattern
4. Updated the migration index file to use the new version of the migration

## Implementation Steps

1. Created a fixed migration file with a slightly different timestamp:

   - `20250425_190000_comprehensive_quiz_jsonb_format_fix.ts` → `20250425_190001_comprehensive_quiz_jsonb_format_fix.ts`

2. Made the following changes to the SQL queries:

   - Replaced `jsonb_array_elements(questions) ? 'relationTo'` with `questions @> '[{"relationTo": "quiz_questions"}]'`
   - Fixed similar patterns in the verification function

3. Updated `apps/payload/src/migrations/index.ts` to:
   - Comment out the import of the old migration
   - Import the new fixed migration
   - Update the migration object to use the new migration

## Verification

Running `./reset-and-migrate.ps1` should now execute successfully without the PostgreSQL error about set-returning functions. The migration will properly update all quiz question arrays to use the correct JSONB format:

```json
[
  {
    "id": "question-id-1",
    "relationTo": "quiz_questions",
    "value": {
      "id": "question-id-1"
    }
  }
]
```

This format will ensure that quiz questions appear correctly in the Payload CMS admin interface.

## Future Considerations

When writing PostgreSQL migrations with JSONB data:

1. **Avoid Set-Returning Functions in FILTER clauses**: Use JSON operators like `@>`, `?`, `->>`, etc. instead.
2. **Test Complex Queries in psql First**: Complex PostgreSQL operations should be tested directly in the database before integrating them into migrations.
3. **Use Transactions**: Always wrap migrations in transactions to ensure atomicity (which this migration already does correctly).
