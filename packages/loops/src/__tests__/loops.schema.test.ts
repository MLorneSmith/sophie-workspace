import { describe, expect, it } from "vitest";

import {
	LoopsEventSchema,
	TransactionalEmailSchema,
} from "../schemas/loops.schema";

describe("TransactionalEmailSchema", () => {
	it("should validate a minimal valid email", () => {
		const result = TransactionalEmailSchema.safeParse({
			transactionalId: "welcome-email",
			email: "user@example.com",
		});

		expect(result.success).toBe(true);
	});

	it("should validate with all fields", () => {
		const result = TransactionalEmailSchema.safeParse({
			transactionalId: "course-notification",
			email: "user@example.com",
			addToAudience: true,
			dataVariables: { firstName: "John", courseName: "Presentation Skills" },
		});

		expect(result.success).toBe(true);
	});

	it("should reject invalid email", () => {
		const result = TransactionalEmailSchema.safeParse({
			transactionalId: "welcome-email",
			email: "not-an-email",
		});

		expect(result.success).toBe(false);
	});

	it("should reject empty transactionalId", () => {
		const result = TransactionalEmailSchema.safeParse({
			transactionalId: "",
			email: "user@example.com",
		});

		expect(result.success).toBe(false);
	});

	it("should reject missing transactionalId", () => {
		const result = TransactionalEmailSchema.safeParse({
			email: "user@example.com",
		});

		expect(result.success).toBe(false);
	});

	it("should reject missing email", () => {
		const result = TransactionalEmailSchema.safeParse({
			transactionalId: "welcome-email",
		});

		expect(result.success).toBe(false);
	});
});

describe("LoopsEventSchema", () => {
	it("should validate event with email", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "userSignedUp",
			email: "user@example.com",
		});

		expect(result.success).toBe(true);
	});

	it("should validate event with userId", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "courseEnrolled",
			userId: "user-123",
		});

		expect(result.success).toBe(true);
	});

	it("should validate event with both email and userId", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "lessonCompleted",
			email: "user@example.com",
			userId: "user-123",
		});

		expect(result.success).toBe(true);
	});

	it("should validate event with all properties", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "assessmentCompleted",
			email: "user@example.com",
			userId: "user-123",
			contactProperties: { firstName: "John" },
			eventProperties: { score: 95, passed: true },
		});

		expect(result.success).toBe(true);
	});

	it("should reject event without email or userId", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "userSignedUp",
		});

		expect(result.success).toBe(false);
	});

	it("should reject empty eventName", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "",
			email: "user@example.com",
		});

		expect(result.success).toBe(false);
	});

	it("should reject missing eventName", () => {
		const result = LoopsEventSchema.safeParse({
			email: "user@example.com",
		});

		expect(result.success).toBe(false);
	});

	it("should reject invalid email format", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "userSignedUp",
			email: "not-valid",
		});

		expect(result.success).toBe(false);
	});

	it("should allow empty contact and event properties", () => {
		const result = LoopsEventSchema.safeParse({
			eventName: "userSignedUp",
			email: "user@example.com",
			contactProperties: {},
			eventProperties: {},
		});

		expect(result.success).toBe(true);
	});
});
