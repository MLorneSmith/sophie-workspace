"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { revalidatePath } from "next/cache";
import { pino } from "pino";
import { z } from "zod";

import { DEFAULT_TASKS } from "../config/default-tasks";
import { SubtaskSchema, UpdateTaskStatusSchema } from "../schema/task.schema";
import { deleteTaskImageAction, uploadTaskImageAction } from "./image-actions";

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
	status: z.enum(["to-do", "in-progress", "done"]),
	priority: z.enum(["low", "medium", "high"]),
	image: z.any().optional(),
	subtasks: z.array(SubtaskSchema).optional(),
});

const UpdateTaskSchema = CreateTaskSchema.extend({
	id: z.string().uuid(),
	image_url: z.string().nullable().optional(),
});

const createTaskAction = enhanceAction(
	async (data, user) => {
		const ctx = {
			name: "create-task",
			userId: user.id,
		};

		logger.info(ctx, "Creating new task...");

		const client = getSupabaseServerClient();
		const { subtasks, image, ...taskData } = data;

		try {
			// Upload image if provided
			let imageUrl: string | undefined;
			if (image) {
				const { data: uploadResult, success } = await uploadTaskImageAction({
					file: image,
				});
				if (success && uploadResult) {
					imageUrl = uploadResult.url;
				}
			}

			const { data: task, error: taskError } = await client
				.from("tasks")
				.insert({
					...taskData,
					image_url: imageUrl,
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

			logger.info(ctx, "Task created successfully");
			revalidatePath("/home/kanban");

			return { success: true, data: task };
		} catch (error) {
			logger.error(ctx, "Failed to create task", { error });
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

		logger.info(ctx, "Updating task...");

		const client = getSupabaseServerClient();
		const { subtasks, image, ...taskData } = data;

		try {
			// Handle image upload/deletion
			let imageUrl = taskData.image_url;

			// If new image is provided, upload it
			if (image) {
				const { data: uploadResult, success } = await uploadTaskImageAction({
					file: image,
				});
				if (success && uploadResult) {
					imageUrl = uploadResult.url;
				}
			}

			// If image is being removed, delete the old one
			if (imageUrl === null) {
				const { data: existingTask } = await client
					.from("tasks")
					.select("image_url")
					.eq("id", data.id)
					.single();

				if (existingTask?.image_url) {
					await deleteTaskImageAction({ url: existingTask.image_url });
				}
			}

			const { error: taskError } = await client
				.from("tasks")
				.update({
					...taskData,
					image_url: imageUrl,
				})
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

			logger.info(ctx, "Task updated successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error(ctx, "Failed to update task", { error });
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

		logger.info(ctx, "Updating task status...");

		const client = getSupabaseServerClient();

		try {
			const { error } = await client
				.from("tasks")
				.update({ status: data.status })
				.eq("id", data.id)
				.eq("account_id", user.id);

			if (error) throw error;

			logger.info(ctx, "Task status updated successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error(ctx, "Failed to update task status", { error });
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

		logger.info(ctx, "Deleting task...");

		const client = getSupabaseServerClient();

		try {
			// Get the task's image URL before deleting
			const { data: task } = await client
				.from("tasks")
				.select("image_url")
				.eq("id", data.id)
				.single();

			// Delete the task
			const { error } = await client
				.from("tasks")
				.delete()
				.eq("id", data.id)
				.eq("account_id", user.id);

			if (error) throw error;

			// If task had an image, delete it from Vercel Blob
			if (task?.image_url) {
				await deleteTaskImageAction({ url: task.image_url });
			}

			logger.info(ctx, "Task deleted successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error(ctx, "Failed to delete task", { error });
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

		logger.info(ctx, "Updating subtask...");

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

			logger.info(ctx, "Subtask updated successfully");
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
			logger.error(ctx, "Failed to update subtask", { error });
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

		logger.info(ctx, "Resetting tasks to default...");

		const client = getSupabaseServerClient();

		try {
			// Get all tasks with images before deleting
			const { data: tasksWithImages } = await client
				.from("tasks")
				.select("image_url")
				.eq("account_id", user.id)
				.not("image_url", "is", null);

			// Delete all existing tasks (this will cascade to subtasks)
			const { error: deleteError } = await client
				.from("tasks")
				.delete()
				.eq("account_id", user.id);

			if (deleteError) throw deleteError;

			// Delete all images from Vercel Blob
			if (tasksWithImages) {
				await Promise.all(
					tasksWithImages
						.filter((task) => task.image_url)
						.map((task) =>
							deleteTaskImageAction({ url: task.image_url as string }),
						),
				);
			}

			// Create default tasks
			for (const task of DEFAULT_TASKS) {
				const { data: newTask, error: taskError } = await client
					.from("tasks")
					.insert({
						title: task.title,
						description: task.description,
						status: task.status,
						priority: task.priority,
						image_url: task.image_url,
						account_id: user.id,
					})
					.select()
					.single();

				if (taskError) throw taskError;

				if (task.subtasks && task.subtasks.length > 0) {
					const { error: subtasksError } = await client.from("subtasks").insert(
						task.subtasks.map((subtask) => ({
							...subtask,
							task_id: newTask.id,
						})),
					);

					if (subtasksError) throw subtasksError;
				}
			}

			logger.info(ctx, "Tasks reset successfully");
			revalidatePath("/home/kanban");

			return { success: true };
		} catch (error) {
			logger.error(ctx, "Failed to reset tasks", { error });
			return { success: false, error: "Failed to reset tasks" };
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
};
