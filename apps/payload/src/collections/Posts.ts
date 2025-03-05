import { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import CallToAction from '../blocks/CallToAction'
import TestBlock from '../blocks/TestBlock'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Blog posts for the website',
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
        description: 'The URL-friendly identifier for this post',
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
        description: 'A brief summary of the post',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock],
          }),
        ],
      }),
      admin: {
        description: 'The main content of the blog post',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'The date and time this post was published',
      },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured image for the blog post',
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
        description: 'Only published posts will be visible on the website',
      },
    },
    {
      name: 'categories',
      type: 'array',
      admin: {
        description: 'Categories for this post',
      },
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
      admin: {
        description: 'Tags for this post',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
}
