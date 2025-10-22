import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import { BunnyVideo, YouTubeVideo } from "../blocks";

export const CourseLessons: CollectionConfig = {
	slug: "course-lessons",
	labels: {
		singular: "Course Lesson",
		plural: "Course Lessons",
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "lesson_number", "course_id"],
		description: "Lessons for courses in the learning management system",
	},
	access: {
		read: () => true, // Public read access
	},
	versions: {
		drafts: true,
	},
	fields: [
		// ID field removed - Payload will default to UUID
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "bunny_video_id",
			type: "text",
			label: "Bunny.net Video ID",
			admin: {
				description:
					"Video ID from Bunny.net (if this lesson includes a video)",
			},
		},
		{
			name: "bunny_library_id",
			type: "text",
			label: "Bunny.net Library ID",
			defaultValue: "264486",
			admin: {
				description: "Library ID from Bunny.net (defaults to main library)",
			},
		},
		{
			name: "video_source_type",
			type: "select",
			label: "External Video Source",
			defaultValue: "youtube", // For backward compatibility
			admin: {
				description: "Source platform for the external video",
				isClearable: true,
			},
			options: [
				{
					label: "YouTube",
					value: "youtube",
				},
				{
					label: "Vimeo",
					value: "vimeo",
				},
			],
		},
		{
			name: "youtube_video_id",
			type: "text",
			label: "External Video ID",
			admin: {
				description:
					"Video ID from YouTube or Vimeo (if this lesson includes an external video)",
			},
		},
		{
			name: "todo_complete_quiz",
			type: "checkbox",
			label: "Todo: Complete Quiz",
			defaultValue: false,
		},
		// {
		//   name: 'todo_watch_content',
		//   type: 'richText',
		//   label: 'Todo: Watch Content',
		//   editor: lexicalEditor({}),
		//   admin: {
		//     description:
		//       'Content to watch - supports rich text formatting like bullet points and links',
		//   },
		// },
		// {
		//   name: 'todo_read_content',
		//   type: 'richText',
		//   label: 'Todo: Read Content',
		//   editor: lexicalEditor({}),
		//   admin: {
		//     description: 'Content to read - supports rich text formatting like bullet points and links',
		//   },
		// },
		// {
		//   name: 'todo_course_project',
		//   type: 'richText',
		//   label: 'Todo: Course Project',
		//   editor: lexicalEditor({}),
		//   admin: {
		//     description:
		//       'Course project instructions - supports rich text formatting like bullet points and links',
		//   },
		// },
		// {
		//   name: 'todo',
		//   type: 'richText',
		//   label: 'Todo',
		//   editor: lexicalEditor({}),
		//   admin: {
		//     description:
		//       'General todo instructions for this lesson - supports rich text formatting like bullet points and links',
		//   },
		// },
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			admin: {
				description: "The URL-friendly identifier for this lesson",
			},
		},
		{
			name: "description",
			type: "textarea",
		},
		{
			name: "thumbnail",
			type: "upload",
			relationTo: "media",
			admin: {
				description: "Thumbnail image for this lesson",
			},
		},
		{
			name: "content",
			type: "richText",
			editor: lexicalEditor({
				features: ({ defaultFeatures }) => [
					...defaultFeatures,
					BlocksFeature({
						blocks: [BunnyVideo, YouTubeVideo],
					}),
				],
			}),
		},
		{
			name: "lesson_number",
			type: "number",
			required: true,
			min: 1,
			admin: {
				description: "Order in which this lesson appears in the course",
			},
		},
		{
			name: "estimated_duration",
			type: "number",
			min: 0,
			label: "Estimated duration (minutes)",
		},
		{
			name: "course_id",
			type: "relationship",
			relationTo: "courses",
			required: false, // Temporarily set to false for Stage 2 seeding
		},
		// Temporarily  commented out due to InvalidFieldRelationship error during config sanitization.
		// The 'course_quizzes' collection is not yet active.
		{
			name: "quiz_id",
			type: "relationship",
			relationTo: "course-quizzes",
			hasMany: false,
			admin: {
				description: "The quiz associated with this lesson (if any)",
			},
		},
		// Temporarily commented out due to InvalidFieldRelationship error during config sanitization.
		// The 'surveys' collection is not yet active.
		{
			name: "survey_id",
			type: "relationship",
			relationTo: "surveys",
			hasMany: false,
			admin: {
				description: "The survey associated with this lesson (if any)",
			},
		},
		{
			name: "downloads",
			type: "relationship",
			relationTo: "downloads",
			hasMany: true,
			admin: {
				description: "Files for download in this lesson",
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
	],
};
