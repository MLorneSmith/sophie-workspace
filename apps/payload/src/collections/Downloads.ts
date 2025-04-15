import { CollectionConfig } from 'payload'
import { getRawR2FileInfo, fileExistsInR2 } from '../utils/r2-helpers'

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
    // Ensure ID consistency with our fixed UUID maps and fetch metadata from R2
    beforeChange: [
      async ({ data }) => {
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

        // If this is a download with a filename but missing metadata, fetch it from R2
        if (data.filename && (!data.mimeType || !data.filesize)) {
          try {
            const fileInfo = await getRawR2FileInfo(data.filename)
            if (fileInfo) {
              // Update metadata from R2
              data.filesize = fileInfo.size
              data.mimeType = fileInfo.contentType || 'application/pdf'

              // Set default dimensions for PDFs if not already set
              if (
                !data.width &&
                !data.height &&
                (data.mimeType === 'application/pdf' || data.filename.endsWith('.pdf'))
              ) {
                data.width = 612 // Standard PDF width (8.5" at 72 DPI)
                data.height = 792 // Standard PDF height (11" at 72 DPI)
              }
            }
          } catch (err) {
            console.error(`Error fetching R2 metadata for ${data.filename}:`, err)
          }
        }

        return data
      },
    ],
    // Add debugging/logging for relationship issues and enhance admin UI display
    afterRead: [
      async ({ doc }) => {
        // Enhanced logging for better debugging
        console.log('Download doc in afterRead:', doc)

        // Special case for SlideHeroes Presentation Template
        if (doc.id === '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1') {
          doc.filename = 'SlideHeroes Presentation Template.zip'
          doc.url = 'https://downloads.slideheroes.com/SlideHeroes Presentation Template.zip'
          doc.mimeType = 'application/zip'
          doc.filesize = 55033588
          doc.description = doc.description || 'SlideHeroes Presentation Template'
        }

        // Special case for SlideHeroes Swipe File
        if (doc.id === 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6') {
          doc.filename = 'SlideHeroes Swipe File.zip'
          doc.url = 'https://downloads.slideheroes.com/SlideHeroes Swipe File.zip'
          doc.mimeType = 'application/zip'
          doc.filesize = 1221523
          doc.description = doc.description || 'SlideHeroes Swipe File'
        }

        // Verify R2 file existence and determine file type
        const fileExists = doc.filename && !doc.filename.includes('.placeholder')
        const isZipFile = doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip'

        // Special handling for ZIP files
        if (fileExists && isZipFile) {
          // Set appropriate mime type if missing
          if (!doc.mimeType) {
            doc.mimeType = 'application/zip'
          }

          // Create friendly display name from filename if description is missing
          if (!doc.description && doc.filename) {
            doc.description = doc.filename.replace(/\.zip$/i, '')
          }

          // For ZIP files, we'll use the API URL instead of a physical file
          if (!doc.sizes || !doc.sizes.thumbnail || doc.sizes.thumbnail.url?.includes('/null')) {
            if (!doc.sizes) doc.sizes = {}

            // Use the API URL pointing to the file itself as the thumbnail URL
            // This way, the UI can display an appropriate icon based on MIME type
            doc.sizes.thumbnail = {
              url: doc.url || `https://downloads.slideheroes.com/${doc.filename}`,
              width: 400,
              height: 300,
              mimeType: 'application/zip',
              filename: doc.filename,
            }
          }
        }
        // Handle PDFs and other files
        else if (
          fileExists &&
          doc.sizes &&
          doc.sizes.thumbnail &&
          (!doc.sizes.thumbnail.filename || doc.sizes.thumbnail.url?.includes('/null'))
        ) {
          // Generate proper thumbnail URL
          const thumbnailFilename = `${doc.id}-thumbnail.webp`
          doc.sizes.thumbnail.url = `https://downloads.slideheroes.com/${thumbnailFilename}`
          doc.sizes.thumbnail.filename = thumbnailFilename
          doc.sizes.thumbnail.width = 400
          doc.sizes.thumbnail.height = 300
          doc.sizes.thumbnail.mimeType = 'image/webp'
        }

        // Get mapped key for debugging
        const key = doc.id ? getDownloadKeyById(doc.id) : null
        if (key) {
          doc._mappedKey = key // Add internal reference to help debugging
        }

        // Enhance with relationship counts
        doc._relationshipCounts = {
          lessons: Array.isArray(doc.course_lessons) ? doc.course_lessons.length : 0,
          documentation: Array.isArray(doc.documentation) ? doc.documentation.length : 0,
          posts: Array.isArray(doc.posts) ? doc.posts.length : 0,
          quizzes: Array.isArray(doc.course_quizzes) ? doc.course_quizzes.length : 0,
        }

        // Enhance the document with R2 visibility flags
        return {
          ...doc,
          _r2FileExists: fileExists,
          _r2FileUrl: doc.url,
          _isZipFile: isZipFile,
          // Add a computed field for admin UI display
          fileStatus: fileExists ? 'Available in R2' : 'Missing in R2',
        }
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
