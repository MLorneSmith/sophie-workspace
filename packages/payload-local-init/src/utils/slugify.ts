// packages/payload-local-init/src/utils/slugify.ts
import { v4 as uuidv4 } from 'uuid';

export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    // Fallback to UUID if text is null, undefined, not a string, or empty after trimming
    // This handles cases where question text might be missing or invalid.
    console.warn(
      `generateSlug received invalid text, falling back to UUID. Input: "${String(text)}"`,
    );
    return uuidv4();
  }
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .trim() // Trim leading/trailing whitespace
    .replace(/\\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}
