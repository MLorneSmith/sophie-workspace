import { useUserWorkspace } from "@kit/accounts/hooks/use-user-workspace";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pino } from "pino";

import type { Database } from "~/lib/database.types";

import { DEFAULT_TASKS } from "../config/default-tasks";
import type { Task } from "../schema/task.schema";
import {
	createTaskAction,
	deleteTaskAction,
	resetTasksAction,
	updateSubtaskAction,
	updateTaskAction,
	updateTaskStatusAction,
} from "../server/server-actions";

type TypedSupabaseClient = SupabaseClient<Database>;

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

async function getTasks(client: TypedSupabaseClient, userId: string) {
	const ctx = {
		name: "get-tasks",
		userId,
	};

	logger.info(ctx, "Fetching tasks...");
	try {
		const { data, error } = await client
			.from("tasks")
			.select(
				`
      id,
      title,
      description,
      status,
      priority,
      image_url,
      created_at,
      updated_at,
      account_id,
      subtasks (
        id,
        title,
        is_completed,
        created_at,
        updated_at
      )
    `,
			)
			.eq("account_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;

		logger.info(ctx, "Tasks fetched successfully");
		return data as Task[];
	} catch (error) {
		logger.error(ctx, "Failed to fetch tasks", { error });
		throw error;
	}
}

export function useTasks() {
	const client = useSupabase();
	const { user } = useUserWorkspace();

	return useQuery<Task[]>({
		queryKey: ["tasks", user.id],
		queryFn: async () => {
			const tasks = await getTasks(client, user.id);

			// If no tasks exist, create default tasks
			if (!tasks.length) {
				const ctx = {
					name: "create-default-tasks",
					userId: user.id,
				};

				logger.info(ctx, "Creating default tasks...");

				try {
					for (const task of DEFAULT_TASKS) {
						await createTaskAction(task);
					}

					logger.info(ctx, "Default tasks created successfully");
					return getTasks(client, user.id);
				} catch (error) {
					logger.error(ctx, "Failed to create default tasks", { error });
					throw error;
				}
			}

			return tasks;
		},
		staleTime: 60 * 1000,
		retry: false,
	});
}

export function _useCreateTask() {
	const queryClient = useQueryClient();
	const { user } = useUserWorkspace();

	return useMutation({
		mutationFn: createTaskAction,
		onSuccess: (_, _variables) => {
			const ctx = {
				name: "create-task",
				userId: user.id,
			};
			logger.info(ctx, "Task created successfully");
			queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
		},
		onError: (error) => {
			const ctx = {
				name: "create-task",
				userId: user.id,
			};
			logger.error(ctx, "Failed to create task", { error });
		},
	});
}

export function _useUpdateTask() {
	const queryClient = useQueryClient();
	const { user } = useUserWorkspace();

	return useMutation({
		mutationFn: updateTaskAction,
		onSuccess: (_, variables) => {
			const ctx = {
				name: "update-task",
				userId: user.id,
				taskId: variables.id,
			};
			logger.info(ctx, "Task updated successfully");
			queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
		},
		onError: (error, variables) => {
			const ctx = {
				name: "update-task",
				userId: user.id,
				taskId: variables.id,
			};
			logger.error(ctx, "Failed to update task", { error });
		},
	});
}

export function _useUpdateTaskStatus() {
	const queryClient = useQueryClient();
	const { user } = useUserWorkspace();

	return useMutation({
		mutationFn: updateTaskStatusAction,
		onSuccess: (_, variables) => {
			const ctx = {
				name: "update-task-status",
				userId: user.id,
				taskId: variables.id,
			};
			logger.info(ctx, "Task status updated successfully");
			queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
		},
		onError: (error, variables) => {
			const ctx = {
				name: "update-task-status",
				userId: user.id,
				taskId: variables.id,
			};
			logger.error(ctx, "Failed to update task status", { error });
		},
	});
}

export function _useDeleteTask() {
	const queryClient = useQueryClient();
	const { user } = useUserWorkspace();

	return useMutation({
		mutationFn: deleteTaskAction,
		onSuccess: (_, variables) => {
			const ctx = {
				name: "delete-task",
				userId: user.id,
				taskId: variables.id,
			};
			logger.info(ctx, "Task deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
		},
		onError: (error, variables) => {
			const ctx = {
				name: "delete-task",
				userId: user.id,
				taskId: variables.id,
			};
			logger.error(ctx, "Failed to delete task", { error });
		},
	});
}

export function _useUpdateSubtask() {
	const queryClient = useQueryClient();
	const { user } = useUserWorkspace();

	return useMutation({
		mutationFn: updateSubtaskAction,
		onMutate: async (variables) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["tasks", user.id] });

			// Snapshot the previous value
			const previousTasks = queryClient.getQueryData(["tasks", user.id]);

			// Optimistically update
			queryClient.setQueryData(["tasks", user.id], (old: Task[] | undefined) =>
				old?.map((t) =>
					t.id === variables.task_id
						? {
								...t,
								subtasks: t.subtasks?.map((s) =>
									s.id === variables.id
										? { ...s, is_completed: variables.is_completed }
										: s,
								),
							}
						: t,
				),
			);

			return { previousTasks };
		},
		onError: (_err, _variables, context) => {
			// Revert the optimistic update
			queryClient.setQueryData(["tasks", user.id], context?.previousTasks);
		},
		onSettled: () => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
		},
	});
}

export function _useResetTasks() {
	const queryClient = useQueryClient();
	const { user } = useUserWorkspace();

	return useMutation({
		mutationFn: resetTasksAction,
		onSuccess: () => {
			const ctx = {
				name: "reset-tasks",
				userId: user.id,
			};
			logger.info(ctx, "Tasks reset successfully");
			queryClient.invalidateQueries({ queryKey: ["tasks", user.id] });
		},
		onError: (error) => {
			const ctx = {
				name: "reset-tasks",
				userId: user.id,
			};
			logger.error(ctx, "Failed to reset tasks", { error });
		},
	});
}
