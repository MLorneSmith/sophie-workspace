import { CollectionConfig } from 'payload'

export const CourseQuizzes: CollectionConfig = {
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        // If the doc has an ID, populate the questions
        if (doc.id) {
          try {
            // Get the questions for this quiz from the relationship table
            const questions = await req.payload.find({
              collection: 'quiz_questions',
              where: {
                quiz_id: {
                  equals: doc.id,
                },
              },
              depth: 0,
            })

            // Add the questions to the doc
            if (questions?.docs?.length > 0) {
              doc.questions = questions.docs.map((question) => question.id)
            }
          } catch (error) {
            console.error('Error populating quiz questions:', error)
          }
        }

        return doc
      },
    ],
  },
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
      type: 'relationship',
      relationTo: 'quiz_questions',
      hasMany: true,
      maxDepth: 1, // Set maximum depth for relationship population
      // Simplified filtering approach to avoid UUID errors
      filterOptions: () => {
        // Show all questions
        return true
      },
      admin: {
        description: 'Questions for this quiz',
      },
    },
  ],
}
