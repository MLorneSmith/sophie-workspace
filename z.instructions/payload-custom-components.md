# Creating Custom Components for Payload CMS

This guide provides instructions for creating custom components for Payload CMS that can be used in the rich text editor.

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

import Component from './Component';
import Field from './Field';

export const YourCustomComponent: Block = {
  slug: 'your-custom-component', // Unique identifier for the block
  labels: {
    singular: 'Your Custom Component',
    plural: 'Your Custom Components',
  },
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
  // Register the components
  admin: {
    components: {
      Field, // Input card in the editor
    },
  },
};
```

## Step 5: Create the Index File

Create a file named `index.ts` in your component directory to export the block configuration:

```ts
import { YourCustomComponent } from './config';

export default YourCustomComponent;
```

## Step 6: Register the Block in the Payload Config

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

## Step 7: Update the Content Renderer

The content renderer in `packages/cms/payload/src/content-renderer.tsx` needs to handle your custom component. Add a condition to handle your component type:

```tsx
// Check for Your Custom Component
if (
  node.type === 'your-custom-component' ||
  (node.fields && node.fields.blockType === 'your-custom-component') ||
  node.blockType === 'your-custom-component'
) {
  console.log('Found Your Custom Component:', node);

  // Try to extract the HTML content from various locations
  let htmlContent = findHtmlContent(node);

  if (htmlContent) {
    console.log(
      'Using HTML content for Your Custom Component:',
      htmlContent.substring(0, 100) + '...',
    );
    return (
      <div
        key={i}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Fallback rendering for Your Custom Component
  return (
    <div
      key={i}
      className="my-6 rounded-md border border-blue-100 bg-blue-50 p-4"
    >
      <h3 className="text-lg font-bold text-blue-700">
        Your Custom Component
      </h3>
      <p className="mt-2 text-blue-600">
        {node.text || node.content || 'Custom component content'}
      </p>
    </div>
  );
}
```

Also, make sure the content renderer can handle 'block' type nodes:

```tsx
// Handle block type nodes
if (node.type === 'block') {
  console.log('Found block type node:', node);

  // Check for Your Custom Component in fields
  if (node.fields && node.fields.blockType === 'your-custom-component') {
    console.log('Found Your Custom Component in fields:', node.fields);

    return (
      <div
        key={i}
        className="my-6 rounded-md border border-blue-100 bg-blue-50 p-4"
      >
        <h3 className="text-lg font-bold text-blue-700">
          {node.fields.headline || 'Your Custom Component'}
        </h3>
        <p className="mt-2 text-blue-600">
          {node.fields.text || node.fields.content || 'Custom component content'}
        </p>
      </div>
    );
  }
}
```

## Step 8: Generate the ImportMap

After adding your custom component, you need to regenerate the importMap:

```bash
cd apps/payload
npx payload generate:importmap
```

This will automatically register your component in the importMap.

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions for your components and files.
2. **Type Safety**: Define proper TypeScript interfaces for your component props.
3. **Default Values**: Always provide default values for your props to handle cases where data might be missing.
4. **Separation of Concerns**: Keep the Field component (editor UI) separate from the Component (frontend rendering).
5. **Debugging**: Add console logs to help debug issues with your component.
6. **Reusability**: Design your components to be reusable and configurable through the admin UI.
7. **Styling**: Use Tailwind CSS classes for styling to maintain consistency with the rest of the application.
8. **Error Handling**: Add robust error handling in the content renderer to prevent crashes.

## Example: Call To Action Component

Here's an example of a Call To Action component that follows these best practices:

### Component.tsx

```tsx
'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

// Define the type for the component props
type CallToActionProps = {
  headline?: string;
  subheadline?: string;
  leftButtonLabel?: string;
  leftButtonUrl?: string;
  rightButtonLabel?: string;
  rightButtonUrl?: string;
  [key: string]: any;
};

// Define our own component props type
type ComponentProps = {
  data?: CallToActionProps;
  [key: string]: any;
};

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
  // Destructure the important properties from props
  const { data } = props;

  // Extract data with defaults if missing
  const {
    headline = 'FREE Course Trial',
    subheadline = 'Start improving your presentations skills immediately with our free trial of the Decks for Decision Makers course.',
    leftButtonLabel = 'Individuals',
    leftButtonUrl = '/free-trial/individual',
    rightButtonLabel = 'Teams',
    rightButtonUrl = '/free-trial/teams',
  } = data || {};

  // Render the component
  return (
    <div className="my-6 rounded-md border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-lg font-bold text-blue-700">{headline}</h3>
      <p className="mt-2 text-blue-600">{subheadline}</p>
      <div className="mt-4 flex flex-wrap gap-4">
        {leftButtonLabel && (
          <a
            href={leftButtonUrl || '#'}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            {leftButtonLabel}
          </a>
        )}
        {rightButtonLabel && (
          <a
            href={rightButtonUrl || '#'}
            className="rounded border border-blue-500 bg-white px-4 py-2 text-blue-500 hover:bg-blue-50"
          >
            {rightButtonLabel}
          </a>
        )}
      </div>
    </div>
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
  const handleChange = (field: string, val: string) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: val,
      });
    }
  };

  return (
    <Card className="mb-4 p-4">
      <CardHeader>
        <CardTitle>Call To Action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input
            value={value?.headline || 'FREE Course Trial'}
            onChange={(e) => handleChange('headline', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Subheadline</Label>
          <Input
            value={
              value?.subheadline ||
              'Start improving your presentations skills...'
            }
            onChange={(e) => handleChange('subheadline', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Left Button Label</Label>
          <Input
            value={value?.leftButtonLabel || 'Individuals'}
            onChange={(e) => handleChange('leftButtonLabel', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Left Button URL</Label>
          <Input
            value={value?.leftButtonUrl || '/free-trial/individual'}
            onChange={(e) => handleChange('leftButtonUrl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Right Button Label</Label>
          <Input
            value={value?.rightButtonLabel || 'Teams'}
            onChange={(e) => handleChange('rightButtonLabel', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Right Button URL</Label>
          <Input
            value={value?.rightButtonUrl || '/free-trial/teams'}
            onChange={(e) => handleChange('rightButtonUrl', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Field;
```

### config.ts

```ts
import { Block } from 'payload/types';

import Component from './Component';
import Field from './Field';

export const CallToAction: Block = {
  slug: 'call-to-action',
  labels: {
    singular: 'Call To Action',
    plural: 'Call To Actions',
  },
  fields: [
    {
      name: 'headline',
      type: 'text',
      defaultValue: 'FREE Course Trial',
      required: true,
    },
    {
      name: 'subheadline',
      type: 'text',
      defaultValue:
        'Start improving your presentations skills immediately with our free trial of the Decks for Decision Makers course.',
      required: true,
    },
    {
      name: 'leftButtonLabel',
      type: 'text',
      defaultValue: 'Individuals',
      required: true,
    },
    {
      name: 'leftButtonUrl',
      type: 'text',
      defaultValue: '/free-trial/individual',
      required: true,
    },
    {
      name: 'rightButtonLabel',
      type: 'text',
      defaultValue: 'Teams',
      required: true,
    },
    {
      name: 'rightButtonUrl',
      type: 'text',
      defaultValue: '/free-trial/teams',
      required: true,
    },
  ],
  admin: {
    components: {
      Field,
    },
  },
};
```

### index.ts

```ts
import { CallToAction } from './config';

export default CallToAction;
```

## Troubleshooting

If your component is not rendering correctly, check the following:

1. **Component Structure**: Make sure your component follows the recommended structure with separate Component.tsx and Field.tsx files.

2. **Block Type Handling**: The content renderer needs to handle both direct block types and 'block' type nodes with blockType in fields.

3. **ImportMap Generation**: After adding or modifying components, regenerate the importMap with `npx payload generate:importmap`.

4. **Console Logs**: Add console logs to your components and the content renderer to debug issues.

5. **Error Handling**: Add robust error handling in the content renderer to prevent crashes when data is missing or malformed.

6. **Default Values**: Always provide default values for your props to handle cases where data might be missing.

7. **PayloadClient Error Handling**: Make sure the PayloadClient has proper error handling for API calls, especially when fetching child documents.

By following these guidelines, you should be able to create custom components for Payload CMS that work seamlessly in both the admin UI and the front end.
