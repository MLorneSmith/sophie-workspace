# Fixing Payload CMS Schema Push Issues

This document outlines the issues encountered with Payload CMS schema push functionality and the solution implemented to resolve them.

## Issue Description

When integrating Payload CMS into our existing Makerkit-based Next.js application, we encountered validation errors in the Payload admin panel:

```
ValidationError: The following field is invalid: User
```

And in the server logs:

```
[Error [ValidationError]: The following field is invalid: User] {
  data: [Object],
  isOperational: true,
  isPublic: false,
  status: 400,
  [cause]: [Object]
}
```

When attempting to enable schema push to create the necessary tables, we encountered another error:

```
error: there is no parameter $1
```

And when trying different ID types:

```
error: type "serial" does not exist
```

## Root Cause Analysis

The issues were related to GitHub issue [#6094](https://github.com/payloadcms/payload/issues/6094) in the Payload CMS repository, which describes the exact error we encountered: "there is no parameter $1".

The issue occurs when:

1. Payload v3 is added to an existing app with data in the database
2. Schema push is enabled, causing Payload to attempt to initialize tables
3. The database schema and Payload's expected schema don't match

The specific problems were:

1. Payload couldn't find tables in the correct schema
2. When trying to create tables, it encountered PostgreSQL type compatibility issues with the "serial" type
3. Parameter errors occurred when Payload tried to execute SQL queries to create or modify tables

## Solution

After exploring multiple approaches, we implemented the following solution:

1. **Specify the Correct Schema**

   We added the `schemaName: 'payload'` property to the PostgreSQL adapter configuration to ensure Payload looks for tables in the correct schema:

   ```typescript
   db: postgresAdapter({
     pool: {
       connectionString: process.env.DATABASE_URI || '',
     },
     // Configure Postgres to use the "payload" schema
     schemaName: 'payload',
     // Disable schema push to avoid parameter errors
     push: false,
   }),
   ```

2. **Disable Schema Push**

   We disabled schema push by setting `push: false` to prevent Payload from attempting to create or modify database tables automatically, which was causing the parameter errors and serial type issues.

3. **Fix TypeScript Error**

   We added a type assertion for the Sharp dependency to resolve TypeScript errors:

   ```typescript
   sharp: sharp as any,
   ```

## Alternative Approaches Considered

We explored several alternative approaches before settling on the final solution:

1. **Creating Empty Tables First**

   We attempted to create empty tables using a SQL script generated from Payload's schema definition, then enable schema push. However, we encountered issues executing the SQL script due to PostgreSQL client compatibility issues.

2. **Using Different ID Types**

   We tried setting different ID types (`integer`, `uuid`) in the Payload configuration, but still encountered the "serial" type error.

3. **Using Supabase Client**

   We attempted to use the Supabase client to execute the SQL script, but encountered issues with the `pgexec` function not being available.

## Lessons Learned

1. **Payload CMS and Existing Databases**

   Payload CMS v3 can have issues when added to an existing application with data in the database, particularly when schema push is enabled.

2. **Schema Naming**

   Specifying the correct schema name is crucial for Payload to find and interact with the correct tables.

3. **PostgreSQL Type Compatibility**

   Different PostgreSQL setups may have different type compatibility issues, particularly with the "serial" type.

## Recommended Approach for Similar Issues

If you encounter similar issues when integrating Payload CMS into an existing application:

1. Specify the correct schema name using the `schemaName` property
2. Disable schema push by setting `push: false`
3. Use your own migration system to create and manage the database schema
4. Consider using Payload's migration system instead of schema push for future schema changes

## References

- [GitHub Issue #6094](https://github.com/payloadcms/payload/issues/6094): "there is no parameter $1"
- [Payload CMS Documentation on PostgreSQL](https://payloadcms.com/docs/database/postgres)
- [Payload CMS Documentation on Migrations](https://payloadcms.com/docs/database/migrations)
