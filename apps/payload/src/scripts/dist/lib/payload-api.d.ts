/**
 * Initialize the REST API connection and authenticate
 */
export declare function initPayloadRestAPI(options: {
    apiUrl?: string;
    email?: string;
    password?: string;
}): Promise<{
    apiUrl: string;
    authToken: any;
    callAPI(endpoint: string, options?: any): Promise<unknown>;
}>;
