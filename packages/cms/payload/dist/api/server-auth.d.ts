import "server-only";
/**
 * Get the server session in a server-only context
 * This isolates the server-only imports to avoid issues with dynamic routes
 */
export declare function getServerSession(): Promise<any>;
