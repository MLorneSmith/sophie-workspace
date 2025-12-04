/**
 * Unit tests for Users collection configuration
 * Tests the user collection schema and field definitions
 */

import { describe, expect, it } from "vitest";
import { Users } from "../Users";

describe("Users Collection", () => {
	describe("Collection Configuration", () => {
		it("should have correct slug", () => {
			expect(Users.slug).toBe("users");
		});

		it("should enable authentication", () => {
			expect(Users.auth).toBe(true);
		});

		it("should use email as admin title", () => {
			expect(Users.admin?.useAsTitle).toBe("email");
		});
	});

	describe("Fields Configuration", () => {
		it("should have name field", () => {
			const nameField = Users.fields.find(
				(f) => "name" in f && f.name === "name",
			);

			expect(nameField).toBeDefined();
			if (nameField && "type" in nameField) {
				expect(nameField.type).toBe("text");
			}
		});

		it("should have role field with correct options", () => {
			const roleField = Users.fields.find(
				(f) => "name" in f && f.name === "role",
			);

			expect(roleField).toBeDefined();
			if (roleField && "type" in roleField) {
				expect(roleField.type).toBe("select");
				if ("options" in roleField && Array.isArray(roleField.options)) {
					expect(roleField.options).toHaveLength(2);
					expect(roleField.options).toContainEqual({
						label: "Admin",
						value: "admin",
					});
					expect(roleField.options).toContainEqual({
						label: "User",
						value: "user",
					});
				}
			}
		});

		it("should have role field with default value", () => {
			const roleField = Users.fields.find(
				(f) => "name" in f && f.name === "role",
			);

			if (roleField && "defaultValue" in roleField) {
				expect(roleField.defaultValue).toBe("user");
			}
		});

		it("should have role field as required", () => {
			const roleField = Users.fields.find(
				(f) => "name" in f && f.name === "role",
			);

			if (roleField && "required" in roleField) {
				expect(roleField.required).toBe(true);
			}
		});
	});
});
