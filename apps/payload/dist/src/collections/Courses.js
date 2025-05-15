import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
export const Courses = {
    slug: 'courses',
    labels: {
        singular: 'Course',
        plural: 'Courses',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'publishedAt'],
        description: 'Courses in the learning management system',
    },
    access: {
        read: () => true, // Public read access
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
            unique: true,
            admin: {
                description: 'The URL-friendly identifier for this course',
            },
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'content',
            type: 'richText',
            editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                    ...defaultFeatures,
                    BlocksFeature({
                        blocks: [], // Empty blocks array
                    }),
                ],
            }),
        },
        {
            name: 'downloads',
            type: 'relationship',
            relationTo: 'downloads',
            hasMany: true,
            admin: {
                description: 'Files for download in this course',
            },
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime',
                },
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
        },
    ],
};
//# sourceMappingURL=Courses.js.map