import type { Block } from "payload";

export const BunnyVideo: Block = {
	slug: "bunny-video",
	interfaceName: "BunnyVideoBlock",
	labels: {
		singular: "Bunny.net Video",
		plural: "Bunny.net Videos",
	},
	imageAltText: "Bunny.net Video component",
	fields: [
		{
			name: "videoId",
			type: "text",
			label: "Video ID",
			admin: {
				description:
					"Enter the Bunny.net Video ID (alternative to Direct Play URL)",
			},
		},
		{
			name: "libraryId",
			type: "text",
			label: "Library ID",
			defaultValue: "264486",
			admin: {
				description: "Enter the Bunny.net Library ID",
			},
		},
		{
			name: "previewUrl",
			type: "text",
			label: "Preview Image URL",
			admin: {
				description: "Custom preview image URL (optional)",
			},
		},
		{
			name: "showPreview",
			type: "checkbox",
			label: "Show Preview",
			defaultValue: false,
			admin: {
				description: "Show preview image before playing the video",
			},
		},
		{
			name: "title",
			type: "text",
			label: "Title",
			defaultValue: "Video",
			admin: {
				description: "Enter a title for the video (optional)",
			},
		},
		{
			name: "aspectRatio",
			type: "select",
			label: "Aspect Ratio",
			defaultValue: "16:9",
			options: [
				{
					label: "16:9 (Widescreen)",
					value: "16:9",
				},
				{
					label: "4:3 (Standard)",
					value: "4:3",
				},
				{
					label: "1:1 (Square)",
					value: "1:1",
				},
			],
			admin: {
				description: "Select the aspect ratio for the video player",
			},
		},
	],
};
