import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import BunnyVideo from '../blocks/BunnyVideo'

export const CourseLessons: CollectionConfig = {
  slug: 'course_lessons',
  labels: {
    singular: 'Course Lesson',
    plural: 'Course Lessons',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'lessonNumber', 'course_id'],
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
      name: 'lessonNumber',
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
