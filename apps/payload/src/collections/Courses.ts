import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: {
    singular: 'Course',
    plural: 'Courses',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Courses for the learning management system',
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
        description: 'The URL-friendly identifier for this course',
      },
    },
    {
      name: 'description',
      type: 'textarea',
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
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'introContent',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'completionContent',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'estimatedDuration',
      type: 'number',
      min: 0,
      label: 'Estimated duration (minutes)',
    },
    {
      name: 'showProgressBar',
      type: 'checkbox',
      defaultValue: true,
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
      name: 'lessons',
      type: 'relationship',
      relationTo: 'course_lessons' as any,
      hasMany: true,
    },
  ],
}
