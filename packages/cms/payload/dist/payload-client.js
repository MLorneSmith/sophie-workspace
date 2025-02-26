export class PayloadClient {
    async getContentItems(options) {
        const collection = (options === null || options === void 0 ? void 0 : options.collection) || 'documentation';
        // Use a large number (1000) instead of Infinity to avoid PostgreSQL errors
        const limit = (options === null || options === void 0 ? void 0 : options.limit) === Infinity ? 1000 : (options === null || options === void 0 ? void 0 : options.limit) || 10;
        const offset = (options === null || options === void 0 ? void 0 : options.offset) || 0;
        const status = (options === null || options === void 0 ? void 0 : options.status) || 'published';
        try {
            // Fetch from Payload API
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=${limit}&page=${Math.floor(offset / limit) + 1}&where[status][equals]=${status}`);
            const data = await response.json();
            return {
                total: data.totalDocs,
                items: data.docs.map(this.mapContentItem),
            };
        }
        catch (error) {
            console.error('Error fetching content items from Payload:', error);
            return {
                total: 0,
                items: [],
            };
        }
    }
    async getContentItemBySlug(params) {
        const { slug, collection, status = 'published' } = params;
        try {
            // Fetch from Payload API
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[slug][equals]=${slug}&where[status][equals]=${status}`);
            const data = await response.json();
            if (data.docs.length === 0) {
                return undefined;
            }
            return this.mapContentItem(data.docs[0]);
        }
        catch (error) {
            console.error('Error fetching content item by slug from Payload:', error);
            return undefined;
        }
    }
    async getCategories(options) {
        // Extract unique categories from documentation collection
        try {
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/documentation?limit=100`);
            const data = await response.json();
            const categoriesSet = new Set();
            data.docs.forEach((doc) => {
                (doc.categories || []).forEach((category) => {
                    categoriesSet.add(category.category);
                });
            });
            return Array.from(categoriesSet).map((name) => ({
                id: name,
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-'),
            }));
        }
        catch (error) {
            console.error('Error fetching categories from Payload:', error);
            return [];
        }
    }
    async getCategoryBySlug(slug) {
        const categories = await this.getCategories();
        return categories.find((category) => category.slug === slug);
    }
    async getTags(options) {
        // Extract unique tags from documentation collection
        try {
            const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/documentation?limit=100`);
            const data = await response.json();
            const tagsSet = new Set();
            data.docs.forEach((doc) => {
                (doc.tags || []).forEach((tag) => {
                    tagsSet.add(tag.tag);
                });
            });
            return Array.from(tagsSet).map((name) => ({
                id: name,
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-'),
            }));
        }
        catch (error) {
            console.error('Error fetching tags from Payload:', error);
            return [];
        }
    }
    async getTagBySlug(slug) {
        const tags = await this.getTags();
        return tags.find((tag) => tag.slug === slug);
    }
    mapContentItem(item) {
        return {
            id: item.id,
            title: item.title,
            label: item.title,
            url: item.slug,
            slug: item.slug,
            description: item.description,
            content: item.content,
            publishedAt: item.publishedAt,
            image: item.image,
            status: item.status,
            categories: (item.categories || []).map((category) => ({
                id: category.category,
                name: category.category,
                slug: category.category.toLowerCase().replace(/\s+/g, '-'),
            })),
            tags: (item.tags || []).map((tag) => ({
                id: tag.tag,
                name: tag.tag,
                slug: tag.tag.toLowerCase().replace(/\s+/g, '-'),
            })),
            parentId: item.parent,
            order: item.order || 0,
            children: [],
        };
    }
}
