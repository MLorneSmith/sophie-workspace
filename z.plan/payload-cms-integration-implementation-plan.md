# Payload CMS Integration: Implementation Plan

This document outlines the current status of the Payload CMS integration and the steps needed to complete the implementation according to the original plan in `z.context/payload-cms-integration-next15-plan.md` and the learnings in `z.context/payload-cms-integration-learnings.md`.

## Current Status

### ✅ Completed

- Basic Payload CMS app setup in `apps/payload`
- Basic CMS client package setup in `packages/cms/payload`
- PayloadClient implementation that follows the CmsClient interface
- Content renderer for Lexical format
- Package exports configuration

### ❌ Missing/Incomplete

1. Documentation collection in Payload CMS
2. Registration of Payload client in the CMS factory
3. Registration of Payload content renderer in the core content renderer
4. Configuration of Payload to use Supabase database with a separate schema
5. Environment variables setup
6. Migration scripts for schema initialization and content migration
7. Payload version needs updating (currently set to 1.0.0 which doesn't exist)

## Implementation Plan

### 1. Update Payload Version

**Files to update:**

- `packages/cms/payload/package.json`
- `apps/payload/package.json` (if needed)

**Changes:**

- Update Payload version from `"^1.0.0"` to `"^3.24.0"`

### 2. Add Documentation Collection

**Files to create:**

- `apps/payload/src/collections/Documentation.ts`

```typescript
import { CollectionConfig } from 'payload';

export const Documentation: CollectionConfig = {
  slug: 'documentation',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Documentation content for the application',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'The URL-friendly identifier for this document',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'categories',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'text',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'documentation',
      hasMany: false,
    },
  ],
};
```

**Files to update:**

- `apps/payload/src/payload.config.ts`

**Changes:**

- Import the Documentation collection
- Add it to the collections array

```typescript
import { Documentation } from './collections/Documentation';

// ...

export default buildConfig({
  // ...
  collections: [Users, Media, Documentation],
  // ...
});
```

### 3. Configure Payload to Use Supabase Database

**Files to update:**

- `apps/payload/src/payload.config.ts`

**Changes:**

- Update the database configuration to use a separate schema and handle migrations

```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI || '',
  },
  // Use a custom schema to separate Payload tables from Makerkit tables
  schemaName: 'payload',
  // Store migrations in the Supabase migrations directory
  migrationDir: path.resolve(dirname, 'migrations/payload'),
  // Automatically push schema changes in development
  push: process.env.NODE_ENV === 'development',
}),
```

### 4. Register Payload Client in CMS Factory

**Files to update:**

- `packages/cms/core/src/create-cms-client.ts`

**Changes:**

- Add Payload client registration to the CMS registry

```typescript
// Register the Payload CMS client implementation
cmsRegistry.register('payload', async () => {
  const { createPayloadClient } = await import('@kit/payload');
  return createPayloadClient();
});
```

### 5. Register Payload Content Renderer in Core Renderer

**Files to update:**

- `packages/cms/core/src/content-renderer.tsx`

**Changes:**

- Add Payload renderer to the getContentRenderer function

```typescript
async function getContentRenderer(type: CmsType) {
  switch (type) {
    case 'keystatic': {
      const { KeystaticContentRenderer } = await import(
        '@kit/keystatic/renderer'
      );

      return KeystaticContentRenderer;
    }

    case 'wordpress': {
      const { WordpressContentRenderer } = await import(
        '@kit/wordpress/renderer'
      );

      return WordpressContentRenderer;
    }

    case 'payload': {
      const { PayloadContentRenderer } = await import('@kit/payload/renderer');

      return PayloadContentRenderer;
    }

    default: {
      console.error(`Unknown CMS client: ${type as string}`);

      return null;
    }
  }
}
```

### 6. Set Up Environment Variables

**Files to update/create:**

- `apps/web/.env.development`
- `apps/web/.env.production`

**Changes:**

- Add Payload-specific environment variables

```
# .env.development
CMS_CLIENT=payload
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

```
# .env.production
CMS_CLIENT=payload
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=https://your-production-url.com
```

### 7. Create Migration Scripts

**Files to create:**

- `apps/payload/src/scripts/init-payload-schema.ts`

```typescript
import dotenv from 'dotenv';
import path from 'path';
import payload from 'payload';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initPayloadSchema() {
  console.log('Initializing Payload schema...');

  try {
    // Initialize Payload
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
      local: true,
      configPath: path.resolve(__dirname, '../payload.config.ts'),
    });

    // Create a test document to ensure the schema is created
    const testDoc = await payload.create({
      collection: 'documentation',
      data: {
        title: 'Test Document',
        slug: 'test-document',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is a test document to initialize the schema.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        status: 'draft',
      },
    });

    console.log('Created test document:', testDoc.id);

    // Delete the test document
    await payload.delete({
      collection: 'documentation',
      id: testDoc.id,
    });

    console.log('Deleted test document');
    console.log('Schema initialization complete!');
  } catch (error) {
    console.error('Error initializing schema:', error);
    process.exit(1);
  }
}

// Run the initialization
initPayloadSchema();
```

- `apps/payload/src/scripts/migrate-docs-to-payload.ts`

```typescript
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import payload from 'payload';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert Markdown content to a Lexical editor compatible format
function convertMarkdownToLexical(markdown: string) {
  // Split the markdown into paragraphs
  const paragraphs = markdown.split(/\n\n+/);

  // Create a Lexical editor compatible object
  return {
    root: {
      children: paragraphs.map((paragraph) => {
        // Check if this is a heading
        const headingMatch = paragraph.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];

          return {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text,
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'heading',
            version: 1,
            tag: `h${level}`,
          };
        }

        // Regular paragraph
        return {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        };
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
}

async function migrateDocsToPayload() {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
    local: true,
    configPath: path.resolve(__dirname, '../payload.config.ts'),
  });

  // Path to the documentation files
  const docsDir = path.join(
    process.cwd(),
    '..',
    'web',
    'content',
    'documentation',
  );
  console.log(`Documentation directory: ${docsDir}`);

  // Function to recursively read all .mdoc files
  const readMdocFiles = (dir: string, parentPath = ''): string[] => {
    console.log(`Reading directory: ${dir}`);
    const files: string[] = [];
    const items = fs.readdirSync(dir);
    console.log(`Found ${items.length} items in directory`);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        console.log(`Found directory: ${item}`);
        files.push(...readMdocFiles(itemPath, path.join(parentPath, item)));
      } else if (item.endsWith('.mdoc')) {
        console.log(`Found .mdoc file: ${item}`);
        files.push(path.join(parentPath, item));
      } else {
        console.log(`Skipping file: ${item} (not a .mdoc file)`);
      }
    }

    return files;
  };

  // Get all .mdoc files
  const mdocFiles = readMdocFiles(docsDir);
  console.log(`Found ${mdocFiles.length} documentation files to migrate.`);

  // Migrate each file to Payload
  for (const file of mdocFiles) {
    const filePath = path.join(docsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: mdContent } = matter(content);

    // Generate a slug from the file path
    const slug = file
      .replace(/\.mdoc$/, '')
      .replace(/\\/g, '/')
      .replace(/^\//, '');

    try {
      // Create a document in the documentation collection
      await payload.create({
        collection: 'documentation',
        data: {
          title: data.title || path.basename(file, '.mdoc'),
          slug,
          description: data.description || '',
          // Convert Markdown content to Lexical format
          content: convertMarkdownToLexical(mdContent),
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          status: data.status || 'published',
          order: data.order || 0,
          categories: data.categories
            ? data.categories.map((category: string) => ({ category }))
            : [],
          tags: data.tags ? data.tags.map((tag: string) => ({ tag })) : [],
          // Handle parent relationship if needed
        },
      });

      console.log(`Migrated: ${file}`);
    } catch (error) {
      console.error(`Error migrating ${file}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run the migration
migrateDocsToPayload().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
```

- `apps/payload/src/scripts/list-documentation.ts`

```typescript
import dotenv from 'dotenv';
import path from 'path';
import payload from 'payload';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listDocumentation() {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
    local: true,
    configPath: path.resolve(__dirname, '../payload.config.ts'),
  });

  try {
    // Fetch all documentation
    const docs = await payload.find({
      collection: 'documentation',
      limit: 100,
    });

    console.log(`Found ${docs.totalDocs} documentation items:`);

    // Print a summary of each document
    docs.docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.slug})`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Published: ${doc.publishedAt}`);
      console.log(
        `   Categories: ${(doc.categories || []).map((c: any) => c.category).join(', ') || 'None'}`,
      );
      console.log(
        `   Tags: ${(doc.tags || []).map((t: any) => t.tag).join(', ') || 'None'}`,
      );
      console.log('');
    });
  } catch (error) {
    console.error('Error listing documentation:', error);
  }
}

// Run the function
listDocumentation().catch((error) => {
  console.error('Failed to list documentation:', error);
  process.exit(1);
});
```

### 8. Update package.json Scripts

**Files to update:**

- `apps/payload/package.json`

**Changes:**

- Add scripts for managing Payload

```json
"scripts": {
  // ... existing scripts
  "payload:generate:schema": "cross-env PAYLOAD_CONFIG_PATH=./src/payload.config.ts payload generate:db-schema",
  "payload:migrate": "cross-env PAYLOAD_CONFIG_PATH=./src/payload.config.ts payload migrate",
  "payload:migrate:docs": "tsx src/scripts/migrate-docs-to-payload.ts",
  "payload:init:schema": "tsx src/scripts/init-payload-schema.ts",
  "payload:list": "tsx src/scripts/list-documentation.ts"
}
```

### 9. Address TypeScript Configuration Issues

**Files to update:**

- `packages/cms/payload/tsconfig.json`

**Changes:**

- Override `noEmit` setting

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 10. Update Turbo Build Configuration

**Files to update:**

- `turbo.json`

**Changes:**

- Include the `dist` directory in outputs

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": [".next/**", "!.next/cache/**", "next-env.d.ts", "dist/**"]
}
```

## Implementation Order

For the most efficient implementation, follow this order:

1. Update Payload version in package.json files
2. Fix TypeScript configuration issues
3. Update Turbo build configuration
4. Add Documentation collection
5. Configure Payload to use Supabase database
6. Register Payload client in CMS factory
7. Register Payload content renderer in core renderer
8. Set up environment variables
9. Create migration scripts
10. Update package.json scripts
11. Run the schema initialization script
12. Run the content migration script
13. Verify the migration with the list documentation script

## Dependencies to Install

- `cross-env`: For setting environment variables across platforms
- `tsx`: For running TypeScript files directly
- `dotenv`: For loading environment variables from .env files
- `gray-matter`: For parsing front matter in Markdown files

```bash
cd apps/payload
pnpm add -D cross-env tsx dotenv gray-matter
```

## Testing the Integration

After completing the implementation, test the integration by:

1. Starting the development server:

   ```bash
   cd apps/web
   pnpm run dev
   ```

2. Accessing the Payload admin panel at `http://localhost:3000/admin`

3. Verifying that the Documentation collection is available and contains the migrated content

4. Testing the CMS client by creating a page that uses the Payload CMS client to fetch and display documentation content
