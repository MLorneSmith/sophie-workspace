"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

const CreatePresentationSchema = z.object({});

export const createPresentationAction = enhanceAction(
	async (_data, user) => {
		const client = getSupabaseServerClient();
		const logger = await getLogger();
		const ctx = { name: "createPresentationAction" };

		// `enhanceAction` passes the authenticated user when `auth: true`, but we
		// still rely on `requireUser` to ensure a valid session.
		const auth = await requireUser(client);

		if (auth.error) {
			throw new Error("Unauthorized");
		}

		const userId = user.id;
		const personalAccountId = auth.data.id;

		// Defensive check: personal accounts use auth.users.id = accounts.id
		const { data: account, error: accountError } = await client
			.from("accounts")
			.select("id")
			.eq("id", personalAccountId)
			.maybeSingle();

		if (accountError) {
			logger.error(ctx, "Failed to resolve personal account: %o", accountError);
			throw accountError;
		}

		if (!account) {
			throw new Error("Personal account not found");
		}

		const { data: presentation, error } = await client
			.from("presentations")
			.insert({
				user_id: userId,
				account_id: personalAccountId,
				title: "Untitled Presentation",
				current_step: "profile",
			})
			.select("id")
			.single();

		if (error) {
			logger.error(ctx, "Failed to create presentation: %o", error);
			throw error;
		}

		return {
			success: true,
			id: presentation.id,
		};
	},
	{
		schema: CreatePresentationSchema,
		auth: true,
	},
);
