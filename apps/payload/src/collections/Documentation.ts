import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import CallToAction from '../blocks/CallToAction'
import TestBlock from '../blocks/TestBlock'

export const Documentation: CollectionConfig = {
  slug: 'documentation',
  labels: {
    singular: 'Documentation',
    plural: 'Documentation',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Documentation content for the application',
  },
  access: {
    read: () => true,
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
      admin: {
        description: 'The URL-friendly identifier for this document',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        // Field-specific editor configuration with custom blocks
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock],
          }),
        ],
      }),
      admin: {
        description: 'The main content of the documentation',
        condition: () => true,
      },
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
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'categories',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'text',
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    // The parent field is now automatically added by the nested-docs plugin
    // {
    //   name: 'parent',
    //   type: 'relationship',
    //   relationTo: 'documentation' as any,
    //   hasMany: false,
    // },
  ],
}
