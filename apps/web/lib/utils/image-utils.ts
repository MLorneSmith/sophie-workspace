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
 * Interface for post objects with image properties
 */
interface PostWithImage {
	image_id?: { url?: string } | string;
	image?: string;
}

/**
 * Get the best available image URL from a post object
 * @param post The post object from CMS
 * @returns The best available image URL or null
 */
export function getBestPostImageUrl(
	post: PostWithImage | { image_id?: unknown; image?: unknown },
): string | null {
	// Safely access image_id property
	let imageFromId: string | null = null;
	if (
		post.image_id &&
		typeof post.image_id === "object" &&
		"url" in post.image_id
	) {
		const imageIdObj = post.image_id as { url?: string };
		imageFromId = imageIdObj.url || null;
	} else if (typeof post.image_id === "string") {
		imageFromId = post.image_id;
	}

	// Safely access image property
	let imageFromProperty: string | null = null;
	if (typeof post.image === "string") {
		imageFromProperty = post.image;
	}

	// Try all possible image field paths
	const imageUrl =
		// From image_id relationship field
		imageFromId ||
		// From direct image property
		imageFromProperty ||
		// From mdoc frontmatter path
		(imageFromProperty?.startsWith("/cms/images/") ? imageFromProperty : null);

	return transformImageUrl(imageUrl);
}
