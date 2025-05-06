import { CollectionConfig } from 'payload'

export const CourseQuizzes: CollectionConfig = {
  slug: 'course_quizzes',
  labels: {
    singular: 'Course Quiz',
    plural: 'Course Quizzes',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'course_id'],
    description: 'Quizzes for courses in the learning management system',
  },
  access: {
    read: () => true, // Public read access
  },
  versions: {
    drafts: true,
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
        description: 'The URL-friendly identifier for this quiz',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'course_id',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'pass_threshold',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 70,
      admin: {
        description: 'Percentage required to pass the quiz',
      },
    },
    {
      name: 'questions',
      type: 'relationship',
      relationTo: 'quiz_questions',
      hasMany: true,
      required: true,
      admin: {
        description: 'Questions included in this quiz',
      },
    },
  ],
}
