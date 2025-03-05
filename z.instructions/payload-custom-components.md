# Creating Custom Components for Payload CMS

This guide provides instructions for creating custom components for Payload CMS that can be used in the rich text editor.

## Directory Structure

Custom components should be organized in the following structure:

```
apps/payload/src/blocks/
  ├── YourCustomComponent/
  │   ├── index.ts           # Block configuration
  │   └── Component.tsx      # React component implementation
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

import React, { useEffect } from 'react';

// Define the type for your component props
type YourComponentProps = {
  blockType: string;
  blockName?: string;
  // Add your custom fields here
  title?: string;
  description?: string;
  // Add these properties for HTML serialization
  htmlContent?: string;
  data?: Record<string, any>;
  html?: string;
  toHTML?: () => string;
};

// Function to generate HTML content
function generateHtmlContent(props: YourComponentProps): string {
  const {
    title = 'Default Title',
    description = 'Default description text',
    // Add default values for your other props
  } = props || {};

  // Return an HTML string representation of your component
  return `
    <div class="my-6 p-6 bg-gray-100 rounded-lg">
      <h3 class="text-xl font-bold mb-2">${title}</h3>
      <p class="text-gray-700">${description}</p>
      <!-- Add your custom HTML here -->
    </div>
  `;
}

export const Component: React.FC<{ data: YourComponentProps }> = ({ data }) => {
  const {
    title = 'Default Title',
    description = 'Default description text',
    // Add default values for your other props
  } = data || {};

  // Generate HTML content
  const htmlContent = generateHtmlContent(data);

  // Store the HTML content directly in the node data for serialization
  useEffect(() => {
    if (data) {
      // Store HTML content in multiple locations for better compatibility
      data.htmlContent = htmlContent;
      data.html = htmlContent;

      // Also store it in data.data for better compatibility
      if (!data.data) {
        data.data = {};
      }
      data.data.htmlContent = htmlContent;
      data.data.html = htmlContent;

      // Add a toHTML method to the data object
      if (typeof data.toHTML !== 'function') {
        data.toHTML = () => htmlContent;
      }

      // Log for debugging
      console.log('Stored HTML content in data:', {
        htmlContent: data.htmlContent?.substring(0, 50) + '...',
        dataHtmlContent: data.data?.htmlContent?.substring(0, 50) + '...',
      });
    }
  }, [data, htmlContent]);

  // Return the React component for rendering in the admin UI
  return (
    <div className="my-6 rounded-lg bg-gray-100 p-6">
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-gray-700">{description}</p>
      {/* Add your custom JSX here */}

      {/* Hidden div with HTML content for serialization */}
      <div
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default Component;
```

## Step 3: Create the Block Configuration

Create a file named `index.ts` in your component directory with the following structure:

```ts
import { Block } from 'payload';

const YourCustomComponent: Block = {
  slug: 'your-custom-component', // Unique identifier for the block
  labels: {
    singular: 'Your Custom Component',
    plural: 'Your Custom Components',
  },
  // Optional image alt text for the block
  imageAltText: 'Your Custom Component',
  // Define the fields for your component
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Default Title',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      defaultValue: 'Default description text',
      required: true,
    },
    // Add more fields as needed
  ],
  admin: {
    components: {
      // Reference the component file
      Block: './Component',
    },
  },
};

export default YourCustomComponent;
```

## Step 4: Register the Block in the Posts Collection

Open `apps/payload/src/collections/Posts.ts` and add your custom component to the `BlocksFeature`:

```ts
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { CollectionConfig } from 'payload';

import CallToAction from '../blocks/CallToAction';
import TestBlock from '../blocks/TestBlock';
import YourCustomComponent from '../blocks/YourCustomComponent';

export const Posts: CollectionConfig = {
  // ...existing configuration
  fields: [
    // ...existing fields
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
      admin: {
        description: 'The main content of the blog post',
      },
    },
    // ...other fields
  ],
};
```

## Step 5: Update the Content Renderer (if needed)

If your component has a unique structure or requires special handling, you may need to update the content renderer in `packages/cms/payload/src/content-renderer.tsx`. Add a new condition to handle your custom component:

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

  // If no HTML content was found, try to generate it
  if (!htmlContent) {
    console.log('No HTML content found, generating from data');
    const {
      title = 'Default Title',
      description = 'Default description text',
      // Add default values for your other props
    } = node.data || node.fields || node;

    htmlContent = `
      <div class="my-6 p-6 bg-gray-100 rounded-lg">
        <h3 class="text-xl font-bold mb-2">${title}</h3>
        <p class="text-gray-700">${description}</p>
        <!-- Add your custom HTML here -->
      </div>
    `;
  }

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
  } else {
    console.log('Failed to generate HTML content for Your Custom Component');
  }
}
```

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions for your components and files.
2. **Type Safety**: Define proper TypeScript interfaces for your component props.
3. **Default Values**: Always provide default values for your props to handle cases where data might be missing.
4. **HTML Serialization**: Implement the `generateHtmlContent` function to ensure your component can be properly serialized to HTML.
5. **Debugging**: Add console logs to help debug issues with your component.
6. **Reusability**: Design your components to be reusable and configurable through the admin UI.
7. **Styling**: Use Tailwind CSS classes for styling to maintain consistency with the rest of the application.

## Example: Call To Action Component

Here's an example of a Call To Action component that follows these best practices:

### Component.tsx

```tsx
'use client';

import React, { useEffect } from 'react';

type CallToActionProps = {
  blockType: string;
  blockName?: string;
  headline?: string;
  subheadline?: string;
  leftButtonLabel?: string;
  leftButtonUrl?: string;
  rightButtonLabel?: string;
  rightButtonUrl?: string;
  htmlContent?: string;
  data?: Record<string, any>;
  html?: string;
  toHTML?: () => string;
};

function generateHtmlContent(props: CallToActionProps): string {
  const {
    headline = 'FREE Course Trial',
    subheadline = 'Start improving your presentations skills immediately with our free trail of the Decks for Decision Makers course.',
    leftButtonLabel = 'Individuals',
    leftButtonUrl = '/free-trial/individual',
    rightButtonLabel = 'Teams',
    rightButtonUrl = '/free-trial/teams',
  } = props || {};

  return `
    <div class="my-6 p-6 bg-gray-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex-1">
        <h3 class="text-xl font-bold mb-2">${headline}</h3>
        <p class="text-gray-700">${subheadline}</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative">
          <img
            src="/images/doodle.png"
            alt="Doodle"
            class="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-auto transform -rotate-90"
          />
          <a
            href="${leftButtonUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            ${leftButtonLabel}
          </a>
        </div>
        <div class="relative">
          <a
            href="${rightButtonUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            ${rightButtonLabel}
          </a>
          <img
            src="/images/doodle.png"
            alt="Doodle"
            class="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-auto transform rotate-90"
          />
        </div>
      </div>
    </div>
  `;
}

export const Component: React.FC<{ data: CallToActionProps }> = ({ data }) => {
  const {
    headline = 'FREE Course Trial',
    subheadline = 'Start improving your presentations skills immediately with our free trail of the Decks for Decision Makers course.',
    leftButtonLabel = 'Individuals',
    leftButtonUrl = '/free-trial/individual',
    rightButtonLabel = 'Teams',
    rightButtonUrl = '/free-trial/teams',
  } = data || {};

  const htmlContent = generateHtmlContent(data);

  useEffect(() => {
    if (data) {
      data.htmlContent = htmlContent;
      data.html = htmlContent;

      if (!data.data) {
        data.data = {};
      }
      data.data.htmlContent = htmlContent;
      data.data.html = htmlContent;

      if (typeof data.toHTML !== 'function') {
        data.toHTML = () => htmlContent;
      }

      console.log('Stored HTML content in data:', {
        htmlContent: data.htmlContent?.substring(0, 50) + '...',
        dataHtmlContent: data.data?.htmlContent?.substring(0, 50) + '...',
      });
    }
  }, [data, htmlContent]);

  return (
    <div className="my-6 flex flex-col items-center justify-between gap-6 rounded-lg bg-gray-100 p-6 md:flex-row">
      <div className="flex-1">
        <h3 className="mb-2 text-xl font-bold">{headline}</h3>
        <p className="text-gray-700">{subheadline}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative">
          <div className="absolute -left-10 top-1/2 -translate-y-1/2">
            <img
              src="/images/doodle.png"
              alt="Doodle"
              className="h-auto w-8 -rotate-90 transform"
            />
          </div>
          <a
            href={leftButtonUrl}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {leftButtonLabel}
          </a>
        </div>

        <div className="relative">
          <a
            href={rightButtonUrl}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {rightButtonLabel}
          </a>
          <div className="absolute -right-10 top-1/2 -translate-y-1/2">
            <img
              src="/images/doodle.png"
              alt="Doodle"
              className="h-auto w-8 rotate-90 transform"
            />
          </div>
        </div>
      </div>

      <div
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default Component;
```

### index.ts

```ts
import { Block } from 'payload';

const CallToAction: Block = {
  slug: 'custom-call-to-action',
  labels: {
    singular: 'Call To Action',
    plural: 'Call To Actions',
  },
  imageAltText: 'Call To Action component',
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
        'Start improving your presentations skills immediately with our free trail of the Decks for Decision Makers course.',
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
      Block: './Component',
    },
  },
};

export default CallToAction;
```

## Troubleshooting

If your component is not rendering correctly, check the following:

1. **Import Paths**: Make sure the import paths in `importMap.js` are correct.
2. **HTML Serialization**: Ensure your component is properly serializing to HTML.
3. **Content Renderer**: Check if the content renderer is correctly handling your component type.
4. **Console Logs**: Look for any error messages or debug logs in the console.
5. **Component Registration**: Verify that your component is properly registered in the Posts collection.

By following these guidelines, you should be able to create custom components for Payload CMS that work seamlessly in both the admin UI and the front end.
