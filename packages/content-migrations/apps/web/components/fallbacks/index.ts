
/**
 * Frontend components for fallback and error handling
 */

export {
  RelationshipErrorBoundary,
  withRelationshipErrorBoundary,
} from './RelationshipErrorBoundary';
export { MediaFallback, DownloadFallback } from './MediaFallback';
export { ContentPlaceholder } from './ContentPlaceholder';

/**
 * Initialize fallback components
 * This should be called in the app's main layout
 */
export function initializeFallbacks() {
  if (typeof window === 'undefined') return;

  // Register error handlers
  window.addEventListener('error', (event) => {
    // If the error is a relationship error, log it
    if (
      event.error?.message?.includes('relationship') ||
      event.message?.includes('relationship')
    ) {
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: event.error?.message || event.message,
            stack: event.error?.stack,
            type: 'relationship',
            url: window.location.href,
          }),
        }).catch(console.error);
      } catch (error) {
        console.error('Failed to log error:', error);
      }
    }
  });

  // Add a fetch interceptor to handle S3/R2 404 errors
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      const response = await originalFetch(input, init);
      
      // If this is a media file (likely from S3/R2) and it's a 404, look for a fallback
      if (
        !response.ok && 
        response.status === 404 &&
        typeof input === 'string' &&
        (
          input.includes('.jpg') || 
          input.includes('.png') || 
          input.includes('.webp') || 
          input.includes('.pdf') ||
          input.includes('download') ||
          input.includes('uploads') ||
          input.includes('.mp4')
        )
      ) {
        console.warn(`Resource not found: ${input}, attempting fallback`);
        
        // Try to fetch a fallback URL instead
        const fallbackUrl = input.includes('.pdf') 
          ? '/assets/fallbacks/download-placeholder.pdf'
          : '/assets/fallbacks/image-placeholder.webp';
          
        // Only try the fallback if it's different from the original
        if (fallbackUrl !== input) {
          try {
            const fallbackResponse = await originalFetch(fallbackUrl);
            if (fallbackResponse.ok) {
              console.log(`Using fallback for ${input}: ${fallbackUrl}`);
              return fallbackResponse;
            }
          } catch (fallbackError) {
            console.error('Error fetching fallback:', fallbackError);
          }
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
}
