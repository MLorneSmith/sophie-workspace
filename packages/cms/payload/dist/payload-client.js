export class PayloadClient {
    async getContentItems(options) {
        const collection = (options === null || options === void 0 ? void 0 : options.collection) || "documentation";
        // Use a large number (1000) instead of Infinity to avoid PostgreSQL errors
        const limit = (options === null || options === void 0 ? void 0 : options.limit) === Number.POSITIVE_INFINITY ? 1000 : (options === null || options === void 0 ? void 0 : options.limit) || 10;
        const offset = (options === null || options === void 0 ? void 0 : options.offset) || 0;
        const status = (options === null || options === void 0 ? void 0 : options.status) || "published";
        try {
            // Fetch all documents
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=${limit}&page=${Math.floor(offset / limit) + 1}&where[status][equals]=${status}`);
            const data = await response.json();
            // Map items
            const items = data.docs.map((doc) => this.mapContentItem(doc));
            // Create a map of items by ID for quick lookup
            const itemsMap = new Map();
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
        }
        catch (error) {
            console.error("Error fetching content items from Payload:", error);
            return {
                total: 0,
                items: [],
            };
        }
    }
    async getContentItemBySlug(params) {
        const { slug, collection, status = "published" } = params;
        try {
            // Fetch the main document
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[slug][equals]=${slug}&where[status][equals]=${status}`);
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
                    console.log(`Fetching child documents for ${collection} with ID ${item.id}`);
                    const childrenResponse = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[parent][equals]=${item.id}&where[status][equals]=${status}`);
                    // Check if the response is ok (status in the range 200-299)
                    if (childrenResponse.ok) {
                        const childrenData = await childrenResponse.json();
                        // Check if childrenData.docs exists and is an array before mapping
                        if (childrenData && Array.isArray(childrenData.docs)) {
                            // Add children to the main item
                            item.children = childrenData.docs.map((doc) => this.mapContentItem(doc));
                        }
                        else {
                            console.warn("No child documents found or invalid response format");
                            item.children = []; // Ensure children is an empty array
                        }
                    }
                    else {
                        console.warn(`Error fetching child documents: ${childrenResponse.status} ${childrenResponse.statusText}`);
                        item.children = []; // Ensure children is an empty array
                    }
                }
                catch (childError) {
                    console.error("Error fetching child documents:", childError);
                    item.children = []; // Ensure children is an empty array
                }
            }
            else {
                console.log(`Skipping child documents fetch for non-hierarchical collection: ${collection}`);
                item.children = []; // Ensure children is an empty array for non-hierarchical collections
            }
            return item;
        }
        catch (error) {
            console.error("Error fetching content item by slug from Payload:", error);
            return undefined;
        }
    }
    async getCategories(options) {
        // Extract unique categories from the specified collection or documentation by default
        const collection = (options === null || options === void 0 ? void 0 : options.collection) || "documentation";
        try {
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=100`);
            const data = await response.json();
            const categoriesSet = new Set();
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
        }
        catch (error) {
            console.error("Error fetching categories from Payload:", error);
            return [];
        }
    }
    async getCategoryBySlug(slug, collection) {
        const categories = await this.getCategories({ collection });
        return categories.find((category) => category.slug === slug);
    }
    async getTags(options) {
        // Extract unique tags from the specified collection or documentation by default
        const collection = (options === null || options === void 0 ? void 0 : options.collection) || "documentation";
        try {
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=100`);
            const data = await response.json();
            const tagsSet = new Set();
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
        }
        catch (error) {
            console.error("Error fetching tags from Payload:", error);
            return [];
        }
    }
    async getTagBySlug(slug, collection) {
        const tags = await this.getTags({ collection });
        return tags.find((tag) => tag.slug === slug);
    }
    /**
     * Transform image URLs to use the custom domain
     * @param url - Original URL
     * @returns Transformed URL or null if input is null
     */
    transformImageUrl(url) {
        if (!url)
            return null;
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
    mapContentItem(item) {
        // Get the image URL and transform it
        // Check for both image and image_id fields
        const imageId = item.image_id;
        const image = item.image;
        const imageUrl = (imageId === null || imageId === void 0 ? void 0 : imageId.url) || // Check for image_id field first (used in Posts collection)
            (typeof image === "object" ? image === null || image === void 0 ? void 0 : image.url : undefined) || // Then check for image field (used in other collections)
            (typeof image === "string" ? image : null);
        const transformedImageUrl = this.transformImageUrl(imageUrl);
        // Map the item
        const parent = item.parent;
        const mappedItem = {
            id: item.id,
            title: item.title,
            label: item.title,
            url: item.slug,
            slug: item.slug,
            description: item.description,
            content: item.content,
            publishedAt: item.publishedAt,
            image: transformedImageUrl || undefined, // Convert null to undefined
            // Also include the original image_id for components that might need to access it directly
            image_id: item.image_id,
            status: item.status,
            categories: (item.categories || []).map((category) => {
                const cat = category;
                const categoryValue = (cat === null || cat === void 0 ? void 0 : cat.category) || "";
                return {
                    id: categoryValue,
                    name: categoryValue,
                    slug: categoryValue
                        ? categoryValue.toLowerCase().replace(/\s+/g, "-")
                        : "",
                };
            }),
            tags: (item.tags || []).map((tag) => {
                const t = tag;
                const tagValue = (t === null || t === void 0 ? void 0 : t.tag) || "";
                return {
                    id: tagValue,
                    name: tagValue,
                    slug: tagValue ? tagValue.toLowerCase().replace(/\s+/g, "-") : "",
                };
            }),
            parentId: (parent === null || parent === void 0 ? void 0 : parent.id) || null,
            order: item.order || 0,
            children: [],
            breadcrumbs: item.breadcrumbs || [],
        };
        // Map children if they exist
        if (item.children &&
            Array.isArray(item.children) &&
            item.children.length > 0) {
            mappedItem.children = item.children.map((child) => this.mapContentItem(child));
        }
        return mappedItem;
    }
}
