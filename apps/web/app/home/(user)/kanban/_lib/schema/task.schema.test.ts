/**
 * Unit tests for task schema validation
 * Tests Zod schemas for task management system including validation rules and type safety
 */
import { describe, expect, it } from "vitest";
import {
	type CreateTaskInput,
	CreateTaskSchema,
	SubtaskSchema,
	TaskPriorityEnum,
	TaskStatusEnum,
	type UpdateTaskInput,
	UpdateTaskSchema,
	type UpdateTaskStatusInput,
	UpdateTaskStatusSchema,
} from "./task.schema";

describe("Task Schema Validation", () => {
	describe("TaskPriorityEnum", () => {
		it("should accept valid priority values", () => {
			expect(TaskPriorityEnum.parse("low")).toBe("low");
			expect(TaskPriorityEnum.parse("medium")).toBe("medium");
			expect(TaskPriorityEnum.parse("high")).toBe("high");
		});

		it("should reject invalid priority values", () => {
			expect(() => TaskPriorityEnum.parse("urgent")).toThrow();
			expect(() => TaskPriorityEnum.parse("critical")).toThrow();
			expect(() => TaskPriorityEnum.parse("")).toThrow();
			expect(() => TaskPriorityEnum.parse(null)).toThrow();
			expect(() => TaskPriorityEnum.parse(undefined)).toThrow();
			expect(() => TaskPriorityEnum.parse(123)).toThrow();
		});
	});

	describe("TaskStatusEnum", () => {
		it("should accept valid status values", () => {
			expect(TaskStatusEnum.parse("do")).toBe("do");
			expect(TaskStatusEnum.parse("doing")).toBe("doing");
			expect(TaskStatusEnum.parse("done")).toBe("done");
		});

		it("should reject invalid status values", () => {
			expect(() => TaskStatusEnum.parse("pending")).toThrow();
			expect(() => TaskStatusEnum.parse("complete")).toThrow();
			expect(() => TaskStatusEnum.parse("todo")).toThrow();
			expect(() => TaskStatusEnum.parse("")).toThrow();
			expect(() => TaskStatusEnum.parse(null)).toThrow();
			expect(() => TaskStatusEnum.parse(undefined)).toThrow();
		});
	});

	describe("SubtaskSchema", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
		const invalidUuid = "not-a-uuid";

		it("should validate subtask with all fields", () => {
			const subtask = {
				id: validUuid,
				title: "Test subtask",
				is_completed: false,
			};

			const result = SubtaskSchema.parse(subtask);
			expect(result).toEqual(subtask);
		});

		it("should validate subtask without optional ID", () => {
			const subtask = {
				title: "Test subtask without ID",
				is_completed: true,
			};

			const result = SubtaskSchema.parse(subtask);
			expect(result).toEqual(subtask);
			expect(result.id).toBeUndefined();
		});

		it("should reject subtask with invalid UUID", () => {
			const subtask = {
				id: invalidUuid,
				title: "Test subtask",
				is_completed: false,
			};

			expect(() => SubtaskSchema.parse(subtask)).toThrow();
		});

		it("should reject subtask with empty title", () => {
			const subtask = {
				title: "",
				is_completed: false,
			};

			expect(() => SubtaskSchema.parse(subtask)).toThrow("Title is required");
		});

		it("should reject subtask with missing title", () => {
			const subtask = {
				is_completed: false,
			};

			expect(() => SubtaskSchema.parse(subtask)).toThrow();
		});

		it("should apply default value for is_completed", () => {
			const subtask = {
				title: "Test subtask",
			};

			const result = SubtaskSchema.parse(subtask);
			expect(result.is_completed).toBe(false);
		});

		it("should handle boolean values for is_completed", () => {
			const subtaskTrue = {
				title: "Completed subtask",
				is_completed: true,
			};

			const subtaskFalse = {
				title: "Incomplete subtask",
				is_completed: false,
			};

			expect(SubtaskSchema.parse(subtaskTrue).is_completed).toBe(true);
			expect(SubtaskSchema.parse(subtaskFalse).is_completed).toBe(false);
		});
	});

	describe("CreateTaskSchema", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

		it("should validate task with required fields only", () => {
			const task = {
				title: "Test task",
			};

			const result = CreateTaskSchema.parse(task);
			expect(result.title).toBe("Test task");
			expect(result.status).toBe("do"); // default value
			expect(result.priority).toBe("medium"); // default value
		});

		it("should validate task with all fields", () => {
			const task = {
				title: "Complete task",
				description: "A comprehensive test task",
				status: "doing" as const,
				priority: "high" as const,
				subtasks: [
					{
						id: validUuid,
						title: "Subtask 1",
						is_completed: true,
					},
					{
						title: "Subtask 2",
						is_completed: false,
					},
				],
				image_url: "https://example.com/image.jpg",
			};

			const result = CreateTaskSchema.parse(task);
			expect(result).toEqual(task);
		});

		it("should reject task with empty title", () => {
			const task = {
				title: "",
				status: "do" as const,
				priority: "medium" as const,
			};

			expect(() => CreateTaskSchema.parse(task)).toThrow("Title is required");
		});

		it("should reject task with missing title", () => {
			const task = {
				status: "do" as const,
				priority: "medium" as const,
			};

			expect(() => CreateTaskSchema.parse(task)).toThrow();
		});

		it("should apply default values correctly", () => {
			const task = {
				title: "Minimal task",
			};

			const result = CreateTaskSchema.parse(task);
			expect(result.status).toBe("do");
			expect(result.priority).toBe("medium");
		});

		it("should validate optional description field", () => {
			const taskWithDescription = {
				title: "Task with description",
				description: "This is a detailed description",
			};

			const taskWithoutDescription = {
				title: "Task without description",
			};

			expect(() => CreateTaskSchema.parse(taskWithDescription)).not.toThrow();
			expect(() =>
				CreateTaskSchema.parse(taskWithoutDescription),
			).not.toThrow();
			expect(
				CreateTaskSchema.parse(taskWithoutDescription).description,
			).toBeUndefined();
		});
	});

	describe("File Validation", () => {
		const createMockFile = (size: number): File => {
			return {
				size,
				name: "test.jpg",
				type: "image/jpeg",
				lastModified: Date.now(),
			} as File;
		};

		it("should accept file under size limit", () => {
			const task = {
				title: "Task with image",
				image: createMockFile(500000), // 500KB
			};

			expect(() => CreateTaskSchema.parse(task)).not.toThrow();
		});

		it("should accept file at exact size limit", () => {
			const task = {
				title: "Task with max size image",
				image: createMockFile(1024 * 1024), // Exactly 1MB
			};

			expect(() => CreateTaskSchema.parse(task)).not.toThrow();
		});

		it("should reject file over size limit", () => {
			const task = {
				title: "Task with oversized image",
				image: createMockFile(1024 * 1024 + 1), // 1MB + 1 byte
			};

			expect(() => CreateTaskSchema.parse(task)).toThrow(
				"Image must be less than 1MB",
			);
		});

		it("should accept task without image", () => {
			const task = {
				title: "Task without image",
			};

			expect(() => CreateTaskSchema.parse(task)).not.toThrow();
		});

		it("should reject file significantly over limit", () => {
			const task = {
				title: "Task with huge image",
				image: createMockFile(5 * 1024 * 1024), // 5MB
			};

			expect(() => CreateTaskSchema.parse(task)).toThrow(
				"Image must be less than 1MB",
			);
		});
	});

	describe("URL Validation", () => {
		it("should accept valid full URLs", () => {
			const validUrls = [
				"https://example.com/image.jpg",
				"http://test.com/photo.png",
				"https://cdn.example.com/assets/image.webp",
			];

			for (const url of validUrls) {
				const task = {
					title: "Task with image URL",
					image_url: url,
				};
				expect(() => CreateTaskSchema.parse(task)).not.toThrow();
			}
		});

		it("should accept valid relative paths", () => {
			const validPaths = [
				"/images/test.jpg",
				"/assets/photos/image.png",
				"/static/placeholder.svg",
			];

			for (const path of validPaths) {
				const task = {
					title: "Task with image path",
					image_url: path,
				};
				expect(() => CreateTaskSchema.parse(task)).not.toThrow();
			}
		});

		it("should reject invalid URL formats", () => {
			const invalidUrls = [
				"invalid-url", // Not URL and doesn't start with /
				"not-a-url", // Not URL and doesn't start with /
				"relative-path", // Not URL and doesn't start with /
				"../relative", // Not URL and doesn't start with /
			];

			for (const url of invalidUrls) {
				const task = {
					title: "Task with invalid URL",
					image_url: url,
				};
				expect(() => CreateTaskSchema.parse(task)).toThrow();
			}
		});

		it("should accept FTP URLs as valid URLs", () => {
			// The z.string().url() validation accepts any valid URL format
			const validUrls = [
				"ftp://example.com",
				"file://localhost/path",
				"data:image/png;base64,iVBORw0K...",
			];

			for (const url of validUrls) {
				const task = {
					title: "Task with URL",
					image_url: url,
				};
				expect(() => CreateTaskSchema.parse(task)).not.toThrow();
			}
		});

		it("should accept null image_url", () => {
			const task = {
				title: "Task with null image URL",
				image_url: null,
			};

			expect(() => CreateTaskSchema.parse(task)).not.toThrow();
		});

		it("should reject empty string image_url", () => {
			const task = {
				title: "Task with empty image URL",
				image_url: "",
			};

			expect(() => CreateTaskSchema.parse(task)).toThrow();
		});
	});

	describe("UpdateTaskSchema", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
		const invalidUuid = "not-a-uuid";

		it("should validate update with valid UUID", () => {
			const updateData = {
				id: validUuid,
				title: "Updated task",
				description: "Updated description",
				status: "doing" as const,
				priority: "high" as const,
			};

			const result = UpdateTaskSchema.parse(updateData);
			expect(result).toEqual(updateData);
		});

		it("should reject update with invalid UUID", () => {
			const updateData = {
				id: invalidUuid,
				title: "Updated task",
			};

			expect(() => UpdateTaskSchema.parse(updateData)).toThrow();
		});

		it("should reject update missing ID field", () => {
			const updateData = {
				title: "Updated task",
				status: "doing" as const,
			};

			expect(() => UpdateTaskSchema.parse(updateData)).toThrow();
		});

		it("should inherit all CreateTaskSchema validations", () => {
			const updateData = {
				id: validUuid,
				title: "", // Invalid title
			};

			expect(() => UpdateTaskSchema.parse(updateData)).toThrow(
				"Title is required",
			);
		});
	});

	describe("UpdateTaskStatusSchema", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
		const invalidUuid = "not-a-uuid";

		it("should validate status update with valid data", () => {
			const statusUpdate = {
				id: validUuid,
				status: "doing" as const,
			};

			const result = UpdateTaskStatusSchema.parse(statusUpdate);
			expect(result).toEqual(statusUpdate);
		});

		it("should validate all status values", () => {
			const statuses: Array<"do" | "doing" | "done"> = ["do", "doing", "done"];

			for (const status of statuses) {
				const statusUpdate = {
					id: validUuid,
					status,
				};
				expect(() => UpdateTaskStatusSchema.parse(statusUpdate)).not.toThrow();
			}
		});

		it("should reject status update with invalid UUID", () => {
			const statusUpdate = {
				id: invalidUuid,
				status: "doing" as const,
			};

			expect(() => UpdateTaskStatusSchema.parse(statusUpdate)).toThrow();
		});

		it("should reject status update with invalid status", () => {
			const statusUpdate = {
				id: validUuid,
				status: "invalid" as "do" | "doing" | "done",
			};

			expect(() => UpdateTaskStatusSchema.parse(statusUpdate)).toThrow();
		});

		it("should require both id and status fields", () => {
			expect(() => UpdateTaskStatusSchema.parse({ id: validUuid })).toThrow();
			expect(() => UpdateTaskStatusSchema.parse({ status: "doing" })).toThrow();
			expect(() => UpdateTaskStatusSchema.parse({})).toThrow();
		});
	});

	describe("Complex Scenarios", () => {
		const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

		it("should validate task with subtasks array", () => {
			const task = {
				title: "Task with subtasks",
				subtasks: [
					{
						id: validUuid,
						title: "First subtask",
						is_completed: true,
					},
					{
						title: "Second subtask",
						is_completed: false,
					},
				],
			};

			const result = CreateTaskSchema.parse(task);
			expect(result.subtasks).toHaveLength(2);
			expect(result.subtasks?.[0].title).toBe("First subtask");
			expect(result.subtasks?.[1].is_completed).toBe(false);
		});

		it("should reject task with invalid subtasks", () => {
			const task = {
				title: "Task with invalid subtasks",
				subtasks: [
					{
						title: "", // Invalid: empty title
						is_completed: false,
					},
				],
			};

			expect(() => CreateTaskSchema.parse(task)).toThrow("Title is required");
		});

		it("should validate empty subtasks array", () => {
			const task = {
				title: "Task with empty subtasks",
				subtasks: [],
			};

			expect(() => CreateTaskSchema.parse(task)).not.toThrow();
			expect(CreateTaskSchema.parse(task).subtasks).toEqual([]);
		});
	});

	describe("Edge Cases", () => {
		it("should handle extremely long title", () => {
			const longTitle = "A".repeat(1000);
			const task = {
				title: longTitle,
			};

			// No max length specified, should pass
			expect(() => CreateTaskSchema.parse(task)).not.toThrow();
			expect(CreateTaskSchema.parse(task).title).toBe(longTitle);
		});

		it("should handle special characters in title", () => {
			const specialTitles = [
				"Task with émojis 🚀",
				"タスク with Unicode",
				'Task with "quotes" and symbols @#$%',
				"Task\nwith\nnewlines",
			];

			for (const title of specialTitles) {
				const task = { title };
				expect(() => CreateTaskSchema.parse(task)).not.toThrow();
				expect(CreateTaskSchema.parse(task).title).toBe(title);
			}
		});

		it("should handle boundary file size conditions", () => {
			const exactLimit = 1024 * 1024; // 1MB exactly
			const justUnder = exactLimit - 1;
			const justOver = exactLimit + 1;

			const taskAtLimit = {
				title: "Task at limit",
				image: { size: exactLimit } as File,
			};

			const taskUnderLimit = {
				title: "Task under limit",
				image: { size: justUnder } as File,
			};

			const taskOverLimit = {
				title: "Task over limit",
				image: { size: justOver } as File,
			};

			expect(() => CreateTaskSchema.parse(taskAtLimit)).not.toThrow();
			expect(() => CreateTaskSchema.parse(taskUnderLimit)).not.toThrow();
			expect(() => CreateTaskSchema.parse(taskOverLimit)).toThrow();
		});

		it("should handle null and undefined values appropriately", () => {
			const taskWithNulls = {
				title: "Task with nulls",
				description: undefined, // Optional field
				image_url: null, // Nullable field
				subtasks: undefined, // Optional array
			};

			expect(() => CreateTaskSchema.parse(taskWithNulls)).not.toThrow();
		});
	});

	describe("Type Safety", () => {
		it("should provide correct TypeScript types", () => {
			// This test ensures the types are correctly inferred
			const createTask: CreateTaskInput = {
				title: "Type test",
				status: "do",
				priority: "medium",
			};

			const updateTask: UpdateTaskInput = {
				id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
				title: "Updated type test",
			};

			const statusUpdate: UpdateTaskStatusInput = {
				id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
				status: "done",
			};

			// These should compile without errors
			expect(createTask.title).toBe("Type test");
			expect(updateTask.id).toBeDefined();
			expect(statusUpdate.status).toBe("done");
		});
	});
});
