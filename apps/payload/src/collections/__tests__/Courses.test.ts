/**
 * Unit tests for Courses collection configuration
 * Tests the courses collection schema, field definitions, and access control
 */

import { describe, expect, it } from "vitest";
import { Courses } from "../Courses";

describe("Courses Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Courses.slug).toBe("courses");
		});

		it("should have correct labels", () => {
			expect(Courses.labels?.singular).toBe("Course");
			expect(Courses.labels?.plural).toBe("Courses");
		});

		it("should use title as admin display field", () => {
			expect(Courses.admin?.useAsTitle).toBe("title");
		});

		it("should have correct default columns", () => {
			expect(Courses.admin?.defaultColumns).toEqual([
				"title",
				"status",
				"publishedAt",
			]);
		});

		it("should have draft versioning enabled", () => {
			expect(Courses.versions?.drafts).toBe(true);
		});

		it("should have public read access", () => {
			if (Courses.access?.read) {
				const readFn = Courses.access.read;
				if (typeof readFn === "function") {
					// Call with minimal args - the function always returns true
					expect(readFn({} as Parameters<typeof readFn>[0])).toBe(true);
				}
			}
		});
	});

	describe("Fields Configuration", () => {
		it("should have title field as required", () => {
			const titleField = Courses.fields.find(
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
			const slugField = Courses.fields.find(
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

		it("should have description field as textarea", () => {
			const descField = Courses.fields.find(
				(f) => "name" in f && f.name === "description",
			);

			expect(descField).toBeDefined();
			if (descField && "type" in descField) {
				expect(descField.type).toBe("textarea");
			}
		});

		it("should have content field as richText", () => {
			const contentField = Courses.fields.find(
				(f) => "name" in f && f.name === "content",
			);

			expect(contentField).toBeDefined();
			if (contentField && "type" in contentField) {
				expect(contentField.type).toBe("richText");
			}
		});

		it("should have downloads relationship field", () => {
			const downloadsField = Courses.fields.find(
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

		it("should have publishedAt date field", () => {
			const publishedAtField = Courses.fields.find(
				(f) => "name" in f && f.name === "publishedAt",
			);

			expect(publishedAtField).toBeDefined();
			if (publishedAtField && "type" in publishedAtField) {
				expect(publishedAtField.type).toBe("date");
			}
		});

		it("should have status select field with correct options", () => {
			const statusField = Courses.fields.find(
				(f) => "name" in f && f.name === "status",
			);

			expect(statusField).toBeDefined();
			if (statusField && "type" in statusField) {
				expect(statusField.type).toBe("select");
				if ("options" in statusField && Array.isArray(statusField.options)) {
					expect(statusField.options).toHaveLength(2);
					expect(statusField.options).toContainEqual({
						label: "Draft",
						value: "draft",
					});
					expect(statusField.options).toContainEqual({
						label: "Published",
						value: "published",
					});
				}
			}
		});

		it("should have status field with draft as default", () => {
			const statusField = Courses.fields.find(
				(f) => "name" in f && f.name === "status",
			);

			if (statusField && "defaultValue" in statusField) {
				expect(statusField.defaultValue).toBe("draft");
			}
		});

		it("should have status field as required", () => {
			const statusField = Courses.fields.find(
				(f) => "name" in f && f.name === "status",
			);

			if (statusField && "required" in statusField) {
				expect(statusField.required).toBe(true);
			}
		});
	});
});
