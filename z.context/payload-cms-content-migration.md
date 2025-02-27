# Migrating Content to Payload CMS Collections

This document provides a comprehensive guide on how to migrate existing content from various sources (files, databases, etc.) to Payload CMS collections in our Makerkit-based Next.js 15 application.

## Overview

Content migration is a multi-step process that involves:

1. Defining a collection schema in Payload CMS
2. Creating a migration script to transform and import content
3. Running the migration script
4. Verifying the migrated content

## Step 1: Define a Collection Schema

Before migrating content, you need to define a collection schema in Payload CMS that matches your content structure.

1. Create a new file in `apps/payload/src/collections/` with a name that represents your content type (e.g., `Documentation.ts`, `Testimonials.ts`).

2. Define the collection schema using Payload's `CollectionConfig` interface:

```typescript
import { CollectionConfig } from 'payload';

export const YourCollection: CollectionConfig = {
  slug: 'your-collection-slug',
  admin: {
    useAsTitle: 'title', // Field to use as the title in the admin UI
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Description of your collection',
  },
  access: {
    read: () => true, // Define access control as needed
  },
  fields: [
    // Define your fields based on your content structure
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    // Add more fields as needed
  ],
};
```

3. Register the collection in `apps/payload/src/payload.config.ts`:

```typescript
import { YourCollection } from './collections/YourCollection';

// ...

export default buildConfig({
  // ...
  collections: [
    // ... existing collections
    YourCollection,
  ],
  // ...
});
```

## Step 2: Create a Migration Script

Create a migration script in `apps/payload/scripts/` to transform and import your content.

1. Create a new file (e.g., `migrate-your-content-to-payload.ts`).

2. Structure your script to:
   - Connect to your source data
   - Transform the data to match your Payload collection schema
   - Use the Payload client to create entries in your collection

Here's a template based on our documentation migration script:

```typescript
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

import { getPayloadClient } from '../src/client/payloadClient'

async function migrateContentToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient()

  // Source your data (from files, database, API, etc.)
  // Example: Reading from files
  const contentDir = path.join(process.cwd(), 'path', 'to', 'your', 'content')

  // Process your source data
  // Example: For each file or database record

  try {
    // Transform your data to match the Payload schema
    const transformedData = {
      // Map your source data to the collection fields
    }

    // Create a document in your collection
    await payload.create({
      collection: 'your-collection-slug',
      data: transformedData,
    })

    console.log(`Migrated: ${/* identifier of your content */}`)
  } catch (error) {
    console.error(`Error migrating content:`, error)
  }

  console.log('Migration complete!')
}

// Run the migration
migrateContentToPayload().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
```

### Example: Migrating from Supabase

If your content is in a Supabase database, your script might look like this:

```typescript
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';

import { getPayloadClient } from '../src/client/payloadClient';

// Load environment variables
dotenv.config();

async function migrateFromSupabase() {
  // Get the Payload client
  const payload = await getPayloadClient();

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  // Fetch data from Supabase
  const { data: sourceData, error } = await supabase
    .from('your_table')
    .select('*');

  if (error) {
    console.error('Error fetching from Supabase:', error);
    return;
  }

  // Migrate each record
  for (const item of sourceData) {
    try {
      // Transform the data
      const transformedData = {
        // Map Supabase fields to Payload fields
        title: item.title,
        // ... other fields
      };

      // Create a document in Payload
      await payload.create({
        collection: 'your-collection-slug',
        data: transformedData,
      });

      console.log(`Migrated: ${item.id}`);
    } catch (error) {
      console.error(`Error migrating item ${item.id}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run the migration
migrateFromSupabase().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
```

### Example: Migrating Markdown Files

For markdown files with frontmatter (like our documentation):

```typescript
import dotenv from 'dotenv';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

import { getPayloadClient } from '../src/client/payloadClient';

// Load environment variables
dotenv.config();

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

async function migrateMarkdownToPayload() {
  // Get the Payload client
  const payload = await getPayloadClient();

  // Path to the markdown files
  const filesDir = path.join(process.cwd(), 'path', 'to', 'markdown', 'files');

  // Function to recursively read all markdown files
  const readMarkdownFiles = (dir: string, parentPath = ''): string[] => {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        files.push(...readMarkdownFiles(itemPath, path.join(parentPath, item)));
      } else if (
        item.endsWith('.md') ||
        item.endsWith('.mdx') ||
        item.endsWith('.mdoc')
      ) {
        files.push(path.join(parentPath, item));
      }
    }

    return files;
  };

  // Get all markdown files
  const markdownFiles = readMarkdownFiles(filesDir);
  console.log(`Found ${markdownFiles.length} files to migrate.`);

  // Migrate each file to Payload
  for (const file of markdownFiles) {
    const filePath = path.join(filesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: mdContent } = matter(content);

    // Generate a slug from the file path
    const slug = file
      .replace(/\.(md|mdx|mdoc)$/, '')
      .replace(/\\/g, '/')
      .replace(/^\//, '');

    try {
      // Create a document in the collection
      await payload.create({
        collection: 'your-collection-slug',
        data: {
          title: data.title || path.basename(file, path.extname(file)),
          slug,
          description: data.description || '',
          // Convert Markdown content to Lexical format
          content: convertMarkdownToLexical(mdContent),
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString()
            : new Date().toISOString(),
          status: data.status || 'published',
          // Add other fields as needed
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
migrateMarkdownToPayload().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
```

## Step 3: Run the Migration Script

Add a script to your `package.json` file to run the migration:

```json
"scripts": {
  "payload:migrate:your-content": "tsx scripts/migrate-your-content-to-payload.ts"
}
```

Then run the script:

```bash
pnpm run payload:migrate:your-content
```

## Step 4: Verify the Migration

Create a verification script to check that your content was migrated correctly:

```typescript
import dotenv from 'dotenv';

import { getPayloadClient } from '../src/client/payloadClient';

// Load environment variables
dotenv.config();

async function listContent() {
  // Get the Payload client
  const payload = await getPayloadClient();

  try {
    // Fetch all content from your collection
    const content = await payload.find({
      collection: 'your-collection-slug',
      limit: 100,
    });

    console.log(`Found ${content.totalDocs} items:`);

    // Print a summary of each document
    content.docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.slug})`);
      // Log other relevant fields
    });
  } catch (error) {
    console.error('Error listing content:', error);
  }
}

// Run the function
listContent().catch((error) => {
  console.error('Failed to list content:', error);
  process.exit(1);
});
```

Add a script to your `package.json`:

```json
"scripts": {
  "payload:list:your-content": "tsx scripts/list-your-content.ts"
}
```

Run the verification:

```bash
pnpm run payload:list:your-content
```

## Best Practices

1. **Backup your data** before running any migration scripts.
2. **Test on a small subset** of data first to ensure your migration script works correctly.
3. **Add error handling** to your migration scripts to catch and log any issues.
4. **Use transactions** when possible to ensure data integrity.
5. **Validate the migrated data** to ensure it meets your requirements.
6. **Consider incremental migrations** for large datasets to avoid timeouts or memory issues.

## Troubleshooting

- **Connection issues**: Ensure your environment variables are correctly set.
- **Permission errors**: Check that your Payload client has the necessary permissions.
- **Data transformation errors**: Validate your source data and transformation logic.
- **Rate limiting**: For API sources, implement rate limiting and backoff strategies.

## Conclusion

By following this guide, you can successfully migrate your existing content to Payload CMS collections. This process allows you to leverage Payload's powerful content management capabilities while preserving your valuable content.
