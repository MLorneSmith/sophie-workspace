import { Block } from 'payload'

export const YouTubeVideo: Block = {
  slug: 'youtube-video',
  interfaceName: 'YouTubeVideoBlock',
  labels: {
    singular: 'YouTube Video',
    plural: 'YouTube Videos',
  },
  imageAltText: 'YouTube Video component',
  fields: [
    {
      name: 'videoId',
      type: 'text',
      label: 'Video ID or URL',
      admin: {
        description:
          'Enter a YouTube video ID (e.g., dQw4w9WgXcQ) or full URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)',
      },
    },
    {
      name: 'previewUrl',
      type: 'text',
      label: 'Preview Image URL',
      admin: {
        description: 'Custom preview image URL (optional)',
      },
    },
    {
      name: 'showPreview',
      type: 'checkbox',
      label: 'Show Preview',
      defaultValue: false,
      admin: {
        description: 'Show preview image before playing the video',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      defaultValue: 'YouTube Video',
      admin: {
        description: 'Enter a title for the video (optional)',
      },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      label: 'Aspect Ratio',
      defaultValue: '16:9',
      options: [
        {
          label: '16:9 (Widescreen)',
          value: '16:9',
        },
        {
          label: '4:3 (Standard)',
          value: '4:3',
        },
        {
          label: '1:1 (Square)',
          value: '1:1',
        },
      ],
      admin: {
        description: 'Select the aspect ratio for the video player',
      },
    },
  ],
}
