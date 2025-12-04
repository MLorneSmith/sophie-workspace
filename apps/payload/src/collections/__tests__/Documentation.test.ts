import { describe, expect, it } from "vitest";
import { Documentation } from "../Documentation";

describe("Documentation Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Documentation.slug).toBe("documentation");
		});

		it("should have correct labels", () => {
			expect(Documentation.labels).toEqual({
				singular: "Documentation",
				plural: "Documentation",
			});
		});

		it("should use title as admin display field", () => {
			expect(Documentation.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(Documentation.admin?.defaultColumns).toEqual([
				"title",
				"status",
				"publishedAt",
			]);
		});

		it("should have admin description", () => {
			expect(Documentation.admin?.description).toBe(
				"Documentation content for the application",
			);
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(Documentation.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Documentation.access?.read()).toBe(true);
		});
	});

	describe("Versioning", () => {
		it("should have drafts enabled", () => {
			expect(Documentation.versions).toEqual({
				drafts: true,
			});
		});
	});

	describe("Fields", () => {
		const fields = Documentation.fields;

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

		it("should have slug field that is required", () => {
			const slugField = fields.find((f) => "name" in f && f.name === "slug");
			expect(slugField).toBeDefined();
			expect(slugField).toMatchObject({
				name: "slug",
				type: "text",
				required: true,
			});
		});

		it("should have parent self-referential relationship field", () => {
			const parentField = fields.find(
				(f) => "name" in f && f.name === "parent",
			);
			expect(parentField).toBeDefined();
			expect(parentField).toMatchObject({
				name: "parent",
				type: "relationship",
				relationTo: "documentation",
			});
		});

		it("should have breadcrumbs array field", () => {
			const breadcrumbsField = fields.find(
				(f) => "name" in f && f.name === "breadcrumbs",
			);
			expect(breadcrumbsField).toBeDefined();
			expect(breadcrumbsField).toMatchObject({
				name: "breadcrumbs",
				type: "array",
			});
			if (breadcrumbsField && "fields" in breadcrumbsField) {
				const subfields = breadcrumbsField.fields as Array<{
					name: string;
					type: string;
				}>;
				expect(subfields).toHaveLength(3);
				expect(subfields.map((f) => f.name)).toEqual(["doc", "url", "label"]);
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

		it("should have content richText field that is required", () => {
			const contentField = fields.find(
				(f) => "name" in f && f.name === "content",
			);
			expect(contentField).toBeDefined();
			expect(contentField).toMatchObject({
				name: "content",
				type: "richText",
				required: true,
			});
		});

		it("should have downloads relationship field", () => {
			const downloadsField = fields.find(
				(f) => "name" in f && f.name === "downloads",
			);
			expect(downloadsField).toBeDefined();
			expect(downloadsField).toMatchObject({
				name: "downloads",
				type: "relationship",
				relationTo: "downloads",
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

		it("should have status select field with draft/published options", () => {
			const statusField = fields.find(
				(f) => "name" in f && f.name === "status",
			);
			expect(statusField).toBeDefined();
			expect(statusField).toMatchObject({
				name: "status",
				type: "select",
				defaultValue: "draft",
				required: true,
			});
			if (statusField && "options" in statusField) {
				const options = statusField.options as Array<{
					label: string;
					value: string;
				}>;
				expect(options.map((o) => o.value)).toEqual(["draft", "published"]);
			}
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

		it("should have categories array field", () => {
			const categoriesField = fields.find(
				(f) => "name" in f && f.name === "categories",
			);
			expect(categoriesField).toBeDefined();
			expect(categoriesField).toMatchObject({
				name: "categories",
				type: "array",
			});
		});

		it("should have tags array field", () => {
			const tagsField = fields.find((f) => "name" in f && f.name === "tags");
			expect(tagsField).toBeDefined();
			expect(tagsField).toMatchObject({
				name: "tags",
				type: "array",
			});
		});
	});
});
