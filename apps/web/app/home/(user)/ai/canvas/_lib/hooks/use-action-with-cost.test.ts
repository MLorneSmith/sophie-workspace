/**
 * Unit tests for useActionWithCost hook
 * Tests action wrapping, session ID injection, and cost tracking integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { useActionWithCost } from "./use-action-with-cost";

// Mock the cost tracking context
vi.mock("../contexts/cost-tracking-context", () => ({
	useCostTracking: vi.fn(),
	CostTrackingProvider: ({ children }: { children: ReactNode }) =>
		React.createElement("div", {}, children),
}));

// Import the mocked hook after mocking
import { useCostTracking as mockUseCostTracking } from "../contexts/cost-tracking-context";

// Type definitions for test data
type TestRequestData = {
	message: string;
	userId?: string;
	sessionId?: string;
};

type TestResponseData = {
	success: boolean;
	data?: string;
	error?: string;
	metadata?: {
		cost?: number;
		tokens?: number;
		processingTime?: number;
		model?: string;
	};
};

// Type for the action function to match what the hook expects
type ActionFunction = (data: TestRequestData) => Promise<TestResponseData>;

// Helper function to create properly typed mock actions
const createMockAction = () => {
	return vi.fn() as ActionFunction & ReturnType<typeof vi.fn>;
};

describe("useActionWithCost", () => {
	const mockAddCost = vi.fn();
	const mockSessionId = "test-session-123";
	const mockUseCostTrackingFn = vi.mocked(mockUseCostTracking);

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mock for cost tracking context
		mockUseCostTrackingFn.mockReturnValue({
			sessionCost: 0,
			sessionId: mockSessionId,
			addCost: mockAddCost,
			isLoading: false,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Action Wrapping", () => {
		it("wraps action function correctly", () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
			});

			// Act
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Assert
			expect(result.current).toBeDefined();
			expect(typeof result.current).toBe("function");
		});

		it("preserves action function type signature", () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
			});

			// Act
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Assert - TypeScript should ensure this compiles correctly
			expect(typeof result.current).toBe("function");
		});

		it("returns stable reference when dependencies unchanged", () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({ success: true });

			// Act
			const { result, rerender } = renderHook(() =>
				useActionWithCost(mockAction),
			);
			const firstReference = result.current;

			rerender();
			const secondReference = result.current;

			// Assert - should be the same reference due to useCallback
			expect(firstReference).toBe(secondReference);
		});

		it("creates new reference when action changes", () => {
			// Arrange
			const mockAction1 = createMockAction();
			mockAction1.mockResolvedValue({ success: true });
			const mockAction2 = createMockAction();
			mockAction2.mockResolvedValue({ success: true });

			// Act
			const { result, rerender } = renderHook(
				({ action }) => useActionWithCost(action),
				{ initialProps: { action: mockAction1 } },
			);
			const firstReference = result.current;

			rerender({ action: mockAction2 });
			const secondReference = result.current;

			// Assert - should be different references
			expect(firstReference).not.toBe(secondReference);
		});

		it("creates new reference when addCost changes", () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({ success: true });
			const newMockAddCost = vi.fn();

			// Act
			const { result, rerender } = renderHook(() =>
				useActionWithCost(mockAction),
			);
			const firstReference = result.current;

			// Change the addCost function
			mockUseCostTrackingFn.mockReturnValue({
				sessionCost: 0,
				sessionId: mockSessionId,
				addCost: newMockAddCost,
				isLoading: false,
			});

			rerender();
			const secondReference = result.current;

			// Assert - should be different references
			expect(firstReference).not.toBe(secondReference);
		});

		it("creates new reference when sessionId changes", () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({ success: true });

			// Act
			const { result, rerender } = renderHook(() =>
				useActionWithCost(mockAction),
			);
			const firstReference = result.current;

			// Change the session ID
			mockUseCostTrackingFn.mockReturnValue({
				sessionCost: 0,
				sessionId: "new-session-456",
				addCost: mockAddCost,
				isLoading: false,
			});

			rerender();
			const secondReference = result.current;

			// Assert - should be different references
			expect(firstReference).not.toBe(secondReference);
		});
	});

	describe("Session ID Injection", () => {
		it("adds sessionId to request data", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
			});

			const requestData: TestRequestData = {
				message: "test message",
				userId: "user-123",
			};

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAction).toHaveBeenCalledWith({
				...requestData,
				sessionId: mockSessionId,
			});
		});

		it("overwrites existing sessionId in request data", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
			});

			const requestData: TestRequestData = {
				message: "test message",
				sessionId: "old-session-id",
			};

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAction).toHaveBeenCalledWith({
				...requestData,
				sessionId: mockSessionId, // Should override the old one
			});
		});

		it("handles empty request data", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
			});

			const requestData = {} as TestRequestData;

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAction).toHaveBeenCalledWith({
				sessionId: mockSessionId,
			});
		});

		it("preserves all original data properties", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
			});

			const requestData = {
				message: "test message",
				userId: "user-123",
				metadata: { timestamp: Date.now() },
				settings: { enableNotifications: true },
			};

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAction).toHaveBeenCalledWith({
				...requestData,
				sessionId: mockSessionId,
			});
		});

		it("uses current sessionId from context", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({ success: true });
			const requestData: TestRequestData = { message: "test" };

			// Start with first session ID
			const { result, rerender } = renderHook(() =>
				useActionWithCost(mockAction),
			);

			await act(async () => {
				await result.current(requestData);
			});

			expect(mockAction).toHaveBeenLastCalledWith({
				...requestData,
				sessionId: mockSessionId,
			});

			// Change session ID
			const newSessionId = "new-session-456";
			mockUseCostTrackingFn.mockReturnValue({
				sessionCost: 0,
				sessionId: newSessionId,
				addCost: mockAddCost,
				isLoading: false,
			});

			rerender();

			// Act with new session ID
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAction).toHaveBeenLastCalledWith({
				...requestData,
				sessionId: newSessionId,
			});
		});
	});

	describe("Cost Tracking Integration", () => {
		it("calls addCost when action succeeds with cost metadata", async () => {
			// Arrange
			const costValue = 1.25;
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { cost: costValue },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).toHaveBeenCalledWith(costValue);
			expect(mockAddCost).toHaveBeenCalledTimes(1);
		});

		it("does not call addCost when action fails", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: false,
				metadata: { cost: 1.25 },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("does not call addCost when action succeeds but no cost metadata", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("does not call addCost when metadata exists but no cost property", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { tokens: 150 }, // Has metadata but no cost
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("handles zero cost correctly", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { cost: 0 },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert - zero cost should not trigger addCost (falsy check)
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("handles decimal cost values correctly", async () => {
			// Arrange
			const costValue = 2.75;
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { cost: costValue },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).toHaveBeenCalledWith(costValue);
		});

		it("handles very small cost values correctly", async () => {
			// Arrange
			const costValue = 0.001;
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { cost: costValue },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).toHaveBeenCalledWith(costValue);
		});

		it("handles large cost values correctly", async () => {
			// Arrange
			const costValue = 99.99;
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { cost: costValue },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAddCost).toHaveBeenCalledWith(costValue);
		});
	});

	describe("Error Handling", () => {
		it("preserves action errors without modification", async () => {
			// Arrange
			const errorMessage = "Network error";
			const mockAction = createMockAction();
			mockAction.mockRejectedValue(new Error(errorMessage));

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act & Assert
			await expect(async () => {
				await act(async () => {
					await result.current(requestData);
				});
			}).rejects.toThrow(errorMessage);

			// Ensure addCost is not called on error
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("does not call addCost when action throws error", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockRejectedValue(new Error("Test error"));

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			try {
				await act(async () => {
					await result.current(requestData);
				});
			} catch {
				// Expected to throw
			}

			// Assert
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("preserves action behavior for non-conforming response", async () => {
			// Arrange - action that doesn't return success boolean
			const mockAction = vi.fn();
			mockAction.mockResolvedValue({
				data: "response without success flag",
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const response = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(response).toEqual({ data: "response without success flag" });
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("handles addCost function errors gracefully", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				metadata: { cost: 1.25 },
			});

			// Mock addCost to throw an error
			mockAddCost.mockImplementation(() => {
				throw new Error("Cost tracking error");
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act & Assert - should not throw despite addCost error
			await expect(async () => {
				await act(async () => {
					await result.current(requestData);
				});
			}).rejects.toThrow("Cost tracking error");
		});
	});

	describe("Response Preservation", () => {
		it("returns original action response unchanged", async () => {
			// Arrange
			const expectedResponse = {
				success: true,
				data: "test response",
				metadata: { cost: 1.25, tokens: 150 },
			};

			const mockAction = createMockAction();
			mockAction.mockResolvedValue(expectedResponse);

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const actualResponse = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(actualResponse).toEqual(expectedResponse);
		});

		it("returns original error response unchanged", async () => {
			// Arrange
			const expectedResponse = {
				success: false,
				error: "Validation failed",
				metadata: { cost: 0.5 },
			};

			const mockAction = createMockAction();
			mockAction.mockResolvedValue(expectedResponse);

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const actualResponse = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(actualResponse).toEqual(expectedResponse);
			expect(mockAddCost).not.toHaveBeenCalled(); // No cost tracking on failure
		});

		it("preserves complex response objects", async () => {
			// Arrange
			const expectedResponse = {
				success: true,
				data: {
					id: "123",
					items: ["item1", "item2"],
					nested: {
						property: "value",
						number: 42,
					},
				},
				metadata: {
					cost: 2.5,
					processingTime: 1500,
					model: "gpt-4",
				},
			};

			const mockAction = createMockAction();
			mockAction.mockResolvedValue(expectedResponse);

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const actualResponse = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(actualResponse).toEqual(expectedResponse);
			expect(mockAddCost).toHaveBeenCalledWith(2.5);
		});
	});

	describe("Integration Tests", () => {
		it("complete successful flow with cost tracking", async () => {
			// Arrange
			const costValue = 3.75;
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "AI generated content",
				metadata: { cost: costValue, tokens: 200 },
			});

			const requestData: TestRequestData = {
				message: "Generate content",
				userId: "user-123",
			};

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const response = await act(async () => {
				return await result.current(requestData);
			});

			// Assert complete flow
			expect(mockAction).toHaveBeenCalledWith({
				...requestData,
				sessionId: mockSessionId,
			});
			expect(response).toEqual({
				success: true,
				data: "AI generated content",
				metadata: { cost: costValue, tokens: 200 },
			});
			expect(mockAddCost).toHaveBeenCalledWith(costValue);
		});

		it("complete failure flow without cost tracking", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: false,
				error: "API rate limit exceeded",
				metadata: { cost: 1.0 }, // Cost present but should not be tracked
			});

			const requestData: TestRequestData = {
				message: "Generate content",
				userId: "user-123",
			};

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const response = await act(async () => {
				return await result.current(requestData);
			});

			// Assert complete flow
			expect(mockAction).toHaveBeenCalledWith({
				...requestData,
				sessionId: mockSessionId,
			});
			expect(response).toEqual({
				success: false,
				error: "API rate limit exceeded",
				metadata: { cost: 1.0 },
			});
			expect(mockAddCost).not.toHaveBeenCalled(); // No cost tracking on failure
		});

		it("handles multiple sequential calls correctly", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction
				.mockResolvedValueOnce({
					success: true,
					data: "first response",
					metadata: { cost: 1.0 },
				})
				.mockResolvedValueOnce({
					success: true,
					data: "second response",
					metadata: { cost: 2.0 },
				})
				.mockResolvedValueOnce({
					success: false,
					error: "third failed",
					metadata: { cost: 3.0 },
				});

			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act - First call
			await act(async () => {
				await result.current({ message: "first" });
			});

			// Act - Second call
			await act(async () => {
				await result.current({ message: "second" });
			});

			// Act - Third call (failure)
			await act(async () => {
				await result.current({ message: "third" });
			});

			// Assert
			expect(mockAction).toHaveBeenCalledTimes(3);
			expect(mockAddCost).toHaveBeenCalledTimes(2); // Only successful calls
			expect(mockAddCost).toHaveBeenNthCalledWith(1, 1.0);
			expect(mockAddCost).toHaveBeenNthCalledWith(2, 2.0);
		});
	});

	describe("Edge Cases", () => {
		it("handles null metadata gracefully", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: null,
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const response = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(response.metadata).toBe(null);
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("handles undefined metadata gracefully", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				// metadata is undefined
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const response = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(response.metadata).toBeUndefined();
			expect(mockAddCost).not.toHaveBeenCalled();
		});

		it("handles non-numeric cost values gracefully", async () => {
			// Arrange
			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				data: "test response",
				metadata: { cost: "invalid" as any },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			const response = await act(async () => {
				return await result.current(requestData);
			});

			// Assert
			expect(response.metadata?.cost).toBe("invalid");
			expect(mockAddCost).toHaveBeenCalledWith("invalid"); // Hook passes through any truthy cost value
		});

		it("handles empty session ID gracefully", async () => {
			// Arrange
			mockUseCostTrackingFn.mockReturnValue({
				sessionCost: 0,
				sessionId: "", // Empty session ID
				addCost: mockAddCost,
				isLoading: false,
			});

			const mockAction = createMockAction();
			mockAction.mockResolvedValue({
				success: true,
				metadata: { cost: 1.0 },
			});

			const requestData: TestRequestData = { message: "test" };
			const { result } = renderHook(() => useActionWithCost(mockAction));

			// Act
			await act(async () => {
				await result.current(requestData);
			});

			// Assert
			expect(mockAction).toHaveBeenCalledWith({
				...requestData,
				sessionId: "", // Should still inject empty string
			});
			expect(mockAddCost).toHaveBeenCalledWith(1.0);
		});

		it("handles missing useCostTracking context gracefully", () => {
			// Arrange
			mockUseCostTrackingFn.mockImplementation(() => {
				throw new Error(
					"useCostTracking must be used within a CostTrackingProvider",
				);
			});

			const mockAction = createMockAction();
			mockAction.mockResolvedValue({ success: true });

			// Act & Assert
			expect(() => {
				renderHook(() => useActionWithCost(mockAction));
			}).toThrow("useCostTracking must be used within a CostTrackingProvider");
		});
	});
});
