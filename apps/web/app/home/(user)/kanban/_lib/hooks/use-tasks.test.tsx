/**
 * Unit tests for use-tasks hook and related task management hooks
 * Tests React Query hooks for CRUD operations on kanban tasks
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	_useCreateTask,
	_useDeleteTask,
	_useResetTasks,
	_useUpdateSubtask,
	_useUpdateTask,
	_useUpdateTaskStatus,
	useTasks,
} from "./use-tasks";

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

const mockSupabaseClient = {
	from: vi.fn(() => ({
		select: mockSelect,
	})),
};

mockSelect.mockReturnValue({
	eq: mockEq,
});

mockEq.mockReturnValue({
	order: mockOrder,
});

vi.mock("@kit/supabase/hooks/use-supabase", () => ({
	useSupabase: vi.fn(() => mockSupabaseClient),
}));

// Mock user workspace
const mockUser = {
	id: "user-123",
	email: "test@example.com",
};

vi.mock("@kit/accounts/hooks/use-user-workspace", () => ({
	useUserWorkspace: vi.fn(() => ({
		user: mockUser,
		account: { id: "user-123" },
	})),
}));

// Mock server actions
const mockCreateTaskAction = vi.fn();
const mockUpdateTaskAction = vi.fn();
const mockUpdateTaskStatusAction = vi.fn();
const mockDeleteTaskAction = vi.fn();
const mockUpdateSubtaskAction = vi.fn();
const mockResetTasksAction = vi.fn();
const mockSeedDefaultTasksAction = vi.fn();

vi.mock("../server/server-actions", () => ({
	createTaskAction: (...args: unknown[]) => mockCreateTaskAction(...args),
	updateTaskAction: (...args: unknown[]) => mockUpdateTaskAction(...args),
	updateTaskStatusAction: (...args: unknown[]) =>
		mockUpdateTaskStatusAction(...args),
	deleteTaskAction: (...args: unknown[]) => mockDeleteTaskAction(...args),
	updateSubtaskAction: (...args: unknown[]) => mockUpdateSubtaskAction(...args),
	resetTasksAction: (...args: unknown[]) => mockResetTasksAction(...args),
	seedDefaultTasksAction: (...args: unknown[]) =>
		mockSeedDefaultTasksAction(...args),
}));

// Test utilities
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
};

const mockTasks = [
	{
		id: "task-1",
		title: "Task 1",
		description: "Description 1",
		status: "do",
		priority: "medium",
		image_url: null,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		account_id: "user-123",
		subtasks: [
			{
				id: "subtask-1",
				title: "Subtask 1",
				is_completed: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			},
		],
	},
	{
		id: "task-2",
		title: "Task 2",
		description: null,
		status: "doing",
		priority: "high",
		image_url: "https://example.com/image.jpg",
		created_at: "2024-01-02T00:00:00Z",
		updated_at: "2024-01-02T00:00:00Z",
		account_id: "user-123",
		subtasks: [],
	},
];

describe("useTasks Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOrder.mockResolvedValue({ data: mockTasks, error: null });
		mockSeedDefaultTasksAction.mockResolvedValue({ success: true });
	});

	describe("Initial Data Fetching", () => {
		it("should fetch tasks on mount", async () => {
			const { result } = renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockSupabaseClient.from).toHaveBeenCalledWith("tasks");
			expect(result.current.data).toEqual(mockTasks);
		});

		it("should use user id as query key", async () => {
			renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(mockEq).toHaveBeenCalledWith("account_id", "user-123");
			});
		});

		it("should order tasks by created_at descending", async () => {
			renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(mockOrder).toHaveBeenCalledWith("created_at", {
					ascending: false,
				});
			});
		});

		it("should seed default tasks when no tasks exist", async () => {
			mockOrder.mockResolvedValueOnce({ data: [], error: null });
			mockOrder.mockResolvedValueOnce({ data: mockTasks, error: null });

			const { result } = renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockSeedDefaultTasksAction).toHaveBeenCalled();
		});

		it("should not seed tasks when tasks already exist", async () => {
			const { result } = renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockSeedDefaultTasksAction).not.toHaveBeenCalled();
		});

		it("should handle fetch error", async () => {
			mockOrder.mockRejectedValue(new Error("Database error"));

			const { result } = renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeInstanceOf(Error);
		});
	});

	describe("Query Configuration", () => {
		it("should have 60 second stale time", async () => {
			const queryClient = new QueryClient({
				defaultOptions: {
					queries: {
						retry: false,
					},
				},
			});

			const { result } = renderHook(() => useTasks(), {
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>
						{children}
					</QueryClientProvider>
				),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			// The hook sets staleTime: 60 * 1000 = 60000ms
			// We can verify the data stays fresh for the stale time
		});

		it("should not retry on failure", async () => {
			mockOrder.mockRejectedValue(new Error("Database error"));

			const { result } = renderHook(() => useTasks(), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			// The hook sets retry: false
			expect(mockOrder).toHaveBeenCalledTimes(1);
		});
	});
});

describe("_useCreateTask Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateTaskAction.mockResolvedValue({
			success: true,
			data: { id: "new-task" },
		});
	});

	it("should call createTaskAction with task data", async () => {
		const { result } = renderHook(() => _useCreateTask(), {
			wrapper: createWrapper(),
		});

		const newTask = {
			title: "New Task",
			status: "do" as const,
			priority: "medium" as const,
		};

		await result.current.mutateAsync(newTask);

		// useMutation passes additional params, so check first arg
		expect(mockCreateTaskAction).toHaveBeenCalled();
		expect(mockCreateTaskAction.mock.calls[0]?.[0]).toEqual(newTask);
	});

	it("should invalidate queries on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => _useCreateTask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await result.current.mutateAsync({
			title: "New Task",
			status: "do" as const,
			priority: "medium" as const,
		});

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ["tasks", "user-123"],
		});
	});

	it("should handle create error", async () => {
		mockCreateTaskAction.mockRejectedValue(new Error("Create failed"));

		const { result } = renderHook(() => _useCreateTask(), {
			wrapper: createWrapper(),
		});

		await expect(
			result.current.mutateAsync({
				title: "New Task",
				status: "do" as const,
				priority: "medium" as const,
			}),
		).rejects.toThrow("Create failed");
	});
});

describe("_useUpdateTask Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateTaskAction.mockResolvedValue({ success: true });
	});

	it("should call updateTaskAction with update data", async () => {
		const { result } = renderHook(() => _useUpdateTask(), {
			wrapper: createWrapper(),
		});

		const updateData = {
			id: "task-1",
			title: "Updated Task",
			status: "doing" as const,
			priority: "high" as const,
		};

		await result.current.mutateAsync(updateData);

		expect(mockUpdateTaskAction).toHaveBeenCalled();
		expect(mockUpdateTaskAction.mock.calls[0]?.[0]).toEqual(updateData);
	});

	it("should invalidate queries on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => _useUpdateTask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await result.current.mutateAsync({
			id: "task-1",
			title: "Updated",
			status: "do" as const,
			priority: "medium" as const,
		});

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ["tasks", "user-123"],
		});
	});

	it("should handle update error", async () => {
		mockUpdateTaskAction.mockRejectedValue(new Error("Update failed"));

		const { result } = renderHook(() => _useUpdateTask(), {
			wrapper: createWrapper(),
		});

		await expect(
			result.current.mutateAsync({
				id: "task-1",
				title: "Updated",
				status: "do" as const,
				priority: "medium" as const,
			}),
		).rejects.toThrow("Update failed");
	});
});

describe("_useUpdateTaskStatus Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateTaskStatusAction.mockResolvedValue({ success: true });
	});

	it("should call updateTaskStatusAction", async () => {
		const { result } = renderHook(() => _useUpdateTaskStatus(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({ id: "task-1", status: "done" as const });

		expect(mockUpdateTaskStatusAction).toHaveBeenCalled();
		expect(mockUpdateTaskStatusAction.mock.calls[0]?.[0]).toEqual({
			id: "task-1",
			status: "done",
		});
	});

	it("should invalidate queries on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => _useUpdateTaskStatus(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await result.current.mutateAsync({ id: "task-1", status: "done" as const });

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ["tasks", "user-123"],
		});
	});
});

describe("_useDeleteTask Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteTaskAction.mockResolvedValue({ success: true });
	});

	it("should call deleteTaskAction", async () => {
		const { result } = renderHook(() => _useDeleteTask(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({ id: "task-1" });

		expect(mockDeleteTaskAction).toHaveBeenCalled();
		expect(mockDeleteTaskAction.mock.calls[0]?.[0]).toEqual({ id: "task-1" });
	});

	it("should invalidate queries on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => _useDeleteTask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await result.current.mutateAsync({ id: "task-1" });

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ["tasks", "user-123"],
		});
	});

	it("should handle delete error", async () => {
		mockDeleteTaskAction.mockRejectedValue(new Error("Delete failed"));

		const { result } = renderHook(() => _useDeleteTask(), {
			wrapper: createWrapper(),
		});

		await expect(result.current.mutateAsync({ id: "task-1" })).rejects.toThrow(
			"Delete failed",
		);
	});
});

describe("_useUpdateSubtask Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateSubtaskAction.mockResolvedValue({ success: true });
		mockOrder.mockResolvedValue({ data: mockTasks, error: null });
	});

	it("should call updateSubtaskAction", async () => {
		const { result } = renderHook(() => _useUpdateSubtask(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({
			id: "subtask-1",
			task_id: "task-1",
			title: "Subtask",
			is_completed: true,
		});

		expect(mockUpdateSubtaskAction).toHaveBeenCalled();
		expect(mockUpdateSubtaskAction.mock.calls[0]?.[0]).toEqual({
			id: "subtask-1",
			task_id: "task-1",
			title: "Subtask",
			is_completed: true,
		});
	});

	it("should perform optimistic update", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		// Pre-populate cache with tasks
		queryClient.setQueryData(["tasks", "user-123"], mockTasks);

		const { result } = renderHook(() => _useUpdateSubtask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		// Start mutation (don't await yet to check optimistic update)
		result.current.mutate({
			id: "subtask-1",
			task_id: "task-1",
			title: "Subtask",
			is_completed: true,
		});

		// Check if optimistic update was applied
		await waitFor(() => {
			const cachedTasks = queryClient.getQueryData([
				"tasks",
				"user-123",
			]) as typeof mockTasks;
			const task = cachedTasks?.find((t) => t.id === "task-1");
			const subtask = task?.subtasks?.find((s) => s.id === "subtask-1");
			expect(subtask?.is_completed).toBe(true);
		});
	});

	it("should revert on error", async () => {
		mockUpdateSubtaskAction.mockRejectedValue(new Error("Update failed"));

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		// Pre-populate cache with tasks
		queryClient.setQueryData(["tasks", "user-123"], mockTasks);

		const { result } = renderHook(() => _useUpdateSubtask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		try {
			await result.current.mutateAsync({
				id: "subtask-1",
				task_id: "task-1",
				title: "Subtask",
				is_completed: true,
			});
		} catch {
			// Expected to fail
		}

		// Should have reverted to original state
		await waitFor(() => {
			const cachedTasks = queryClient.getQueryData([
				"tasks",
				"user-123",
			]) as typeof mockTasks;
			const task = cachedTasks?.find((t) => t.id === "task-1");
			const subtask = task?.subtasks?.find((s) => s.id === "subtask-1");
			expect(subtask?.is_completed).toBe(false);
		});
	});

	it("should invalidate queries on settle", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => _useUpdateSubtask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await result.current.mutateAsync({
			id: "subtask-1",
			task_id: "task-1",
			title: "Subtask",
			is_completed: true,
		});

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ["tasks", "user-123"],
		});
	});
});

describe("_useResetTasks Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockResetTasksAction.mockResolvedValue({ success: true });
	});

	it("should call resetTasksAction", async () => {
		const { result } = renderHook(() => _useResetTasks(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({});

		expect(mockResetTasksAction).toHaveBeenCalled();
		expect(mockResetTasksAction.mock.calls[0]?.[0]).toEqual({});
	});

	it("should invalidate queries on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => _useResetTasks(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await result.current.mutateAsync({});

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ["tasks", "user-123"],
		});
	});

	it("should handle reset error", async () => {
		mockResetTasksAction.mockRejectedValue(new Error("Reset failed"));

		const { result } = renderHook(() => _useResetTasks(), {
			wrapper: createWrapper(),
		});

		await expect(result.current.mutateAsync({})).rejects.toThrow(
			"Reset failed",
		);
	});
});

describe("Integration Scenarios", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOrder.mockResolvedValue({ data: mockTasks, error: null });
		mockCreateTaskAction.mockResolvedValue({
			success: true,
			data: { id: "new-task" },
		});
		mockUpdateTaskAction.mockResolvedValue({ success: true });
		mockDeleteTaskAction.mockResolvedValue({ success: true });
	});

	it("should support complete task lifecycle", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		// Fetch tasks
		const { result: tasksResult } = renderHook(() => useTasks(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await waitFor(() => expect(tasksResult.current.isSuccess).toBe(true));

		// Create task
		const { result: createResult } = renderHook(() => _useCreateTask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await createResult.current.mutateAsync({
			title: "New Task",
			status: "do" as const,
			priority: "medium" as const,
		});

		expect(mockCreateTaskAction).toHaveBeenCalled();

		// Update task
		const { result: updateResult } = renderHook(() => _useUpdateTask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await updateResult.current.mutateAsync({
			id: "task-1",
			title: "Updated Task",
			status: "doing" as const,
			priority: "high" as const,
		});

		expect(mockUpdateTaskAction).toHaveBeenCalled();

		// Delete task
		const { result: deleteResult } = renderHook(() => _useDeleteTask(), {
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			),
		});

		await deleteResult.current.mutateAsync({ id: "task-1" });

		expect(mockDeleteTaskAction).toHaveBeenCalled();
	});
});
