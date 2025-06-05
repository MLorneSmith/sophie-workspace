import { createEnvironmentLogger } from "@kit/shared/logger";
/**
 * Helper function to make authenticated requests to Payload CMS
 * @param endpoint The API endpoint to call (without the /api/ prefix)
 * @param options Additional fetch options
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The JSON response from the API
 */
const logger = createEnvironmentLogger("PAYLOAD-API");
export async function callPayloadAPI(endpoint, options = {}, supabaseClient) {
    let session = null;
    try {
        if (supabaseClient) {
            // Use provided client (useful for client components)
            const { data } = await supabaseClient.auth.getSession();
            session = data.session;
        }
        else if (typeof window === "undefined") {
            // Server-side: skip authentication in Payload CMS context
            // This avoids the server-only dependency chain
            console.log("Server-side context detected, skipping authentication");
            // We'll continue without a session, which is fine for most Payload CMS operations
            // The user will still be authenticated through the Next.js middleware
        }
    }
    catch (error) {
        console.error("Error getting auth session:", error);
        // Continue without authentication
    }
    // Use port 3020 to match the actual Payload CMS server port
    const payloadUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3020";
    // Only log detailed info in non-production environments
    if (process.env.NODE_ENV !== "production") {
        logger.debug(`Calling Payload API at: ${payloadUrl}/api/${endpoint}`);
    }
    try {
        // Add request ID for tracking in logs
        const requestId = Math.random().toString(36).substring(2, 15);
        logger.debug(`API Request: ${endpoint}`, { requestId });
        const response = await fetch(`${payloadUrl}/api/${endpoint}`, Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign({}, options.headers), { "Content-Type": "application/json", Authorization: session ? `Bearer ${session.access_token}` : "" }) }));
        if (!response.ok) {
            // Try to parse error as JSON, but handle case where it's not valid JSON
            try {
                const errorText = await response.text();
                let errorMessage = "";
                try {
                    // Try to parse as JSON
                    const errorJson = JSON.parse(errorText);
                    console.error(`[${requestId}] Payload API error:`, errorJson);
                    errorMessage =
                        errorJson.message || errorJson.error || JSON.stringify(errorJson);
                }
                catch (parseError) {
                    // Not valid JSON
                    console.error(`[${requestId}] Payload API error (non-JSON):`, response.status, response.statusText, errorText);
                    errorMessage =
                        errorText || `${response.status} ${response.statusText}`;
                }
                // Throw a more detailed error
                throw new Error(`Failed to call Payload API (${endpoint}): ${response.status} ${response.statusText} - ${errorMessage}`);
            }
            catch (jsonError) {
                // If error response couldn't be read at all
                console.error(`[${requestId}] Payload API error (unreadable):`, response.status, response.statusText);
                throw new Error(`Failed to call Payload API (${endpoint}): ${response.status} ${response.statusText}`);
            }
        }
        // Parse the JSON response
        try {
            const data = await response.json();
            console.log(`[${requestId}] API Response successful for: ${endpoint}`);
            return data;
        }
        catch (error) {
            // Type guard for Error objects
            const parseError = error instanceof Error ? error : new Error(String(error));
            console.error(`[${requestId}] Error parsing JSON response:`, parseError);
            throw new Error(`Failed to parse Payload API response: ${parseError.message}`);
        }
    }
    catch (error) {
        // Catch network errors or other exceptions
        // Log error with appropriate level of detail based on environment
        if (process.env.NODE_ENV === "production") {
            const statusCode = error === null || error === void 0 ? void 0 : error.status;
            logger.error(`API Error: ${endpoint}`, { statusCode });
        }
        else {
            logger.error(`API Error: ${endpoint}`, { error });
        }
        throw error;
    }
}
