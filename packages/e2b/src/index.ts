import "server-only";

// Sandbox management
export {
	createSandbox,
	connectToSandbox,
	listSandboxes,
	killSandbox,
	killSandboxById,
	isSandboxRunning,
	extendSandboxTimeout,
	getSandboxHost,
	Sandbox,
} from "./sandbox";

// Code execution
export {
	executeCode,
	executePython,
	executeJavaScript,
	executeR,
	executeWithRetry,
	isExecutionSuccessful,
	getLanguageFromExtension,
} from "./code-execution";

// Command execution
export {
	runCommand,
	runCommandChecked,
	installPythonPackage,
	installPythonPackages,
	installNodePackage,
	installNodePackages,
	installSystemPackage,
	cloneRepository,
} from "./commands";

// File operations
export {
	readFile,
	writeFile,
	listDirectory,
	fileExists,
	getFileInfo,
	makeDirectory,
	removeFile,
	getDownloadUrl,
	getUploadUrl,
	copyFile,
	moveFile,
} from "./files";

// Errors
export {
	E2BError,
	AuthenticationError,
	SandboxCreateError,
	SandboxNotFoundError,
	ExecutionError,
	ExecutionTimeoutError,
	FileNotFoundError,
	FileOperationError,
	CommandError,
	RateLimitError,
	TemplateError,
	isE2BError,
	wrapError,
} from "./errors";

// Types
export type {
	SandboxCreateOptions,
	SandboxInfo,
	ExecutionResult,
	ExecutionOutput,
	ExecutionError as ExecutionErrorType,
	CommandResult,
	FileInfo,
	SupportedLanguage,
	CodeExecutionOptions,
	CommandOptions,
	FileWriteOptions,
	FileReadOptions,
} from "./types";
