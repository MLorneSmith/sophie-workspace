import { describe, expect, it } from "vitest";
import { Surveys } from "../Surveys";

describe("Surveys Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Surveys.slug).toBe("surveys");
		});

		it("should have correct labels", () => {
			expect(Surveys.labels).toEqual({
				singular: "Survey",
				plural: "Surveys",
			});
		});

		it("should use title as admin display field", () => {
			expect(Surveys.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(Surveys.admin?.defaultColumns).toEqual([
				"title",
				"status",
				"publishedAt",
			]);
		});

		it("should have admin description", () => {
			expect(Surveys.admin?.description).toBe(
				"Surveys for user assessment and feedback",
			);
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(Surveys.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Surveys.access?.read()).toBe(true);
		});
	});

	describe("Versioning", () => {
		it("should have drafts enabled", () => {
			expect(Surveys.versions).toEqual({
				drafts: true,
			});
		});
	});

	describe("Fields", () => {
		const fields = Surveys.fields;

		it("should have title field that is required", () => {
			const titleField = fields.find((f) => "name" in f && f.name === "title");
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

		it("should have questions relationship field to survey-questions", () => {
			const questionsField = fields.find(
				(f) => "name" in f && f.name === "questions",
			);
			expect(questionsField).toBeDefined();
			expect(questionsField).toMatchObject({
				name: "questions",
				type: "relationship",
				relationTo: "survey-questions",
				hasMany: true,
			});
		});

		it("should have publishedAt date field", () => {
			const publishedField = fields.find(
				(f) => "name" in f && f.name === "publishedAt",
			);
			expect(publishedField).toBeDefined();
			expect(publishedField).toMatchObject({
				name: "publishedAt",
				type: "date",
			});
		});
	});

	describe("Slug Hook", () => {
		const slugField = Surveys.fields.find(
			(f) => "name" in f && f.name === "slug",
		);
		const beforeValidateHook =
			slugField && "hooks" in slugField
				? slugField.hooks?.beforeValidate?.[0]
				: undefined;

		it("should generate slug from title when slug is empty", () => {
			const result = beforeValidateHook?.({
				value: null,
				data: { title: "User Feedback Survey" },
			});
			expect(result).toBe("user-feedback-survey");
		});

		it("should generate slug removing special characters", () => {
			const result = beforeValidateHook?.({
				value: "",
				data: { title: "Survey: Questions & Answers!" },
			});
			// Regex replaces multiple spaces with single dash
			expect(result).toBe("survey-questions-answers");
		});

		it("should preserve existing slug value", () => {
			const result = beforeValidateHook?.({
				value: "existing-survey-slug",
				data: { title: "Different Survey Title" },
			});
			expect(result).toBe("existing-survey-slug");
		});
	});
});
