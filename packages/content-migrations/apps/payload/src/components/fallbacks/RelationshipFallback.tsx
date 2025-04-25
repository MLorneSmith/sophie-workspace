
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
            `/api/fallbacks/relationships?collection=${collection}&id=${id}&field=${path}`
          );

          if (!res.ok) {
            throw new Error(`Failed to fetch fallback: ${res.status}`);
          }

          const fallbackData = await res.json();

          if (fallbackData.data) {
            // Set the value to the fallback data
            setValue(fallbackData.data);
            setHasFallback(true);

            console.log(
              `Fallback applied for ${path}: ${JSON.stringify(fallbackData.data)}`
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
