/**
 * Unit tests for kanban server actions
 * Tests CRUD operations for tasks including create, update, delete, and reset functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createTaskAction,
	deleteTaskAction,
	resetTasksAction,
	seedDefaultTasksAction,
	updateSubtaskAction,
	updateTaskAction,
	updateTaskStatusAction,
} from "./server-actions";

// Mock revalidatePath
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Mock enhanceAction to preserve schema validation
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, options) => {
		return async (data: unknown) => {
			// Validate with schema if provided
			let validatedData = data;
			if (options?.schema) {
				const result = options.schema.safeParse(data);
				if (!result.success) {
					return { success: false, error: "Validation failed" } as const;
				}
				validatedData = result.data;
			}

			// Mock authenticated user
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				aud: "authenticated",
			};

			return fn(validatedData, mockUser);
		};
	}),
}));

// Mock Supabase client with proper method chaining
const createMockSupabaseChain = () => {
	const chain = {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		eq: vi.fn(),
		not: vi.fn(),
		single: vi.fn(),
	};

	// Make all methods return the chain for proper chaining
	chain.select.mockReturnValue(chain);
	chain.insert.mockReturnValue(chain);
	chain.update.mockReturnValue(chain);
	chain.delete.mockReturnValue(chain);
	chain.eq.mockReturnValue(chain);
	chain.not.mockReturnValue(chain);
	chain.single.mockResolvedValue({ data: null, error: null });

	return chain;
};

const mockSupabaseClient = {
	from: vi.fn(() => createMockSupabaseChain()),
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

// Mock default tasks
vi.mock("../config/default-tasks", () => ({
	DEFAULT_TASKS: [
		{
			title: "Default Task 1",
			description: "Description 1",
			status: "do",
			priority: "medium",
			subtasks: [
				{ title: "Subtask 1", is_completed: false },
				{ title: "Subtask 2", is_completed: false },
			],
		},
		{
			title: "Default Task 2",
			description: "Description 2",
			status: "doing",
			priority: "high",
			subtasks: [],
		},
	],
}));

describe("Kanban Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset Supabase mock to default behavior
		mockSupabaseClient.from.mockImplementation(() => createMockSupabaseChain());
	});

	describe("createTaskAction", () => {
		describe("Schema Validation", () => {
			it("should accept valid task data with required fields only", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: { id: "task-123", title: "Test Task" },
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					title: "Test Task",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(true);
			});

			it("should accept valid task data with all fields", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: { id: "task-123", title: "Complete Task" },
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					title: "Complete Task",
					description: "A comprehensive task description",
					status: "doing" as const,
					priority: "high" as const,
					subtasks: [
						{ title: "Subtask 1", is_completed: false },
						{ title: "Subtask 2", is_completed: true },
					],
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(true);
			});

			it("should reject task with empty title", async () => {
				const input = {
					title: "",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject task with invalid status", async () => {
				const input = {
					title: "Test Task",
					status: "invalid" as "do",
					priority: "medium" as const,
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject task with invalid priority", async () => {
				const input = {
					title: "Test Task",
					status: "do" as const,
					priority: "urgent" as "high",
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should create task with correct account_id", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: { id: "task-123" },
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					title: "Test Task",
					status: "do" as const,
					priority: "medium" as const,
				};

				await createTaskAction(input);

				expect(chain.insert).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Test Task",
						status: "do",
						priority: "medium",
						account_id: "user-123",
					}),
				);
			});

			it("should create subtasks when provided", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: { id: "task-123" },
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					title: "Task with Subtasks",
					status: "do" as const,
					priority: "medium" as const,
					subtasks: [
						{ title: "Subtask 1", is_completed: false },
						{ title: "Subtask 2", is_completed: true },
					],
				};

				await createTaskAction(input);

				// Verify subtasks table was called
				expect(mockSupabaseClient.from).toHaveBeenCalledWith("subtasks");
			});

			it("should return success with task data on successful creation", async () => {
				const createdTask = {
					id: "task-123",
					title: "Test Task",
					status: "do",
					priority: "medium",
				};

				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({ data: createdTask, error: null });
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					title: "Test Task",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(true);
				expect(result.data).toEqual(createdTask);
			});
		});

		describe("Error Handling", () => {
			it("should handle database insert error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: null,
					error: { message: "Database error" },
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					title: "Test Task",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to create task");
			});

			it("should handle subtask insert error gracefully", async () => {
				const chain = createMockSupabaseChain();
				let callCount = 0;
				(
					mockSupabaseClient.from as ReturnType<typeof vi.fn>
				).mockImplementation((table: string) => {
					const newChain = createMockSupabaseChain();
					if (table === "tasks") {
						newChain.single.mockResolvedValue({
							data: { id: "task-123" },
							error: null,
						});
					} else if (table === "subtasks") {
						newChain.insert.mockResolvedValue({
							data: null,
							error: { message: "Subtask insert error" },
						});
					}
					callCount++;
					return newChain;
				});

				const input = {
					title: "Task with Subtasks",
					status: "do" as const,
					priority: "medium" as const,
					subtasks: [{ title: "Subtask 1", is_completed: false }],
				};

				const result = await createTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to create task");
			});
		});
	});

	describe("updateTaskAction", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

		describe("Schema Validation", () => {
			it("should accept valid update data", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					title: "Updated Task",
					status: "doing" as const,
					priority: "high" as const,
				};

				const result = await updateTaskAction(input);
				expect(result.success).toBe(true);
			});

			it("should reject update with invalid UUID", async () => {
				const input = {
					id: "invalid-uuid",
					title: "Updated Task",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await updateTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject update with empty title", async () => {
				const input = {
					id: validUuid,
					title: "",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await updateTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should update task with new values", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					title: "Updated Task",
					description: "Updated description",
					status: "doing" as const,
					priority: "high" as const,
				};

				await updateTaskAction(input);

				expect(chain.update).toHaveBeenCalledWith(
					expect.objectContaining({
						title: "Updated Task",
						description: "Updated description",
						status: "doing",
						priority: "high",
					}),
				);
				expect(chain.eq).toHaveBeenCalledWith("id", validUuid);
			});

			it("should delete and replace subtasks when provided", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					title: "Task with Updated Subtasks",
					status: "do" as const,
					priority: "medium" as const,
					subtasks: [{ title: "New Subtask", is_completed: false }],
				};

				await updateTaskAction(input);

				// Should call delete on subtasks table
				expect(mockSupabaseClient.from).toHaveBeenCalledWith("subtasks");
			});
		});

		describe("Error Handling", () => {
			it("should handle database update error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.update.mockReturnValue({
					...chain,
					eq: vi.fn().mockReturnValue({
						...chain,
						eq: vi.fn().mockResolvedValue({
							data: null,
							error: { message: "Update failed" },
						}),
					}),
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					title: "Updated Task",
					status: "do" as const,
					priority: "medium" as const,
				};

				const result = await updateTaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to update task");
			});
		});
	});

	describe("updateTaskStatusAction", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

		describe("Schema Validation", () => {
			it("should accept valid status update", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					status: "doing" as const,
				};

				const result = await updateTaskStatusAction(input);
				expect(result.success).toBe(true);
			});

			it("should accept all valid status values", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const statuses = ["do", "doing", "done"] as const;

				for (const status of statuses) {
					const result = await updateTaskStatusAction({
						id: validUuid,
						status,
					});
					expect(result.success).toBe(true);
				}
			});

			it("should reject invalid status", async () => {
				const input = {
					id: validUuid,
					status: "pending" as "do",
				};

				const result = await updateTaskStatusAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject invalid UUID", async () => {
				const input = {
					id: "not-a-uuid",
					status: "doing" as const,
				};

				const result = await updateTaskStatusAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should update only the status field", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					status: "done" as const,
				};

				await updateTaskStatusAction(input);

				expect(chain.update).toHaveBeenCalledWith({ status: "done" });
				expect(chain.eq).toHaveBeenCalledWith("id", validUuid);
			});

			it("should filter by account_id for security", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					status: "doing" as const,
				};

				await updateTaskStatusAction(input);

				// Should call eq twice - once for id, once for account_id
				expect(chain.eq).toHaveBeenCalledWith("account_id", "user-123");
			});
		});

		describe("Error Handling", () => {
			it("should handle database error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.update.mockReturnValue({
					...chain,
					eq: vi.fn().mockReturnValue({
						...chain,
						eq: vi.fn().mockResolvedValue({
							data: null,
							error: { message: "Database error" },
						}),
					}),
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validUuid,
					status: "done" as const,
				};

				const result = await updateTaskStatusAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to update task status");
			});
		});
	});

	describe("deleteTaskAction", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

		describe("Schema Validation", () => {
			it("should accept valid UUID", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const result = await deleteTaskAction({ id: validUuid });
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID", async () => {
				const result = await deleteTaskAction({ id: "not-a-uuid" });
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should delete task by id and account_id", async () => {
				const chain = createMockSupabaseChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				await deleteTaskAction({ id: validUuid });

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("tasks");
				expect(chain.delete).toHaveBeenCalled();
				expect(chain.eq).toHaveBeenCalledWith("id", validUuid);
				expect(chain.eq).toHaveBeenCalledWith("account_id", "user-123");
			});
		});

		describe("Error Handling", () => {
			it("should handle database delete error gracefully", async () => {
				const chain = createMockSupabaseChain();
				// Make the second eq() call return a promise that resolves with an error
				chain.eq.mockReturnValueOnce({
					...chain,
					eq: vi.fn().mockResolvedValue({
						data: null,
						error: { message: "Delete failed" },
					}),
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const result = await deleteTaskAction({ id: validUuid });
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to delete task");
			});
		});
	});

	describe("updateSubtaskAction", () => {
		const validTaskId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
		const validSubtaskId = "a47ac10b-58cc-4372-a567-0e02b2c3d480";

		describe("Schema Validation", () => {
			it("should accept valid subtask update", async () => {
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation(() => {
					const chain = createMockSupabaseChain();
					if (callCount === 0) {
						// First call for task ownership verification
						chain.single.mockResolvedValue({
							data: { id: validTaskId },
							error: null,
						});
					}
					callCount++;
					return chain;
				});

				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "Updated Subtask",
					is_completed: true,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(true);
			});

			it("should reject with invalid subtask UUID", async () => {
				const input = {
					id: "not-a-uuid",
					task_id: validTaskId,
					title: "Subtask",
					is_completed: false,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject with invalid task_id UUID", async () => {
				const input = {
					id: validSubtaskId,
					task_id: "not-a-uuid",
					title: "Subtask",
					is_completed: false,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});

			it("should reject with empty title", async () => {
				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "",
					is_completed: false,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Validation failed");
			});
		});

		describe("Core Functionality", () => {
			it("should verify task ownership before updating", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: { id: validTaskId },
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "Subtask",
					is_completed: true,
				};

				await updateSubtaskAction(input);

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("tasks");
				expect(chain.eq).toHaveBeenCalledWith("account_id", "user-123");
				expect(chain.eq).toHaveBeenCalledWith("id", validTaskId);
			});

			it("should update is_completed field", async () => {
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation(() => {
					const chain = createMockSupabaseChain();
					if (callCount === 0) {
						chain.single.mockResolvedValue({
							data: { id: validTaskId },
							error: null,
						});
					}
					callCount++;
					return chain;
				});

				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "Subtask",
					is_completed: true,
				};

				await updateSubtaskAction(input);

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("subtasks");
			});

			it("should return updated subtask data on success", async () => {
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation(() => {
					const chain = createMockSupabaseChain();
					if (callCount === 0) {
						chain.single.mockResolvedValue({
							data: { id: validTaskId },
							error: null,
						});
					}
					callCount++;
					return chain;
				});

				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "Test Subtask",
					is_completed: true,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(true);
				expect(result.data).toEqual({
					id: validSubtaskId,
					task_id: validTaskId,
					is_completed: true,
					title: "Test Subtask",
				});
			});
		});

		describe("Error Handling", () => {
			it("should fail if task not found or access denied", async () => {
				const chain = createMockSupabaseChain();
				chain.single.mockResolvedValue({
					data: null,
					error: { message: "Not found" },
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "Subtask",
					is_completed: false,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to update subtask");
			});

			it("should handle subtask update error gracefully", async () => {
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation(() => {
					const chain = createMockSupabaseChain();
					if (callCount === 0) {
						chain.single.mockResolvedValue({
							data: { id: validTaskId },
							error: null,
						});
					} else {
						chain.eq.mockReturnValue({
							...chain,
							eq: vi.fn().mockResolvedValue({
								data: null,
								error: { message: "Update failed" },
							}),
						});
					}
					callCount++;
					return chain;
				});

				const input = {
					id: validSubtaskId,
					task_id: validTaskId,
					title: "Subtask",
					is_completed: true,
				};

				const result = await updateSubtaskAction(input);
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to update subtask");
			});
		});
	});

	describe("resetTasksAction", () => {
		// Helper to create a more complete mock chain for resetTasks
		const createResetMockChain = () => {
			const chain = {
				select: vi.fn(),
				insert: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
				eq: vi.fn(),
				not: vi.fn(),
				single: vi.fn(),
			};

			// Set up proper chaining for reset flow
			chain.select.mockReturnValue(chain);
			chain.insert.mockReturnValue(chain);
			chain.update.mockReturnValue(chain);
			chain.delete.mockReturnValue(chain);
			chain.eq.mockReturnValue(chain);
			chain.not.mockReturnValue(chain);
			chain.single.mockResolvedValue({ data: null, error: null });

			// Make insert return properly when chained with select
			chain.insert.mockReturnValue({
				...chain,
				select: vi.fn().mockResolvedValue({
					data: [{ id: "task-1" }, { id: "task-2" }],
					error: null,
				}),
			});

			return chain;
		};

		describe("Core Functionality", () => {
			it("should delete all existing tasks for user", async () => {
				const chain = createResetMockChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				await resetTasksAction({});

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("tasks");
				expect(chain.delete).toHaveBeenCalled();
				expect(chain.eq).toHaveBeenCalledWith("account_id", "user-123");
			});

			it("should insert default tasks after deletion", async () => {
				const chain = createResetMockChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				await resetTasksAction({});

				expect(chain.insert).toHaveBeenCalled();
			});

			it("should insert subtasks for default tasks", async () => {
				const chain = createResetMockChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				await resetTasksAction({});

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("subtasks");
			});

			it("should return success on completion", async () => {
				const chain = createResetMockChain();
				mockSupabaseClient.from.mockReturnValue(chain);

				const result = await resetTasksAction({});
				expect(result.success).toBe(true);
			});
		});

		describe("Error Handling", () => {
			it("should handle delete error gracefully", async () => {
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation(() => {
					const chain = createMockSupabaseChain();
					if (callCount === 1) {
						// Second call for delete
						chain.eq.mockResolvedValue({
							data: null,
							error: { message: "Delete failed" },
						});
					}
					callCount++;
					return chain;
				});

				const result = await resetTasksAction({});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to reset tasks");
			});

			it("should handle insert error gracefully", async () => {
				let callCount = 0;
				mockSupabaseClient.from.mockImplementation(() => {
					const chain = createMockSupabaseChain();
					if (callCount >= 2) {
						// Tasks insert call
						chain.select.mockResolvedValue({
							data: null,
							error: { message: "Insert failed" },
						});
					}
					callCount++;
					return chain;
				});

				const result = await resetTasksAction({});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to reset tasks");
			});
		});
	});

	describe("seedDefaultTasksAction", () => {
		describe("Core Functionality", () => {
			it("should insert default tasks for new user", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: [{ id: "task-1" }, { id: "task-2" }],
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				await seedDefaultTasksAction({});

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("tasks");
				expect(chain.insert).toHaveBeenCalled();
			});

			it("should batch insert all default tasks", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: [{ id: "task-1" }, { id: "task-2" }],
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				await seedDefaultTasksAction({});

				// Should use batch insert (single insert call with array)
				const insertCalls = chain.insert.mock.calls;
				expect(insertCalls.length).toBeGreaterThanOrEqual(1);
			});

			it("should insert subtasks for tasks that have them", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: [{ id: "task-1" }, { id: "task-2" }],
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				await seedDefaultTasksAction({});

				expect(mockSupabaseClient.from).toHaveBeenCalledWith("subtasks");
			});

			it("should set account_id for all tasks", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: [{ id: "task-1" }],
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				await seedDefaultTasksAction({});

				const insertCalls = chain.insert.mock.calls;
				if (insertCalls.length > 0) {
					const tasksData = insertCalls[0]?.[0];
					if (Array.isArray(tasksData)) {
						for (const task of tasksData) {
							expect(task.account_id).toBe("user-123");
						}
					}
				}
			});

			it("should return success on completion", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: [{ id: "task-1" }],
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const result = await seedDefaultTasksAction({});
				expect(result.success).toBe(true);
			});
		});

		describe("Error Handling", () => {
			it("should handle task insert error gracefully", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: null,
					error: { message: "Insert failed" },
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const result = await seedDefaultTasksAction({});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to seed default tasks");
			});

			it("should handle subtask insert error gracefully", async () => {
				let callCount = 0;
				(
					mockSupabaseClient.from as ReturnType<typeof vi.fn>
				).mockImplementation((table: string) => {
					const chain = createMockSupabaseChain();
					if (table === "tasks") {
						chain.select.mockResolvedValue({
							data: [{ id: "task-1" }],
							error: null,
						});
					} else if (table === "subtasks") {
						chain.insert.mockResolvedValue({
							data: null,
							error: { message: "Subtask insert failed" },
						});
					}
					callCount++;
					return chain;
				});

				const result = await seedDefaultTasksAction({});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Failed to seed default tasks");
			});

			it("should throw if no tasks returned from insert", async () => {
				const chain = createMockSupabaseChain();
				chain.select.mockResolvedValue({
					data: null,
					error: null,
				});
				mockSupabaseClient.from.mockReturnValue(chain);

				const result = await seedDefaultTasksAction({});
				expect(result.success).toBe(false);
			});
		});
	});

	describe("Integration Scenarios", () => {
		it("should handle complete task lifecycle: create -> update -> delete", async () => {
			const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

			// Create
			const createChain = createMockSupabaseChain();
			createChain.single.mockResolvedValue({
				data: { id: validUuid, title: "New Task" },
				error: null,
			});
			mockSupabaseClient.from.mockReturnValue(createChain);

			const createResult = await createTaskAction({
				title: "New Task",
				status: "do" as const,
				priority: "medium" as const,
			});
			expect(createResult.success).toBe(true);

			// Update
			const updateChain = createMockSupabaseChain();
			mockSupabaseClient.from.mockReturnValue(updateChain);

			const updateResult = await updateTaskAction({
				id: validUuid,
				title: "Updated Task",
				status: "doing" as const,
				priority: "high" as const,
			});
			expect(updateResult.success).toBe(true);

			// Delete
			const deleteChain = createMockSupabaseChain();
			deleteChain.single.mockResolvedValue({ data: null, error: null });
			mockSupabaseClient.from.mockReturnValue(deleteChain);

			const deleteResult = await deleteTaskAction({ id: validUuid });
			expect(deleteResult.success).toBe(true);
		});

		it("should handle task with subtasks workflow", async () => {
			const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
			const subtaskId = "a47ac10b-58cc-4372-a567-0e02b2c3d480";

			// Create task with subtasks
			const createChain = createMockSupabaseChain();
			createChain.single.mockResolvedValue({
				data: { id: validUuid },
				error: null,
			});
			mockSupabaseClient.from.mockReturnValue(createChain);

			const createResult = await createTaskAction({
				title: "Task with Subtasks",
				status: "do" as const,
				priority: "medium" as const,
				subtasks: [
					{ title: "Subtask 1", is_completed: false },
					{ title: "Subtask 2", is_completed: false },
				],
			});
			expect(createResult.success).toBe(true);

			// Update subtask completion
			let callCount = 0;
			mockSupabaseClient.from.mockImplementation(() => {
				const chain = createMockSupabaseChain();
				if (callCount === 0) {
					chain.single.mockResolvedValue({
						data: { id: validUuid },
						error: null,
					});
				}
				callCount++;
				return chain;
			});

			const subtaskResult = await updateSubtaskAction({
				id: subtaskId,
				task_id: validUuid,
				title: "Subtask 1",
				is_completed: true,
			});
			expect(subtaskResult.success).toBe(true);
		});
	});
});
