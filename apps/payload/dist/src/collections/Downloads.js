import path from 'path';
import { fileURLToPath } from 'url';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export const Downloads = {
    slug: 'downloads',
    upload: {
        mimeTypes: [
            'image/*',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip', // Added zip file support
        ],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
        },
        {
            name: 'description',
            type: 'textarea',
        },
    ],
};
//# sourceMappingURL=Downloads.js.map