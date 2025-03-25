/**
 * Helper function to make authenticated requests to Payload CMS
 * @param endpoint The API endpoint to call (without the /api/ prefix)
 * @param options Additional fetch options
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The JSON response from the API
 */
export async function callPayloadAPI(
  endpoint: string,
  options: RequestInit = {},
  supabaseClient?: any,
) {
  let session = null;

  try {
    if (supabaseClient) {
      // Use provided client (useful for client components)
      const { data } = await supabaseClient.auth.getSession();
      session = data.session;
    } else {
      // Try to use server client (may fail in some contexts)
      try {
        const { getSupabaseServerClient } =
          require('@kit/supabase/server-client') as {
            getSupabaseServerClient: () => any;
          };
        const supabase = getSupabaseServerClient();
        const { data } = await supabase.auth.getSession();
        session = data.session;
      } catch (error) {
        console.error('Failed to get Supabase server client:', error);
        // Continue without authentication
      }
    }
  } catch (error) {
    console.error('Error getting auth session:', error);
    // Continue without authentication
  }

  // Use port 3020 to match the actual Payload CMS server port
  const payloadUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3020';

  // Log the URL for debugging
  console.log(`Calling Payload API at: ${payloadUrl}/api/${endpoint}`);

  try {
    const response = await fetch(`${payloadUrl}/api/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: session ? `Bearer ${session.access_token}` : '',
      },
    });

    if (!response.ok) {
      // Try to parse error as JSON, but handle case where it's not valid JSON
      try {
        const error = await response.json();
        console.error('Payload API error:', error);
        throw new Error(
          error.message ||
            `Failed to call Payload API: ${response.status} ${response.statusText}`,
        );
      } catch (jsonError) {
        // If error response is not valid JSON
        console.error(
          'Payload API error (non-JSON):',
          response.status,
          response.statusText,
        );
        throw new Error(
          `Failed to call Payload API: ${response.status} ${response.statusText}`,
        );
      }
    }

    // Return the JSON response inside the try block
    return response.json();
  } catch (error) {
    // Catch network errors or other exceptions
    console.error('Payload API request failed:', error);
    throw error;
  }
}
