import { CollectionConfig } from 'payload'
import path from 'path'

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  upload: {
    staticDir: path.resolve(__dirname, '../../downloads'),
    mimeTypes: [
      'image/*',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
