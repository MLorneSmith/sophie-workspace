/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getLogger } from '../../../../utils/logging.js';
// Create logger for admin UI components
const logger = getLogger('fallbacks:admin-ui');
/**
 * Creates React components for graceful error handling in the admin interface.
 * These components provide helpful error states and recovery options when
 * relationship data fails to load.
 */
export async function createErrorComponents() {
    logger.info('Creating admin UI error components...', {
        module: 'fallbacks',
        component: 'admin-ui',
    });
    try {
        // Create directory for admin UI fallback components
        const componentsDir = path.join(process.cwd(), 'apps/payload/src/components/fallbacks');
        if (!fs.existsSync(componentsDir)) {
            fs.mkdirSync(componentsDir, { recursive: true });
        }
        // Create error handler component
        const errorHandlerPath = path.join(componentsDir, 'ErrorHandler.tsx');
        const errorHandlerContent = `
import React from 'react';
import { useDocumentInfo } from 'payload/components/utilities';
import { Button } from 'payload/components';

/**
 * Custom error component for Payload admin UI that provides
 * helpful recovery options when a document fails to load
 */
const ErrorHandler: React.FC<{
  error?: Error;
  message?: string;
}> = ({ error, message }) => {
  const { id, collection } = useDocumentInfo();
  const collectionLabel = collection
    ? collection.charAt(0).toUpperCase() + collection.slice(1)
    : 'Document';

  const errorMessage = message || (error ? error.message : 'Unknown error');

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Document Error</h1>

      <div style={{ marginBottom: '2rem' }}>
        <p>
          There was a problem loading the {collectionLabel} document
          {id ? \` with ID: \${id}\` : ''}.
        </p>

        <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f8f8f8', borderRadius: '4px', textAlign: 'left' }}>
          <p><strong>Error:</strong> {errorMessage}</p>
        </div>

        <p>This may be due to one of the following reasons:</p>
        <ul style={{ textAlign: 'left', marginTop: '1rem', maxWidth: '600px', margin: '1rem auto' }}>
          <li>The document may have been deleted</li>
          <li>There may be a relationship issue with this document</li>
          <li>A database migration may have affected this document's structure</li>
          <li>You may not have permission to access this document</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        <Button onClick={() => window.history.back()}>Go Back</Button>
        {collection && (
          <Button el="link" url={\`/admin/collections/\${collection}\`}>
            Return to {collectionLabel} List
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Error Handler component that can be registered with Payload
 */
export const RelationshipErrorHandler = {
  ErrorBoundary: ErrorHandler,
};

export default ErrorHandler;
`;
        fs.writeFileSync(errorHandlerPath, errorHandlerContent);
        logger.info(`Created error handler component at ${errorHandlerPath}`, {
            module: 'fallbacks',
            component: 'admin-ui',
        });
        // Create relationship fallback component
        const relationshipFallbackPath = path.join(componentsDir, 'RelationshipFallback.tsx');
        const relationshipFallbackContent = `
import React, { useEffect, useState } from 'react';
import { useField } from 'payload/components/forms';
import { useDocumentInfo } from 'payload/components/utilities';
import { Button, Spinner } from 'payload/components';
import { Props } from 'payload/components/fields/relationship';

/**
 * Component that provides UI-level fallbacks for relationship fields in Payload admin
 * This wraps the standard relationship field component with fallback functionality
 */
export const RelationshipFallback: React.FC<Props> = (props) => {
  // First render the original component
  const { relationship } = require('payload/components/fields');
  const RelationshipField = relationship.FieldComponent as React.ComponentType<Props>;
  
  const { path } = props;
  const { value, setValue } = useField<any>({ path: props.path });
  const { id, collection } = useDocumentInfo();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFallback, setHasFallback] = useState(false);

  // Effect to attempt fallback fetching if value is missing
  useEffect(() => {
    const attemptFallbackFetch = async () => {
      // Only run if value is missing or empty
      if (!value || (Array.isArray(value) && value.length === 0)) {
        setIsLoading(true);
        setError(null);

        try {
          // Fetch fallback relationships from our custom endpoint
          const res = await fetch(
            \`/api/fallbacks/relationships?collection=\${collection}&id=\${id}&field=\${path}\`
          );

          if (!res.ok) {
            throw new Error(\`Failed to fetch fallback: \${res.status}\`);
          }

          const fallbackData = await res.json();

          if (fallbackData.data) {
            // Set the value to the fallback data
            setValue(fallbackData.data);
            setHasFallback(true);

            console.log(
              \`Fallback applied for \${path}: \${JSON.stringify(fallbackData.data)}\`
            );
          }
        } catch (err) {
          console.error('Error fetching relationship fallback:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Only attempt fallback for saved documents (that have an ID)
    if (id) {
      attemptFallbackFetch();
    }
  }, [path, value, id, collection, setValue]);

  return (
    <div>
      <RelationshipField {...props} />

      {/* Show loading indicator if fetching fallback */}
      {isLoading && (
        <div style={{ marginTop: '0.5rem' }}>
          <Spinner size="small" />
          <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
            Looking for relationships...
          </span>
        </div>
      )}

      {/* Show error if fallback fetch failed */}
      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          <p>Unable to load related items. You may need to manually select them.</p>
          <Button
            buttonStyle="secondary"
            size="small"
            onClick={() => {
              setError(null);
              // This will re-trigger the effect
              setValue(Array.isArray(value) ? [] : null);
            }}
          >
            Retry Fallback
          </Button>
        </div>
      )}

      {/* Show indicator if fallback was applied */}
      {hasFallback && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#d4edda',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          <p>Relationship restored from fallback data.</p>
        </div>
      )}
    </div>
  );
};

export default RelationshipFallback;
`;
        fs.writeFileSync(relationshipFallbackPath, relationshipFallbackContent);
        logger.info(`Created relationship fallback component at ${relationshipFallbackPath}`, { module: 'fallbacks', component: 'admin-ui' });
        // Create components index
        const indexPath = path.join(componentsDir, 'index.ts');
        const indexContent = `
/**
 * Admin UI components for fallback and error handling in Payload CMS
 */

export { default as ErrorHandler, RelationshipErrorHandler } from './ErrorHandler';
export { default as RelationshipFallback } from './RelationshipFallback';
`;
        fs.writeFileSync(indexPath, indexContent);
        logger.info(`Created components index at ${indexPath}`, {
            module: 'fallbacks',
            component: 'admin-ui',
        });
        return { success: true };
    }
    catch (error) {
        logger.error('Error creating admin UI error components', {
            module: 'fallbacks',
            component: 'admin-ui',
            error,
        });
        throw error;
    }
}
// If this script is run directly
// ES modules don't have a direct equivalent to require.main === module
// Use this pattern for direct execution detection
const isMainModule = typeof process !== 'undefined' &&
    process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    createErrorComponents()
        .then(() => {
        console.log('Admin UI error components created successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Error creating admin UI error components:', error);
        process.exit(1);
    });
}
