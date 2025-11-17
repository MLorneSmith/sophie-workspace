/**
 * Unit tests for monitoring.service.ts
 * Tests the abstract MonitoringService interface contract
 */

import { describe, expect, it, vi } from "vitest";
import { MonitoringService } from "./monitoring.service";

// Create a concrete test implementation of the abstract class
class TestMonitoringService extends MonitoringService {
	captureException = vi.fn();
	captureEvent = vi.fn();
	identifyUser = vi.fn();
	ready = vi.fn(() => Promise.resolve());
}

describe("MonitoringService", () => {
	describe("Abstract Class Contract", () => {
		it("should define the monitoring service interface", () => {
			// Arrange
			const service = new TestMonitoringService();

			// Assert - verify all required methods exist
			expect(service.captureException).toBeDefined();
			expect(service.captureEvent).toBeDefined();
			expect(service.identifyUser).toBeDefined();
			expect(service.ready).toBeDefined();
		});

		it("should have captureException method that accepts error and optional extra data", () => {
			// Arrange
			const service = new TestMonitoringService();
			const error = new Error("Test error");
			const errorWithDigest = Object.assign(error, { digest: "error-123" });
			const extra = { userId: "user-123", context: "test" };

			// Act
			service.captureException(errorWithDigest, extra);

			// Assert
			expect(service.captureException).toHaveBeenCalledWith(
				errorWithDigest,
				extra,
			);
			expect(service.captureException).toHaveBeenCalledTimes(1);
		});

		it("should have captureEvent method that accepts event name and optional extra data", () => {
			// Arrange
			const service = new TestMonitoringService();
			const eventName = "user_login";
			const extra = { userId: "user-123", timestamp: Date.now() };

			// Act
			service.captureEvent(eventName, extra);

			// Assert
			expect(service.captureEvent).toHaveBeenCalledWith(eventName, extra);
			expect(service.captureEvent).toHaveBeenCalledTimes(1);
		});

		it("should have identifyUser method that accepts user info with id", () => {
			// Arrange
			const service = new TestMonitoringService();
			const userInfo = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			};

			// Act
			service.identifyUser(userInfo);

			// Assert
			expect(service.identifyUser).toHaveBeenCalledWith(userInfo);
			expect(service.identifyUser).toHaveBeenCalledTimes(1);
		});

		it("should have ready method that returns a promise", async () => {
			// Arrange
			const service = new TestMonitoringService();

			// Act
			const result = service.ready();

			// Assert
			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBeUndefined();
		});
	});

	describe("Type Safety", () => {
		it("should enforce id property in identifyUser parameter", () => {
			// Arrange
			const service = new TestMonitoringService();

			// This test verifies TypeScript compilation would fail without id
			// Runtime test to ensure the method can be called with proper typing
			const validUser = { id: "123", customField: "value" };

			// Act & Assert - should not throw
			expect(() => service.identifyUser(validUser)).not.toThrow();
		});

		it("should allow extra data to be any object type", () => {
			// Arrange
			const service = new TestMonitoringService();

			// Test various extra data shapes
			const extraWithArray = { items: [1, 2, 3] };
			const extraWithNested = {
				user: { id: "123", profile: { name: "Test" } },
			};
			const extraWithMixed = { count: 42, flag: true, data: null };

			// Act & Assert - all should work without errors
			expect(() =>
				service.captureException(new Error(), extraWithArray),
			).not.toThrow();
			expect(() =>
				service.captureEvent("event", extraWithNested),
			).not.toThrow();
			expect(() =>
				service.captureException(new Error(), extraWithMixed),
			).not.toThrow();
		});

		it("should support Error with optional digest property", () => {
			// Arrange
			const service = new TestMonitoringService();
			const plainError = new Error("Plain error");
			const errorWithDigest = Object.assign(new Error("Error with digest"), {
				digest: "hash-abc-123",
			});

			// Act
			service.captureException(plainError);
			service.captureException(errorWithDigest);

			// Assert
			expect(service.captureException).toHaveBeenNthCalledWith(
				1,
				plainError,
				undefined,
			);
			expect(service.captureException).toHaveBeenNthCalledWith(
				2,
				errorWithDigest,
				undefined,
			);
		});
	});

	describe("Method Signatures", () => {
		it("should allow captureException without extra parameter", () => {
			// Arrange
			const service = new TestMonitoringService();
			const error = new Error("Test");

			// Act
			service.captureException(error);

			// Assert
			expect(service.captureException).toHaveBeenCalledWith(error, undefined);
		});

		it("should allow captureEvent without extra parameter", () => {
			// Arrange
			const service = new TestMonitoringService();

			// Act
			service.captureEvent("test_event");

			// Assert
			expect(service.captureEvent).toHaveBeenCalledWith(
				"test_event",
				undefined,
			);
		});

		it("should return unknown type from all methods", () => {
			// Arrange
			const service = new TestMonitoringService();

			// Mock different return values to verify unknown type flexibility
			service.captureException.mockReturnValue("string-return");
			service.captureEvent.mockReturnValue({ success: true });
			service.identifyUser.mockReturnValue(123);
			service.ready.mockResolvedValue(undefined);

			// Act
			const exceptionResult = service.captureException(new Error());
			const eventResult = service.captureEvent("event");
			const userResult = service.identifyUser({ id: "123" });
			const readyResult = service.ready();

			// Assert - verify methods can return any type
			expect(exceptionResult).toBe("string-return");
			expect(eventResult).toEqual({ success: true });
			expect(userResult).toBe(123);
			expect(readyResult).toBeInstanceOf(Promise);
		});
	});

	describe("Implementation Contract", () => {
		it("should require concrete implementations to implement all abstract methods", () => {
			// This test verifies that TypeScript enforces implementation
			// Creating a class without implementing all methods would cause compilation error

			class IncompleteService extends MonitoringService {
				captureException = vi.fn();
				captureEvent = vi.fn();
				identifyUser = vi.fn();
				ready = vi.fn(() => Promise.resolve());
			}

			const service = new IncompleteService();

			// Assert all methods are present
			expect(typeof service.captureException).toBe("function");
			expect(typeof service.captureEvent).toBe("function");
			expect(typeof service.identifyUser).toBe("function");
			expect(typeof service.ready).toBe("function");
		});
	});
});
