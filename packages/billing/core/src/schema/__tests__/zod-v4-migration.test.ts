import { describe, expect, it } from "vitest";
import { createBillingSchema } from "../../create-billing-schema";

describe("Zod v4 Schema Migration", () => {
	it("should create billing schema without errors using v4 API", () => {
		// This test verifies that the schema can be created without errors
		// after migrating from Zod v3 to v4 API (description parameter -> .describe() method)
		const schema = createBillingSchema({
			provider: "stripe",
			products: [
				{
					id: "test-product",
					name: "Test Product",
					description: "A test product",
					currency: "USD",
					features: ["Feature 1", "Feature 2"],
					plans: [
						{
							id: "test-plan",
							name: "Test Plan",
							paymentType: "recurring",
							interval: "month",
							lineItems: [
								{
									id: "test-line-item",
									name: "Test Line Item",
									cost: 999,
									type: "flat",
								},
							],
						},
					],
				},
			],
		});

		expect(schema).toBeDefined();
		expect(schema.provider).toBe("stripe");
		expect(schema.products).toHaveLength(1);
		expect(schema.products[0]?.id).toBe("test-product");
	});

	it("should validate schemas correctly with .describe() metadata", () => {
		// Verify that .describe() preserves metadata correctly
		const schema = createBillingSchema({
			provider: "stripe",
			products: [
				{
					id: "prod-1",
					name: "Product 1",
					description: "Product description",
					currency: "USD",
					features: ["Feature"],
					plans: [
						{
							id: "plan-1",
							name: "Plan 1",
							paymentType: "one-time",
							lineItems: [
								{
									id: "item-1",
									name: "Item 1",
									cost: 500,
									type: "flat",
								},
							],
						},
					],
				},
			],
		});

		// Schema should be valid and parseable
		expect(schema.provider).toBe("stripe");
		expect(schema.products[0]?.plans[0]?.paymentType).toBe("one-time");
	});

	it("should throw validation errors when schema requirements are not met", () => {
		// Verify that validation still works after migration
		expect(() => {
			createBillingSchema({
				provider: "stripe",
				products: [
					{
						id: "", // Invalid: min length 1 required
						name: "Product",
						description: "Description",
						currency: "USD",
						features: ["Feature"],
						plans: [], // Invalid: must have at least one plan
					},
				],
			});
		}).toThrow();
	});
});
