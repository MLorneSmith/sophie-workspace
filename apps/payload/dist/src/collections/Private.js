import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
// Assuming blocks like BunnyVideo, CallToAction, TestBlock, YouTubeVideo will be defined elsewhere
// import { BunnyVideo, CallToAction, TestBlock, YouTubeVideo } from '../blocks'
export const Private = {
    slug: 'private',
    labels: {
        singular: 'Private Post',
        plural: 'Private Posts',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'publishedAt'],
        description: 'Private posts that are not indexed by search engines',
    },
    access: {
        read: () => true,
    },
    versions: {
        drafts: true,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            admin: {
                description: 'The URL-friendly identifier for this private post',
            },
            hooks: {
                beforeValidate: [
                    ({ value, data }) => {
                        // If no slug is provided, generate one from the title
                        if (!value && data?.title) {
                            return data.title
                                .toLowerCase()
                                .replace(/[^\w\s]/g, '')
                                .replace(/\s+/g, '-');
                        }
                        return value;
                    },
                ],
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'A brief summary of the private post',
            },
        },
        {
            name: 'content',
            type: 'richText',
            required: true,
            editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                    ...defaultFeatures,
                    BlocksFeature({
                        blocks: [
                        // Assuming blocks like BunnyVideo, CallToAction, TestBlock, YouTubeVideo will be defined elsewhere
                        // CallToAction,
                        // TestBlock,
                        // BunnyVideo,
                        // YouTubeVideo
                        ],
                    }),
                ],
            }),
            admin: {
                description: 'The main content of the private post',
            },
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime',
                },
                description: 'The date and time this post was published',
            },
            defaultValue: () => new Date().toISOString(),
        },
        {
            name: 'image_id',
            type: 'upload',
            relationTo: 'downloads', // Assuming 'media' is replaced by 'downloads'
            admin: {
                description: 'Featured image for the private post',
            },
        },
        {
            name: 'featured_image_id',
            type: 'upload',
            relationTo: 'downloads', // Assuming 'media' is replaced by 'downloads'
            admin: {
                description: 'Featured image (larger version) for the private post',
            },
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
            ],
            defaultValue: 'draft',
            required: true,
            admin: {
                position: 'sidebar',
                description: 'Only published posts will be visible on the website',
            },
        },
        {
            name: 'categories',
            type: 'array',
            admin: {
                description: 'Categories for this private post',
            },
            fields: [
                {
                    name: 'category',
                    type: 'text',
                },
            ],
        },
        {
            name: 'tags',
            type: 'array',
            admin: {
                description: 'Tags for this private post',
            },
            fields: [
                {
                    name: 'tag',
                    type: 'text',
                },
            ],
        },
        {
            name: 'downloads',
            type: 'relationship',
            relationTo: 'downloads',
            hasMany: true,
            admin: {
                description: 'Files for download in this private post',
            },
        },
    ],
};
//# sourceMappingURL=Private.js.map