import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { CollectionConfig } from 'payload'
import BunnyVideo from '../blocks/BunnyVideo'

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
            blocks: [BunnyVideo],
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
      name: 'estimatedDuration',
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
    // Add a field for the survey_id_id that Payload creates automatically
    // This is needed for compatibility with the database schema
    {
      name: 'survey_id_id',
      type: 'text',
      admin: {
        hidden: true, // Hide this field in the admin UI
      },
      hooks: {
        beforeChange: [
          ({ data }: { data?: any }) => {
            // Copy the value from survey_id to survey_id_id if survey_id exists
            if (data?.survey_id) {
              if (typeof data.survey_id === 'object' && data.survey_id.id) {
                return data.survey_id.id
              }
              return data.survey_id
            }
            return undefined
          },
        ],
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
