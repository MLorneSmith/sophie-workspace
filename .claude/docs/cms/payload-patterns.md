# Payload CMS Patterns

## Collection Configuration

Define collections with proper typing:

```tsx
import { CollectionConfig } from 'payload/types';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'category', 'status', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return {
        author: {
          equals: user?.id,
        },
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user?.role === 'admin'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    // More fields...
  ],
};
```

## Field Types

Use appropriate field types for different content:

```tsx
// Rich text field
{
  name: 'content',
  type: 'richText',
  required: true,
  admin: {
    elements: ['h2', 'h3', 'h4', 'link', 'ol', 'ul', 'indent', 'blockquote'],
    leaves: ['bold', 'italic', 'underline'],
  },
}

// Select field
{
  name: 'status',
  type: 'select',
  required: true,
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ],
  defaultValue: 'draft',
}

// Array field
{
  name: 'sections',
  type: 'array',
  required: true,
  admin: {
    components: {
      RowLabel: ({ data }) => data?.title || 'Section',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
}

// Blocks field
{
  name: 'layout',
  type: 'blocks',
  required: true,
  blocks: [
    {
      slug: 'text',
      fields: [
        {
          name: 'content',
          type: 'richText',
          required: true,
        },
      ],
    },
    {
      slug: 'image',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
  ],
}
```

## Hooks

Use hooks for custom logic:

```tsx
import { CollectionConfig } from 'payload/types';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          // Create user profile
          const profile = await req.payload.create({
            collection: 'profiles',
            data: {
              user: data.id,
              displayName: data.email.split('@')[0],
            },
          });
          
          return data;
        }
        
        return data;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Clean up related data
        await req.payload.delete({
          collection: 'profiles',
          where: {
            user: {
              equals: doc.id,
            },
          },
        });
      },
    ],
  },
  fields: [
    // Fields...
  ],
};
```

## Access Control

Implement granular access control:

```tsx
import { CollectionConfig } from 'payload/types';
import { checkRole } from '../access/checkRole';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => checkRole(['admin', 'editor'], user),
    update: ({ req: { user } }) => checkRole(['admin', 'editor'], user),
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    // Fields...
  ],
};
```

## Versioning

Enable versioning for content:

```tsx
import { CollectionConfig } from 'payload/types';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      
      // Public can only see published
      return {
        _status: {
          equals: 'published',
        },
      };
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: '_status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
    },
    // More fields...
  ],
};
```