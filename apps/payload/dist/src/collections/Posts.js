import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
// Assuming blocks like BunnyVideo, CallToAction, TestBlock, YouTubeVideo will be defined elsewhere
// import { BunnyVideo, CallToAction, TestBlock, YouTubeVideo } from '../blocks'
export const Posts = {
    slug: 'posts',
    labels: {
        singular: 'Post',
        plural: 'Posts',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'publishedAt'],
        description: 'Blog posts for the website',
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
                description: 'The URL-friendly identifier for this post',
            },
            hooks: {
                beforeValidate: [
                    ({ value, data, }) => {
                        // If no slug is provided (value is null, undefined, or empty string) and title exists in data
                        if (!value && data?.title) {
                            // data?.title will safely access title
                            return data.title
                                .toLowerCase()
                                .replace(/[^\w\s]/g, '')
                                .replace(/\s+/g, '-');
                        }
                        return value ?? undefined;
                    },
                ],
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'A brief summary of the post',
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
                description: 'The main content of the blog post',
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
            relationTo: 'media', // Corrected: Should relate to 'media' for post images
            admin: {
                description: 'Featured image for the blog post',
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
                description: 'Categories for this post',
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
                description: 'Tags for this post',
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
                description: 'Files for download in this post',
            },
        },
    ],
};
//# sourceMappingURL=Posts.js.map