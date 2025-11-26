import "server-only";

import { Sandbox } from "@e2b/code-interpreter";
import { createServiceLogger } from "@kit/shared/logger";

import {
	AuthenticationError,
	SandboxCreateError,
	SandboxNotFoundError,
	wrapError,
} from "./errors";
import type { SandboxCreateOptions, SandboxInfo } from "./types";

const { getLogger } = createServiceLogger("E2B");

function getApiKey(providedKey?: string): string {
	const apiKey = providedKey ?? process.env.E2B_API_KEY;
	if (!apiKey) {
		throw new AuthenticationError("E2B_API_KEY environment variable not set");
	}
	return apiKey;
}

export async function createSandbox(
	options: SandboxCreateOptions = {},
): Promise<Sandbox> {
	const logger = await getLogger();
	const apiKey = getApiKey(options.apiKey);

	const { template, timeoutMs = 300000, metadata, envs } = options;

	logger.info("Creating E2B sandbox", {
		template: template ?? "default",
		timeoutMs,
		hasMetadata: !!metadata,
	});

	try {
		const createOpts = {
			timeoutMs,
			metadata,
			envs,
			apiKey,
		};

		// Sandbox.create() has two overloads: with template string or without
		const sandbox = template
			? await Sandbox.create(template, createOpts)
			: await Sandbox.create(createOpts);

		logger.info("Sandbox created successfully", {
			sandboxId: sandbox.sandboxId,
		});

		return sandbox;
	} catch (error) {
		logger.error("Failed to create sandbox", { error });
		throw new SandboxCreateError(
			`Failed to create sandbox: ${error instanceof Error ? error.message : "Unknown error"}`,
			error,
		);
	}
}

export async function connectToSandbox(
	sandboxId: string,
	apiKey?: string,
): Promise<Sandbox> {
	const logger = await getLogger();
	const key = getApiKey(apiKey);

	logger.info("Connecting to existing sandbox", { sandboxId });

	try {
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: key });
		logger.info("Connected to sandbox", { sandboxId });
		return sandbox;
	} catch (error) {
		logger.error("Failed to connect to sandbox", { sandboxId, error });
		throw new SandboxNotFoundError(sandboxId);
	}
}

export async function listSandboxes(apiKey?: string): Promise<SandboxInfo[]> {
	const logger = await getLogger();
	const key = getApiKey(apiKey);

	logger.info("Listing sandboxes");

	try {
		const sandboxes = await Sandbox.list({ apiKey: key });

		const result: SandboxInfo[] = sandboxes.map((s) => ({
			sandboxId: s.sandboxId,
			templateId: s.templateId,
			startedAt: s.startedAt,
			metadata: s.metadata,
		}));

		logger.info("Listed sandboxes", { count: result.length });
		return result;
	} catch (error) {
		logger.error("Failed to list sandboxes", { error });
		throw wrapError(error, "Failed to list sandboxes");
	}
}

export async function killSandbox(sandbox: Sandbox): Promise<void> {
	const logger = await getLogger();
	const sandboxId = sandbox.sandboxId;

	logger.info("Killing sandbox", { sandboxId });

	try {
		await sandbox.kill();
		logger.info("Sandbox killed", { sandboxId });
	} catch (error) {
		logger.error("Failed to kill sandbox", { sandboxId, error });
		throw wrapError(error, `Failed to kill sandbox: ${sandboxId}`);
	}
}

export async function killSandboxById(
	sandboxId: string,
	apiKey?: string,
): Promise<void> {
	const sandbox = await connectToSandbox(sandboxId, apiKey);
	await killSandbox(sandbox);
}

export async function isSandboxRunning(sandbox: Sandbox): Promise<boolean> {
	try {
		return await sandbox.isRunning();
	} catch {
		return false;
	}
}

export async function extendSandboxTimeout(
	sandbox: Sandbox,
	timeoutMs: number,
): Promise<void> {
	const logger = await getLogger();

	logger.info("Extending sandbox timeout", {
		sandboxId: sandbox.sandboxId,
		timeoutMs,
	});

	try {
		await sandbox.setTimeout(timeoutMs);
		logger.info("Sandbox timeout extended", { sandboxId: sandbox.sandboxId });
	} catch (error) {
		logger.error("Failed to extend sandbox timeout", { error });
		throw wrapError(error, "Failed to extend sandbox timeout");
	}
}

export async function getSandboxHost(
	sandbox: Sandbox,
	port: number,
): Promise<string> {
	return sandbox.getHost(port);
}

export { Sandbox };
