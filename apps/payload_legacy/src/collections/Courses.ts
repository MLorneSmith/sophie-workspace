import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { findDownloadsForCollection } from '../db/downloads'

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: {
    singular: 'Course',
    plural: 'Courses',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Courses in the learning management system',
  },
  access: {
    read: () => true, // Public read access
  },
  hooks: {
    // Add a collection-level afterRead hook to handle downloads
    afterRead: [
      async ({ req, doc }) => {
        // Only handle downloads if we have a specific document with an ID
        if (doc?.id) {
          try {
            // Replace downloads with ones from our custom view
            const downloads = await findDownloadsForCollection(req.payload, doc.id, 'courses')

            // Update the document with the retrieved downloads
            return {
              ...doc,
              downloads,
            }
          } catch (error) {
            console.error('Error fetching downloads for course:', error)
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
      unique: true,
      admin: {
        description: 'The URL-friendly identifier for this course',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [],
          }),
        ],
      }),
    },
    // Add downloads field
    {
      name: 'downloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
      admin: {
        description: 'Files for download in this course',
      },
    },
    {
      name: 'featured_image_id',
      type: 'upload',
      relationTo: 'media',
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
  ],
}
