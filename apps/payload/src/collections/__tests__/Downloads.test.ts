import { describe, expect, it } from "vitest";
import { Downloads } from "../Downloads";

describe("Downloads Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Downloads.slug).toBe("downloads");
		});

		it("should have upload enabled", () => {
			expect(Downloads.upload).toBe(true);
		});

		it("should use title as admin display field", () => {
			expect(Downloads.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(Downloads.admin?.defaultColumns).toEqual([
				"title",
				"filename",
				"mimeType",
				"filesize",
				"updatedAt",
			]);
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(Downloads.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Downloads.access?.read()).toBe(true);
		});

		it("should require authentication for create", () => {
			expect(Downloads.access?.create).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Downloads.access?.create({ req: { user: null } })).toBe(false);
			// @ts-expect-error - testing access function
			expect(Downloads.access?.create({ req: { user: { id: "123" } } })).toBe(
				true,
			);
		});

		it("should require authentication for update", () => {
			expect(Downloads.access?.update).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Downloads.access?.update({ req: { user: null } })).toBe(false);
			// @ts-expect-error - testing access function
			expect(Downloads.access?.update({ req: { user: { id: "123" } } })).toBe(
				true,
			);
		});

		it("should require authentication for delete", () => {
			expect(Downloads.access?.delete).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Downloads.access?.delete({ req: { user: null } })).toBe(false);
			// @ts-expect-error - testing access function
			expect(Downloads.access?.delete({ req: { user: { id: "123" } } })).toBe(
				true,
			);
		});
	});

	describe("Fields", () => {
		const fields = Downloads.fields;

		it("should have title field that is required", () => {
			const titleField = fields.find((f) => "name" in f && f.name === "title");
			expect(titleField).toBeDefined();
			expect(titleField).toMatchObject({
				name: "title",
				type: "text",
				required: true,
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

		it("should have category select field with correct options", () => {
			const categoryField = fields.find(
				(f) => "name" in f && f.name === "category",
			);
			expect(categoryField).toBeDefined();
			expect(categoryField).toMatchObject({
				name: "category",
				type: "select",
			});
			if (categoryField && "options" in categoryField) {
				const options = categoryField.options as Array<{
					label: string;
					value: string;
				}>;
				expect(options).toHaveLength(7);
				expect(options.map((o) => o.value)).toEqual([
					"document",
					"template",
					"resource",
					"software",
					"media",
					"archive",
					"other",
				]);
			}
		});

		it("should have tags array field", () => {
			const tagsField = fields.find((f) => "name" in f && f.name === "tags");
			expect(tagsField).toBeDefined();
			expect(tagsField).toMatchObject({
				name: "tags",
				type: "array",
			});
		});

		it("should have downloadCount number field with default 0", () => {
			const countField = fields.find(
				(f) => "name" in f && f.name === "downloadCount",
			);
			expect(countField).toBeDefined();
			expect(countField).toMatchObject({
				name: "downloadCount",
				type: "number",
				defaultValue: 0,
			});
		});

		it("should have featured checkbox field", () => {
			const featuredField = fields.find(
				(f) => "name" in f && f.name === "featured",
			);
			expect(featuredField).toBeDefined();
			expect(featuredField).toMatchObject({
				name: "featured",
				type: "checkbox",
				defaultValue: false,
			});
		});

		it("should have accessLevel select field with correct options", () => {
			const accessField = fields.find(
				(f) => "name" in f && f.name === "accessLevel",
			);
			expect(accessField).toBeDefined();
			expect(accessField).toMatchObject({
				name: "accessLevel",
				type: "select",
				defaultValue: "public",
			});
			if (accessField && "options" in accessField) {
				const options = accessField.options as Array<{
					label: string;
					value: string;
				}>;
				expect(options.map((o) => o.value)).toEqual([
					"public",
					"registered",
					"premium",
				]);
			}
		});
	});

	describe("Hooks", () => {
		it("should have beforeChange hook for auto-categorization", () => {
			expect(Downloads.hooks?.beforeChange).toBeDefined();
			expect(Downloads.hooks?.beforeChange).toHaveLength(1);
		});

		it("should have afterRead hook for analytics", () => {
			expect(Downloads.hooks?.afterRead).toBeDefined();
			expect(Downloads.hooks?.afterRead).toHaveLength(1);
		});

		describe("beforeChange hook - auto-categorization", () => {
			const beforeChangeHook = Downloads.hooks?.beforeChange?.[0];

			it("should set category to document for PDF files", () => {
				const data = {};
				const req = { file: { mimetype: "application/pdf" } };
				// @ts-expect-error - testing hook
				const result = beforeChangeHook?.({ data, req });
				expect(result?.category).toBe("document");
			});

			it("should set category to archive for zip files", () => {
				const data = {};
				const req = { file: { mimetype: "application/zip" } };
				// @ts-expect-error - testing hook
				const result = beforeChangeHook?.({ data, req });
				expect(result?.category).toBe("archive");
			});

			it("should set category to media for image files", () => {
				const data = {};
				const req = { file: { mimetype: "image/png" } };
				// @ts-expect-error - testing hook
				const result = beforeChangeHook?.({ data, req });
				expect(result?.category).toBe("media");
			});

			it("should set category to media for video files", () => {
				const data = {};
				const req = { file: { mimetype: "video/mp4" } };
				// @ts-expect-error - testing hook
				const result = beforeChangeHook?.({ data, req });
				expect(result?.category).toBe("media");
			});

			it("should not override existing category", () => {
				const data = { category: "software" };
				const req = { file: { mimetype: "application/pdf" } };
				// @ts-expect-error - testing hook
				const result = beforeChangeHook?.({ data, req });
				expect(result?.category).toBe("software");
			});
		});
	});
});
