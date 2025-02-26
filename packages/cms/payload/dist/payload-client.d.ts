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
    getCategoryBySlug(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
    } | undefined>;
    getTags(options?: Cms.GetTagsOptions): Promise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
    getTagBySlug(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
    } | undefined>;
    private mapContentItem;
}
