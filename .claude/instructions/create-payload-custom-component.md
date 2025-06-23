# Creating Custom Components for Payload CMS

This guide provides comprehensive instructions for creating custom components for Payload CMS that can be used in the rich text editor.

## Overview of Component Architecture

In our implementation of Payload CMS, custom components require several key pieces to work correctly:

1. **Component Files**: The core files that define the component's appearance, behavior, and data structure.
2. **Registration in Payload Config**: Adding the component to the global lexical editor configuration.
3. **Registration in Collections**: Adding the component to specific collections where it should be available.
4. **Registration in RenderBlocks**: Adding the component to the RenderBlocks component for frontend rendering.

## Directory Structure

Custom components should be organized in the following structure:

```
apps/payload/src/blocks/
  ├── YourCustomComponent/
  │   ├── config.ts          # Block configuration
  │   ├── index.ts           # Export file
  │   ├── Component.tsx      # React component for rendering in the frontend
  │   └── Field.tsx          # React component for the input card in the editor
```

## Step 1: Create the Component Directory

Create a new directory for your component in `apps/payload/src/blocks/`:

```
mkdir -p apps/payload/src/blocks/YourCustomComponent
```

## Step 2: Create the Component Implementation

Create a file named `Component.tsx` in your component directory with the following structure:

```tsx
'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

// Define the type for the component props
type YourComponentProps = {
  text?: string;
  [key: string]: any;
};

// Define our own component props type
type ComponentProps = {
  data?: YourComponentProps;
  [key: string]: any;
};

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
  // Destructure the important properties from props
  const { data } = props;

  // Extract data with defaults if missing
  const { text = 'Default Text' } = data || {};

  // Render the component
  return (
    <Card className="my-6 bg-blue-100">
      <CardHeader>
        <CardTitle className="mb-2">Your Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
};

export default Component;
```

## Step 3: Create the Field Component

Create a file named `Field.tsx` in your component directory with the following structure:

```tsx
'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

// Define the type for the field props
type FieldProps = {
  path: string;
  name: string;
  label?: string;
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
};

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
  const { path, value = {}, onChange } = props;

  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <Card className="mb-4 p-4">
      <CardHeader>
        <CardTitle>Your Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Text</Label>
          <Input value={value || 'Default Text'} onChange={handleChange} />
        </div>
      </CardContent>
    </Card>
  );
};

export default Field;
```

## Step 4: Create the Block Configuration

Create a file named `config.ts` in your component directory with the following structure:

```ts
import { Block } from 'payload/types';

export const YourCustomComponent: Block = {
  slug: 'your-custom-component', // Unique identifier for the block
  interfaceName: 'YourCustomComponentBlock', // TypeScript interface name
  labels: {
    singular: 'Your Custom Component',
    plural: 'Your Custom Components',
  },
  imageAltText: 'Your Custom Component', // Alt text for admin UI
  // Define the fields for your component
  fields: [
    {
      name: 'text',
      type: 'text',
      defaultValue: 'Default Text',
      required: true,
    },
    // Add more fields as needed
  ],
};
```

## Step 5: Create the Index File

Create a file named `index.ts` in your component directory to export the block configuration:

```ts
import { YourCustomComponent } from './config';

export default YourCustomComponent;
```

## Step 6: Update the RenderBlocks Component

The RenderBlocks component is responsible for rendering custom blocks in the frontend. Update `apps/payload/src/blocks/RenderBlocks.tsx` to include your new component:

```tsx
'use client';

import React, { Fragment } from 'react';

import CallToActionComponent from './CallToAction/Component';
import TestBlockComponent from './TestBlock/Component';
import YourCustomComponent from './YourCustomComponent/Component';

// Update the BlockType to include your component's slug
type BlockType = 'call-to-action' | 'test-block' | 'your-custom-component';

// Map block types to their respective components
const blockComponents: Record<BlockType, React.FC<any>> = {
  'call-to-action': CallToActionComponent,
  'test-block': TestBlockComponent,
  'your-custom-component': YourCustomComponent,
};

// Update the isValidBlockType function to include your component's slug
const isValidBlockType = (type: string): type is BlockType =>
  type === 'call-to-action' ||
  type === 'test-block' ||
  type === 'your-custom-component';

// ... rest of the RenderBlocks component
```

## Step 7: Register the Block in the Payload Config

Open `apps/payload/src/payload.config.ts` and add your custom component to the `BlocksFeature`:

```ts
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';

import CallToAction from './blocks/CallToAction';
import TestBlock from './blocks/TestBlock';
import YourCustomComponent from './blocks/YourCustomComponent';

export default buildConfig({
  // ...existing configuration
  editor: lexicalEditor({
    // Global editor configuration with custom blocks
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [CallToAction, TestBlock, YourCustomComponent], // Add your component here
      }),
    ],
  }),
  // ...other configuration
});
```

## Step 8: Register the Block in Collections

To make your custom component available in specific collections, you need to add it to the BlocksFeature in those collections. For example, to add your component to the Posts collection:

```ts
// apps/payload/src/collections/Posts.ts
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { CollectionConfig } from 'payload';

import { CallToAction, TestBlock, YourCustomComponent } from '../blocks';

export const Posts: CollectionConfig = {
  // ...existing configuration
  fields: [
    // ...other fields
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [CallToAction, TestBlock, YourCustomComponent], // Add your component here
          }),
        ],
      }),
      // ...other field config
    },
    // ...other fields
  ],
};
```

Repeat this step for each collection where you want your custom component to be available (e.g., Posts, Private, CourseLessons).

## Step 9: Generate the ImportMap

After adding your custom component, you need to regenerate the importMap:

```bash
cd apps/payload
npx payload generate:importmap
```

## Step 10: Restart the Development Server

Restart the Payload development server to apply all your changes:

```bash
cd apps/payload
pnpm dev:clean
```

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions for your components, files, and slugs.
2. **Type Safety**: Define proper TypeScript interfaces for your component props.
3. **Default Values**: Always provide default values for your props to handle cases where data might be missing.
4. **Separation of Concerns**: Keep the Field component (editor UI) separate from the Component (frontend rendering).
5. **Error Handling**: Add robust error handling to prevent crashes when data is missing or malformed.
6. **Reusability**: Design your components to be reusable and configurable.
7. **Styling**: Use Tailwind CSS classes for styling to maintain consistency with the rest of the application.

## Example: YouTube Video Component

Here's an example of a YouTube Video component that follows these best practices:

### Component.tsx

```tsx
'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

// Define the type for the component props
type YouTubeVideoData = {
  videoId?: string;
  previewUrl?: string;
  showPreview?: boolean;
  title?: string;
  aspectRatio?: string;
  [key: string]: any;
};

// Define our own component props type
type ComponentProps = {
  data?: YouTubeVideoData;
  [key: string]: any;
};

// Helper function to extract YouTube ID from URL or ID
const extractYouTubeId = (input: string): string => {
  // Return if input is empty
  if (!input) return '';

  // Regular expression to match YouTube video ID from various URL formats
  const regExp =
    /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = input.match(regExp);

  if (match && match[1]) {
    // If it's a URL, return the extracted ID
    return match[1];
  }

  // If it's not a URL, assume it's already an ID
  return input;
};

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
  // Destructure the important properties from props
  const { data } = props;

  // Extract data with defaults if missing
  const {
    videoId = '',
    previewUrl = '',
    showPreview = false,
    title = 'YouTube Video',
    aspectRatio = '16:9',
  } = data || {};

  // Extract the YouTube video ID
  const youtubeId = extractYouTubeId(videoId);

  // Calculate padding based on aspect ratio
  const getPaddingBottom = () => {
    if (aspectRatio === '16:9') return '56.25%'; // 9/16 = 0.5625 = 56.25%
    if (aspectRatio === '4:3') return '75%'; // 3/4 = 0.75 = 75%
    if (aspectRatio === '1:1') return '100%'; // Square
    return '56.25%'; // Default to 16:9
  };

  // If no videoId is provided, show a placeholder
  if (!youtubeId) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>{title || 'YouTube Video'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded bg-gray-100 p-8">
            <p className="text-gray-500">
              Please provide a YouTube Video ID or URL
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine the preview image URL
  const finalPreviewUrl =
    previewUrl || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  // Render the component with the YouTube video player
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>{title || 'YouTube Video'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
          {showPreview && finalPreviewUrl ? (
            <div
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black"
              onClick={() => {
                // Replace the preview with the iframe
                const container = document.getElementById(
                  `youtube-video-${youtubeId}`,
                );
                if (container) {
                  container.innerHTML = `
                    <iframe
                      src="https://www.youtube.com/embed/${youtubeId}?autoplay=1"
                      loading="lazy"
                      style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                      allowfullscreen="true"
                      title="${title || 'YouTube Video'}"
                    ></iframe>
                  `;
                }
              }}
              id={`youtube-video-${youtubeId}`}
            >
              <img
                src={finalPreviewUrl}
                alt={`Preview for ${title}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white bg-opacity-80">
                  <div className="border-l-16 ml-1 h-0 w-0 border-b-8 border-t-8 border-b-transparent border-l-red-600 border-t-transparent"></div>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              loading="lazy"
              style={{
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={true}
              title={title || 'YouTube Video'}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Component;
```

### Field.tsx

```tsx
'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Switch } from '@kit/ui/switch';

// Define the type for the field props
type FieldProps = {
  path: string;
  name: string;
  label?: string;
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
};

// Custom TextField component
type TextFieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const TextField: React.FC<TextFieldProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} />
    </div>
  );
};

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
  const { path, value = {}, onChange } = props;

  // Handle field changes
  const handleChange = (fieldName: string, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [fieldName]: fieldValue,
      });
    }
  };

  // Handle aspect ratio selection
  const handleAspectRatioChange = (newRatio: string) => {
    handleChange('aspectRatio', newRatio);
  };

  return (
    <Card className="mb-4 p-4">
      <CardHeader>
        <CardTitle>YouTube Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextField
          label="Video ID or URL"
          value={value.videoId || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('videoId', e.target.value)
          }
        />
        <div className="mb-4 text-xs text-gray-500">
          <p>
            Enter a YouTube video ID (e.g., dQw4w9WgXcQ) or full URL (e.g.,
            https://www.youtube.com/watch?v=dQw4w9WgXcQ)
          </p>
        </div>

        <div className="mb-4 border-t pt-4">
          <p className="mb-2 text-sm font-medium">Preview Options</p>
          <TextField
            label="Custom Preview Image URL (optional)"
            value={value.previewUrl || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange('previewUrl', e.target.value)
            }
          />
          <div className="mt-4 flex items-center space-x-2">
            <Switch
              id="show-preview"
              checked={value.showPreview || false}
              onCheckedChange={(checked) =>
                handleChange('showPreview', checked)
              }
            />
            <Label htmlFor="show-preview">
              Show preview image before playing
            </Label>
          </div>
        </div>
        <TextField
          label="Title (optional)"
          value={value.title || 'YouTube Video'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('title', e.target.value)
          }
        />
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select
            value={value.aspectRatio || '16:9'}
            onValueChange={handleAspectRatioChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
              <SelectItem value="4:3">4:3 (Standard)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default Field;
```

### config.ts

```ts
import { Block } from 'payload';

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
};
```

### index.ts

```ts
import { YouTubeVideo } from './config';

export default YouTubeVideo;
```

## Troubleshooting

If your component is not appearing in the rich text editor dropdown, check the following:

1. **RenderBlocks Registration**: Make sure your component is registered in `RenderBlocks.tsx` with the correct slug.

2. **Collection Registration**: Ensure your component is added to the BlocksFeature in all collections where it should be available.

3. **Component Structure**: Verify that your component follows the recommended structure with separate Component.tsx and Field.tsx files.

4. **ImportMap Generation**: After adding or modifying components, regenerate the importMap with `npx payload generate:importmap`.

5. **Server Restart**: Restart the Payload development server with `pnpm dev:clean` to apply all changes.

6. **Console Logs**: Add console logs to your components to debug any issues.

7. **Field vs Block Registration**: Remember that components in the rich text editor do not need an `admin.components.Field` property in the config.ts file.

By following these guidelines and troubleshooting steps, you should be able to create custom components for Payload CMS that work seamlessly in both the admin UI and the front end.
