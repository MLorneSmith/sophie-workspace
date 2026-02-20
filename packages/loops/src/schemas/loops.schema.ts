import { z } from "zod";

export const TransactionalEmailSchema = z.object({
	transactionalId: z.string().min(1, "transactionalId is required"),
	email: z.email("Invalid email address"),
	addToAudience: z.boolean().optional(),
	dataVariables: z.record(z.string(), z.unknown()).optional(),
});

export const LoopsEventSchema = z
	.object({
		eventName: z.string().min(1, "eventName is required"),
		email: z.email("Invalid email address").optional(),
		userId: z.string().min(1).optional(),
		contactProperties: z.record(z.string(), z.unknown()).optional(),
		eventProperties: z.record(z.string(), z.unknown()).optional(),
	})
	.refine((data) => data.email || data.userId, {
		message: "Either email or userId must be provided",
	});
