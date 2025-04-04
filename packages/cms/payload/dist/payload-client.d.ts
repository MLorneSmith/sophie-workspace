import { Cms, CmsClient } from '@kit/cms-types';
export declare class PayloadClient implements CmsClient {
    getContentItems(options?: Cms.GetContentItemsOptions): Promise<{
        total: any;
        items: any;
    }>;
    getContentItemBySlug(params: {
        slug: string;
        collection: string;
        status?: Cms.ContentItemStatus;
    }): Promise<Cms.ContentItem | undefined>;
    getCategories(options?: Cms.GetCategoriesOptions): Promise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
    getCategoryBySlug(slug: string, collection?: string): Promise<{
        id: string;
        name: string;
        slug: string;
    } | undefined>;
    getTags(options?: Cms.GetTagsOptions): Promise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
    getTagBySlug(slug: string, collection?: string): Promise<{
        id: string;
        name: string;
        slug: string;
    } | undefined>;
    /**
     * Transform image URLs to use the custom domain
     * @param url - Original URL
     * @returns Transformed URL or null if input is null
     */
    private transformImageUrl;
    private mapContentItem;
}
