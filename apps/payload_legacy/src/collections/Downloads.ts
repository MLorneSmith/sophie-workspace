import { CollectionConfig } from 'payload'
import { getRawR2FileInfo } from '../utils/r2-helpers'

/**
 * Simplified Downloads Collection
 *
 * Key changes:
 * 1. Simplified hooks with only essential functionality
 * 2. Removed bidirectional relationships, using one-way relationships instead
 * 3. Standard upload configuration with R2 consistent paths
 */
export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: {
    singular: 'Download',
    plural: 'Downloads',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'filename'],
    description: 'Downloadable files for lessons and documentation',
    group: 'Content',
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
    // Enhanced afterRead hook with improved R2 URL handling
    afterRead: [
      async ({ doc }) => {
        // Only proceed if we have a filename
        if (!doc.filename) return doc

        // Remove .placeholder extension if present
        const cleanFilename = doc.filename.replace('.placeholder', '')

        // Map filenames to actual R2 file names based on patterns
        let actualFilename

        // Use a mapping dictionary for special cases
        const filenameMap = {
          'slide-templates': 'SlideHeroes Presentation Template.zip',
          'swipe-file': 'SlideHeroes Swipe File.zip',
          'our-process-slides': '201 Our Process.pdf',
          'the-who-slides': '202 The Who.pdf',
          'introduction-slides': '203 The Why - Introductions.pdf',
          'next-steps-slides': '204 The Why - Next Steps.pdf',
          'idea-generation-slides': '301 Idea Generation.pdf',
          'what-is-structure-slides': '302 What is Structure.pdf',
          'using-stories-slides': '401 Using Stories.pdf',
          'storyboards-presentations-slides': '403 Storyboards in Presentations.pdf',
          'visual-perception-slides': '501 Visual Perception.pdf',
          'detail-fundamental-elements-slides': '503 Detail Fundamental Elements.pdf',
          'gestalt-principles-slides': '504 Gestalt Principles of Visual Perception.pdf',
          'slide-composition-slides': '505 Slide Composition.pdf',
          'fact-based-persuasion-slides': '601 Fact-based Persuasion Overview.pdf',
          'tables-v-graphs-slides': '602 Tables v Graphs.pdf',
          'standard-graphs-slides': '604 Standard Graphs.pdf',
          'specialist-graphs-slides': '605 Specialist Graphs.pdf',
          'preparation-practice-slides': '701 Preparation and Practice.pdf',
          'performance-slides': '702 Performance.pdf',
          'audience-map': 'Audience Map.pdf',
          'golden-rules': 'SlideHeroes Golden Rules.pdf',
        }

        // Check if we have a direct mapping
        if (cleanFilename && filenameMap[cleanFilename as keyof typeof filenameMap]) {
          actualFilename = filenameMap[cleanFilename as keyof typeof filenameMap]
        } else {
          // Use the cleaned filename and add extension if missing
          actualFilename =
            cleanFilename.endsWith('.pdf') || cleanFilename.endsWith('.zip')
              ? cleanFilename
              : `${cleanFilename}.pdf`
        }

        // Handle placeholder files by constructing a proper URL
        if (doc.filename.includes('.placeholder') || doc.url?.includes('example.com')) {
          // Generate the R2 URL with encoded filename
          const r2Url = `https://downloads.slideheroes.com/${encodeURIComponent(actualFilename)}`

          console.log(`Mapped placeholder ${doc.filename} to R2 file: ${actualFilename}`)
          console.log(`Generated R2 URL: ${r2Url}`)

          // Update the document with the real URL
          return {
            ...doc,
            url: r2Url,
            _actualFilename: actualFilename, // Store for debugging
            _fileType: actualFilename.endsWith('.zip')
              ? 'zip'
              : actualFilename.endsWith('.pdf')
                ? 'pdf'
                : 'other',
            fileStatus: 'Available',
            _debug: {
              isPlaceholder: true,
              mapped: true,
              originalFilename: doc.filename,
              mappedFilename: actualFilename,
              originalUrl: doc.url,
              newUrl: r2Url,
            },
          }
        }

        // Basic file type detection for non-placeholder files
        const isZipFile = doc.filename?.endsWith('.zip') || doc.mimeType === 'application/zip'
        const isPdfFile = doc.filename?.endsWith('.pdf') || doc.mimeType === 'application/pdf'

        // Handle normal files (not placeholders)
        return {
          ...doc,
          _fileType: isZipFile ? 'zip' : isPdfFile ? 'pdf' : 'other',
          fileStatus: 'Available',
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
    // No bidirectional relationships - these will be managed from the content side
  ],
}
