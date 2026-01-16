"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { revalidatePath } from "next/cache";
import { pino } from "pino";
import { z } from "zod";

import { DEFAULT_TASKS } from "../config/default-tasks";
import {
	SubtaskSchema,
	TaskPriorityEnum,
	TaskStatusEnum,
	UpdateTaskStatusSchema,
} from "../schema/task.schema";

const logger = pino({
	browser: {
		asObject: true,
	},
	level: "debug",
	base: {
		env: process.env.NODE_ENV,
	},
	errorKey: "error",
});

const CreateTaskSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	status: TaskStatusEnum,
	priority: TaskPriorityEnum,
	phase: z.string().optional(),
	subtasks: z.array(SubtaskSchema).optional(),
});

const UpdateTaskSchema = CreateTaskSchema.extend({
	id: z.string().uuid(),
});

const createTaskAction = enhanceAction(
	async (data, user) => {
		const ctx = {
			name: "create-task",
			userId: user.id,
		};

		logger.info({ ...ctx }, "Creating new task...");

		const client = getSupabaseServerClient();
		const { subtasks, ...taskData } = data;

		try {
			const { data: task, error: taskError } = await client
				.from("tasks")
				.insert({
					...taskData,
					account_id: user.id,
				})
				.select()
				.single();

			if (taskError) throw taskError;

			if (subtasks && subtasks.length > 0) {
				const { error: subtasksError } = await client.from("subtasks").insert(
					subtasks.map((subtask) => ({
						...subtask,
						task_id: task.id,
					})),
				);

				if (subtasksError) throw subtasksError;
			}

			logger.info({ ...ctx }, "Task created successfully");
			revalidatePath("/home/kanban");

			return { success: true, data: task };
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to create task");
			return { success: false, error: "Failed to create task" };
		}
	},
	{
		auth: true,
		schema: CreateTaskSchema,
	},
);

const updateTaskAction = enhanceAction(
	async (data, user) => {
		const ctx = {
			name: "update-task",
			userId: user.id,
			taskId: data.id,
		};

		logger.info({ ...ctx }, "Updating task...");

		const client = getSupabaseServerClient();
		const { subtasks, ...taskData } = data;

		try {
			const { error: taskError } = await client
				.from("tasks")
				.update(taskData)
				.eq("id", data.id)
				.eq("account_id", user.id);

			if (taskError) throw taskError;

			if (subtasks) {
				// Delete existing subtasks
				await client.from("subtasks").delete().eq("task_id", data.id);

				// Insert new subtasks
				if (subtasks.length > 0) {
					const { error: subtasksError } = await client.from("subtasks").insert(
						subtasks.map((subtask) => ({
							...subtask,
							task_id: data.id,
						})),
					);

					if (subtasksError) throw subtasksError;
				}
			}

			logger.info({ ...ctx }, "Task updated successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to update task");
			return { success: false, error: "Failed to update task" };
		}
	},
	{
		auth: true,
		schema: UpdateTaskSchema,
	},
);

const updateTaskStatusAction = enhanceAction(
	async (data, user) => {
		const ctx = {
			name: "update-task-status",
			userId: user.id,
			taskId: data.id,
		};

		logger.info({ ...ctx }, "Updating task status...");

		const client = getSupabaseServerClient();

		try {
			const { error } = await client
				.from("tasks")
				.update({ status: data.status })
				.eq("id", data.id)
				.eq("account_id", user.id);

			if (error) throw error;

			logger.info({ ...ctx }, "Task status updated successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to update task status");
			return { success: false, error: "Failed to update task status" };
		}
	},
	{
		auth: true,
		schema: UpdateTaskStatusSchema,
	},
);

const deleteTaskAction = enhanceAction(
	async (data, user) => {
		const ctx = {
			name: "delete-task",
			userId: user.id,
			taskId: data.id,
		};

		logger.info({ ...ctx }, "Deleting task...");

		const client = getSupabaseServerClient();

		try {
			const { error } = await client
				.from("tasks")
				.delete()
				.eq("id", data.id)
				.eq("account_id", user.id);

			if (error) throw error;

			logger.info({ ...ctx }, "Task deleted successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to delete task");
			return { success: false, error: "Failed to delete task" };
		}
	},
	{
		auth: true,
		schema: z.object({
			id: z.string().uuid(),
		}),
	},
);

const updateSubtaskAction = enhanceAction(
	async (data, user) => {
		const ctx = {
			name: "update-subtask",
			userId: user.id,
			subtaskId: data.id,
		};

		logger.info({ ...ctx }, "Updating subtask...");

		const client = getSupabaseServerClient();

		try {
			// First verify the user owns the parent task
			const { data: task, error: taskError } = await client
				.from("tasks")
				.select("id")
				.eq("account_id", user.id)
				.eq("id", data.task_id)
				.single();

			if (taskError || !task) {
				throw new Error("Task not found or access denied");
			}

			const { error } = await client
				.from("subtasks")
				.update({ is_completed: data.is_completed })
				.eq("id", data.id)
				.eq("task_id", data.task_id);

			if (error) throw error;

			logger.info({ ...ctx }, "Subtask updated successfully");
			revalidatePath("/home/kanban");

			return {
				success: true,
				data: {
					id: data.id,
					task_id: data.task_id,
					is_completed: data.is_completed,
					title: data.title,
				},
			};
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to update subtask");
			return { success: false, error: "Failed to update subtask" };
		}
	},
	{
		auth: true,
		schema: SubtaskSchema.extend({
			id: z.string().uuid(),
			task_id: z.string().uuid(),
		}),
	},
);

const resetTasksAction = enhanceAction(
	async (_, user) => {
		const ctx = {
			name: "reset-tasks",
			userId: user.id,
		};

		logger.info({ ...ctx }, "Resetting tasks to default...");

		const client = getSupabaseServerClient();

		try {
			// Delete all existing tasks (this will cascade to subtasks)
			const { error: deleteError } = await client
				.from("tasks")
				.delete()
				.eq("account_id", user.id);

			if (deleteError) throw deleteError;

			// Batch insert all default tasks at once for optimal performance
			const tasksToInsert = DEFAULT_TASKS.map((task) => ({
				title: task.title,
				description: task.description ?? null,
				status: task.status,
				priority: task.priority,
				phase: task.phase ?? null,
				account_id: user.id,
			}));

			const { data: insertedTasks, error: tasksError } = await client
				.from("tasks")
				.insert(tasksToInsert)
				.select("id");

			if (tasksError) throw tasksError;
			if (!insertedTasks) throw new Error("No tasks returned from insert");

			// Collect and batch insert all subtasks
			const subtasksToInsert: Array<{
				title: string;
				is_completed: boolean;
				task_id: string;
			}> = [];

			DEFAULT_TASKS.forEach((task, index) => {
				if (task.subtasks && task.subtasks.length > 0 && insertedTasks[index]) {
					for (const subtask of task.subtasks) {
						subtasksToInsert.push({
							title: subtask.title,
							is_completed: subtask.is_completed ?? false,
							task_id: insertedTasks[index].id,
						});
					}
				}
			});

			if (subtasksToInsert.length > 0) {
				const { error: subtasksError } = await client
					.from("subtasks")
					.insert(subtasksToInsert);

				if (subtasksError) throw subtasksError;
			}

			logger.info({ ...ctx }, "Tasks reset successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to reset tasks");
			return { success: false, error: "Failed to reset tasks" };
		}
	},
	{
		auth: true,
	},
);

/**
 * Seed default tasks for new users.
 * Uses batch insert for optimal performance with 14 presentation tasks.
 */
const seedDefaultTasksAction = enhanceAction(
	async (_, user) => {
		const ctx = {
			name: "seed-default-tasks",
			userId: user.id,
		};

		logger.info({ ...ctx }, "Seeding default tasks for new user...");

		const client = getSupabaseServerClient();

		try {
			// Batch insert all default tasks at once for optimal performance
			const tasksToInsert = DEFAULT_TASKS.map((task) => ({
				title: task.title,
				description: task.description ?? null,
				status: task.status,
				priority: task.priority,
				phase: task.phase ?? null,
				account_id: user.id,
			}));

			const { data: insertedTasks, error: tasksError } = await client
				.from("tasks")
				.insert(tasksToInsert)
				.select("id");

			if (tasksError) throw tasksError;
			if (!insertedTasks) throw new Error("No tasks returned from insert");

			// Collect and batch insert all subtasks
			const subtasksToInsert: Array<{
				title: string;
				is_completed: boolean;
				task_id: string;
			}> = [];

			DEFAULT_TASKS.forEach((task, index) => {
				if (task.subtasks && task.subtasks.length > 0 && insertedTasks[index]) {
					for (const subtask of task.subtasks) {
						subtasksToInsert.push({
							title: subtask.title,
							is_completed: subtask.is_completed ?? false,
							task_id: insertedTasks[index].id,
						});
					}
				}
			});

			if (subtasksToInsert.length > 0) {
				const { error: subtasksError } = await client
					.from("subtasks")
					.insert(subtasksToInsert);

				if (subtasksError) throw subtasksError;
			}

			logger.info({ ...ctx }, "Default tasks seeded successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error({ ...ctx, error }, "Failed to seed default tasks");
			return { success: false, error: "Failed to seed default tasks" };
		}
	},
	{
		auth: true,
	},
);

export {
	createTaskAction,
	updateTaskAction,
	updateTaskStatusAction,
	deleteTaskAction,
	updateSubtaskAction,
	resetTasksAction,
	seedDefaultTasksAction,
};
