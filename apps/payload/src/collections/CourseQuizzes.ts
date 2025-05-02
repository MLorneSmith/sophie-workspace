import { CollectionConfig } from 'payload'
import { findCourseForQuiz } from '../db/relationships'
// import {
//   formatQuizQuestionsOnRead,
//   syncQuizQuestionRelationships,
// } from './hooks/quiz-relationships' // Removed hooks

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
  hooks: {
    // Add hooks to manage course relationship
    beforeChange: [
      // syncQuizQuestionRelationships, // Removed hook
      async ({ data, req }) => {
        // If no course_id provided but we're not creating a new quiz
        // (i.e., updating an existing one), attempt to get existing course_id
        if (!data.course_id && req.method !== 'POST') {
          try {
            const courseId = await findCourseForQuiz(req.payload, data.id)
            if (courseId) {
              data.course_id = courseId
            }
          } catch (error) {
            console.error('Error finding course for quiz:', error)
          }
        }

        // Default to main course if still no course_id
        if (!data.course_id) {
          try {
            const mainCourse = await req.payload.find({
              collection: 'courses',
              where: {
                slug: { equals: 'decks-for-decision-makers' },
              },
            })

            if (mainCourse.docs && mainCourse.docs.length > 0) {
              data.course_id = mainCourse.docs[0].id
            }
          } catch (error) {
            console.error('Error finding default course:', error)
          }
        }

        return data
      },
    ],
    afterRead: [
      // formatQuizQuestionsOnRead, // Removed hook
      async ({ req, doc }) => {
        // Only process if we have a doc with ID
        if (doc?.id) {
          try {
            // If course_id is missing, attempt to find it
            if (!doc.course_id) {
              const courseId = await findCourseForQuiz(req.payload, doc.id)
              if (courseId) {
                doc.course_id = courseId
              }
            }
          } catch (error) {
            console.error('Error fetching course for quiz:', error)
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
      relationTo: 'courses' as any,
      required: true,
      hooks: {
        // Add field-level hook for additional validation
        beforeValidate: [
          async ({ value, operation, originalDoc, req }) => {
            // If value is missing but we're not creating a new document
            if (!value && operation !== 'create') {
              try {
                // Try to fetch from existing document
                const courseId = await findCourseForQuiz(req.payload, originalDoc.id)
                return courseId || value
              } catch (error) {
                console.error('Error in course_id beforeValidate hook:', error)
              }
            }
            return value
          },
        ],
      },
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
      type: 'relationship', // Restored
      relationTo: 'quiz_questions' as any, // Restored
      hasMany: true, // Restored
      required: true,
      admin: {
        description: 'Questions included in this quiz', // Restored description
      },
    },
    // Downloads field removed - quizzes do not need downloads
  ],
}
