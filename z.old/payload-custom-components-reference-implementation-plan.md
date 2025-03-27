# Plan for Adding Custom Components to Payload CMS Reference Setup

This document outlines a comprehensive plan for implementing custom components in the Payload CMS reference setup located at `D:\SlideHeroes\App\repos\payload-website-reference`.

## Current Understanding

1. **Reference Setup**: We have a working reference setup of Payload CMS using Docker containers for Payload CMS and PostgreSQL.

2. **Custom Components Goal**: We want to add custom components to this reference setup to understand how they work and debug issues in our main project.

3. **Example Repository**: Payload provides a custom components example that demonstrates how to implement various types of custom components, including field components, views, and root components.

4. **Implementation Approach**: The custom components in the example are implemented as both server and client components, with proper registration in the Payload config.

## Implementation Plan

### Phase 1: Setup and Preparation

1. **Clone the Reference Repository**

   - Clone the reference repository to have a local copy to work with
   - Ensure Docker is running and the containers are operational

2. **Examine Current Configuration**

   - Review the current Payload configuration in the reference setup
   - Identify where custom components should be integrated
   - Check for any existing custom components or related code

3. **Create Component Directory Structure**
   - Create a directory structure for custom components following the pattern in the example:
     ```
     src/components/
     ├── fields/
     ├── views/
     └── afterNavLinks/
     ```

### Phase 2: Implement Basic Custom Components

1. **Implement a Simple Custom Field Component**

   - Create a basic text field custom component with both server and client versions
   - Structure:
     ```
     src/components/fields/text/
     ├── components/
     │   ├── client/
     │   │   ├── Field.tsx
     │   │   └── Label.tsx
     │   └── server/
     │       ├── Field.tsx
     │       └── Label.tsx
     └── index.ts
     ```

2. **Implement a Simple Custom View**

   - Create a basic custom view component
   - Structure:
     ```
     src/components/views/
     └── CustomView.tsx
     ```

3. **Implement a Navigation Link Component**
   - Create a simple navigation link component
   - Structure:
     ```
     src/components/afterNavLinks/
     └── LinkToCustomView.tsx
     ```

### Phase 3: Register Custom Components in Payload Config

1. **Update Payload Configuration**

   - Modify the payload.config.ts file to register the custom components
   - Add the components to the admin configuration
   - Set up the import map configuration

2. **Create a Collection with Custom Fields**

   - Create a new collection that uses the custom field components
   - Register the collection in the Payload config

3. **Register Custom Views**
   - Add the custom views to the admin configuration
   - Set up the routes for the custom views

### Phase 4: Implement Rich Text Editor Custom Components

1. **Create Block Components Directory**

   - Create a directory for block components:
     ```
     src/blocks/
     ```

2. **Implement a Call to Action Component**

   - Create a Call to Action component following the example in the instructions
   - Structure:
     ```
     src/blocks/CallToAction/
     ├── Component.tsx
     └── index.ts
     ```

3. **Register Block Components in Rich Text Editor**
   - Update the rich text editor configuration to include the custom blocks
   - Ensure the blocks are properly registered in the import map

### Phase 5: Testing and Debugging

1. **Generate Import Map**

   - Run the generate:importmap command to create the import map
   - Check for any errors in the import map generation

2. **Test Custom Components in Admin UI**

   - Access the admin UI and test the custom field components
   - Test the custom views and navigation links
   - Test the rich text editor block components

3. **Debug and Fix Issues**
   - Identify and fix any issues with the custom components
   - Check for import map issues, component registration problems, or rendering errors

### Phase 6: Documentation and Knowledge Transfer

1. **Document Implementation**

   - Document the custom components implementation
   - Include instructions for adding new custom components

2. **Create Examples for Future Reference**
   - Create example implementations of different types of custom components
   - Include examples of both server and client components

## Implementation Details

### Custom Field Component Example (Text Field)

```tsx
// src/components/fields/text/components/server/Field.tsx
import React from 'react';

import { TextField } from '@payloadcms/ui';
import type { TextFieldServerComponent } from 'payload';

export const CustomTextFieldServer: TextFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  permissions,
}) => {
  return (
    <TextField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  );
};
```

```tsx
// src/components/fields/text/components/client/Field.tsx
'use client';

import React from 'react';

import { TextField } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';

// src/components/fields/text/components/client/Field.tsx

export const CustomTextFieldClient: TextFieldClientComponent = (props) => {
  return <TextField {...props} />;
};
```

### Custom View Example

```tsx
// src/components/views/CustomView.tsx
import React from 'react';

import type { AdminViewProps } from 'payload';

export const CustomView: React.FC<AdminViewProps> = () => {
  return (
    <div>
      <h1>Custom View</h1>
      <p>This is a custom view in the Payload admin panel.</p>
    </div>
  );
};
```

### Payload Config Update Example

```tsx
// src/payload.config.ts
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    components: {
      afterNavLinks: [
        '@/components/afterNavLinks/LinkToCustomView#LinkToCustomView',
      ],
      views: {
        CustomView: {
          Component: '@/components/views/CustomView#CustomView',
          path: '/custom',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // ... other configuration
});
```

### Rich Text Block Component Example

```tsx
// src/blocks/CallToAction/Component.tsx
'use client';

import React, { useEffect } from 'react';

// src/blocks/CallToAction/Component.tsx

type CallToActionProps = {
  blockType: string;
  blockName?: string;
  headline?: string;
  subheadline?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  htmlContent?: string;
  data?: Record<string, any>;
  html?: string;
  toHTML?: () => string;
};

function generateHtmlContent(props: CallToActionProps): string {
  const {
    headline = 'Default Headline',
    subheadline = 'Default subheadline text',
    buttonLabel = 'Learn More',
    buttonUrl = '#',
  } = props || {};

  return `
    <div class="my-6 p-6 bg-gray-100 rounded-lg">
      <h3 class="text-xl font-bold mb-2">${headline}</h3>
      <p class="text-gray-700">${subheadline}</p>
      <a href="${buttonUrl}" class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        ${buttonLabel}
      </a>
    </div>
  `;
}

export const Component: React.FC<{ data: CallToActionProps }> = ({ data }) => {
  const {
    headline = 'Default Headline',
    subheadline = 'Default subheadline text',
    buttonLabel = 'Learn More',
    buttonUrl = '#',
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
    }
  }, [data, htmlContent]);

  return (
    <div className="my-6 rounded-lg bg-gray-100 p-6">
      <h3 className="mb-2 text-xl font-bold">{headline}</h3>
      <p className="text-gray-700">{subheadline}</p>
      <a
        href={buttonUrl}
        className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white"
      >
        {buttonLabel}
      </a>

      <div
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default Component;
```

```tsx
// src/blocks/CallToAction/index.ts
import { Block } from 'payload';

const CallToAction: Block = {
  slug: 'call-to-action',
  labels: {
    singular: 'Call To Action',
    plural: 'Call To Actions',
  },
  imageAltText: 'Call To Action component',
  fields: [
    {
      name: 'headline',
      type: 'text',
      defaultValue: 'Default Headline',
      required: true,
    },
    {
      name: 'subheadline',
      type: 'text',
      defaultValue: 'Default subheadline text',
      required: true,
    },
    {
      name: 'buttonLabel',
      type: 'text',
      defaultValue: 'Learn More',
      required: true,
    },
    {
      name: 'buttonUrl',
      type: 'text',
      defaultValue: '#',
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

## Potential Challenges and Solutions

1. **Import Map Generation Issues**

   - **Challenge**: The import map generation might fail due to SCSS imports or other issues
   - **Solution**: Create a TypeScript declaration file for SCSS and temporarily comment out SCSS imports during import map generation

2. **Component Registration Issues**

   - **Challenge**: Components might not be properly registered in the Payload config
   - **Solution**: Double-check the component paths and ensure they match the directory structure

3. **Docker Environment Issues**

   - **Challenge**: The Docker environment might have different paths or configurations
   - **Solution**: Ensure paths are relative and use environment variables where appropriate

4. **Version Compatibility**
   - **Challenge**: The example might be using a different version of Payload than the reference setup
   - **Solution**: Check the Payload version and adapt the components accordingly

## Implementation Steps

1. **Set up the directory structure**

   ```bash
   mkdir -p src/components/fields/text/components/client
   mkdir -p src/components/fields/text/components/server
   mkdir -p src/components/views
   mkdir -p src/components/afterNavLinks
   mkdir -p src/blocks/CallToAction
   ```

2. **Create the custom field components**

   - Create the server and client field components
   - Create the field index file

3. **Create the custom view component**

   - Create the custom view component
   - Create the navigation link component

4. **Create the rich text block component**

   - Create the Call to Action component
   - Create the block index file

5. **Update the Payload configuration**

   - Register the custom components in the Payload config
   - Set up the import map configuration

6. **Generate the import map**

   - Run the generate:importmap command
   - Fix any issues with the import map generation

7. **Test the custom components**
   - Access the admin UI and test the components
   - Debug and fix any issues

## Conclusion

This plan provides a comprehensive approach to implementing custom components in the Payload CMS reference setup. By following this plan, we will be able to understand how custom components work in Payload CMS and debug issues in our main project.
