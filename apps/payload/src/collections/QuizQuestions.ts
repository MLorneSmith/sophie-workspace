import { CollectionConfig } from 'payload'

export const QuizQuestions: CollectionConfig = {
  slug: 'quiz_questions',
  labels: {
    singular: 'Quiz Question',
    plural: 'Quiz Questions',
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'quiz_id', 'type'],
    description: 'Questions for course quizzes',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'quiz_id',
      type: 'relationship',
      relationTo: 'course_quizzes',
      required: true,
      admin: {
        description: 'The quiz this question belongs to',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Multiple Choice', value: 'multiple_choice' },
        // Future: add more question types as needed
      ],
      defaultValue: 'multiple_choice',
      required: true,
    },
    {
      name: 'options',
      type: 'array',
      required: true,
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
      validate: (options) => {
        if (!options || options.length < 2) {
          return 'At least two options are required'
        }
        return true
      },
    },
    {
      name: 'explanation',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional explanation for this question (plain text only)',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order within the quiz (lower numbers appear first)',
      },
    },
  ],
}
