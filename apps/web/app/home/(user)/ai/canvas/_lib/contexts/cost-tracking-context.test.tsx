/**
 * Unit tests for CostTrackingContext provider and hook
 * Tests cost calculation, state management, and API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	render,
	screen,
	act,
	waitFor,
	renderHook,
} from "@testing-library/react";
import React, { type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { UseQueryResult } from "@tanstack/react-query";
import { CostTrackingProvider, useCostTracking } from "./cost-tracking-context";

// Mock dependencies - mock the entire context file's dependencies at the module level
vi.mock("uuid", () => ({
	v4: vi.fn(() => "mock-uuid-123"),
}));

vi.mock("@kit/supabase/hooks/use-user", () => ({
	useUser: vi.fn(),
}));

// Import after mocking
import { useUser } from "@kit/supabase/hooks/use-user";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component to consume the context
function TestComponent() {
	const { sessionCost, sessionId, addCost, isLoading } = useCostTracking();

	return (
		<div>
			<span data-testid="cost">{sessionCost}</span>
			<span data-testid="session-id">{sessionId}</span>
			<span data-testid="loading">{isLoading.toString()}</span>
			<button
				type="button"
				data-testid="add-cost-btn"
				onClick={() => addCost(5)}
			>
				Add Cost
			</button>
		</div>
	);
}

// Helper wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
	return <CostTrackingProvider>{children}</CostTrackingProvider>;
}

// Helper function to create a complete User mock
function createMockUser(overrides: Partial<User> = {}): User {
	return {
		id: "user-123",
		email: "test@example.com",
		aud: "authenticated",
		role: "authenticated",
		created_at: "2023-01-01T00:00:00.000Z",
		updated_at: "2023-01-01T00:00:00.000Z",
		app_metadata: {},
		user_metadata: {},
		identities: [],
		...overrides,
	} as User;
}

// Helper function to create a proper UseQueryResult mock
function createMockUseQueryResult<T>(
	data: T | null | undefined,
	overrides: Partial<UseQueryResult<T, Error>> = {},
): UseQueryResult<T, Error> {
	return {
		data,
		error: null,
		isError: false,
		isPending: false,
		isLoading: false,
		isSuccess: data !== null && data !== undefined,
		status: data !== null && data !== undefined ? "success" : "pending",
		dataUpdatedAt: Date.now(),
		errorUpdatedAt: 0,
		failureCount: 0,
		failureReason: null,
		fetchStatus: "idle",
		isInitialLoading: false,
		isLoadingError: false,
		isPaused: false,
		isPlaceholderData: false,
		isRefetchError: false,
		isRefetching: false,
		isStale: false,
		refetch: vi.fn(),
		...overrides,
	} as UseQueryResult<T, Error>;
}

describe("CostTrackingContext", () => {
	const mockUseUser = vi.mocked(useUser);

	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Provider Component", () => {
		it("initializes with default values when user is not loaded", () => {
			// Arrange
			mockUseUser.mockReturnValue(createMockUseQueryResult(null));

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("0");
			expect(screen.getByTestId("session-id")).toHaveTextContent("");
			expect(screen.getByTestId("loading")).toHaveTextContent("true");
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("generates session ID when user loads", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 0 }),
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			// Wait for effects to complete
			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(screen.getByTestId("session-id")).toHaveTextContent(
				"mock-uuid-123",
			);
		});

		it("fetches initial costs on user load", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 15.75 }),
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			// Wait for API call to complete
			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(mockFetch).toHaveBeenCalledWith("/api/ai-usage/session-cost");
			expect(screen.getByTestId("cost")).toHaveTextContent("15.75");
		});

		it("handles successful API response with zero cost", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 0 }),
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("0");
		});

		it("handles successful API response with existing cost", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 5.25 }),
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("5.25");
		});

		it("handles API response without cost property", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }), // No cost property
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert - should default to 0
			expect(screen.getByTestId("cost")).toHaveTextContent("0");
		});

		it("handles API failure response", async () => {
			// Arrange
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: false, error: "Database error" }),
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert - should remain at default
			expect(screen.getByTestId("cost")).toHaveTextContent("0");

			consoleSpy.mockRestore();
		});

		it("handles network error", async () => {
			// Arrange
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("0");
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch initial costs:",
				expect.any(Error),
			);

			consoleSpy.mockRestore();
		});

		it("handles malformed JSON response", async () => {
			// Arrange
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("0");
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch initial costs:",
				expect.any(Error),
			);

			consoleSpy.mockRestore();
		});

		it("re-initializes when user ID changes", async () => {
			// Arrange - Start with first user
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test1@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 10 }),
			});

			const { rerender } = render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			// Wait for initial load
			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(screen.getByTestId("cost")).toHaveTextContent("10");

			// Change to second user
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-456", email: "test2@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 20 }),
			});

			// Re-render with second user (this should trigger useEffect again)
			rerender(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("20");
			});

			// Assert new session created
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("addCost Function", () => {
		beforeEach(async () => {
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 10 }),
			});
		});

		it("increases session cost correctly", async () => {
			// Arrange
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("10");
			});

			// Act
			await act(async () => {
				screen.getByTestId("add-cost-btn").click();
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("15");
		});

		it("handles decimal values", async () => {
			// Arrange
			mockFetch.mockClear();
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 0 }),
			});

			function TestComponentDecimal() {
				const { sessionCost, addCost } = useCostTracking();

				return (
					<div>
						<span data-testid="cost">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-decimal-btn"
							onClick={() => addCost(2.75)}
						>
							Add Decimal
						</button>
					</div>
				);
			}

			render(
				<TestWrapper>
					<TestComponentDecimal />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("0");
			});

			// Act
			await act(async () => {
				screen.getByTestId("add-decimal-btn").click();
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("2.75");
		});

		it("handles multiple sequential additions", async () => {
			// Arrange
			function TestComponentMultiple() {
				const { sessionCost, addCost } = useCostTracking();

				return (
					<div>
						<span data-testid="cost">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-1-btn"
							onClick={() => addCost(1)}
						>
							Add 1
						</button>
						<button
							type="button"
							data-testid="add-2-btn"
							onClick={() => addCost(2)}
						>
							Add 2
						</button>
						<button
							type="button"
							data-testid="add-3-btn"
							onClick={() => addCost(3)}
						>
							Add 3
						</button>
					</div>
				);
			}

			render(
				<TestWrapper>
					<TestComponentMultiple />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("10");
			});

			// Act - sequential additions
			await act(async () => {
				screen.getByTestId("add-1-btn").click();
			});
			await act(async () => {
				screen.getByTestId("add-2-btn").click();
			});
			await act(async () => {
				screen.getByTestId("add-3-btn").click();
			});

			// Assert - 10 + 1 + 2 + 3 = 16
			expect(screen.getByTestId("cost")).toHaveTextContent("16");
		});

		it("handles zero values", async () => {
			// Arrange
			function TestComponentZero() {
				const { sessionCost, addCost } = useCostTracking();

				return (
					<div>
						<span data-testid="cost">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-zero-btn"
							onClick={() => addCost(0)}
						>
							Add Zero
						</button>
					</div>
				);
			}

			render(
				<TestWrapper>
					<TestComponentZero />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("10");
			});

			// Act
			await act(async () => {
				screen.getByTestId("add-zero-btn").click();
			});

			// Assert - should remain the same
			expect(screen.getByTestId("cost")).toHaveTextContent("10");
		});

		it("handles negative values (edge case)", async () => {
			// Arrange
			function TestComponentNegative() {
				const { sessionCost, addCost } = useCostTracking();

				return (
					<div>
						<span data-testid="cost">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-negative-btn"
							onClick={() => addCost(-3)}
						>
							Add Negative
						</button>
					</div>
				);
			}

			render(
				<TestWrapper>
					<TestComponentNegative />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("10");
			});

			// Act
			await act(async () => {
				screen.getByTestId("add-negative-btn").click();
			});

			// Assert - 10 + (-3) = 7
			expect(screen.getByTestId("cost")).toHaveTextContent("7");
		});
	});

	describe("useCostTracking Hook", () => {
		it("returns context values correctly", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 15 }),
			});

			// Act
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("15");
			expect(screen.getByTestId("session-id")).toHaveTextContent(
				"mock-uuid-123",
			);
			expect(screen.getByTestId("loading")).toHaveTextContent("false");
			expect(screen.getByTestId("add-cost-btn")).toBeInTheDocument();
		});

		it("throws error when used outside provider", () => {
			// Act & Assert - use renderHook which is better for testing hook errors
			expect(() => {
				renderHook(() => useCostTracking());
			}).toThrow("useCostTracking must be used within a CostTrackingProvider");
		});

		it("addCost function from hook updates context state", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 5 }),
			});

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("5");
			});

			// Act
			await act(async () => {
				screen.getByTestId("add-cost-btn").click();
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("10");
		});
	});

	describe("Integration Tests", () => {
		it("complete user flow from loading to cost tracking", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 0 }),
			});

			// Act - Initial render
			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			);

			// Assert initial loading state
			expect(screen.getByTestId("loading")).toHaveTextContent("true");
			expect(screen.getByTestId("cost")).toHaveTextContent("0");

			// Wait for API to complete
			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("false");
			});

			// Assert loaded state
			expect(screen.getByTestId("session-id")).toHaveTextContent(
				"mock-uuid-123",
			);
			expect(mockFetch).toHaveBeenCalledWith("/api/ai-usage/session-cost");

			// Act - Add cost
			await act(async () => {
				screen.getByTestId("add-cost-btn").click();
			});

			// Assert final state
			expect(screen.getByTestId("cost")).toHaveTextContent("5");
		});

		it("multiple components can share cost tracking state", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 10 }),
			});

			function ComponentA() {
				const { sessionCost, addCost } = useCostTracking();
				return (
					<div>
						<span data-testid="cost-a">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-a"
							onClick={() => addCost(2)}
						>
							Add from A
						</button>
					</div>
				);
			}

			function ComponentB() {
				const { sessionCost, addCost } = useCostTracking();
				return (
					<div>
						<span data-testid="cost-b">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-b"
							onClick={() => addCost(3)}
						>
							Add from B
						</button>
					</div>
				);
			}

			// Act
			render(
				<TestWrapper>
					<ComponentA />
					<ComponentB />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost-a")).toHaveTextContent("10");
				expect(screen.getByTestId("cost-b")).toHaveTextContent("10");
			});

			// Act - Add cost from Component A
			await act(async () => {
				screen.getByTestId("add-a").click();
			});

			// Assert both components see the update
			expect(screen.getByTestId("cost-a")).toHaveTextContent("12");
			expect(screen.getByTestId("cost-b")).toHaveTextContent("12");

			// Act - Add cost from Component B
			await act(async () => {
				screen.getByTestId("add-b").click();
			});

			// Assert both components see the update
			expect(screen.getByTestId("cost-a")).toHaveTextContent("15");
			expect(screen.getByTestId("cost-b")).toHaveTextContent("15");
		});
	});

	describe("Edge Cases", () => {
		it("handles very large cost values", async () => {
			// Arrange
			mockUseUser.mockReturnValue(
				createMockUseQueryResult(
					createMockUser({ id: "user-123", email: "test@example.com" }),
				),
			);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true, cost: 0 }),
			});

			function TestComponentLarge() {
				const { sessionCost, addCost } = useCostTracking();

				return (
					<div>
						<span data-testid="cost">{sessionCost}</span>
						<button
							type="button"
							data-testid="add-large-btn"
							onClick={() => addCost(999999.99)}
						>
							Add Large
						</button>
					</div>
				);
			}

			render(
				<TestWrapper>
					<TestComponentLarge />
				</TestWrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cost")).toHaveTextContent("0");
			});

			// Act
			await act(async () => {
				screen.getByTestId("add-large-btn").click();
			});

			// Assert
			expect(screen.getByTestId("cost")).toHaveTextContent("999999.99");
		});
	});
});
