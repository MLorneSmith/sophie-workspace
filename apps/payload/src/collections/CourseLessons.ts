import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { CollectionConfig } from 'payload'
import { BunnyVideo, YouTubeVideo } from '../blocks'
import { findDownloadsForCollection } from '../db/downloads'
import { getDownloadsForLesson } from '../db/download-helpers'

export const CourseLessons: CollectionConfig = {
  slug: 'course_lessons',
  labels: {
    singular: 'Course Lesson',
    plural: 'Course Lessons',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'lesson_number', 'course_id'],
    description: 'Lessons for courses in the learning management system',
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
            // First try using our new helper function which includes special handling for zip files
            try {
              const enhancedDownloads = await getDownloadsForLesson(req.payload, doc.id)

              if (enhancedDownloads && enhancedDownloads.length > 0) {
                console.log(
                  `Found ${enhancedDownloads.length} downloads for lesson ${doc.slug || doc.id} using enhanced helper`,
                )

                // Update the document with the enhanced downloads
                return {
                  ...doc,
                  downloads: enhancedDownloads,
                }
              }
            } catch (enhancedError) {
              console.error('Error using enhanced download helper:', enhancedError)
              // Fall back to the legacy helper if the new one fails
            }

            // Fall back to the original helper if the enhanced one fails or returns empty
            const downloads = await findDownloadsForCollection(
              req.payload,
              doc.id,
              'course_lessons',
            )

            // Update the document with the retrieved downloads
            return {
              ...doc,
              downloads,
            }
          } catch (error) {
            console.error('Error fetching downloads for course lesson:', error)
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
      name: 'bunny_video_id',
      type: 'text',
      label: 'Bunny.net Video ID',
      admin: {
        description: 'Video ID from Bunny.net (if this lesson includes a video)',
      },
    },
    {
      name: 'bunny_library_id',
      type: 'text',
      label: 'Bunny.net Library ID',
      defaultValue: '264486',
      admin: {
        description: 'Library ID from Bunny.net (defaults to main library)',
      },
    },
    {
      name: 'video_source_type',
      type: 'select',
      label: 'External Video Source',
      defaultValue: 'youtube', // For backward compatibility
      admin: {
        description: 'Source platform for the external video',
        isClearable: true,
      },
      options: [
        {
          label: 'YouTube',
          value: 'youtube',
        },
        {
          label: 'Vimeo',
          value: 'vimeo',
        },
      ],
    },
    {
      name: 'youtube_video_id',
      type: 'text',
      label: 'External Video ID',
      admin: {
        description: 'Video ID from YouTube or Vimeo (if this lesson includes an external video)',
      },
    },
    {
      name: 'todo_complete_quiz',
      type: 'checkbox',
      label: 'Todo: Complete Quiz',
      defaultValue: false,
    },
    {
      name: 'todo_watch_content',
      type: 'richText',
      label: 'Todo: Watch Content',
      editor: lexicalEditor({}),
      admin: {
        description:
          'Content to watch - supports rich text formatting like bullet points and links',
      },
    },
    {
      name: 'todo_read_content',
      type: 'richText',
      label: 'Todo: Read Content',
      editor: lexicalEditor({}),
      admin: {
        description: 'Content to read - supports rich text formatting like bullet points and links',
      },
    },
    {
      name: 'todo_course_project',
      type: 'richText',
      label: 'Todo: Course Project',
      editor: lexicalEditor({}),
      admin: {
        description:
          'Course project instructions - supports rich text formatting like bullet points and links',
      },
    },
    {
      name: 'todo',
      type: 'richText',
      label: 'Todo',
      editor: lexicalEditor({}),
      admin: {
        description:
          'General todo instructions for this lesson - supports rich text formatting like bullet points and links',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The URL-friendly identifier for this lesson',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'featured_image_id',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [BunnyVideo, YouTubeVideo],
          }),
        ],
      }),
    },
    {
      name: 'lesson_number',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Order in which this lesson appears in the course',
      },
    },
    {
      name: 'estimated_duration',
      type: 'number',
      min: 0,
      label: 'Estimated duration (minutes)',
    },
    {
      name: 'course_id',
      type: 'relationship',
      relationTo: 'courses' as any,
      required: true,
    },
    {
      name: 'quiz_id',
      type: 'relationship',
      relationTo: 'course_quizzes' as any,
      hasMany: false,
      admin: {
        description: 'The quiz associated with this lesson (if any)',
      },
    },
    {
      name: 'survey_id',
      type: 'relationship',
      relationTo: 'surveys' as any,
      hasMany: false,
      admin: {
        description: 'The survey associated with this lesson (if any)',
      },
    },
    {
      name: 'downloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
      admin: {
        description: 'Files for download in this lesson',
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
  ],
}
