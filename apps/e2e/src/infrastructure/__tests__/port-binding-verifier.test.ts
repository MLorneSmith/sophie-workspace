import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import { createConnection } from "node:net";
import {
	inspectPortBindings,
	verifyPortConnectivity,
	diagnosePortBindingFailure,
	getRecoveryInstructions,
	formatDiagnosticMessage,
	verifyPortBindings,
	type PortBindingInfo,
	type DiagnosticReport,
} from "../port-binding-verifier";

// Mock dependencies
vi.mock("node:child_process");
vi.mock("node:net");

describe("Port Binding Verifier", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("inspectPortBindings", () => {
		it("should parse docker inspect output correctly", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {
							"54321/tcp": [{ HostIp: "", HostPort: "54321" }],
							"54322/tcp": [{ HostIp: "", HostPort: "54322" }],
						},
					},
					NetworkSettings: {
						Ports: {
							"54321/tcp": [{ HostIp: "0.0.0.0", HostPort: "54321" }],
							"54322/tcp": [{ HostIp: "0.0.0.0", HostPort: "54322" }],
						},
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const result = await inspectPortBindings("test-container");

			expect(result.hostConfigPortBindings).toHaveProperty("54321/tcp");
			expect(result.networkSettingsPorts).toHaveProperty("54321/tcp");
		});

		it("should detect empty NetworkSettings.Ports (bug symptom)", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {
							"54321/tcp": [{ HostIp: "", HostPort: "54321" }],
						},
					},
					NetworkSettings: {
						Ports: {}, // Empty - this is the bug!
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const result = await inspectPortBindings("test-container");

			expect(result.hostConfigPortBindings).toHaveProperty("54321/tcp");
			expect(result.networkSettingsPorts).toEqual({});
		});

		it("should throw error when container not found", async () => {
			vi.mocked(execSync).mockImplementation(() => {
				throw new Error("No such container");
			});

			await expect(
				inspectPortBindings("nonexistent-container"),
			).rejects.toThrow("Failed to inspect container");
		});
	});

	describe("verifyPortConnectivity", () => {
		it("should return true for connectable ports", async () => {
			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "connect") {
						handler();
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const result = await verifyPortConnectivity(54321, 500);

			expect(result).toBe(true);
			expect(mockSocket.destroy).toHaveBeenCalled();
		});

		it("should return false for non-connectable ports", async () => {
			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "error") {
						handler(new Error("Connection refused"));
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const result = await verifyPortConnectivity(54321, 500);

			expect(result).toBe(false);
		});

		it("should handle timeout correctly", async () => {
			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "timeout") {
						handler();
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const result = await verifyPortConnectivity(54321, 500);

			expect(result).toBe(false);
		});
	});

	describe("diagnosePortBindingFailure", () => {
		it("should identify the WSL2 port binding bug", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {
							"54321/tcp": [{ HostIp: "", HostPort: "54321" }],
							"54322/tcp": [{ HostIp: "", HostPort: "54322" }],
							"54323/tcp": [{ HostIp: "", HostPort: "54323" }],
						},
					},
					NetworkSettings: {
						Ports: {}, // Bug: empty even though HostConfig has bindings
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "error") {
						handler(new Error("Connection refused"));
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const report = await diagnosePortBindingFailure(
				"test-container",
				[54321, 54322, 54323],
			);

			expect(report.isHealthy).toBe(false);
			expect(report.failedPorts.length).toBeGreaterThan(0);
			expect(report.failedPorts[0]?.error).toContain(
				"port binding proxy failure",
			);
		});

		it("should identify ports not bound at all", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {}, // No bindings configured
					},
					NetworkSettings: {
						Ports: {},
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const report = await diagnosePortBindingFailure(
				"test-container",
				[54321],
			);

			expect(report.failedPorts[0]?.error).toContain("Port not bound");
		});

		it("should report healthy when all ports are connectable", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {
							"54321/tcp": [{ HostIp: "", HostPort: "54321" }],
						},
					},
					NetworkSettings: {
						Ports: {
							"54321/tcp": [{ HostIp: "0.0.0.0", HostPort: "54321" }],
						},
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "connect") {
						handler();
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const report = await diagnosePortBindingFailure(
				"test-container",
				[54321],
			);

			expect(report.isHealthy).toBe(true);
			expect(report.failedPorts.length).toBe(0);
		});
	});

	describe("getRecoveryInstructions", () => {
		it("should provide correct recovery steps for vpnkit proxy failure", () => {
			const failedPorts: PortBindingInfo[] = [
				{
					port: 54321,
					containerName: "test",
					isBound: true,
					isConnectable: false,
					error:
						"Port configured but not connectable (port binding proxy failure)",
				},
			];

			const steps = getRecoveryInstructions(failedPorts);

			expect(steps.length).toBeGreaterThan(0);
			expect(steps.some((s) => s.includes("wsl --shutdown"))).toBe(true);
			expect(steps.some((s) => s.includes("Docker Desktop"))).toBe(true);
		});

		it("should provide correct recovery steps for unbound ports", () => {
			const failedPorts: PortBindingInfo[] = [
				{
					port: 54321,
					containerName: "test",
					isBound: false,
					isConnectable: false,
					error: "Port not bound to host",
				},
			];

			const steps = getRecoveryInstructions(failedPorts);

			expect(steps.some((s) => s.includes("docker logs"))).toBe(true);
		});

		it("should return no steps when all ports are bound", () => {
			const steps = getRecoveryInstructions([]);

			expect(steps).toEqual(["No recovery needed - ports are bound correctly"]);
		});
	});

	describe("formatDiagnosticMessage", () => {
		it("should format a comprehensive diagnostic message", () => {
			const report: DiagnosticReport = {
				timestamp: new Date("2025-11-21T00:00:00Z"),
				ports: [
					{
						port: 54321,
						containerName: "test",
						isBound: true,
						isConnectable: false,
						error: "Port configured but not connectable",
					},
				],
				failedPorts: [
					{
						port: 54321,
						containerName: "test",
						isBound: true,
						isConnectable: false,
						error: "Port configured but not connectable",
					},
				],
				isHealthy: false,
				diagnosticData: {
					hostConfigPortBindings: { "54321/tcp": {} },
					networkSettingsPorts: {},
					dockerInspectOutput: "{}",
				},
				recoverySteps: ["Step 1", "Step 2"],
			};

			const message = formatDiagnosticMessage(report);

			expect(message).toContain("Docker Port Binding Verification Failed");
			expect(message).toContain("Port 54321");
			expect(message).toContain("Recovery Instructions");
			expect(message).toContain("Step 1");
		});
	});

	describe("verifyPortBindings", () => {
		it("should return healthy report when ports are connectable", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {
							"54321/tcp": [{ HostIp: "", HostPort: "54321" }],
						},
					},
					NetworkSettings: {
						Ports: {
							"54321/tcp": [{ HostIp: "0.0.0.0", HostPort: "54321" }],
						},
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "connect") {
						handler();
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const report = await verifyPortBindings("test-container", [54321]);

			expect(report.isHealthy).toBe(true);
		});

		it("should retry on failure before throwing", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: { PortBindings: {} },
					NetworkSettings: { Ports: {} },
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			await expect(
				verifyPortBindings("test-container", [54321], {
					retries: 2,
					retryDelay: 10, // Short delay for tests
					throwOnFailure: true,
				}),
			).rejects.toThrow();
		});
	});

	describe("Edge cases", () => {
		it("should handle containers with no port bindings", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: { PortBindings: null },
					NetworkSettings: { Ports: null },
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const result = await inspectPortBindings("test-container");

			expect(result.hostConfigPortBindings).toEqual({});
			expect(result.networkSettingsPorts).toEqual({});
		});

		it("should handle custom port list", async () => {
			const mockInspect = JSON.stringify([
				{
					HostConfig: {
						PortBindings: {
							"9999/tcp": [{ HostIp: "", HostPort: "9999" }],
						},
					},
					NetworkSettings: {
						Ports: {
							"9999/tcp": [{ HostIp: "0.0.0.0", HostPort: "9999" }],
						},
					},
				},
			]);

			vi.mocked(execSync).mockReturnValue(mockInspect as any);

			const mockSocket = {
				destroy: vi.fn(),
				on: vi.fn((event, handler) => {
					if (event === "connect") {
						handler();
					}
					return mockSocket;
				}),
			};

			vi.mocked(createConnection).mockReturnValue(mockSocket as any);

			const report = await diagnosePortBindingFailure("test-container", [9999]);

			expect(report.ports[0]?.port).toBe(9999);
			expect(report.isHealthy).toBe(true);
		});
	});
});
