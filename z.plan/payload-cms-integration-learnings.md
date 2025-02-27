# Payload CMS Integration Learnings

This document outlines the learnings and things we needed to do differently from what was originally planned in `z.context/payload-cms-integration-next15-plan.md` during the implementation of the Payload CMS integration with the Makerkit-based Next.js 15 application.

## Key Learnings

### 1. TypeScript Configuration

The original plan didn't explicitly mention TypeScript configuration issues that we encountered during the implementation. We had to make the following adjustments:

- **Override `noEmit` Setting**: The root `tsconfig.json` had `"noEmit": true`, which prevented the Payload CMS client package from generating output files. We had to override this in the package's `tsconfig.json` with `"noEmit": false`.

- **JSX Handling**: We encountered issues with dynamic JSX element creation in the content renderer. Instead of using a dynamic approach with `const HeadingTag = node.tag as keyof JSX.IntrinsicElements`, we had to use a switch statement to handle different heading levels explicitly.

- **Path Mappings**: We had to add TypeScript path mappings in multiple tsconfig.json files to help TypeScript resolve the workspace packages. This was necessary in:
  - The root `tsconfig.json` file
  - The `packages/cms/core/tsconfig.json` file
  - The `apps/web/tsconfig.json` file

### 2. Package Exports Configuration

The original plan didn't include details about package exports configuration, which is crucial for proper module resolution in a monorepo setup:

- **Exports Field**: We had to add an `exports` field to the `package.json` of the Payload CMS client package to properly expose the main entry point and the renderer:

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./renderer": {
    "import": "./dist/renderer.js",
    "types": "./dist/renderer.d.ts"
  }
}
```

### 3. Turbo Build Configuration

The original plan didn't mention the need to update the Turbo build configuration to include the `dist` directory in the outputs:

- **Outputs Configuration**: We had to update the `turbo.json` file to include the `dist` directory in the outputs configuration for the build task:

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": [".next/**", "!.next/cache/**", "next-env.d.ts", "dist/**"]
}
```

### 4. Environment Variables

The original plan mentioned updating environment variables but didn't specify the exact changes needed:

- **Production Environment**: We had to update the `.env.production` file to include a valid HTTPS URL for the `NEXT_PUBLIC_SITE_URL` and `PAYLOAD_PUBLIC_SERVER_URL` environment variables to satisfy the robots.txt generation requirements.

- **Development Environment**: We had to ensure that the `.env.development` file had the correct `PAYLOAD_PUBLIC_SERVER_URL` set to `http://localhost:3000`.

### 5. Payload Version Management

The original plan didn't mention potential issues with Payload version management:

- **Version Mismatch**: We encountered issues with the Payload version in both the `apps/payload/package.json` and `packages/cms/payload/package.json` files. Both had `"payload": "1.0.0"`, but that version doesn't exist. We had to update them to use `"payload": "3.24.0"`.

### 6. Local Development with Push Mode

The original plan mentioned using migrations for schema changes, but we learned that for local development, Payload recommends using "push" mode:

- **Push Mode**: In the Payload configuration, we set `push: process.env.NODE_ENV === 'development'` to automatically sync schema changes to the database during development, which is the recommended approach according to the Payload documentation.

- **Migrations for Production**: Migrations are still important for production deployments, but for local development, push mode is more convenient.

### 7. Database Schema Creation

The original plan didn't mention the need to create the database schema before running migrations:

- **Schema Creation**: We had to modify the migration file to create the "payload" schema before creating tables and types:

```typescript
// First create the schema if it doesn't exist
await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "payload"`);

// Then create the types and tables
await db.execute(sql`...`);
```

### 8. Environment Variables for Scripts

The original plan didn't mention the need to load environment variables in scripts:

- **dotenv Integration**: We had to add the dotenv package and load environment variables in scripts that interact with Payload:

```typescript
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
```

### 9. PostgreSQL Type Limitations

The original plan didn't mention PostgreSQL type limitations:

- **Infinity Value**: PostgreSQL doesn't support the `Infinity` value for bigint types, which caused errors when fetching documentation items. We had to modify the PayloadClient class to use a large number (1000) instead of Infinity:

```typescript
// Use a large number (1000) instead of Infinity to avoid PostgreSQL errors
const limit = options?.limit === Infinity ? 1000 : options?.limit || 10;
```

## Recommendations for Future Implementations

1. **Start with TypeScript Configuration**: Ensure that the TypeScript configuration is properly set up for all packages in the monorepo, especially when dealing with JSX and module resolution.

2. **Use Package Exports**: Always configure the `exports` field in the `package.json` of packages that need to expose multiple entry points.

3. **Update Turbo Configuration**: Make sure the Turbo build configuration includes all necessary output directories for all packages.

4. **Manage Environment Variables Carefully**: Pay special attention to environment variables, especially those that are required for production builds.

5. **Check Package Versions**: Verify that all package versions specified in `package.json` files actually exist and are compatible with each other.

6. **Follow Database Best Practices**: Use push mode for local development and migrations for production deployments, as recommended by Payload.

7. **Create Database Schema First**: Always create the database schema before creating tables and types in migrations.

8. **Load Environment Variables in Scripts**: Use dotenv to load environment variables in scripts that interact with Payload.

9. **Handle PostgreSQL Type Limitations**: Be aware of PostgreSQL type limitations, such as not supporting the `Infinity` value for bigint types.

## Conclusion

The implementation of the Payload CMS integration was successful, but we had to make several adjustments to the original plan to address issues that weren't anticipated. These learnings will be valuable for future implementations and can help streamline the process.
