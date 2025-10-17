import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
	slug: "media",
	// Upload config removed - using pre-uploaded R2 files with manual URL management
	// This allows seeding with existing R2 files without Payload's automatic upload handling
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
		// File metadata fields (manually managed since upload config removed)
		{
			name: "filename",
			type: "text",
			required: true,
			admin: {
				description: "Original filename of the media file",
			},
		},
		{
			name: "url",
			type: "text",
			required: true,
			admin: {
				description: "Public URL to access the file (R2 CDN URL)",
			},
		},
		{
			name: "mimeType",
			type: "text",
			admin: {
				description: "MIME type of the file (e.g., image/png, video/mp4)",
			},
		},
		{
			name: "filesize",
			type: "number",
			admin: {
				description: "File size in bytes",
			},
		},
		{
			name: "width",
			type: "number",
			admin: {
				description: "Image/video width in pixels (if applicable)",
			},
		},
		{
			name: "height",
			type: "number",
			admin: {
				description: "Image/video height in pixels (if applicable)",
			},
		},
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
