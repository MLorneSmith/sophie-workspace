/**
 * Utility for determining MIME types based on file extensions
 */
import path from 'path';

/**
 * Helper function to determine MIME type based on file extension
 * @param filename - Filename
 * @returns MIME type
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
