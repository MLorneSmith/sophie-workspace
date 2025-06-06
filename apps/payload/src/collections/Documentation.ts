import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
// Assuming blocks like CallToAction and TestBlock will be defined elsewhere
// import { CallToAction, TestBlock } from '../blocks'

export const Documentation: CollectionConfig = {
	slug: "documentation",
	labels: {
		singular: "Documentation",
		plural: "Documentation",
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "status", "publishedAt"],
		description: "Documentation content for the application",
	},
	access: {
		read: () => true,
	},
	versions: {
		drafts: true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "slug",
			type: "text",
			required: true,
			admin: {
				description: "The URL-friendly identifier for this document",
			},
		},
		{
			name: "description",
			type: "textarea",
		},
		{
			name: "content",
			type: "richText",
			required: true,
			editor: lexicalEditor({
				features: ({ defaultFeatures }) => [
					...defaultFeatures,
					// BlocksFeature will be added when blocks are properly configured
				],
			}),
			admin: {
				description: "The main content of the documentation",
				condition: () => true,
			},
		},
		{
			name: "downloads",
			type: "relationship",
			relationTo: "downloads",
			hasMany: true,
			admin: {
				description: "Files for download in this documentation",
			},
		},
		{
			name: "publishedAt",
			type: "date",
			admin: {
				date: {
					pickerAppearance: "dayAndTime",
				},
			},
		},
		{
			name: "status",
			type: "select",
			options: [
				{ label: "Draft", value: "draft" },
				{ label: "Published", value: "published" },
			],
			defaultValue: "draft",
			required: true,
		},
		{
			name: "order",
			type: "number",
			defaultValue: 0,
		},
		{
			name: "categories",
			type: "array",
			fields: [
				{
					name: "category",
					type: "text",
				},
			],
		},
		{
			name: "tags",
			type: "array",
			fields: [
				{
					name: "tag",
					type: "text",
				},
			],
		},
	],
	// Added a comment for migrate reliability test
};
