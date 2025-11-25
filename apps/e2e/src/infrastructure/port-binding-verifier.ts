import { execSync } from "node:child_process";
import { createConnection } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { getSupabaseConfig } from "../../tests/utils/supabase-config-loader";

/**
 * Port Binding Verifier
 *
 * Detects and diagnoses Docker port binding failures in WSL2 environments.
 * Provides recovery instructions and automated recovery options.
 */

export interface PortBindingInfo {
	port: number;
	containerName: string;
	isBound: boolean;
	isConnectable: boolean;
	error?: string;
}

export interface DiagnosticReport {
	timestamp: Date;
	ports: PortBindingInfo[];
	failedPorts: PortBindingInfo[];
	isHealthy: boolean;
	diagnosticData: {
		hostConfigPortBindings: Record<string, unknown>;
		networkSettingsPorts: Record<string, unknown>;
		dockerInspectOutput: string;
	};
	recoverySteps: string[];
}

/**
 * Gets the actual Supabase ports from dynamic configuration.
 * Falls back to standard ports if config detection fails.
 */
function getSupabasePorts(): {
	kong: number;
	postgres: number;
	studio: number;
} {
	try {
		const config = getSupabaseConfig();
		if (config.ports) {
			return {
				kong: config.ports.api,
				postgres: config.ports.db,
				studio: config.ports.studio,
			};
		}
	} catch {
		// Fall back to defaults
	}
	return {
		kong: 54321,
		postgres: 54322,
		studio: 54323,
	};
}

const DEFAULT_SUPABASE_PORTS = getSupabasePorts();

/**
 * Inspects Docker container port bindings
 */
export async function inspectPortBindings(containerName: string): Promise<{
	hostConfigPortBindings: Record<string, unknown>;
	networkSettingsPorts: Record<string, unknown>;
}> {
	try {
		const output = execSync(
			`docker inspect "${containerName}" --format='{{json .}}'`,
			{ encoding: "utf-8" },
		);

		const inspect = JSON.parse(output);
		const hostConfig = inspect[0]?.HostConfig || {};
		const networkSettings = inspect[0]?.NetworkSettings || {};

		return {
			hostConfigPortBindings: hostConfig.PortBindings || {},
			networkSettingsPorts: networkSettings.Ports || {},
		};
	} catch (error) {
		throw new Error(
			`Failed to inspect container "${containerName}": ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Verifies TCP connectivity to a port
 */
export async function verifyPortConnectivity(
	port: number,
	timeout = 500,
	host = "localhost",
): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = createConnection(
			{
				port,
				host,
				timeout,
			},
			() => {
				socket.destroy();
				resolve(true);
			},
		);

		socket.on("error", () => {
			socket.destroy();
			resolve(false);
		});

		socket.on("timeout", () => {
			socket.destroy();
			resolve(false);
		});
	});
}

/**
 * Diagnoses port binding failures
 */
export async function diagnosePortBindingFailure(
	containerName: string,
	ports: number[] = Object.values(DEFAULT_SUPABASE_PORTS),
): Promise<DiagnosticReport> {
	const timestamp = new Date();
	const portResults: PortBindingInfo[] = [];
	const failedPorts: PortBindingInfo[] = [];

	try {
		const { hostConfigPortBindings, networkSettingsPorts } =
			await inspectPortBindings(containerName);

		// Check each port
		for (const port of ports) {
			const isBound =
				!!hostConfigPortBindings[`${port}/tcp`] ||
				!!networkSettingsPorts[`${port}/tcp`];

			const isConnectable = isBound
				? await verifyPortConnectivity(port)
				: false;

			const portInfo: PortBindingInfo = {
				port,
				containerName,
				isBound,
				isConnectable,
			};

			if (!isConnectable) {
				portInfo.error = isBound
					? "Port configured but not connectable (port binding proxy failure)"
					: "Port not bound to host";
				failedPorts.push(portInfo);
			}

			portResults.push(portInfo);
		}

		const recoverySteps = getRecoveryInstructions(failedPorts);

		const dockerInspectOutput = execSync(`docker inspect "${containerName}"`, {
			encoding: "utf-8",
		});

		return {
			timestamp,
			ports: portResults,
			failedPorts,
			isHealthy: failedPorts.length === 0,
			diagnosticData: {
				hostConfigPortBindings,
				networkSettingsPorts,
				dockerInspectOutput,
			},
			recoverySteps,
		};
	} catch (error) {
		throw new Error(
			`Diagnosis failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Generates recovery instructions based on failure type
 */
export function getRecoveryInstructions(
	failedPorts: PortBindingInfo[],
): string[] {
	const steps: string[] = [];

	if (failedPorts.length === 0) {
		return ["No recovery needed - ports are bound correctly"];
	}

	// Detect the specific failure pattern
	const hasConfiguredButNotConnectable = failedPorts.some(
		(p) => p.isBound && !p.isConnectable,
	);
	const hasNotBound = failedPorts.some((p) => !p.isBound);

	steps.push("🔧 Port Binding Recovery Steps:\n");

	if (hasConfiguredButNotConnectable) {
		steps.push(
			"1. Restart WSL2 and Docker Desktop (fixes vpnkit proxy synchronization):",
		);
		steps.push("   wsl --shutdown");
		steps.push("   # Then restart Docker Desktop via Windows UI\n");

		steps.push(
			"2. Check for port conflicts (Windows Hyper-V dynamic port reservation):",
		);
		steps.push("   netsh int ipv4 show excludedportrange protocol=tcp\n");

		steps.push(
			"3. Verify .wslconfig networking mode (use NAT, avoid mirrored):",
		);
		steps.push("   Edit: %USERPROFILE%\\.wslconfig");
		steps.push("   [wsl2]");
		steps.push("   networkingMode=NAT\n");

		steps.push("4. Update WSL2 to latest version (requires WSL 2.6.1+):");
		steps.push("   wsl --update\n");
	}

	if (hasNotBound) {
		steps.push("⚠️ Ports not configured on host:");
		steps.push(
			"   This indicates Docker container may not have started correctly.",
		);
		steps.push(
			"   Check container logs: docker logs " + failedPorts[0]?.containerName,
		);
		steps.push(
			"   Restart containers: docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d\n",
		);
	}

	return steps;
}

/**
 * Performs automated recovery attempt (optional)
 */
export async function attemptAutomatedRecovery(
	attempts = 1,
	retryDelay = 5000,
): Promise<boolean> {
	for (let i = 0; i < attempts; i++) {
		try {
			// WSL shutdown to reset network stack
			execSync("wsl --shutdown", { stdio: "inherit" });

			// Wait for Docker to restart
			await sleep(retryDelay);

			return true;
		} catch (_error) {
			if (i < attempts - 1) {
				await sleep(1000);
			}
		}
	}

	return false;
}

/**
 * Main verification function with retry logic
 */
export async function verifyPortBindings(
	containerName: string = "supabase_kong_2025slideheroes-db",
	ports: number[] = Object.values(DEFAULT_SUPABASE_PORTS),
	options: {
		retries?: number;
		retryDelay?: number;
		throwOnFailure?: boolean;
	} = {},
): Promise<DiagnosticReport> {
	const { retries = 1, retryDelay = 5000, throwOnFailure = true } = options;

	let lastReport: DiagnosticReport | null = null;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const report = await diagnosePortBindingFailure(containerName, ports);

			if (report.isHealthy) {
				return report;
			}

			lastReport = report;

			if (attempt < retries) {
				await sleep(retryDelay);
			}
		} catch (error) {
			if (attempt === retries && throwOnFailure) {
				throw error;
			}
			lastReport = null;
		}
	}

	if (lastReport && !lastReport.isHealthy && throwOnFailure) {
		const errorMsg = formatDiagnosticMessage(lastReport);
		throw new Error(errorMsg);
	}

	return (
		lastReport || {
			timestamp: new Date(),
			ports: [],
			failedPorts: [],
			isHealthy: false,
			diagnosticData: {
				hostConfigPortBindings: {},
				networkSettingsPorts: {},
				dockerInspectOutput: "",
			},
			recoverySteps: ["Unable to diagnose - Docker may not be running"],
		}
	);
}

/**
 * Formats diagnostic report as user-friendly message
 */
export function formatDiagnosticMessage(report: DiagnosticReport): string {
	const lines: string[] = [];

	lines.push("\n❌ Docker Port Binding Verification Failed\n");
	lines.push("═".repeat(50));

	lines.push("\n📊 Port Status:");
	for (const port of report.ports) {
		const status = port.isConnectable ? "✅" : port.isBound ? "⚠️" : "❌";
		lines.push(
			`  ${status} Port ${port.port}: ${port.isConnectable ? "OK" : port.error || "Unknown"}`,
		);
	}

	lines.push("\n🔍 Diagnostic Data:");
	lines.push(`  Timestamp: ${report.timestamp.toISOString()}`);
	lines.push(`  Failed ports: ${report.failedPorts.length}`);

	lines.push("\n🛠️ Recovery Instructions:");
	for (const step of report.recoverySteps) {
		lines.push(`  ${step}`);
	}

	lines.push("\n" + "═".repeat(50));

	return lines.join("\n");
}
