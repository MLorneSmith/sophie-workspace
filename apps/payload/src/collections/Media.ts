import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'filename',
  },
  upload: {
    // Enhanced image processing for media collection
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
    // Specify allowed MIME types for media
    mimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ],
    // File size limits (10MB for images, 100MB for videos)
    filesRequiredOnCreate: false,
    // The storage plugin will handle disableLocalStorage automatically
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility and SEO',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption for the media',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'Image',
          value: 'image',
        },
        {
          label: 'Video',
          value: 'video',
        },
        {
          label: 'Document',
          value: 'document',
        },
      ],
      admin: {
        description: 'Type of media file',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: {
        description: 'Tags for organizing and searching media',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Auto-detect file type based on MIME type if not set
        if (req.file && !data.type) {
          const mimeType = req.file.mimetype;
          if (mimeType.startsWith('image/')) {
            data.type = 'image';
          } else if (mimeType.startsWith('video/')) {
            data.type = 'video';
          } else {
            data.type = 'document';
          }
        }
        return data;
      },
    ],
  },
}
