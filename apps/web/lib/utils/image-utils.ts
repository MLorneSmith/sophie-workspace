/**
 * Transform image URLs to use the custom domain
 * @param url - Original URL
 * @returns Transformed URL or null if input is null
 */
export function transformImageUrl(url: string | null): string | null {
  if (!url) return null;

  // If the URL contains r2.cloudflarestorage.com, transform it to the custom domain
  if (url.includes('r2.cloudflarestorage.com')) {
    const filename = url.split('/').pop();
    return `https://images.slideheroes.com/${filename}`;
  }

  // If the URL is just a filename (no protocol/domain), add the custom domain
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return `https://images.slideheroes.com/${url}`;
  }

  return url;
}

/**
 * Get a placeholder image for a post
 * @returns Path to the placeholder image
 */
export function getPostPlaceholderImage(): string {
  return '/images/blog/default-post.svg';
}
