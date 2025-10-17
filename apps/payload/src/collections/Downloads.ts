import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";

const filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(filename);

export const Downloads: CollectionConfig = {
	slug: "downloads",
	upload: {
		// Comprehensive MIME types for downloads collection
		mimeTypes: [
			// Images
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/svg+xml",

			// Documents
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-powerpoint",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"text/plain",
			"text/csv",
			"application/rtf",

			// Archives
			"application/zip",
			"application/x-rar-compressed",
			"application/x-7z-compressed",
			"application/gzip",
			"application/x-tar",

			// Audio
			"audio/mpeg",
			"audio/mp4",
			"audio/wav",
			"audio/ogg",
			"audio/webm",

			// Video
			"video/mp4",
			"video/quicktime",
			"video/webm",
			"video/avi",
			"video/mov",

			// Code and data files
			"application/json",
			"application/xml",
			"text/xml",
			"application/javascript",
			"text/css",
			"text/html",

			// Other common formats
			"application/octet-stream",
		],

		// File size limits - more generous for downloads
		filesRequiredOnCreate: false,

		// No image processing for downloads collection
		disableLocalStorage: true, // Use R2 storage via s3-adapter
	},
	access: {
		read: () => true,
		create: ({ req }) => {
			// Require authentication for creating downloads
			return Boolean(req.user);
		},
		update: ({ req }) => {
			return Boolean(req.user);
		},
		delete: ({ req }) => {
			return Boolean(req.user);
		},
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "filename", "mimeType", "filesize", "updatedAt"],
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			admin: {
				description: "Display name for the download file",
			},
		},
		{
			name: "description",
			type: "textarea",
			admin: {
				description: "Description of what this file contains",
			},
		},
		{
			name: "category",
			type: "select",
			options: [
				{
					label: "Document",
					value: "document",
				},
				{
					label: "Template",
					value: "template",
				},
				{
					label: "Resource",
					value: "resource",
				},
				{
					label: "Software",
					value: "software",
				},
				{
					label: "Media",
					value: "media",
				},
				{
					label: "Archive",
					value: "archive",
				},
				{
					label: "Other",
					value: "other",
				},
			],
			admin: {
				description: "Category of the download file",
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
				description: "Tags for organizing and searching downloads",
			},
		},
		{
			name: "downloadCount",
			type: "number",
			defaultValue: 0,
			admin: {
				readOnly: true,
				description: "Number of times this file has been downloaded",
			},
		},
		{
			name: "featured",
			type: "checkbox",
			defaultValue: false,
			admin: {
				description: "Mark as featured download",
			},
		},
		{
			name: "accessLevel",
			type: "select",
			options: [
				{
					label: "Public",
					value: "public",
				},
				{
					label: "Registered Users",
					value: "registered",
				},
				{
					label: "Premium",
					value: "premium",
				},
			],
			defaultValue: "public",
			admin: {
				description: "Who can access this download",
			},
		},
	],
	hooks: {
		beforeChange: [
			({ data, req }) => {
				// Auto-set category based on MIME type if not set
				if (req.file && !data.category) {
					const mimeType = req.file.mimetype;

					if (
						mimeType.includes("pdf") ||
						mimeType.includes("document") ||
						mimeType.includes("word") ||
						mimeType.includes("excel") ||
						mimeType.includes("powerpoint")
					) {
						data.category = "document";
					} else if (
						mimeType.includes("zip") ||
						mimeType.includes("rar") ||
						mimeType.includes("7z") ||
						mimeType.includes("tar") ||
						mimeType.includes("gzip")
					) {
						data.category = "archive";
					} else if (
						mimeType.startsWith("image/") ||
						mimeType.startsWith("video/") ||
						mimeType.startsWith("audio/")
					) {
						data.category = "media";
					} else if (mimeType.includes("template")) {
						data.category = "template";
					} else {
						data.category = "other";
					}
				}

				return data;
			},
		],
		afterRead: [
			({ doc, req }) => {
				// Track download analytics if needed
				const userAgent = req.headers.get("user-agent");
				if (userAgent && !userAgent.includes("bot")) {
					// This is a real user request, could increment download count
					// Implementation depends on your analytics requirements
				}
				return doc;
			},
		],
	},
};
