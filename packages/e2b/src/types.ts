import type { Sandbox } from "@e2b/code-interpreter";

export type { Sandbox };

export interface SandboxCreateOptions {
	template?: string;
	timeoutMs?: number;
	metadata?: Record<string, string>;
	envs?: Record<string, string>;
	apiKey?: string;
}

export interface SandboxInfo {
	sandboxId: string;
	templateId?: string;
	startedAt?: Date;
	metadata?: Record<string, string>;
}

export interface ExecutionResult {
	stdout: string;
	stderr: string;
	exitCode?: number;
	results: ExecutionOutput[];
	error?: ExecutionError;
}

export interface ExecutionOutput {
	type: string;
	data?: unknown;
	text?: string;
}

export interface ExecutionError {
	name: string;
	value: string;
	traceback: string;
}

export interface CommandResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

export interface FileInfo {
	name: string;
	type: "file" | "directory";
	path: string;
}

export type SupportedLanguage = "python" | "javascript" | "r";

export interface CodeExecutionOptions {
	language?: SupportedLanguage;
	timeoutMs?: number;
	onStdout?: (output: string) => void;
	onStderr?: (output: string) => void;
}

export interface CommandOptions {
	cwd?: string;
	envs?: Record<string, string>;
	timeoutMs?: number;
	background?: boolean;
}

export interface FileWriteOptions {
	user?: string;
}

export interface FileReadOptions {
	format?: "text" | "bytes" | "blob" | "stream";
}
