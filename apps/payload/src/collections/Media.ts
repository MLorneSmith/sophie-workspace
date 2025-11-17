import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
	slug: "media",
	// Enable upload functionality - required for storage plugin integration
	// Manual fields below will be managed by the s3Storage plugin or manually during seeding
	upload: true,
	access: {
		read: () => true,
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	admin: {
		useAsTitle: "filename",
		defaultColumns: ["filename", "mimeType", "filesize", "updatedAt"],
	},
	fields: [
		// Upload will auto-generate: filename, url, mimeType, filesize, width, height
		// We only add custom fields here
		{
			name: "alt",
			type: "text",
			required: true,
			admin: {
				description: "Alternative text for accessibility and SEO",
			},
		},
		{
			name: "caption",
			type: "text",
			admin: {
				description: "Optional caption for the media",
			},
		},
		{
			name: "type",
			type: "select",
			options: [
				{ label: "Image", value: "image" },
				{ label: "Video", value: "video" },
				{ label: "Document", value: "document" },
			],
			admin: {
				description: "Type of media file",
			},
		},
		{
			name: "tags",
			type: "array",
			label: "Tags",
			fields: [
				{
					name: "tag",
					type: "text",
				},
			],
			admin: {
				description: "Tags for organizing and searching media",
			},
		},
	],
};
