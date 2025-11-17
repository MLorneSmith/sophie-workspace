/**
 * Mock for 'server-only' package in test environment
 *
 * The real 'server-only' package throws an error when imported in client code.
 * In tests, we need to allow these imports to test server-side code.
 */

// Empty export to satisfy module resolution
export {};
