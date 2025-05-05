/**
 * Utility functions for module detection and execution
 * Provides ESM-compatible alternatives to CommonJS patterns
 */
/**
 * Check if the current module is being run directly (not imported)
 * This is the ESM equivalent of 'require.main === module'
 * @returns boolean indicating whether this module is being run directly
 */
export function isDirectExecution() {
    // Using import.meta.url which is only available in ES modules
    const currentUrl = import.meta.url;
    const executedUrl = process.argv[1];
    if (!executedUrl) {
        return false;
    }
    // Handle both Windows and Unix paths
    const normalizedCurrentUrl = currentUrl.replace(/\\/g, '/');
    const normalizedExecutedUrl = executedUrl.replace(/\\/g, '/');
    // Check if this file is the entry point
    return normalizedCurrentUrl.endsWith(normalizedExecutedUrl);
}
