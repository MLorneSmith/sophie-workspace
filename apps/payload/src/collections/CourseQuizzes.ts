import { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const CourseQuizzes: CollectionConfig = {
  slug: 'course_quizzes',
  labels: {
    singular: 'Course Quiz',
    plural: 'Course Quizzes',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'passingScore'],
    description: 'Quizzes for course lessons in the learning management system',
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'passingScore',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      defaultValue: 70,
    },
    {
      name: 'questions',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Multiple Choice', value: 'multiple_choice' },
            // Future: 'true_false', 'short_answer', etc.
          ],
          defaultValue: 'multiple_choice',
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
            {
              name: 'isCorrect',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
        {
          name: 'explanation',
          type: 'text', // Changed from richText to text to avoid Lexical editor issues
          required: false, // Make it optional
          admin: {
            description: 'Optional explanation for this question (plain text only)',
          },
        },
      ],
    },
  ],
}
