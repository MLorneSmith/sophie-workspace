import { describe, expect, it } from "vitest";
import { Posts } from "../Posts";

describe("Posts Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Posts.slug).toBe("posts");
		});

		it("should have correct labels", () => {
			expect(Posts.labels).toEqual({
				singular: "Post",
				plural: "Posts",
			});
		});

		it("should use title as admin display field", () => {
			expect(Posts.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(Posts.admin?.defaultColumns).toEqual([
				"title",
				"status",
				"publishedAt",
			]);
		});

		it("should have admin description", () => {
			expect(Posts.admin?.description).toBe("Blog posts for the website");
		});
	});

	describe("Access Control", () => {
		it("should allow public read access", () => {
			expect(Posts.access?.read).toBeDefined();
			// @ts-expect-error - testing access function
			expect(Posts.access?.read()).toBe(true);
		});
	});

	describe("Versioning", () => {
		it("should have drafts enabled", () => {
			expect(Posts.versions).toEqual({
				drafts: true,
			});
		});
	});

	describe("Fields", () => {
		const fields = Posts.fields;

		it("should have title field that is required", () => {
			const titleField = fields.find((f) => "name" in f && f.name === "title");
			expect(titleField).toBeDefined();
			expect(titleField).toMatchObject({
				name: "title",
				type: "text",
				required: true,
			});
		});

		it("should have slug field with beforeValidate hook", () => {
			const slugField = fields.find((f) => "name" in f && f.name === "slug");
			expect(slugField).toBeDefined();
			expect(slugField).toMatchObject({
				name: "slug",
				type: "text",
				required: true,
			});
			if (slugField && "hooks" in slugField) {
				expect(slugField.hooks?.beforeValidate).toBeDefined();
				expect(slugField.hooks?.beforeValidate).toHaveLength(1);
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

		it("should have publishedAt date field with default", () => {
			const publishedField = fields.find(
				(f) => "name" in f && f.name === "publishedAt",
			);
			expect(publishedField).toBeDefined();
			expect(publishedField).toMatchObject({
				name: "publishedAt",
				type: "date",
			});
			if (publishedField && "defaultValue" in publishedField) {
				expect(publishedField.defaultValue).toBeDefined();
				expect(typeof publishedField.defaultValue).toBe("function");
			}
		});

		it("should have image_id upload field relating to media", () => {
			const imageField = fields.find(
				(f) => "name" in f && f.name === "image_id",
			);
			expect(imageField).toBeDefined();
			expect(imageField).toMatchObject({
				name: "image_id",
				type: "upload",
				relationTo: "media",
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
	});

	describe("Slug Hook", () => {
		const slugField = Posts.fields.find(
			(f) => "name" in f && f.name === "slug",
		);
		const beforeValidateHook =
			slugField && "hooks" in slugField
				? slugField.hooks?.beforeValidate?.[0]
				: undefined;

		it("should generate slug from title when slug is empty", () => {
			const result = beforeValidateHook?.({
				value: null,
				data: { title: "My Test Post" },
			});
			expect(result).toBe("my-test-post");
		});

		it("should generate slug removing special characters", () => {
			const result = beforeValidateHook?.({
				value: "",
				data: { title: "Hello! World? Test." },
			});
			expect(result).toBe("hello-world-test");
		});

		it("should preserve existing slug value", () => {
			const result = beforeValidateHook?.({
				value: "existing-slug",
				data: { title: "Different Title" },
			});
			expect(result).toBe("existing-slug");
		});

		it("should return undefined when no title and no slug", () => {
			const result = beforeValidateHook?.({
				value: null,
				data: {},
			});
			expect(result).toBeUndefined();
		});
	});
});
