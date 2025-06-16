import type { Cms, CmsClient } from "@kit/cms-types";

export class PayloadClient implements CmsClient {
	async getContentItems(options?: Cms.GetContentItemsOptions) {
		const collection = options?.collection || "documentation";
		// Use a large number (1000) instead of Infinity to avoid PostgreSQL errors
		const limit =
			options?.limit === Number.POSITIVE_INFINITY ? 1000 : options?.limit || 10;
		const offset = options?.offset || 0;
		const status = options?.status || "published";

		try {
			// Fetch all documents
			const response = await fetch(
				`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=${limit}&page=${Math.floor(offset / limit) + 1}&where[status][equals]=${status}`,
			);
			const data = await response.json();

			// Map items
			const items = data.docs.map((doc: unknown) => this.mapContentItem(doc as Record<string, unknown>));

			// Create a map of items by ID for quick lookup
			const itemsMap = new Map<string, Cms.ContentItem>();
			for (const item of items) {
				itemsMap.set(item.id, item);
			}

			// Populate children arrays
			for (const item of items) {
				if (item.parentId && itemsMap.has(item.parentId)) {
					const parent = itemsMap.get(item.parentId);
					if (parent) {
						parent.children.push(item);
					}
				}
			}

			return {
				total: data.totalDocs,
				items,
			};
		} catch (error) {
			// Error logging suppressed for production
			// Uncomment for debugging: process.stderr.write(`Error fetching content items from Payload: ${error}\n`);
			return {
				total: 0,
				items: [],
			};
		}
	}

	async getContentItemBySlug(params: {
		slug: string;
		collection: string;
		status?: Cms.ContentItemStatus;
	}) {
		const { slug, collection, status = "published" } = params;

		try {
			// Fetch the main document
			const response = await fetch(
				`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[slug][equals]=${slug}&where[status][equals]=${status}`,
			);
			const data = await response.json();

			if (data.docs.length === 0) {
				return undefined;
			}

			// Get the main item
			const item = this.mapContentItem(data.docs[0]);

			// Collections that don't support parent-child relationships
			const nonHierarchicalCollections = ["posts"];

			// Only fetch child documents for collections that support hierarchical relationships
			if (!nonHierarchicalCollections.includes(collection)) {
				try {
					// Debug logging suppressed for production
					// Uncomment for debugging: process.stdout.write(`Fetching child documents for ${collection} with ID ${item.id}\n`);
					const childrenResponse = await fetch(
						`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[parent][equals]=${item.id}&where[status][equals]=${status}`,
					);

					// Check if the response is ok (status in the range 200-299)
					if (childrenResponse.ok) {
						const childrenData = await childrenResponse.json();

						// Check if childrenData.docs exists and is an array before mapping
						if (childrenData && Array.isArray(childrenData.docs)) {
							// Add children to the main item
							item.children = childrenData.docs.map((doc: unknown) =>
								this.mapContentItem(doc as Record<string, unknown>),
							);
						} else {
							// Warning suppressed for production
							// Uncomment for debugging: process.stderr.write("No child documents found or invalid response format\n");
							item.children = []; // Ensure children is an empty array
						}
					} else {
						// Warning suppressed for production
						// Uncomment for debugging: process.stderr.write(`Error fetching child documents: ${childrenResponse.status} ${childrenResponse.statusText}\n`);
						item.children = []; // Ensure children is an empty array
					}
				} catch (childError) {
					// Error logging suppressed for production
					// Uncomment for debugging: process.stderr.write(`Error fetching child documents: ${childError}\n`);
					item.children = []; // Ensure children is an empty array
				}
			} else {
				// Debug logging suppressed for production
				// Uncomment for debugging: process.stdout.write(`Skipping child documents fetch for non-hierarchical collection: ${collection}\n`);
				item.children = []; // Ensure children is an empty array for non-hierarchical collections
			}

			return item;
		} catch (error) {
			// Error logging suppressed for production
			// Uncomment for debugging: process.stderr.write(`Error fetching content item by slug from Payload: ${error}\n`);
			return undefined;
		}
	}

	async getCategories(options?: Cms.GetCategoriesOptions) {
		// Extract unique categories from the specified collection or documentation by default
		const collection = options?.collection || "documentation";
		try {
			const response = await fetch(
				`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=100`,
			);
			const data = await response.json();

			const categoriesSet = new Set<string>();
			for (const doc of data.docs) {
				for (const category of doc.categories || []) {
					categoriesSet.add(category.category);
				}
			}

			return Array.from(categoriesSet).map((name) => ({
				id: name,
				name,
				slug: name.toLowerCase().replace(/\s+/g, "-"),
			}));
		} catch (error) {
			// Error logging suppressed for production
			// Uncomment for debugging: process.stderr.write(`Error fetching categories from Payload: ${error}\n`);
			return [];
		}
	}

	async getCategoryBySlug(slug: string, collection?: string) {
		const categories = await this.getCategories({ collection });
		return categories.find((category) => category.slug === slug);
	}

	async getTags(options?: Cms.GetTagsOptions) {
		// Extract unique tags from the specified collection or documentation by default
		const collection = options?.collection || "documentation";
		try {
			const response = await fetch(
				`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=100`,
			);
			const data = await response.json();

			const tagsSet = new Set<string>();
			for (const doc of data.docs) {
				for (const tag of doc.tags || []) {
					tagsSet.add(tag.tag);
				}
			}

			return Array.from(tagsSet).map((name) => ({
				id: name,
				name,
				slug: name.toLowerCase().replace(/\s+/g, "-"),
			}));
		} catch (error) {
			// Error logging suppressed for production
			// Uncomment for debugging: process.stderr.write(`Error fetching tags from Payload: ${error}\n`);
			return [];
		}
	}

	async getTagBySlug(slug: string, collection?: string) {
		const tags = await this.getTags({ collection });
		return tags.find((tag) => tag.slug === slug);
	}

	/**
	 * Transform image URLs to use the custom domain
	 * @param url - Original URL
	 * @returns Transformed URL or null if input is null
	 */
	private transformImageUrl(url: string | null): string | null {
		if (!url) return null;

		// If the URL contains r2.cloudflarestorage.com, transform it to the custom domain
		if (url.includes("r2.cloudflarestorage.com")) {
			const filename = url.split("/").pop();
			return `https://images.slideheroes.com/${filename}`;
		}

		// If the URL is just a filename (no protocol/domain), add the custom domain
		if (!url.startsWith("http") && !url.startsWith("/")) {
			return `https://images.slideheroes.com/${url}`;
		}

		return url;
	}

	private mapContentItem(item: Record<string, unknown>): Cms.ContentItem {
		// Get the image URL and transform it
		// Check for both image and image_id fields
		const imageId = item.image_id as { url?: string } | undefined;
		const image = item.image as { url?: string } | string | undefined;
		const imageUrl =
			imageId?.url || // Check for image_id field first (used in Posts collection)
			(typeof image === "object" ? image?.url : undefined) || // Then check for image field (used in other collections)
			(typeof image === "string" ? image : null);

		const transformedImageUrl = this.transformImageUrl(imageUrl);

		// Map the item
		const parent = item.parent as { id?: string } | undefined;
		const mappedItem: Cms.ContentItem = {
			id: item.id as string,
			title: item.title as string,
			label: item.title as string,
			url: item.slug as string,
			slug: item.slug as string,
			description: item.description as string | undefined,
			content: item.content,
			publishedAt: String(item.publishedAt || ""),
			image: transformedImageUrl || undefined, // Convert null to undefined
			// Also include the original image_id for components that might need to access it directly
			image_id: item.image_id,
			status: item.status as Cms.ContentItemStatus,
			categories: ((item.categories as unknown[]) || []).map((category: unknown) => {
				const cat = category as { category?: string };
				const categoryValue = cat?.category || "";
				return {
					id: categoryValue,
					name: categoryValue,
					slug: categoryValue
						? categoryValue.toLowerCase().replace(/\s+/g, "-")
						: "",
				};
			}),
			tags: ((item.tags as unknown[]) || []).map((tag: unknown) => {
				const t = tag as { tag?: string };
				const tagValue = t?.tag || "";
				return {
					id: tagValue,
					name: tagValue,
					slug: tagValue ? tagValue.toLowerCase().replace(/\s+/g, "-") : "",
				};
			}),
			parentId: parent?.id || undefined,
			order: (item.order as number) || 0,
			children: [],
			breadcrumbs: ((item.breadcrumbs as string[]) || []).map((label: string) => ({ label })),
		};

		// Map children if they exist
		if (
			item.children &&
			Array.isArray(item.children) &&
			item.children.length > 0
		) {
			mappedItem.children = (item.children as unknown[]).map((child: unknown) =>
				this.mapContentItem(child as Record<string, unknown>),
			);
		}

		return mappedItem;
	}
}
