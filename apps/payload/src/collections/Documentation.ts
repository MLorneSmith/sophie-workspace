import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { sql } from '@payloadcms/db-postgres'
import CallToAction from '../blocks/CallToAction'
import TestBlock from '../blocks/TestBlock'
import { findDownloadsForCollection } from '../db/downloads'

export const Documentation: CollectionConfig = {
  slug: 'documentation',
  labels: {
    singular: 'Documentation',
    plural: 'Documentation',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Documentation content for the application',
  },
  access: {
    read: () => true,
  },
  hooks: {
    // Add a collection-level afterRead hook to handle downloads
    afterRead: [
      async ({ req, doc }) => {
        // Only handle downloads if we have a specific document with an ID
        if (doc?.id) {
          try {
            // Proactively run the scanner function before fetching downloads
            try {
              await req.payload.db.drizzle.execute(
                sql.raw(`SELECT * FROM payload.scan_and_fix_uuid_tables()`),
              )
            } catch (scanError) {
              // Log but continue even if scanner fails
              console.log('Scanner function failed in Documentation hook, continuing:', scanError)
            }

            // Replace downloads with ones from our custom view
            const downloads = await findDownloadsForCollection(req.payload, doc.id, 'documentation')

            // Update the document with the retrieved downloads
            return {
              ...doc,
              downloads,
            }
          } catch (error) {
            console.error('Error fetching downloads for documentation:', error)
            // Return the document with an empty downloads array instead of failing
            return {
              ...doc,
              downloads: [], // Fallback to empty array on error
            }
          }
        }

        return doc
      },
    ],
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
      editor: lexicalEditor({
        // Field-specific editor configuration with custom blocks
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock],
          }),
        ],
      }),
      admin: {
        description: 'The main content of the documentation',
        condition: () => true,
      },
    },
    // Add downloads field
    {
      name: 'downloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
      admin: {
        description: 'Files for download in this documentation',
      },
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
    // The parent field is now automatically added by the nested-docs plugin
    // {
    //   name: 'parent',
    //   type: 'relationship',
    //   relationTo: 'documentation' as any,
    //   hasMany: false,
    // },
  ],
}
