import { Cms, CmsClient } from '@kit/cms-types';

export class PayloadClient implements CmsClient {
  async getContentItems(options?: Cms.GetContentItemsOptions) {
    const collection = options?.collection || 'documentation';
    // Use a large number (1000) instead of Infinity to avoid PostgreSQL errors
    const limit = options?.limit === Infinity ? 1000 : options?.limit || 10;
    const offset = options?.offset || 0;
    const status = options?.status || 'published';

    try {
      // Fetch all documents
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=${limit}&page=${Math.floor(offset / limit) + 1}&where[status][equals]=${status}`,
      );
      const data = await response.json();

      // Map items
      const items = data.docs.map((doc: any) => this.mapContentItem(doc));

      // Create a map of items by ID for quick lookup
      const itemsMap = new Map<string, Cms.ContentItem>();
      items.forEach((item: Cms.ContentItem) => {
        itemsMap.set(item.id, item);
      });

      // Populate children arrays
      items.forEach((item: Cms.ContentItem) => {
        if (item.parentId && itemsMap.has(item.parentId)) {
          const parent = itemsMap.get(item.parentId);
          if (parent) {
            parent.children.push(item);
          }
        }
      });

      return {
        total: data.totalDocs,
        items,
      };
    } catch (error) {
      console.error('Error fetching content items from Payload:', error);
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
    const { slug, collection, status = 'published' } = params;

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

      // Fetch child documents
      const childrenResponse = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[parent][equals]=${item.id}&where[status][equals]=${status}`,
      );
      const childrenData = await childrenResponse.json();

      // Add children to the main item
      item.children = childrenData.docs.map((doc: any) =>
        this.mapContentItem(doc),
      );

      return item;
    } catch (error) {
      console.error('Error fetching content item by slug from Payload:', error);
      return undefined;
    }
  }

  async getCategories(options?: Cms.GetCategoriesOptions) {
    // Extract unique categories from the specified collection or documentation by default
    const collection = options?.collection || 'documentation';
    try {
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=100`,
      );
      const data = await response.json();

      const categoriesSet = new Set<string>();
      data.docs.forEach((doc: any) => {
        (doc.categories || []).forEach((category: any) => {
          categoriesSet.add(category.category);
        });
      });

      return Array.from(categoriesSet).map((name) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      }));
    } catch (error) {
      console.error('Error fetching categories from Payload:', error);
      return [];
    }
  }

  async getCategoryBySlug(slug: string, collection?: string) {
    const categories = await this.getCategories({ collection });
    return categories.find((category) => category.slug === slug);
  }

  async getTags(options?: Cms.GetTagsOptions) {
    // Extract unique tags from the specified collection or documentation by default
    const collection = options?.collection || 'documentation';
    try {
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=100`,
      );
      const data = await response.json();

      const tagsSet = new Set<string>();
      data.docs.forEach((doc: any) => {
        (doc.tags || []).forEach((tag: any) => {
          tagsSet.add(tag.tag);
        });
      });

      return Array.from(tagsSet).map((name) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      }));
    } catch (error) {
      console.error('Error fetching tags from Payload:', error);
      return [];
    }
  }

  async getTagBySlug(slug: string, collection?: string) {
    const tags = await this.getTags({ collection });
    return tags.find((tag) => tag.slug === slug);
  }

  private mapContentItem(item: any): Cms.ContentItem {
    // Map the item
    const mappedItem: Cms.ContentItem = {
      id: item.id,
      title: item.title,
      label: item.title,
      url: item.slug,
      slug: item.slug,
      description: item.description,
      content: item.content,
      publishedAt: item.publishedAt,
      image:
        item.image?.url || (typeof item.image === 'string' ? item.image : null),
      status: item.status,
      categories: (item.categories || []).map((category: any) => ({
        id: category.category,
        name: category.category,
        slug: category.category.toLowerCase().replace(/\s+/g, '-'),
      })),
      tags: (item.tags || []).map((tag: any) => ({
        id: tag.tag,
        name: tag.tag,
        slug: tag.tag.toLowerCase().replace(/\s+/g, '-'),
      })),
      parentId: item.parent ? item.parent.id : null,
      order: item.order || 0,
      children: [],
      breadcrumbs: item.breadcrumbs || [],
    };

    // Map children if they exist
    if (
      item.children &&
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      mappedItem.children = item.children.map((child: any) =>
        this.mapContentItem(child),
      );
    }

    return mappedItem;
  }
}
