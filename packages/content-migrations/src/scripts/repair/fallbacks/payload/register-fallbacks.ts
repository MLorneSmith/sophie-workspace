import fs from 'fs';
import path from 'path';

/**
 * Creates Payload extension for fallback system
 */
export async function registerFallbacks() {
  try {
    const extensionsDir = path.join(
      process.cwd(),
      'apps/payload/src/extensions',
    );

    // Create extensions directory if it doesn't exist
    if (!fs.existsSync(extensionsDir)) {
      fs.mkdirSync(extensionsDir, { recursive: true });
    }

    // Create the fallback system extension file
    const fallbackExtensionPath = path.join(
      extensionsDir,
      'fallback-system.ts',
    );
    const fallbackExtensionContent = `
import { Config } from 'payload/config';

/**
 * Extension to register the fallback system with Payload configuration
 * This provides graceful failure handling for relationship issues
 */
export const registerFallbackSystem = (config: Config): Config => {
  // Create a new config object
  const updatedConfig = {
    ...config,
    // Add hooks for fallback system
    hooks: {
      ...config.hooks,
      afterError: [
        ...(config.hooks?.afterError || []),
        // Add fallback error handler
        async ({ error }) => {
          // Log error for monitoring
          console.warn('Fallback system handling error:', error);
          
          try {
            // Analyze error to see if it's a relationship error
            const isRelationshipError = 
              error?.message?.includes('relationship') || 
              error?.message?.includes('reference') ||
              error?.message?.includes('foreign key');
            
            if (isRelationshipError) {
              // Log specific relationship errors for better tracking
              console.warn('Relationship error detected, fallback system activated');
              
              // In production, you might want to send this to a monitoring service
              // or log it more formally
            }
          } catch (loggingError) {
            console.error('Error in fallback error handler:', loggingError);
          }
          
          // Return the original error - Payload will continue processing
          return error;
        },
      ],
    },
    // Add global admin components for fallbacks
    admin: {
      ...config.admin,
      components: {
        ...config.admin?.components,
        // Add components here if needed
        // For example, you could add a custom error component
        // to show more helpful errors in the admin UI
      },
    },
  };

  return updatedConfig;
};

/**
 * Function to register fallback-specific collection hooks
 * This allows adding collection-specific fallback behavior
 */
export const registerCollectionFallbacks = (collection: any): any => {
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      // Add collection-specific hooks here
    },
  };
};
`;

    fs.writeFileSync(fallbackExtensionPath, fallbackExtensionContent);
    console.log(`Created fallback extension at ${fallbackExtensionPath}`);

    // Update Payload config to use the fallback system if it's not already configured
    const configPath = path.join(
      process.cwd(),
      'apps/payload/src/payload.config.ts',
    );

    if (fs.existsSync(configPath)) {
      let configContent = fs.readFileSync(configPath, 'utf8');

      // Only add the import and registration if they don't already exist
      if (!configContent.includes('registerFallbackSystem')) {
        // Add import statement after the Payload import
        configContent = configContent.replace(
          "import { buildConfig } from 'payload/config';",
          "import { buildConfig } from 'payload/config';\nimport { registerFallbackSystem } from './extensions/fallback-system';",
        );

        // Find where the config is built/exported
        if (configContent.includes('export default buildConfig(')) {
          // Add fallback system registration before the buildConfig call
          configContent = configContent.replace(
            'export default buildConfig(',
            '// Apply fallback mechanisms\nconst updatedConfig = registerFallbackSystem(baseConfig);\n\nexport default buildConfig(',
          );

          // Update the passed variable to use the updated config
          configContent = configContent.replace(
            'export default buildConfig(baseConfig',
            'export default buildConfig(updatedConfig',
          );
        } else if (configContent.includes('export default buildConfig({')) {
          // For inline config objects, wrap it first
          configContent = configContent.replace(
            'export default buildConfig({',
            'const baseConfig = {\n',
          );

          // Find the closing brace and add the registration
          const lastBraceIndex = configContent.lastIndexOf('});');
          if (lastBraceIndex !== -1) {
            configContent =
              configContent.substring(0, lastBraceIndex) +
              '};\n\n// Apply fallback mechanisms\nconst updatedConfig = registerFallbackSystem(baseConfig);\n\nexport default buildConfig(updatedConfig);' +
              configContent.substring(lastBraceIndex + 3);
          }
        }

        fs.writeFileSync(configPath, configContent);
        console.log(
          `Updated Payload config at ${configPath} to use fallback system`,
        );
      } else {
        console.log(`Fallback system already registered in Payload config`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error registering fallbacks:', error);
    return { success: false, error };
  }
}

// Run the function directly if executed as a script
if (require.main === module) {
  registerFallbacks()
    .then((result) => {
      if (result.success) {
        console.log('Successfully registered fallback system with Payload');
        process.exit(0);
      } else {
        console.error('Failed to register fallback system:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
