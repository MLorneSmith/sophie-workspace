import { z } from "zod";

const TimeFilter = z
	.object({
		startTime: z.number(),
		endTime: z.number(),
	})
	.describe("The time range to filter the usage records. Used for Stripe");

const PageFilter = z
	.object({
		page: z.number(),
		size: z.number(),
	})
	.describe("The page and size to filter the usage records. Used for LS");

export const QueryBillingUsageSchema = z.object({
	id: z
		.string()
		.describe(
			"The id of the usage record. For Stripe a meter ID, for LS a subscription item ID.",
		),
	customerId: z
		.string()
		.describe("The id of the customer in the billing system"),
	filter: z.union([TimeFilter, PageFilter]),
});
