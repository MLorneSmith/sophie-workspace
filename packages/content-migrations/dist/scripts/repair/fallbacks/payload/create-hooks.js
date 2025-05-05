import fs from 'fs';
import path from 'path';
/**
 * Creates Payload hooks for fallback system
 */
export async function createPayloadHooks() {
    try {
        const hooksDir = path.join(process.cwd(), 'apps/payload/src/hooks');
        // Create hooks directory if it doesn't exist
        if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
        }
        // Create the fallback hook file
        const fallbackHookPath = path.join(hooksDir, 'useFallbackRelationships.ts');
        const fallbackHookContent = `
import { useAllFormFields } from 'payload/components/forms';
import { useDocumentInfo } from 'payload/components/utilities';
import { useEffect } from 'react';

/**
 * Hook that provides fallback relationships for Payload CMS admin UI
 * This activates when relationship fields are empty due to ID mismatches or missing records
 */
export const useFallbackRelationships = (relationTo: string | string[], path: string) => {
  const { id, collection } = useDocumentInfo();
  const { dispatchFields } = useAllFormFields();
  
  useEffect(() => {
    // Only activate when the admin UI is loaded
    if (typeof window === 'undefined') return;
    
    // Log that fallback relationships hook is active
    console.log(\`Fallback relationships hook active for \${path} in \${collection} \${id}\`);
    
    // Function to attempt fallback data retrieval
    const attemptFallbackRetrieval = async () => {
      try {
        // Construct URL to fallback API
        const url = \`/api/fallbacks/relationships?\${new URLSearchParams({
          collection: collection || '',
          id: id || '',
          field: path,
          relationTo: Array.isArray(relationTo) ? relationTo.join(',') : relationTo,
        }).toString()}\`;
        
        // Fetch fallback data
        const response = await fetch(url);
        
        if (response.ok) {
          const fallbackData = await response.json();
          
          if (fallbackData.success && fallbackData.value) {
            // Dispatch field update with fallback value
            dispatchFields({
              type: 'UPDATE',
              path,
              value: fallbackData.value,
            });
            
            console.log(\`Applied fallback for \${path}: \${JSON.stringify(fallbackData.value)}\`);
          }
        }
      } catch (error) {
        console.error(\`Failed to fetch fallback for \${path}:\`, error);
      }
    };
    
    // Set a slight delay to ensure form is ready
    const timeoutId = setTimeout(attemptFallbackRetrieval, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [id, collection, path, relationTo, dispatchFields]);
  
  return null;
};
`;
        fs.writeFileSync(fallbackHookPath, fallbackHookContent);
        console.log(`Created fallback hook at ${fallbackHookPath}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error creating Payload hooks:', error);
        return { success: false, error };
    }
}
// Run the function directly if executed as a script
if (require.main === module) {
    createPayloadHooks()
        .then((result) => {
        if (result.success) {
            console.log('Successfully created Payload hooks for fallback system');
            process.exit(0);
        }
        else {
            console.error('Failed to create Payload hooks:', result.error);
            process.exit(1);
        }
    })
        .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}
