import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
	slug: "media",
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
	upload: {
		mimeTypes: [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/svg+xml",
			"video/mp4",
			"video/quicktime",
			"video/webm",
		],
		filesRequiredOnCreate: false, // Allow seeding pre-existing R2 files
		disableLocalStorage: true,
	},
	fields: [
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
