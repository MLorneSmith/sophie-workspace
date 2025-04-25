
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
          {id ? ` with ID: ${id}` : ''}.
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
          <Button el="link" url={`/admin/collections/${collection}`}>
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
