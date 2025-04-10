import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import CallToAction from '../blocks/CallToAction'
import TestBlock from '../blocks/TestBlock'
import { findDownloadsForCollection } from '../db/downloads'

export const Surveys: CollectionConfig = {
  slug: 'surveys',
  labels: {
    singular: 'Survey',
    plural: 'Surveys',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Surveys for user assessment and feedback',
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
            const downloads = await findDownloadsForCollection(req.payload, doc.id, 'surveys')

            // Update the document with the retrieved downloads
            return {
              ...doc,
              downloads,
            }
          } catch (error) {
            console.error('Error fetching downloads for survey:', error)
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
        description: 'The URL-friendly identifier for this survey',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // If no slug is provided, generate one from the title
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '-')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'A brief summary of the survey',
      },
    },
    {
      name: 'startMessage',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock],
          }),
        ],
      }),
      admin: {
        description: 'Introduction message shown before starting the survey',
      },
    },
    {
      name: 'endMessage',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock],
          }),
        ],
      }),
      admin: {
        description: 'Message shown after completing the survey',
      },
    },
    {
      name: 'showProgressBar',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show a progress bar during the survey',
      },
    },
    {
      name: 'questions',
      type: 'relationship',
      relationTo: 'survey_questions' as any,
      hasMany: true,
      admin: {
        description: 'Questions included in this survey',
      },
    },
    {
      name: 'summaryContent',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock],
          }),
        ],
      }),
      admin: {
        description: 'Content shown on the summary page',
      },
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
      admin: {
        position: 'sidebar',
        description: 'Only published surveys will be visible to users',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'The date and time this survey was published',
      },
    },
    // Add downloads field
    {
      name: 'downloads',
      type: 'relationship',
      relationTo: 'downloads',
      hasMany: true,
      admin: {
        description: 'Files for download in this survey',
      },
    },
  ],
}
