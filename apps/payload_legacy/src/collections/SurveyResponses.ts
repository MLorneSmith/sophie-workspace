import type { CollectionConfig } from 'payload'

export const SurveyResponses: CollectionConfig = {
  slug: 'survey_responses',
  labels: {
    singular: 'Survey Response',
    plural: 'Survey Responses',
  },
  admin: {
    useAsTitle: 'userId',
    defaultColumns: ['userId', 'survey', 'completed', 'createdAt'],
    description: 'User responses to surveys',
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      admin: {
        description: 'The ID of the user who submitted this response',
      },
    },
    {
      name: 'survey',
      type: 'relationship',
      relationTo: 'surveys' as any, // Type assertion to bypass TypeScript error
      required: true,
      admin: {
        description: 'The survey this response is for',
      },
    },
    {
      name: 'responses',
      type: 'json',
      admin: {
        description: "The user's responses to the survey questions",
      },
    },
    {
      name: 'progress',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Percentage of survey completed',
      },
    },
    {
      name: 'categoryScores',
      type: 'json',
      admin: {
        description: 'Scores for each category in the survey',
      },
    },
    {
      name: 'highestScoringCategory',
      type: 'text',
      admin: {
        description: 'The category with the highest score',
      },
    },
    {
      name: 'lowestScoringCategory',
      type: 'text',
      admin: {
        description: 'The category with the lowest score',
      },
    },
    {
      name: 'completed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the survey has been completed',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When the response was created',
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When the response was last updated',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const now = new Date().toISOString()
        if (!data.createdAt) {
          data.createdAt = now
        }
        data.updatedAt = now
        return data
      },
    ],
  },
  access: {
    read: ({ req }) => {
      // Admin users can read all responses
      if (req.user?.email?.endsWith('@slideheroes.com')) return true

      // Regular users can only see their own responses
      if (req.user?.id) {
        return {
          userId: { equals: req.user.id },
        }
      }

      // Default deny access
      return false
    },
    create: ({ req }) => {
      // Only authenticated users can create responses
      return Boolean(req.user)
    },
    update: ({ req }) => {
      // Admin users can update all responses
      if (req.user?.email?.endsWith('@slideheroes.com')) return true

      // Regular users can only update their own responses
      if (req.user?.id) {
        return {
          userId: { equals: req.user.id },
        }
      }

      // Default deny access
      return false
    },
    delete: ({ req }) => {
      // Only admin users can delete responses
      return Boolean(req.user?.email?.endsWith('@slideheroes.com'))
    },
  },
}
