/**
 * Unit tests for AdminGuard component
 * Tests the admin authorization wrapper functionality
 */

import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { notFound } from "next/navigation";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminGuard } from "./admin-guard";

// Mock dependencies
vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	notFound: vi.fn(),
}));

vi.mock("../lib/server/utils/is-super-admin", () => ({
	isSuperAdmin: vi.fn(),
}));

// Import after mocking to get the mocked version
import { isSuperAdmin } from "../lib/server/utils/is-super-admin";

describe("AdminGuard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authorization Check", () => {
		it("should render the wrapped component when user is super admin", async () => {
			// Arrange
			const mockClient = { mock: "client" };
			vi.mocked(getSupabaseServerClient).mockReturnValue(mockClient as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = ({ message }: { message: string }) => (
				<div>{message}</div>
			);
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const result = await WrappedComponent({ message: "Admin content" });

			// Assert
			expect(result).toEqual(<TestComponent message="Admin content" />);
			expect(getSupabaseServerClient).toHaveBeenCalledTimes(1);
			expect(isSuperAdmin).toHaveBeenCalledWith(mockClient);
			expect(notFound).not.toHaveBeenCalled();
		});

		it("should call notFound when user is not super admin", async () => {
			// Arrange
			const mockClient = { mock: "client" };
			vi.mocked(getSupabaseServerClient).mockReturnValue(mockClient as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(false);

			const TestComponent = ({ message }: { message: string }) => (
				<div>{message}</div>
			);
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			await WrappedComponent({ message: "Admin content" });

			// Assert
			expect(getSupabaseServerClient).toHaveBeenCalledTimes(1);
			expect(isSuperAdmin).toHaveBeenCalledWith(mockClient);
			expect(notFound).toHaveBeenCalledTimes(1);
		});

		it("should handle isSuperAdmin throwing an error", async () => {
			// Arrange
			const mockClient = { mock: "client" };
			vi.mocked(getSupabaseServerClient).mockReturnValue(mockClient as any);
			vi.mocked(isSuperAdmin).mockRejectedValue(
				new Error("Database connection failed"),
			);

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act & Assert
			await expect(WrappedComponent({})).rejects.toThrow(
				"Database connection failed",
			);
			expect(notFound).not.toHaveBeenCalled();
		});
	});

	describe("Component Wrapping", () => {
		it("should pass all props to the wrapped component", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			interface TestProps {
				id: number;
				name: string;
				data: { value: string };
			}

			const TestComponent = ({ id, name, data }: TestProps) => (
				<div>
					{id}-{name}-{data.value}
				</div>
			);
			const WrappedComponent = AdminGuard(TestComponent);

			const props: TestProps = {
				id: 123,
				name: "Test",
				data: { value: "test-value" },
			};

			// Act
			const result = await WrappedComponent(props);

			// Assert
			expect(result).toEqual(<TestComponent {...props} />);
		});

		it("should work with components that have no props", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = () => <div>No props component</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const result = await WrappedComponent({});

			// Assert
			expect(result).toEqual(<TestComponent />);
		});

		it("should work with complex component types", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			// Complex component with children
			const TestComponent = ({
				children,
				className,
			}: {
				children?: React.ReactNode;
				className?: string;
			}) => <div className={className}>{children}</div>;

			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const result = await WrappedComponent({
				children: <span>Child content</span>,
				className: "admin-container",
			});

			// Assert
			expect(result).toEqual(
				<TestComponent className="admin-container">
					<span>Child content</span>
				</TestComponent>,
			);
		});

		it("should preserve component display name", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = () => <div>Test</div>;
			TestComponent.displayName = "TestComponent";

			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			await WrappedComponent({});

			// Assert
			// The wrapper function should be named AdminGuardServerComponentWrapper
			expect(WrappedComponent.name).toBe("AdminGuardServerComponentWrapper");
		});
	});

	describe("Edge Cases", () => {
		it("should handle null Supabase client gracefully", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue(null as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(false);

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			await WrappedComponent({});

			// Assert
			expect(isSuperAdmin).toHaveBeenCalledWith(null);
			expect(notFound).toHaveBeenCalled();
		});

		it("should handle undefined Supabase client", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue(undefined as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(false);

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			await WrappedComponent({});

			// Assert
			expect(isSuperAdmin).toHaveBeenCalledWith(undefined);
			expect(notFound).toHaveBeenCalled();
		});

		it("should handle getSupabaseServerClient throwing an error", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockImplementation(() => {
				throw new Error("Failed to get client");
			});

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act & Assert
			await expect(WrappedComponent({})).rejects.toThrow(
				"Failed to get client",
			);
			expect(isSuperAdmin).not.toHaveBeenCalled();
			expect(notFound).not.toHaveBeenCalled();
		});

		it("should handle notFound throwing an error", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(false);
			vi.mocked(notFound).mockImplementation(() => {
				throw new Error("Navigation error");
			});

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act & Assert
			await expect(WrappedComponent({})).rejects.toThrow("Navigation error");
		});
	});

	describe("Component Types", () => {
		it("should work with function components", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			function TestComponent({ value }: { value: string }) {
				return <div>{value}</div>;
			}

			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const result = await WrappedComponent({ value: "test" });

			// Assert
			expect(result).toEqual(<TestComponent value="test" />);
		});

		it("should work with arrow function components", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = ({ value }: { value: string }) => (
				<div>{value}</div>
			);

			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const result = await WrappedComponent({ value: "test" });

			// Assert
			expect(result).toEqual(<TestComponent value="test" />);
		});

		it("should work with async components", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = async ({ value }: { value: string }) => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return <div>{value}</div>;
			};

			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const result = await WrappedComponent({ value: "async-test" });

			// Assert
			expect(result).toEqual(<TestComponent value="async-test" />);
		});
	});

	describe("Security Scenarios", () => {
		it("should check authorization on every render", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			await WrappedComponent({});
			await WrappedComponent({});
			await WrappedComponent({});

			// Assert
			expect(getSupabaseServerClient).toHaveBeenCalledTimes(3);
			expect(isSuperAdmin).toHaveBeenCalledTimes(3);
		});

		it("should not cache authorization results", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			// Reset notFound mock to not throw
			vi.mocked(notFound).mockImplementation((() => {
				// notFound doesn't return a value
			}) as any);

			// First call - user is admin
			vi.mocked(isSuperAdmin).mockResolvedValueOnce(true);
			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act & Assert - First call succeeds
			const result1 = await WrappedComponent({});
			expect(result1).toEqual(<TestComponent />);

			// Second call - user is not admin (should call notFound)
			vi.mocked(isSuperAdmin).mockResolvedValueOnce(false);
			await WrappedComponent({});
			expect(notFound).toHaveBeenCalledTimes(1);

			// Third call - user is admin again
			vi.mocked(isSuperAdmin).mockResolvedValueOnce(true);
			const result3 = await WrappedComponent({});
			expect(result3).toEqual(<TestComponent />);

			// Verify each call checked authorization independently
			expect(isSuperAdmin).toHaveBeenCalledTimes(3);
		});

		it("should handle rapid successive calls", async () => {
			// Arrange
			vi.mocked(getSupabaseServerClient).mockReturnValue({} as any);
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			const TestComponent = () => <div>Admin content</div>;
			const WrappedComponent = AdminGuard(TestComponent);

			// Act
			const promises = Array(10)
				.fill(null)
				.map(() => WrappedComponent({}));
			const results = await Promise.all(promises);

			// Assert
			expect(results).toHaveLength(10);
			expect(getSupabaseServerClient).toHaveBeenCalledTimes(10);
			expect(isSuperAdmin).toHaveBeenCalledTimes(10);
		});
	});
});
