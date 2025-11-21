/**
 * Port Binding Verifier Module (CommonJS)
 * Bridges TypeScript port-binding-verifier to CommonJS test controller
 */

const { execSync } = require("node:child_process");
const { createConnection } = require("node:net");

const DEFAULT_SUPABASE_PORTS = {
	kong: 54321,
	postgres: 54322,
	studio: 54323,
};

/**
 * Inspects Docker container port bindings
 */
async function inspectPortBindings(containerName) {
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
function verifyPortConnectivity(port, timeout = 500, host = "localhost") {
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
async function diagnosePortBindingFailure(
	containerName,
	ports = Object.values(DEFAULT_SUPABASE_PORTS),
) {
	const timestamp = new Date();
	const portResults = [];
	const failedPorts = [];

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

			const portInfo = {
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

		let dockerInspectOutput = "";
		try {
			dockerInspectOutput = execSync(`docker inspect "${containerName}"`, {
				encoding: "utf-8",
			});
		} catch {
			dockerInspectOutput = "Failed to retrieve docker inspect output";
		}

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
function getRecoveryInstructions(failedPorts) {
	const steps = [];

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
			"   Check container logs: docker logs " +
				(failedPorts[0]?.containerName || "container"),
		);
		steps.push(
			"   Restart containers: docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d\n",
		);
	}

	return steps;
}

/**
 * Formats diagnostic report as user-friendly message
 */
function formatDiagnosticMessage(report) {
	const lines = [];

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

/**
 * Main verification function with retry logic
 */
async function verifyPortBindings(
	containerName = "supabase_kong_2025slideheroes-db",
	ports = Object.values(DEFAULT_SUPABASE_PORTS),
	options = {},
) {
	const { retries = 1, retryDelay = 5000, throwOnFailure = true } = options;

	let lastReport = null;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const report = await diagnosePortBindingFailure(containerName, ports);

			if (report.isHealthy) {
				return report;
			}

			lastReport = report;

			if (attempt < retries) {
				console.log(
					`Port binding check failed (attempt ${attempt}/${retries}), retrying in ${retryDelay}ms...`,
				);
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
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

module.exports = {
	inspectPortBindings,
	verifyPortConnectivity,
	diagnosePortBindingFailure,
	getRecoveryInstructions,
	formatDiagnosticMessage,
	verifyPortBindings,
	DEFAULT_SUPABASE_PORTS,
};
