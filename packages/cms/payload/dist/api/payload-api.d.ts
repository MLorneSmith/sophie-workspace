/**
 * Helper function to make authenticated requests to Payload CMS
 * @param endpoint The API endpoint to call (without the /api/ prefix)
 * @param options Additional fetch options
 * @returns The JSON response from the API
 */
export declare function callPayloadAPI(endpoint: string, options?: RequestInit): Promise<any>;
