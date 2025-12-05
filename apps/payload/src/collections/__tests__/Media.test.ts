import { describe, expect, it } from "vitest";
import { Media } from "../Media";

describe("Media Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Media.slug).toBe("media");
		});

		it("should have upload enabled", () => {
			expect(Media.upload).toBe(true);
		});

		it("should use filename as admin display field", () => {
			expect(Media.admin?.useAsTitle).toBe("filename");
		});

		it("should have correct default columns", () => {
			expect(Media.admin?.defaultColumns).toEqual([
				"filename",
				"mimeType",
				"filesize",
				"updatedAt",
			]);
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(Media.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Media.access?.read()).toBe(true);
		});

		it("should require authentication for create", () => {
			expect(Media.access?.create).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Media.access?.create({ req: { user: null } })).toBe(false);
			// @ts-expect-error - testing access function
			expect(Media.access?.create({ req: { user: { id: "123" } } })).toBe(true);
		});

		it("should require authentication for update", () => {
			expect(Media.access?.update).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Media.access?.update({ req: { user: null } })).toBe(false);
			// @ts-expect-error - testing access function
			expect(Media.access?.update({ req: { user: { id: "123" } } })).toBe(true);
		});

		it("should require authentication for delete", () => {
			expect(Media.access?.delete).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Media.access?.delete({ req: { user: null } })).toBe(false);
			// @ts-expect-error - testing access function
			expect(Media.access?.delete({ req: { user: { id: "123" } } })).toBe(true);
		});
	});

	describe("Fields", () => {
		const fields = Media.fields;

		it("should have alt field that is required", () => {
			const altField = fields.find((f) => "name" in f && f.name === "alt");
			expect(altField).toBeDefined();
			expect(altField).toMatchObject({
				name: "alt",
				type: "text",
				required: true,
			});
		});

		it("should have caption text field", () => {
			const captionField = fields.find(
				(f) => "name" in f && f.name === "caption",
			);
			expect(captionField).toBeDefined();
			expect(captionField).toMatchObject({
				name: "caption",
				type: "text",
			});
		});

		it("should have type select field with correct options", () => {
			const typeField = fields.find((f) => "name" in f && f.name === "type");
			expect(typeField).toBeDefined();
			expect(typeField).toMatchObject({
				name: "type",
				type: "select",
			});
			if (typeField && "options" in typeField) {
				const options = typeField.options as Array<{
					label: string;
					value: string;
				}>;
				expect(options).toHaveLength(3);
				expect(options.map((o) => o.value)).toEqual([
					"image",
					"video",
					"document",
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
			if (tagsField && "fields" in tagsField) {
				const subfields = tagsField.fields as Array<{
					name: string;
					type: string;
				}>;
				expect(subfields).toHaveLength(1);
				expect(subfields[0]).toMatchObject({
					name: "tag",
					type: "text",
				});
			}
		});
	});
});
