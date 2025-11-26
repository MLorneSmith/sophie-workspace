import "server-only";

import type { Sandbox } from "@e2b/code-interpreter";
import { createServiceLogger } from "@kit/shared/logger";

import { FileNotFoundError, FileOperationError, wrapError } from "./errors";
import type { FileInfo, FileReadOptions, FileWriteOptions } from "./types";

const { getLogger } = createServiceLogger("E2B");

export async function readFile(
	sandbox: Sandbox,
	path: string,
	options: FileReadOptions = {},
): Promise<string> {
	const logger = await getLogger();
	const { format = "text" } = options;

	logger.info("Reading file", { sandboxId: sandbox.sandboxId, path, format });

	try {
		const exists = await sandbox.files.exists(path);
		if (!exists) {
			throw new FileNotFoundError(path);
		}

		const content = await sandbox.files.read(path);
		logger.info("File read successfully", {
			sandboxId: sandbox.sandboxId,
			path,
			contentLength: content.length,
		});

		return content;
	} catch (error) {
		if (error instanceof FileNotFoundError) {
			throw error;
		}
		logger.error("Failed to read file", {
			sandboxId: sandbox.sandboxId,
			path,
			error,
		});
		throw new FileOperationError("read", path, error);
	}
}

export async function writeFile(
	sandbox: Sandbox,
	path: string,
	content: string,
	_options: FileWriteOptions = {},
): Promise<void> {
	const logger = await getLogger();

	logger.info("Writing file", {
		sandboxId: sandbox.sandboxId,
		path,
		contentLength: content.length,
	});

	try {
		await sandbox.files.write(path, content);
		logger.info("File written successfully", {
			sandboxId: sandbox.sandboxId,
			path,
		});
	} catch (error) {
		logger.error("Failed to write file", {
			sandboxId: sandbox.sandboxId,
			path,
			error,
		});
		throw new FileOperationError("write", path, error);
	}
}

export async function listDirectory(
	sandbox: Sandbox,
	path: string,
): Promise<FileInfo[]> {
	const logger = await getLogger();

	logger.info("Listing directory", { sandboxId: sandbox.sandboxId, path });

	try {
		const entries = await sandbox.files.list(path);

		const result: FileInfo[] = entries.map((entry) => ({
			name: entry.name,
			type: entry.type as "file" | "directory",
			path: entry.path,
		}));

		logger.info("Directory listed successfully", {
			sandboxId: sandbox.sandboxId,
			path,
			entryCount: result.length,
		});

		return result;
	} catch (error) {
		logger.error("Failed to list directory", {
			sandboxId: sandbox.sandboxId,
			path,
			error,
		});
		throw wrapError(error, `Failed to list directory: ${path}`);
	}
}

export async function fileExists(
	sandbox: Sandbox,
	path: string,
): Promise<boolean> {
	try {
		return await sandbox.files.exists(path);
	} catch {
		return false;
	}
}

export async function getFileInfo(
	sandbox: Sandbox,
	path: string,
): Promise<FileInfo | null> {
	const logger = await getLogger();

	try {
		const info = await sandbox.files.getInfo(path);
		return {
			name: info.name,
			type: info.type as "file" | "directory",
			path: info.path,
		};
	} catch (error) {
		logger.warn("Failed to get file info", {
			sandboxId: sandbox.sandboxId,
			path,
			error,
		});
		return null;
	}
}

export async function makeDirectory(
	sandbox: Sandbox,
	path: string,
): Promise<boolean> {
	const logger = await getLogger();

	logger.info("Creating directory", { sandboxId: sandbox.sandboxId, path });

	try {
		const result = await sandbox.files.makeDir(path);
		logger.info("Directory created", {
			sandboxId: sandbox.sandboxId,
			path,
			created: result,
		});
		return result;
	} catch (error) {
		logger.error("Failed to create directory", {
			sandboxId: sandbox.sandboxId,
			path,
			error,
		});
		throw new FileOperationError("mkdir", path, error);
	}
}

export async function removeFile(
	sandbox: Sandbox,
	path: string,
): Promise<void> {
	const logger = await getLogger();

	logger.info("Removing file/directory", {
		sandboxId: sandbox.sandboxId,
		path,
	});

	try {
		await sandbox.files.remove(path);
		logger.info("File/directory removed", {
			sandboxId: sandbox.sandboxId,
			path,
		});
	} catch (error) {
		logger.error("Failed to remove file/directory", {
			sandboxId: sandbox.sandboxId,
			path,
			error,
		});
		throw new FileOperationError("remove", path, error);
	}
}

export async function getDownloadUrl(
	sandbox: Sandbox,
	path: string,
): Promise<string> {
	return sandbox.downloadUrl(path);
}

export async function getUploadUrl(
	sandbox: Sandbox,
	path: string,
): Promise<string> {
	return sandbox.uploadUrl(path);
}

export async function copyFile(
	sandbox: Sandbox,
	sourcePath: string,
	destPath: string,
): Promise<void> {
	const content = await readFile(sandbox, sourcePath);
	await writeFile(sandbox, destPath, content);
}

export async function moveFile(
	sandbox: Sandbox,
	sourcePath: string,
	destPath: string,
): Promise<void> {
	await copyFile(sandbox, sourcePath, destPath);
	await removeFile(sandbox, sourcePath);
}
