import { NextResponse } from "next/server";

import {
	createSandbox,
	executePython,
	killSandbox,
	listSandboxes,
	runCommand,
} from "@kit/e2b";

export const dynamic = "force-dynamic";

export async function GET() {
	const startTime = Date.now();
	const results: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
		tests: {},
	};

	try {
		// Test 1: List existing sandboxes
		const existingSandboxes = await listSandboxes();
		results.tests = {
			...(results.tests as object),
			listSandboxes: {
				success: true,
				count: existingSandboxes.length,
			},
		};

		// Test 2: Create a sandbox
		const sandbox = await createSandbox({
			timeoutMs: 60000, // 1 minute timeout
		});

		results.tests = {
			...(results.tests as object),
			createSandbox: {
				success: true,
				sandboxId: sandbox.sandboxId,
			},
		};

		try {
			// Test 3: Run a simple Python command
			const pythonResult = await executePython(
				sandbox,
				`
import sys
import platform

print(f"Python version: {sys.version}")
print(f"Platform: {platform.platform()}")
print("Hello from E2B sandbox!")

# Return some data
result = {
    "python_version": sys.version_info[:3],
    "platform": platform.system(),
    "message": "E2B is working!"
}
result
`.trim(),
			);

			results.tests = {
				...(results.tests as object),
				executePython: {
					success: !pythonResult.error,
					stdout: pythonResult.stdout,
					stderr: pythonResult.stderr,
					hasError: !!pythonResult.error,
					error: pythonResult.error,
				},
			};

			// Test 4: Run a shell command
			const commandResult = await runCommand(
				sandbox,
				"uname -a && whoami && pwd",
			);

			results.tests = {
				...(results.tests as object),
				runCommand: {
					success: commandResult.exitCode === 0,
					stdout: commandResult.stdout,
					exitCode: commandResult.exitCode,
				},
			};

			// Test 5: Check environment
			const envResult = await executePython(
				sandbox,
				`
import os
print("Environment check:")
print(f"  HOME: {os.environ.get('HOME', 'not set')}")
print(f"  USER: {os.environ.get('USER', 'not set')}")
print(f"  PWD: {os.getcwd()}")
`.trim(),
			);

			results.tests = {
				...(results.tests as object),
				environmentCheck: {
					success: !envResult.error,
					stdout: envResult.stdout,
				},
			};
		} finally {
			// Always cleanup: kill the sandbox
			await killSandbox(sandbox);
			results.tests = {
				...(results.tests as object),
				killSandbox: {
					success: true,
					message: "Sandbox cleaned up successfully",
				},
			};
		}

		const duration = Date.now() - startTime;
		results.duration = `${duration}ms`;
		results.success = true;
		results.message = "All E2B tests passed!";

		return NextResponse.json(results, { status: 200 });
	} catch (error) {
		const duration = Date.now() - startTime;
		results.duration = `${duration}ms`;
		results.success = false;
		results.error = {
			message: error instanceof Error ? error.message : "Unknown error",
			name: error instanceof Error ? error.name : "Error",
			stack:
				process.env.NODE_ENV === "development" && error instanceof Error
					? error.stack
					: undefined,
		};

		return NextResponse.json(results, { status: 500 });
	}
}
