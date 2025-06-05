/**
 * Transform image URLs to use the custom domain
 * @param url - Original URL
 * @returns Transformed URL or null if input is null
 */
export function transformImageUrl(url: string | null): string | null {
	if (!url) return null;

	// If the URL contains r2.cloudflarestorage.com, transform it to the custom domain
	if (url.includes("r2.cloudflarestorage.com")) {
		const filename = url.split("/").pop();
		return `https://images.slideheroes.com/${filename}`;
	}

	// Handle URLs starting with /cms/images/
	if (url.startsWith("/cms/images/")) {
		// Extract the post name from the URL pattern /cms/images/post-name/image.png
		const parts = url.split("/");
		if (parts.length >= 4) {
			const postName = parts[3] || ""; // e.g., 'presentation-tips', with empty string fallback

			// Map to the actual filename used in the media table
			const filenameMapping: Record<string, string> = {
				"presentation-tips": "Presentation Tips Optimized.png",
				"art-craft-business-presentation-creation":
					"Art Craft of Presentation Creation.png",
				"pitch-deck": "pitch-deck-image.png",
				"powerpoint-presentations-defense": "Defense of PowerPoint.png",
				"presentation-review-bcg": "BCG-teardown-optimized.jpg",
				"presentation-tools": "Presentation Tools-optimized.png",
				"public-speaking-anxiety": "Conquering Public Speaking Anxiety.png",
				"seneca-partnership": "Seneca Partnership.webp",
				"typology-business-charts": "business-charts.jpg",
			};

			// Safely check if the postName is a key in our mapping
			if (postName && postName in filenameMapping) {
				return `https://images.slideheroes.com/${filenameMapping[postName]}`;
			}
		}
	}

	// If the URL is just a filename (no protocol/domain), add the custom domain
	if (!url.startsWith("http") && !url.startsWith("/")) {
		return `https://images.slideheroes.com/${url}`;
	}

	return url;
}

/**
 * Get a placeholder image for a post
 * @returns Path to the placeholder image
 */
export function getPostPlaceholderImage(): string {
	// We'll use a generic course image since we're skipping the SVG creation
	return "/images/course/default-course.png";
}

/**
 * Get the best available image URL from a post object
 * @param post The post object from CMS
 * @returns The best available image URL or null
 */
export function getBestPostImageUrl(post: any): string | null {
	// Try all possible image field paths
	const imageUrl =
		// From image_id relationship field
		post.image_id?.url ||
		(typeof post.image_id === "object" ? post.image_id?.url : null) ||
		// From direct image property
		post.image ||
		// From mdoc frontmatter path
		(post.image?.startsWith("/cms/images/") ? post.image : null);

	return transformImageUrl(imageUrl);
}
