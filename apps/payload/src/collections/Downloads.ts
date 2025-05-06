import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  upload: {
    staticDir: path.resolve(dirname, '../../downloads'),
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
