import { describe, expect, it } from "vitest";
import { CourseQuizzes } from "../CourseQuizzes";

describe("CourseQuizzes Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(CourseQuizzes.slug).toBe("course-quizzes");
		});

		it("should have correct labels", () => {
			expect(CourseQuizzes.labels).toEqual({
				singular: "Course Quiz",
				plural: "Course Quizzes",
			});
		});

		it("should use title as admin display field", () => {
			expect(CourseQuizzes.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(CourseQuizzes.admin?.defaultColumns).toEqual([
				"title",
				"course_id",
			]);
		});

		it("should have admin description", () => {
			expect(CourseQuizzes.admin?.description).toBe(
				"Quizzes for courses in the learning management system",
			);
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(CourseQuizzes.access?.read).toBeDefined();
			expect(typeof CourseQuizzes.access?.read).toBe("function");
			// @ts-expect-error - testing access function
			expect(CourseQuizzes.access?.read()).toBe(true);
		});
	});

	describe("Versioning", () => {
		it("should have drafts enabled", () => {
			expect(CourseQuizzes.versions).toEqual({
				drafts: true,
			});
		});
	});

	describe("Fields", () => {
		const fields = CourseQuizzes.fields;

		it("should have title field that is required", () => {
			const titleField = fields.find(
				(f) => "name" in f && f.name === "title",
			);
			expect(titleField).toBeDefined();
			expect(titleField).toMatchObject({
				name: "title",
				type: "text",
				required: true,
			});
		});

		it("should have slug field that is required and unique", () => {
			const slugField = fields.find((f) => "name" in f && f.name === "slug");
			expect(slugField).toBeDefined();
			expect(slugField).toMatchObject({
				name: "slug",
				type: "text",
				required: true,
				unique: true,
			});
		});

		it("should have description textarea field", () => {
			const descField = fields.find(
				(f) => "name" in f && f.name === "description",
			);
			expect(descField).toBeDefined();
			expect(descField).toMatchObject({
				name: "description",
				type: "textarea",
			});
		});

		it("should have course_id relationship field", () => {
			const courseField = fields.find(
				(f) => "name" in f && f.name === "course_id",
			);
			expect(courseField).toBeDefined();
			expect(courseField).toMatchObject({
				name: "course_id",
				type: "relationship",
				relationTo: "courses",
			});
		});

		it("should have pass_threshold number field with validation", () => {
			const thresholdField = fields.find(
				(f) => "name" in f && f.name === "pass_threshold",
			);
			expect(thresholdField).toBeDefined();
			expect(thresholdField).toMatchObject({
				name: "pass_threshold",
				type: "number",
				min: 0,
				max: 100,
				defaultValue: 70,
			});
		});

		it("should have questions relationship field to quiz-questions", () => {
			const questionsField = fields.find(
				(f) => "name" in f && f.name === "questions",
			);
			expect(questionsField).toBeDefined();
			expect(questionsField).toMatchObject({
				name: "questions",
				type: "relationship",
				relationTo: "quiz-questions",
				hasMany: true,
			});
		});
	});
});
