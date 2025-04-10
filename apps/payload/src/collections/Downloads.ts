import { CollectionConfig } from 'payload'

// Define static UUIDs directly without importing from another package
// This is a simplified version of what's in the download-id-map.ts file
const DOWNLOAD_ID_MAP: Record<string, string> = {
  'slide-templates': '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1',
  'swipe-file': 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
  'our-process-slides': 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28',
  'the-who-slides': 'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456',
  'introduction-slides': 'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593',
  'next-steps-slides': 'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04',
  'idea-generation-slides': 'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18',
}

// Helper function to get a download key by ID
function getDownloadKeyById(id: string): string | undefined {
  for (const [key, value] of Object.entries(DOWNLOAD_ID_MAP)) {
    if (value === id) {
      return key
    }
  }
  return undefined
}

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: {
    singular: 'Download',
    plural: 'Downloads',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type'],
    description: 'Downloadable files for lessons',
  },
  access: {
    read: () => true, // Public read access
  },
  upload: {
    staticDir: 'downloads',
    adminThumbnail: 'thumbnail',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'application/zip',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],
  },
  hooks: {
    // Ensure ID consistency with our fixed UUID maps
    beforeChange: [
      ({ data }) => {
        // If this is a known download item with a fixed ID, ensure it matches
        if (data.title) {
          const downloadKey = Object.keys(DOWNLOAD_ID_MAP).find((key) =>
            key.includes(data.title.toLowerCase().replace(/\s+/g, '-')),
          )

          if (downloadKey && DOWNLOAD_ID_MAP[downloadKey]) {
            // Ensure the ID matches our predefined UUID
            data.id = DOWNLOAD_ID_MAP[downloadKey]
          }
        }

        return data
      },
    ],
    // Add debugging/logging for relationship issues
    afterRead: [
      ({ doc }) => {
        // Log for debugging relationship issues
        const key = doc.id ? getDownloadKeyById(doc.id) : null
        if (key) {
          doc._mappedKey = key // Add internal reference to help debugging
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'PowerPoint Template',
          value: 'pptx_template',
        },
        {
          label: 'Worksheet',
          value: 'worksheet',
        },
        {
          label: 'Reference',
          value: 'reference',
        },
        {
          label: 'Example',
          value: 'example',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      required: true,
    },
    // Bidirectional relationship fields
    {
      name: 'course_lessons',
      type: 'relationship',
      relationTo: 'course_lessons',
      hasMany: true,
      admin: {
        description: 'Lessons that reference this download',
      },
    },
    {
      name: 'documentation',
      type: 'relationship',
      relationTo: 'documentation',
      hasMany: true,
      admin: {
        description: 'Documentation pages that reference this download',
      },
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description: 'Blog posts that reference this download',
      },
    },
    {
      name: 'course_quizzes',
      type: 'relationship',
      relationTo: 'course_quizzes',
      hasMany: true,
      admin: {
        description: 'Quizzes that reference this download',
      },
    },
  ],
}
