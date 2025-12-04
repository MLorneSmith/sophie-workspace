import { describe, expect, it } from "vitest";
import { QuizQuestions } from "../QuizQuestions";

describe("QuizQuestions Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(QuizQuestions.slug).toBe("quiz-questions");
		});

		it("should have correct labels", () => {
			expect(QuizQuestions.labels).toEqual({
				singular: "Quiz Question",
				plural: "Quiz Questions",
			});
		});

		it("should use question as admin display field", () => {
			expect(QuizQuestions.admin?.useAsTitle).toBe("question");
		});

		it("should have correct default columns", () => {
			expect(QuizQuestions.admin?.defaultColumns).toEqual(["question", "type"]);
		});

		it("should have admin description", () => {
			expect(QuizQuestions.admin?.description).toBe(
				"Questions for course quizzes",
			);
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(QuizQuestions.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(QuizQuestions.access?.read()).toBe(true);
		});
	});

	describe("Versioning", () => {
		it("should have versioning disabled", () => {
			expect(QuizQuestions.versions).toBe(false);
		});
	});

	describe("Fields", () => {
		const fields = QuizQuestions.fields;

		it("should have question field that is required", () => {
			const questionField = fields.find(
				(f) => "name" in f && f.name === "question",
			);
			expect(questionField).toBeDefined();
			expect(questionField).toMatchObject({
				name: "question",
				type: "text",
				required: true,
			});
		});

		it("should have type select field with multiple_choice default", () => {
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
				expect(options.map((o) => o.value)).toContain("multiple_choice");
			}
		});

		it("should have questionSlug field that is required and indexed", () => {
			const slugField = fields.find(
				(f) => "name" in f && f.name === "questionSlug",
			);
			expect(slugField).toBeDefined();
			expect(slugField).toMatchObject({
				name: "questionSlug",
				type: "text",
				required: true,
				index: true,
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
				required: true,
			});
			if (optionsField && "fields" in optionsField) {
				const subfields = optionsField.fields as Array<{
					name: string;
					type: string;
				}>;
				expect(subfields).toHaveLength(2);
				expect(subfields[0]).toMatchObject({
					name: "text",
					type: "text",
					required: true,
				});
				expect(subfields[1]).toMatchObject({
					name: "isCorrect",
					type: "checkbox",
					defaultValue: false,
				});
			}
		});

		it("should have explanation richText field", () => {
			const explanationField = fields.find(
				(f) => "name" in f && f.name === "explanation",
			);
			expect(explanationField).toBeDefined();
			expect(explanationField).toMatchObject({
				name: "explanation",
				type: "richText",
				required: false,
			});
		});

		it("should have order number field with default 0", () => {
			const orderField = fields.find(
				(f) => "name" in f && f.name === "order",
			);
			expect(orderField).toBeDefined();
			expect(orderField).toMatchObject({
				name: "order",
				type: "number",
				defaultValue: 0,
			});
		});
	});

	describe("Options Validation", () => {
		const optionsField = QuizQuestions.fields.find(
			(f) => "name" in f && f.name === "options",
		);
		const validate =
			optionsField && "validate" in optionsField
				? optionsField.validate
				: undefined;

		it("should require at least one option", () => {
			// @ts-expect-error - testing validation
			expect(validate?.([])).toBe("At least one option is required");
			// @ts-expect-error - testing validation
			expect(validate?.(null)).toBe("At least one option is required");
			// @ts-expect-error - testing validation
			expect(validate?.(undefined)).toBe("At least one option is required");
		});

		it("should pass with one or more options", () => {
			// @ts-expect-error - testing validation
			expect(validate?.([{ text: "Option 1", isCorrect: true }])).toBe(true);
			expect(
				// @ts-expect-error - testing validation
				validate?.([
					{ text: "Option 1", isCorrect: true },
					{ text: "Option 2", isCorrect: false },
				]),
			).toBe(true);
		});
	});
});
