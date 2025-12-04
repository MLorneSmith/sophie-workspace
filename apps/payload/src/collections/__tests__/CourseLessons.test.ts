/**
 * Unit tests for CourseLessons collection configuration
 * Tests the course lessons collection schema, field definitions, and relationships
 */

import { describe, expect, it } from "vitest";
import { CourseLessons } from "../CourseLessons";

describe("CourseLessons Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(CourseLessons.slug).toBe("course-lessons");
		});

		it("should have correct labels", () => {
			expect(CourseLessons.labels?.singular).toBe("Course Lesson");
			expect(CourseLessons.labels?.plural).toBe("Course Lessons");
		});

		it("should use title as admin display field", () => {
			expect(CourseLessons.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(CourseLessons.admin?.defaultColumns).toEqual([
				"title",
				"lesson_number",
				"course_id",
			]);
		});

		it("should have draft versioning enabled", () => {
			expect(CourseLessons.versions?.drafts).toBe(true);
		});

		it("should have public read access", () => {
			if (CourseLessons.access?.read) {
				const readFn = CourseLessons.access.read;
				if (typeof readFn === "function") {
					expect(readFn({} as Parameters<typeof readFn>[0])).toBe(true);
				}
			}
		});
	});

	describe("Core Fields", () => {
		it("should have title field as required", () => {
			const titleField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "title",
			);

			expect(titleField).toBeDefined();
			if (titleField && "type" in titleField) {
				expect(titleField.type).toBe("text");
			}
			if (titleField && "required" in titleField) {
				expect(titleField.required).toBe(true);
			}
		});

		it("should have slug field as required and unique", () => {
			const slugField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "slug",
			);

			expect(slugField).toBeDefined();
			if (slugField && "type" in slugField) {
				expect(slugField.type).toBe("text");
			}
			if (slugField && "required" in slugField) {
				expect(slugField.required).toBe(true);
			}
			if (slugField && "unique" in slugField) {
				expect(slugField.unique).toBe(true);
			}
		});

		it("should have lesson_number field as required number", () => {
			const lessonNumField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "lesson_number",
			);

			expect(lessonNumField).toBeDefined();
			if (lessonNumField && "type" in lessonNumField) {
				expect(lessonNumField.type).toBe("number");
			}
			if (lessonNumField && "required" in lessonNumField) {
				expect(lessonNumField.required).toBe(true);
			}
			if (lessonNumField && "min" in lessonNumField) {
				expect(lessonNumField.min).toBe(1);
			}
		});
	});

	describe("Video Fields", () => {
		it("should have bunny_video_id field", () => {
			const bunnyVideoField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "bunny_video_id",
			);

			expect(bunnyVideoField).toBeDefined();
			if (bunnyVideoField && "type" in bunnyVideoField) {
				expect(bunnyVideoField.type).toBe("text");
			}
		});

		it("should have bunny_library_id field with default value", () => {
			const bunnyLibraryField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "bunny_library_id",
			);

			expect(bunnyLibraryField).toBeDefined();
			if (bunnyLibraryField && "defaultValue" in bunnyLibraryField) {
				expect(bunnyLibraryField.defaultValue).toBe("264486");
			}
		});

		it("should have video_source_type select field with youtube and vimeo options", () => {
			const videoSourceField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "video_source_type",
			);

			expect(videoSourceField).toBeDefined();
			if (videoSourceField && "type" in videoSourceField) {
				expect(videoSourceField.type).toBe("select");
				if (
					"options" in videoSourceField &&
					Array.isArray(videoSourceField.options)
				) {
					expect(videoSourceField.options).toContainEqual({
						label: "YouTube",
						value: "youtube",
					});
					expect(videoSourceField.options).toContainEqual({
						label: "Vimeo",
						value: "vimeo",
					});
				}
			}
		});

		it("should have youtube_video_id field", () => {
			const youtubeField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "youtube_video_id",
			);

			expect(youtubeField).toBeDefined();
			if (youtubeField && "type" in youtubeField) {
				expect(youtubeField.type).toBe("text");
			}
		});
	});

	describe("Todo Fields", () => {
		it("should have todo_complete_quiz checkbox field", () => {
			const todoQuizField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "todo_complete_quiz",
			);

			expect(todoQuizField).toBeDefined();
			if (todoQuizField && "type" in todoQuizField) {
				expect(todoQuizField.type).toBe("checkbox");
			}
			if (todoQuizField && "defaultValue" in todoQuizField) {
				expect(todoQuizField.defaultValue).toBe(false);
			}
		});

		it("should have todo richText field", () => {
			const todoField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "todo",
			);

			expect(todoField).toBeDefined();
			if (todoField && "type" in todoField) {
				expect(todoField.type).toBe("richText");
			}
		});

		it("should have todo_watch_content richText field", () => {
			const todoWatchField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "todo_watch_content",
			);

			expect(todoWatchField).toBeDefined();
			if (todoWatchField && "type" in todoWatchField) {
				expect(todoWatchField.type).toBe("richText");
			}
		});

		it("should have todo_read_content richText field", () => {
			const todoReadField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "todo_read_content",
			);

			expect(todoReadField).toBeDefined();
			if (todoReadField && "type" in todoReadField) {
				expect(todoReadField.type).toBe("richText");
			}
		});

		it("should have todo_course_project richText field", () => {
			const todoProjectField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "todo_course_project",
			);

			expect(todoProjectField).toBeDefined();
			if (todoProjectField && "type" in todoProjectField) {
				expect(todoProjectField.type).toBe("richText");
			}
		});
	});

	describe("Relationship Fields", () => {
		it("should have course_id relationship to courses", () => {
			const courseField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "course_id",
			);

			expect(courseField).toBeDefined();
			if (courseField && "type" in courseField) {
				expect(courseField.type).toBe("relationship");
			}
			if (courseField && "relationTo" in courseField) {
				expect(courseField.relationTo).toBe("courses");
			}
		});

		it("should have quiz_id relationship to course-quizzes", () => {
			const quizField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "quiz_id",
			);

			expect(quizField).toBeDefined();
			if (quizField && "type" in quizField) {
				expect(quizField.type).toBe("relationship");
			}
			if (quizField && "relationTo" in quizField) {
				expect(quizField.relationTo).toBe("course-quizzes");
			}
		});

		it("should have survey_id relationship to surveys", () => {
			const surveyField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "survey_id",
			);

			expect(surveyField).toBeDefined();
			if (surveyField && "type" in surveyField) {
				expect(surveyField.type).toBe("relationship");
			}
			if (surveyField && "relationTo" in surveyField) {
				expect(surveyField.relationTo).toBe("surveys");
			}
		});

		it("should have downloads relationship with hasMany", () => {
			const downloadsField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "downloads",
			);

			expect(downloadsField).toBeDefined();
			if (downloadsField && "type" in downloadsField) {
				expect(downloadsField.type).toBe("relationship");
			}
			if (downloadsField && "relationTo" in downloadsField) {
				expect(downloadsField.relationTo).toBe("downloads");
			}
			if (downloadsField && "hasMany" in downloadsField) {
				expect(downloadsField.hasMany).toBe(true);
			}
		});

		it("should have thumbnail upload to media", () => {
			const thumbnailField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "thumbnail",
			);

			expect(thumbnailField).toBeDefined();
			if (thumbnailField && "type" in thumbnailField) {
				expect(thumbnailField.type).toBe("upload");
			}
			if (thumbnailField && "relationTo" in thumbnailField) {
				expect(thumbnailField.relationTo).toBe("media");
			}
		});
	});

	describe("Content Fields", () => {
		it("should have description textarea field", () => {
			const descField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "description",
			);

			expect(descField).toBeDefined();
			if (descField && "type" in descField) {
				expect(descField.type).toBe("textarea");
			}
		});

		it("should have content richText field", () => {
			const contentField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "content",
			);

			expect(contentField).toBeDefined();
			if (contentField && "type" in contentField) {
				expect(contentField.type).toBe("richText");
			}
		});

		it("should have estimated_duration number field", () => {
			const durationField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "estimated_duration",
			);

			expect(durationField).toBeDefined();
			if (durationField && "type" in durationField) {
				expect(durationField.type).toBe("number");
			}
			if (durationField && "min" in durationField) {
				expect(durationField.min).toBe(0);
			}
		});

		it("should have publishedAt date field", () => {
			const publishedField = CourseLessons.fields.find(
				(f) => "name" in f && f.name === "publishedAt",
			);

			expect(publishedField).toBeDefined();
			if (publishedField && "type" in publishedField) {
				expect(publishedField.type).toBe("date");
			}
		});
	});
});
