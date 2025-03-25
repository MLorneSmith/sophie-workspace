# Payload CMS Integration Plan for Makerkit App (Next.js 15 Compatible)

This document provides a comprehensive, step-by-step implementation plan for integrating Payload CMS 3.x with a Makerkit-based Next.js 15 application. This plan is designed to be followed by an AI coding assistant or developer to successfully implement Payload CMS into a fresh Makerkit repository.

## Overview

We'll integrate Payload CMS 3.x with a Makerkit app using a hybrid approach:

1. Install Payload core in the application directory (`apps/web`)
2. Create a CMS client package in `packages/cms/payload` to maintain consistency with other CMS implementations
3. Use the recommended Next.js App Router integration pattern for Payload 3.x
4. Configure Payload to use the existing Supabase database with a separate schema

## Prerequisites

- A Makerkit-based Next.js 15 application
- Supabase database setup and configured
- Node.js 20.9.0+
- pnpm (preferred), npm, or yarn

## Implementation Steps

### 1. Install Required Dependencies

```bash
# Navigate to the web app directory
cd apps/web

# Install Payload and related dependencies
pnpm add payload@3.23.0 @payloadcms/db-postgres@3.24.0 @payloadcms/richtext-lexical@3.24.0 @payloadcms/next@3.24.0 sharp graphql

# Install development dependencies
pnpm add -D cross-env tsx
```

### 2. Create Directory Structure

Create the necessary directories for Payload integration:

```bash
# Create directories for Payload files
mkdir -p apps/web/app/(payload)
mkdir -p apps/web/app/(payload)/admin/[[...segments]]
mkdir -p apps/web/app/(payload)/api/[[...segments]]
mkdir -p apps/web/collections
mkdir -p apps/web/payload
mkdir -p apps/web/supabase/migrations/payload
mkdir -p apps/web/scripts
```

### 3. Create Payload Configuration

Create a Payload configuration file at `apps/web/payload.config.ts`:

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';

import { Documentation } from './collections/documentation';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export the config
export default buildConfig({
  // Server URL is required for the admin panel to work properly
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // Secret is used for encrypting cookies and tokens
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key',

  // Admin panel configuration
  admin: {
    // We're using Supabase for authentication, so we don't need Payload's built-in authentication
  },

  // Specify the editor for rich text fields
  editor: lexicalEditor({}),

  // Collections define the data structure
  collections: [Documentation],

  // TypeScript configuration for generating types
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // Database configuration using PostgreSQL adapter
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
    // Use a custom schema to separate Payload tables from Makerkit tables
    schemaName: 'payload',
    // Store migrations in the Supabase migrations directory
    migrationDir: path.resolve(__dirname, 'supabase/migrations/payload'),
    // Automatically push schema changes in development
    push: process.env.NODE_ENV === 'development',
  }),
});
```

### 4. Configure Environment Variables

Add the following environment variables to `apps/web/.env.development`:

```
CMS_CLIENT=payload
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

### 5. Create Documentation Collection

Create a collection for documentation content at `apps/web/collections/documentation.ts`:

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

### 6. Create Payload Client Utility

Create a utility to initialize and access the Payload client at `apps/web/payload/payloadClient.ts`:

```typescript
import { getPayload } from 'payload';
import type { Payload } from 'payload';

// Cache the Payload instance
let cachedPayloadClient: Payload | null = null;

// Function to get the Payload client
export const getPayloadClient = async (): Promise<Payload> => {
  if (cachedPayloadClient) {
    return cachedPayloadClient;
  }

  // Initialize Payload
  const payload = await getPayload({
    // The config is automatically loaded from payload.config.ts
  });

  // Cache the Payload instance
  cachedPayloadClient = payload;

  return payload;
};
```

### 7. Update Next.js Configuration

Update `apps/web/next.config.mjs` to use the withPayload plugin:

```javascript
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const config = {
  // ... existing config ...
  experimental: {
    // ... existing experimental options ...
    reactCompiler: false, // Disable React compiler as required by Payload
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(withPayload(config));
```

### 8. Set Up Next.js App Router Integration

#### 8.1 Create Route Group for Payload

Create a layout for the Payload route group at `apps/web/app/(payload)/layout.tsx`:

```typescript
import React from 'react';

// This layout is used for all Payload-related routes
export default function PayloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="payload-layout">{children}</div>;
}
```

#### 8.2 Create Admin Route

Create the admin route at `apps/web/app/(payload)/admin/[[...segments]]/page.tsx`:

```typescript
import { Payload } from '@payloadcms/next';
import React from 'react';

export default function AdminPage() {
  return <Payload />;
}
```

#### 8.3 Create API Route

Create the API route at `apps/web/app/(payload)/api/[[...segments]]/route.ts`:

```typescript
import { NextRequest } from 'next/server';

import { createPayloadAPI } from '@payloadcms/next';

// This creates all the necessary API routes for Payload
export const { GET, POST, PATCH, PUT, DELETE } = createPayloadAPI({
  // Optional: customize the API handler
  onRequest: async (req: NextRequest) => {
    // You can modify the request here if needed
    return req;
  },
});
```

### 9. Create Database Schema and Migration

#### 9.1 Create Initial Migration

Create an initial migration file at `apps/web/supabase/migrations/payload/20250225154300-initial-schema.js`:

```javascript
import { sql } from '@payloadcms/db-postgres';

export async function up({ payload, db }) {
  console.log('Running initial schema migration');

  // Create the payload schema if it doesn't exist
  await db.execute(sql`
    CREATE SCHEMA IF NOT EXISTS payload;
  `);

  // The rest of the schema changes are handled automatically by Payload
}

export async function down({ payload, db }) {
  console.log('Rolling back initial schema migration');

  // Add rollback logic if needed
  // await db.execute(sql`
  //   -- Your rollback SQL here
  // `);
}
```

#### 9.2 Create Schema Initialization Script

Create a script to initialize the database schema at `apps/web/scripts/init-payload-schema.ts`:

```typescript
import { getPayloadClient } from '../payload/payloadClient';

async function initPayloadSchema() {
  console.log('Initializing Payload schema...');

  try {
    // Get the Payload client, which will initialize the database schema
    const payload = await getPayloadClient();

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

### 10. Create Content Migration Script

Create a script to migrate existing documentation to Payload at `apps/web/scripts/migrate-docs-to-payload.ts`:

```typescript
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

import { getPayloadClient } from '../payload/payloadClient';

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
  // Get the Payload client
  const payload = await getPayloadClient();

  // Path to the documentation files
  const docsDir = path.join(process.cwd(), 'content', 'documentation');
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

### 11. Create Verification Script

Create a script to verify the migration at `apps/web/scripts/list-documentation.ts`:

```typescript
import { getPayloadClient } from '../payload/payloadClient';

async function listDocumentation() {
  // Get the Payload client
  const payload = await getPayloadClient();

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

### 12. Update package.json Scripts

Add the following scripts to `apps/web/package.json`:

```json
"scripts": {
  // ... existing scripts
  "payload:generate:schema": "cross-env PAYLOAD_CONFIG_PATH=./payload.config.ts payload generate:db-schema",
  "payload:migrate": "cross-env PAYLOAD_CONFIG_PATH=./payload.config.ts payload migrate",
  "payload:migrate:docs": "tsx scripts/migrate-docs-to-payload.ts",
  "payload:init:schema": "tsx scripts/init-payload-schema.ts",
  "payload:list": "tsx scripts/list-documentation.ts"
}
```

### 13. Create CMS Client Package

#### 13.1 Update Package.json

Create or update `packages/cms/payload/package.json`:

```json
{
  "name": "@kit/payload",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w"
  },
  "dependencies": {
    "@kit/cms-types": "workspace:*",
    "payload": "^3.23.0",
    "react": "19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.4",
    "@types/react": "19.0.10",
    "typescript": "^5.7.3"
  }
}
```

#### 13.2 Create tsconfig.json

Create `packages/cms/payload/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 13.3 Implement CMS Client

Create `packages/cms/payload/src/payload-client.ts`:

```typescript
import { Cms, CmsClient } from '@kit/cms-types';

export class PayloadClient implements CmsClient {
  async getContentItems(options?: Cms.GetContentItemsOptions) {
    const collection = options?.collection || 'documentation';
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    const status = options?.status || 'published';

    try {
      // Fetch from Payload API
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=${limit}&page=${Math.floor(offset / limit) + 1}&where[status][equals]=${status}`,
      );
      const data = await response.json();

      return {
        total: data.totalDocs,
        items: data.docs.map(this.mapContentItem),
      };
    } catch (error) {
      console.error('Error fetching content items from Payload:', error);
      return {
        total: 0,
        items: [],
      };
    }
  }

  async getContentItemBySlug(params: {
    slug: string;
    collection: string;
    status?: Cms.ContentItemStatus;
  }) {
    const { slug, collection, status = 'published' } = params;

    try {
      // Fetch from Payload API
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[slug][equals]=${slug}&where[status][equals]=${status}`,
      );
      const data = await response.json();

      if (data.docs.length === 0) {
        return undefined;
      }

      return this.mapContentItem(data.docs[0]);
    } catch (error) {
      console.error('Error fetching content item by slug from Payload:', error);
      return undefined;
    }
  }

  async getCategories(options?: Cms.GetCategoriesOptions) {
    // Extract unique categories from documentation collection
    try {
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/documentation?limit=100`,
      );
      const data = await response.json();

      const categoriesSet = new Set<string>();
      data.docs.forEach((doc: any) => {
        (doc.categories || []).forEach((category: any) => {
          categoriesSet.add(category.category);
        });
      });

      return Array.from(categoriesSet).map((name) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      }));
    } catch (error) {
      console.error('Error fetching categories from Payload:', error);
      return [];
    }
  }

  async getCategoryBySlug(slug: string) {
    const categories = await this.getCategories();
    return categories.find((category) => category.slug === slug);
  }

  async getTags(options?: Cms.GetTagsOptions) {
    // Extract unique tags from documentation collection
    try {
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/documentation?limit=100`,
      );
      const data = await response.json();

      const tagsSet = new Set<string>();
      data.docs.forEach((doc: any) => {
        (doc.tags || []).forEach((tag: any) => {
          tagsSet.add(tag.tag);
        });
      });

      return Array.from(tagsSet).map((name) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      }));
    } catch (error) {
      console.error('Error fetching tags from Payload:', error);
      return [];
    }
  }

  async getTagBySlug(slug: string) {
    const tags = await this.getTags();
    return tags.find((tag) => tag.slug === slug);
  }

  private mapContentItem(item: any): Cms.ContentItem {
    return {
      id: item.id,
      title: item.title,
      label: item.title,
      url: item.slug,
      slug: item.slug,
      description: item.description,
      content: item.content,
      publishedAt: item.publishedAt,
      image: item.image,
      status: item.status,
      categories: (item.categories || []).map((category: any) => ({
        id: category.category,
        name: category.category,
        slug: category.category.toLowerCase().replace(/\s+/g, '-'),
      })),
      tags: (item.tags || []).map((tag: any) => ({
        id: tag.tag,
        name: tag.tag,
        slug: tag.tag.toLowerCase().replace(/\s+/g, '-'),
      })),
      parentId: item.parent,
      order: item.order || 0,
      children: [],
    };
  }
}
```

#### 13.4 Create Content Renderer for Lexical Format

Create `packages/cms/payload/src/content-renderer.tsx`:

```tsx
import React from 'react';

// Function to render Lexical content
export function PayloadContentRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null;
  }

  // For Lexical content, extract the text and render it
  // In a real implementation, you would use a proper Lexical renderer
  try {
    const lexicalContent = content as any;
    if (lexicalContent.root && lexicalContent.root.children) {
      return (
        <div className="payload-content">
          {lexicalContent.root.children.map((node: any, i: number) => {
            // Handle different node types
            if (node.type === 'paragraph') {
              return (
                <p key={i}>
                  {node.children.map((textNode: any, j: number) => (
                    <span key={j}>{textNode.text}</span>
                  ))}
                </p>
              );
            }

            if (node.type === 'heading') {
              const HeadingTag = node.tag as keyof JSX.IntrinsicElements;
              return (
                <HeadingTag key={i}>
                  {node.children.map((textNode: any, j: number) => (
                    <span key={j}>{textNode.text}</span>
                  ))}
                </HeadingTag>
              );
            }

            return null;
          })}
        </div>
      );
    }
  } catch (error) {
    console.error('Error rendering Lexical content:', error);
  }

  // Fallback for non-Lexical content
  return <div dangerouslySetInnerHTML={{ __html: String(content) }} />;
}
```

#### 13.5 Create Renderer Export

Create `packages/cms/payload/src/renderer.ts`:

```typescript
// Re-export the PayloadContentRenderer for use in the core content renderer
export { PayloadContentRenderer } from './content-renderer';
```

#### 13.6 Create Factory Function

Create `packages/cms/payload/src/create-payload-cms.ts`:

```typescript
import { CmsClient } from '@kit/cms-types';

/**
 * Creates a new Payload client instance.
 */
export async function createPayloadClient(): Promise<CmsClient> {
  const { PayloadClient } = await import('./payload-client');
  return new PayloadClient();
}
```

#### 13.7 Create Package Entry Point

Create `packages/cms/payload/src/index.ts`:

```typescript
export { createPayloadClient } from './create-payload-cms';
export { PayloadContentRenderer } from './content-renderer';
```

### 14. Register Payload CMS Client in CMS Factory

Update the CMS client factory at `packages/cms/core/src/cms-factory.ts` to include the Payload client:

```typescript
import { CmsClient } from '@kit/cms-types';

/**
 * Creates a CMS client based on the environment variable.
 */
export async function createCmsClient(): Promise<CmsClient> {
  const cmsClient = process.env.CMS_CLIENT || 'keystatic';

  switch (cmsClient.toLowerCase()) {
    case 'keystatic': {
      const { createKeystaticClient } = await import('@kit/keystatic');
      return createKeystaticClient();
    }
    case 'wordpress': {
      const { createWordPressClient } = await import('@kit/wordpress');
      return createWordPressClient();
    }
    case 'payload': {
      const { createPayloadClient } = await import('@kit/payload');
      return createPayloadClient();
    }
    default: {
      throw new Error(`Unknown CMS client: ${cmsClient}`);
    }
  }
}
```

### 15. Register Payload Content Renderer in Core Renderer

Update the content renderer at `packages/cms/core/src/content-renderer.tsx` to include the Payload renderer:

```tsx
import React from 'react';

import { Cms } from '@kit/cms-types';

interface ContentRendererProps {
  content: unknown;
  cms?: string;
}

export function ContentRenderer({ content, cms }: ContentRendererProps) {
  const cmsType = cms || process.env.CMS_CLIENT || 'keystatic';

  switch (cmsType.toLowerCase()) {
    case 'keystatic': {
      const { KeystaticContentRenderer } = require('@kit/keystatic/renderer');
      return <KeystaticContentRenderer content={content} />;
    }
    case 'wordpress': {
      const { WordPressContentRenderer } = require('@kit/wordpress/renderer');
      return <WordPressContentRenderer content={content} />;
    }
    case 'payload': {
      const { PayloadContentRenderer } = require('@kit/payload/renderer');
      return <PayloadContentRenderer content={content} />;
    }
    default: {
      return <div>Unknown CMS type: {cmsType}</div>;
    }
  }
}
```

## Implementation Process

Follow these steps in order to implement Payload CMS in your Makerkit app:

1. **Install Dependencies**: Install all required packages

   ```bash
   cd apps/web
   pnpm add payload@3.23.0 @payloadcms/db-postgres@3.24.0 @payloadcms/richtext-lexical@3.24.0 @payloadcms/next@3.24.0 sharp graphql
   pnpm add -D cross-env tsx
   ```

2. **Create Directory Structure**: Set up the necessary directories

   ```bash
   mkdir -p apps/web/app/(payload)/admin/[[...segments]]
   mkdir -p apps/web/app/(payload)/api/[[...segments]]
   mkdir -p apps/web/collections
   mkdir -p apps/web/payload
   mkdir -p apps/web/supabase/migrations/payload
   mkdir -p apps/web/scripts
   ```

3. **Create Configuration Files**: Create the Payload configuration file and collection definition
   ```bash
   # Create payload.config.ts and documentation collection
   touch apps/web/payload.config.ts
   touch apps/web/collections/documentation.ts
   ```

4. **Set Up Next.js Integration**: Configure the Next.js App Router integration
   ```bash
   # Create layout and route files
   touch apps/web/app/(payload)/layout.tsx
   touch apps/web/app/(payload)/admin/[[...segments]]/page.tsx
   touch apps/web/app/(payload)/api/[[...segments]]/route.ts
   ```

5. **Create Utility Files**: Create the Payload client utility and scripts
   ```bash
   # Create payload client utility
   touch apps/web/payload/payloadClient.ts
   
   # Create scripts
   touch apps/web/scripts/init-payload-schema.ts
   touch apps/web/scripts/migrate-docs-to-payload.ts
   touch apps/web/scripts/list-documentation.ts
   ```

6. **Create CMS Client Package**: Set up the CMS client package
   ```bash
   # Create package directory structure
   mkdir -p packages/cms/payload/src
   
   # Create package files
   touch packages/cms/payload/package.json
   touch packages/cms/payload/tsconfig.json
   touch packages/cms/payload/src/index.ts
   touch packages/cms/payload/src/payload-client.ts
   touch packages/cms/payload/src/content-renderer.tsx
   touch packages/cms/payload/src/renderer.ts
   touch packages/cms/payload/src/create-payload-cms.ts
   ```

7. **Update CMS Factory**: Update the CMS factory to include Payload
   ```bash
   # Edit the CMS factory file
   # This will vary depending on your project structure
   ```

8. **Initialize Database Schema**: Run the schema initialization script
   ```bash
   cd apps/web
   pnpm run payload:init:schema
   ```

9. **Migrate Content**: Run the content migration script
   ```bash
   cd apps/web
   pnpm run payload:migrate:docs
   ```

10. **Verify Migration**: Check that the content was migrated successfully
    ```bash
    cd apps/web
    pnpm run payload:list
    ```

11. **Start the Development Server**: Start the development server to test the integration
    ```bash
    cd apps/web
    pnpm run dev
    ```

12. **Access the Admin Panel**: Navigate to http://localhost:3000/admin to access the Payload admin panel

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Issues**
   - Ensure the database connection string is correct
   - Verify that the Supabase database is running
   - Check that the database user has the necessary permissions

2. **Schema Creation Issues**
   - If the schema isn't created automatically, run the initialization script
   - Check the database logs for any errors
   - Try setting `push: true` in the Payload config to force schema creation

3. **Admin Panel Access Issues**
   - Ensure the PAYLOAD_PUBLIC_SERVER_URL environment variable is set correctly
   - Check that the admin route is configured correctly
   - Verify that the Next.js configuration is using the withPayload plugin

4. **Content Migration Issues**
   - Check that the documentation files exist in the expected location
   - Verify that the Markdown to Lexical conversion is working correctly
   - Check for any errors in the migration script output

5. **Content Rendering Issues**
   - Ensure the content renderer is registered correctly
   - Check that the Lexical content format is being handled properly
   - Verify that the CMS client is returning the expected data

## Conclusion

This implementation plan provides a comprehensive guide for integrating Payload CMS 3.x with a Makerkit-based Next.js 15 application. By following these steps, you can successfully add a powerful content management system to your application while maintaining compatibility with the existing architecture.

The integration leverages the improvements in Payload CMS 3.x, particularly its better integration with Next.js App Router. The implementation maintains compatibility with the existing Makerkit app while adding the powerful features of Payload CMS.
