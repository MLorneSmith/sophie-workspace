import { CollectionConfig } from 'payload'
import { findDownloadsForCollection } from '../db/downloads'

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
    // Add a collection-level afterRead hook to handle downloads
    afterRead: [
      async ({ req, doc }) => {
        // Only handle downloads if we have a specific document with an ID
        if (doc?.id) {
          try {
            // Replace downloads with ones from our custom view
            const downloads = await findDownloadsForCollection(
              req.payload,
              doc.id,
              'course_quizzes',
            )

            // Update the document with the retrieved downloads
            return {
              ...doc,
              downloads,
            }
          } catch (error) {
            console.error('Error fetching downloads for course quiz:', error)
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
      relationTo: 'quiz_questions' as any,
      hasMany: true,
      required: true,
      admin: {
        description: 'Questions included in this quiz',
      },
    },
    // Add downloads field
    {
      name: 'downloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
      admin: {
        description: 'Files for download in this quiz',
      },
    },
  ],
}
