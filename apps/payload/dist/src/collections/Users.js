import { v4 as uuidv4 } from 'uuid'; // Import uuid library
export const Users = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
    },
    auth: true, // Re-enable auth for Users collection
    fields: [
        {
            name: 'id',
            type: 'text', // Use text type for UUIDs in Payload config
            required: true,
            unique: true,
            admin: {
                disabled: true, // Prevent editing in admin UI
            },
            defaultValue: () => uuidv4(), // Use uuidv4 for default value
        },
        // Email added by default
        // Add more fields as needed
    ],
};
//# sourceMappingURL=Users.js.map