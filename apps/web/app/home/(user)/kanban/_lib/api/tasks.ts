import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/lib/database.types";

import type { TaskStatus } from "../schema/task.schema";

type TypedSupabaseClient = SupabaseClient<Database>;

export function getTasks(client: TypedSupabaseClient) {
	return client
		.from("tasks")
		.select(
			`
      *,
      subtasks (
        id,
        title,
        is_completed,
        created_at,
        updated_at
      )
    `,
		)
		.throwOnError();
}

export function getTaskById(client: TypedSupabaseClient, id: string) {
	return client
		.from("tasks")
		.select(
			`
      *,
      subtasks (
        id,
        title,
        is_completed,
        created_at,
        updated_at
      )
    `,
		)
		.eq("id", id)
		.throwOnError()
		.single();
}

export function getTasksByStatus(
	client: TypedSupabaseClient,
	status: TaskStatus,
) {
	return client
		.from("tasks")
		.select(
			`
      *,
      subtasks (
        id,
        title,
        is_completed,
        created_at,
        updated_at
      )
    `,
		)
		.eq("status", status)
		.throwOnError();
}
