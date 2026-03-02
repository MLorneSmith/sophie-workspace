import { z } from "zod";

/**
 * Schema for validating Langfuse environment variables.
 * All variables are optional to support fallback-only mode when Langfuse is not configured.
 */
export const LangfuseEnvSchema = z
	.object({
		publicKey: z.string().optional(),
		secretKey: z.string().optional(),
		host: z.string().url().optional(),
	})
	.refine(
		(schema) => {
			// If any key is provided, all should be provided
			const hasAny = schema.publicKey || schema.secretKey || schema.host;
			const hasAll = schema.publicKey && schema.secretKey;
			return !hasAny || hasAll;
		},
		{
			path: ["publicKey"],
			message:
				"LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must both be provided or neither",
		},
	);

/**
 * Validates that Langfuse public key starts with correct prefix if provided
 */
export const LangfusePublicKeySchema = z
	.string()
	.refine((key) => !key || key.startsWith("pk-"), {
		message: "LANGFUSE_PUBLIC_KEY must start with 'pk-'",
	});

/**
 * Validates that Langfuse secret key starts with correct prefix if provided
 */
export const LangfuseSecretKeySchema = z
	.string()
	.refine((key) => !key || key.startsWith("sk-"), {
		message: "LANGFUSE_SECRET_KEY must start with 'sk-'",
	});

export type LangfuseEnv = z.infer<typeof LangfuseEnvSchema>;
