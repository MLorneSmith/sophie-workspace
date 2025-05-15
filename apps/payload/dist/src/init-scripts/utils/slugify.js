/**
 * Generates a URL-friendly slug from a given text string.
 * @param text The input text.
 * @returns The generated slug.
 */
export function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}
//# sourceMappingURL=slugify.js.map