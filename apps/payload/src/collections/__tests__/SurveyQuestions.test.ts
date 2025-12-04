import { describe, expect, it } from "vitest";
import { SurveyQuestions } from "../SurveyQuestions";

describe("SurveyQuestions Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(SurveyQuestions.slug).toBe("survey-questions");
		});

		it("should have correct labels", () => {
			expect(SurveyQuestions.labels).toEqual({
				singular: "Survey Question",
				plural: "Survey Questions",
			});
		});

		it("should use text as admin display field", () => {
			expect(SurveyQuestions.admin?.useAsTitle).toBe("text");
		});

		it("should have correct default columns", () => {
			expect(SurveyQuestions.admin?.defaultColumns).toEqual([
				"text",
				"type",
				"category",
				"position",
			]);
		});

		it("should have admin description", () => {
			expect(SurveyQuestions.admin?.description).toBe("Questions for surveys");
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(SurveyQuestions.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(SurveyQuestions.access?.read()).toBe(true);
		});
	});

	describe("Versioning", () => {
		it("should have drafts enabled", () => {
			expect(SurveyQuestions.versions).toEqual({
				drafts: true,
			});
		});
	});

	describe("Fields", () => {
		const fields = SurveyQuestions.fields;

		it("should have questionSlug field that is required, unique, and indexed", () => {
			const slugField = fields.find(
				(f) => "name" in f && f.name === "questionSlug",
			);
			expect(slugField).toBeDefined();
			expect(slugField).toMatchObject({
				name: "questionSlug",
				type: "text",
				required: true,
				unique: true,
				index: true,
			});
		});

		it("should have text field that is required", () => {
			const textField = fields.find((f) => "name" in f && f.name === "text");
			expect(textField).toBeDefined();
			expect(textField).toMatchObject({
				name: "text",
				type: "text",
				required: true,
			});
		});

		it("should have type select field with correct options", () => {
			const typeField = fields.find((f) => "name" in f && f.name === "type");
			expect(typeField).toBeDefined();
			expect(typeField).toMatchObject({
				name: "type",
				type: "select",
				defaultValue: "multiple_choice",
				required: true,
			});
			if (typeField && "options" in typeField) {
				const options = typeField.options as Array<{
					label: string;
					value: string;
				}>;
				expect(options.map((o) => o.value)).toEqual([
					"multiple_choice",
					"text_field",
					"textarea",
					"scale",
				]);
			}
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

		it("should have required checkbox field with default true", () => {
			const requiredField = fields.find(
				(f) => "name" in f && f.name === "required",
			);
			expect(requiredField).toBeDefined();
			expect(requiredField).toMatchObject({
				name: "required",
				type: "checkbox",
				defaultValue: true,
			});
		});

		it("should have options array field with validation", () => {
			const optionsField = fields.find(
				(f) => "name" in f && f.name === "options",
			);
			expect(optionsField).toBeDefined();
			expect(optionsField).toMatchObject({
				name: "options",
				type: "array",
			});
			if (optionsField && "fields" in optionsField) {
				const subfields = optionsField.fields as Array<{
					name: string;
					type: string;
				}>;
				expect(subfields).toHaveLength(1);
				expect(subfields[0]).toMatchObject({
					name: "option",
					type: "text",
					required: true,
				});
			}
		});

		it("should have category field that is required", () => {
			const categoryField = fields.find(
				(f) => "name" in f && f.name === "category",
			);
			expect(categoryField).toBeDefined();
			expect(categoryField).toMatchObject({
				name: "category",
				type: "text",
				required: true,
			});
		});

		it("should have questionspin select field with Positive/Negative options", () => {
			const spinField = fields.find(
				(f) => "name" in f && f.name === "questionspin",
			);
			expect(spinField).toBeDefined();
			expect(spinField).toMatchObject({
				name: "questionspin",
				type: "select",
				defaultValue: "Positive",
				required: true,
			});
			if (spinField && "options" in spinField) {
				const options = spinField.options as Array<{
					label: string;
					value: string;
				}>;
				expect(options.map((o) => o.value)).toEqual(["Positive", "Negative"]);
			}
		});

		it("should have position number field with default 0", () => {
			const positionField = fields.find(
				(f) => "name" in f && f.name === "position",
			);
			expect(positionField).toBeDefined();
			expect(positionField).toMatchObject({
				name: "position",
				type: "number",
				defaultValue: 0,
			});
		});
	});

	describe("Options Validation", () => {
		const optionsField = SurveyQuestions.fields.find(
			(f) => "name" in f && f.name === "options",
		);
		const validate =
			optionsField && "validate" in optionsField
				? optionsField.validate
				: undefined;

		it("should require at least two options for multiple_choice type", () => {
			expect(
				// @ts-expect-error - testing validation
				validate?.([], { data: { type: "multiple_choice" } }),
			).toBe("At least two options are required");
			expect(
				// @ts-expect-error - testing validation
				validate?.([{ option: "One" }], { data: { type: "multiple_choice" } }),
			).toBe("At least two options are required");
		});

		it("should require at least two options for scale type", () => {
			expect(
				// @ts-expect-error - testing validation
				validate?.([], { data: { type: "scale" } }),
			).toBe("At least two options are required");
		});

		it("should not require options for text_field type", () => {
			expect(
				// @ts-expect-error - testing validation
				validate?.([], { data: { type: "text_field" } }),
			).toBe(true);
		});

		it("should not require options for textarea type", () => {
			expect(
				// @ts-expect-error - testing validation
				validate?.([], { data: { type: "textarea" } }),
			).toBe(true);
		});

		it("should pass with two or more options for multiple_choice", () => {
			expect(
				// @ts-expect-error - testing validation
				validate?.([{ option: "One" }, { option: "Two" }], {
					data: { type: "multiple_choice" },
				}),
			).toBe(true);
		});
	});
});
