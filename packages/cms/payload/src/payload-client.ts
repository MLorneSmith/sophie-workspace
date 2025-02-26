import { Cms, CmsClient } from '@kit/cms-types';

export class PayloadClient implements CmsClient {
  async getContentItems(options?: Cms.GetContentItemsOptions) {
    const collection = options?.collection || 'documentation';
    // Use a large number (1000) instead of Infinity to avoid PostgreSQL errors
    const limit = options?.limit === Infinity ? 1000 : options?.limit || 10;
    const offset = options?.offset || 0;
    const status = options?.status || 'published';

    try {
      // Fetch from Payload API
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?limit=${limit}&page=${Math.floor(offset / limit) + 1}&where[status][equals]=${status}`,
      );
      const data = await response.json();

      return {
        total: data.totalDocs,
        items: data.docs.map(this.mapContentItem),
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
      // Fetch from Payload API
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${collection}?where[slug][equals]=${slug}&where[status][equals]=${status}`,
      );
      const data = await response.json();

      if (data.docs.length === 0) {
        return undefined;
      }

      return this.mapContentItem(data.docs[0]);
    } catch (error) {
      console.error('Error fetching content item by slug from Payload:', error);
      return undefined;
    }
  }

  async getCategories(options?: Cms.GetCategoriesOptions) {
    // Extract unique categories from documentation collection
    try {
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/documentation?limit=100`,
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

  async getCategoryBySlug(slug: string) {
    const categories = await this.getCategories();
    return categories.find((category) => category.slug === slug);
  }

  async getTags(options?: Cms.GetTagsOptions) {
    // Extract unique tags from documentation collection
    try {
      const response = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/documentation?limit=100`,
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

  async getTagBySlug(slug: string) {
    const tags = await this.getTags();
    return tags.find((tag) => tag.slug === slug);
  }

  private mapContentItem(item: any): Cms.ContentItem {
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
      parentId: item.parent,
      order: item.order || 0,
      children: [],
    };
  }
}
