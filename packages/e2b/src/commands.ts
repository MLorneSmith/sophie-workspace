import "server-only";

import type { Sandbox } from "@e2b/code-interpreter";
import { createServiceLogger } from "@kit/shared/logger";

import { CommandError, wrapError } from "./errors";
import type { CommandOptions, CommandResult } from "./types";

const { getLogger } = createServiceLogger("E2B");

export async function runCommand(
	sandbox: Sandbox,
	command: string,
	options: CommandOptions = {},
): Promise<CommandResult> {
	const logger = await getLogger();
	const { cwd, envs, timeoutMs = 60000, background = false } = options;

	logger.info("Running command", {
		sandboxId: sandbox.sandboxId,
		command: command.substring(0, 100),
		cwd,
		background,
		timeoutMs,
	});

	try {
		const result = await sandbox.commands.run(command, {
			cwd,
			envs,
			timeoutMs: background ? 0 : timeoutMs,
		});

		const commandResult: CommandResult = {
			stdout: result.stdout,
			stderr: result.stderr,
			exitCode: result.exitCode,
		};

		if (result.exitCode !== 0) {
			logger.warn("Command completed with non-zero exit code", {
				sandboxId: sandbox.sandboxId,
				exitCode: result.exitCode,
				stderr: result.stderr.substring(0, 500),
			});
		} else {
			logger.info("Command completed successfully", {
				sandboxId: sandbox.sandboxId,
				stdoutLength: result.stdout.length,
			});
		}

		return commandResult;
	} catch (error) {
		logger.error("Command execution failed", {
			sandboxId: sandbox.sandboxId,
			command,
			error,
		});
		throw wrapError(error, `Command failed: ${command}`);
	}
}

export async function runCommandChecked(
	sandbox: Sandbox,
	command: string,
	options: CommandOptions = {},
): Promise<CommandResult> {
	const result = await runCommand(sandbox, command, options);

	if (result.exitCode !== 0) {
		throw new CommandError(command, result.exitCode, result.stderr);
	}

	return result;
}

export async function installPythonPackage(
	sandbox: Sandbox,
	packageName: string,
): Promise<CommandResult> {
	const logger = await getLogger();

	logger.info("Installing Python package", {
		sandboxId: sandbox.sandboxId,
		package: packageName,
	});

	return runCommandChecked(sandbox, `pip install ${packageName}`, {
		timeoutMs: 120000,
	});
}

export async function installPythonPackages(
	sandbox: Sandbox,
	packages: string[],
): Promise<CommandResult> {
	const logger = await getLogger();

	logger.info("Installing Python packages", {
		sandboxId: sandbox.sandboxId,
		packages,
	});

	return runCommandChecked(sandbox, `pip install ${packages.join(" ")}`, {
		timeoutMs: 180000,
	});
}

export async function installNodePackage(
	sandbox: Sandbox,
	packageName: string,
): Promise<CommandResult> {
	const logger = await getLogger();

	logger.info("Installing Node.js package", {
		sandboxId: sandbox.sandboxId,
		package: packageName,
	});

	return runCommandChecked(sandbox, `npm install ${packageName}`, {
		timeoutMs: 120000,
	});
}

export async function installNodePackages(
	sandbox: Sandbox,
	packages: string[],
): Promise<CommandResult> {
	const logger = await getLogger();

	logger.info("Installing Node.js packages", {
		sandboxId: sandbox.sandboxId,
		packages,
	});

	return runCommandChecked(sandbox, `npm install ${packages.join(" ")}`, {
		timeoutMs: 180000,
	});
}

export async function installSystemPackage(
	sandbox: Sandbox,
	packageName: string,
): Promise<CommandResult> {
	const logger = await getLogger();

	logger.info("Installing system package", {
		sandboxId: sandbox.sandboxId,
		package: packageName,
	});

	return runCommandChecked(
		sandbox,
		`apt-get update && apt-get install -y ${packageName}`,
		{
			timeoutMs: 180000,
		},
	);
}

export async function cloneRepository(
	sandbox: Sandbox,
	repoUrl: string,
	targetDir: string,
	options: { branch?: string; depth?: number } = {},
): Promise<CommandResult> {
	const logger = await getLogger();
	const { branch, depth } = options;

	let command = "git clone";
	if (branch) command += ` -b ${branch}`;
	if (depth) command += ` --depth ${depth}`;
	command += ` ${repoUrl} ${targetDir}`;

	logger.info("Cloning repository", {
		sandboxId: sandbox.sandboxId,
		repoUrl,
		targetDir,
		branch,
	});

	return runCommandChecked(sandbox, command, {
		timeoutMs: 300000,
	});
}
