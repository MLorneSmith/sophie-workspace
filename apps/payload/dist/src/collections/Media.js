export const Media = {
    slug: 'media',
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'id',
            type: 'text', // Use text type for UUIDs in Payload config
            required: true,
            unique: true,
            admin: {
                disabled: true, // Prevent editing in admin UI
            },
        },
        {
            name: 'alt',
            type: 'text',
            required: true,
        },
    ],
    upload: true,
};
//# sourceMappingURL=Media.js.map