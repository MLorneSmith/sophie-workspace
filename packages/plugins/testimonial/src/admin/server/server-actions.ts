"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { z } from "zod";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import { AddManualTestimonialSchema } from "../../schema/add-manual-testimonial.schema";

export const updateTestimonialStatusAction = enhanceAction(
	async ({ id, status }) => {
		await assertIsSuperAdmin();

		const logger = await getLogger();
		const adminClient = getSupabaseServerAdminClient();

		logger.info(
			{ testimonialId: id },
			"Super Admin is updating testimonial...",
		);

		const { error } = await adminClient
			.from("testimonials")
			.update({
				status,
			})
			.eq("id", id);

		if (error) {
			logger.error({ testimonialId: id }, "Failed to update testimonial");

			throw new Error("Failed to update testimonial");
		}

		revalidatePath("/admin/testimonials", "page");

		return {
			success: true,
		};
	},
	{
		schema: z.object({
			status: z.enum(["approved", "rejected", "pending"]),
			id: z.string().uuid(),
		}),
	},
);

export const deleteTestimonialAction = enhanceAction(
	async ({ id }) => {
		await assertIsSuperAdmin();

		const logger = await getLogger();
		const adminClient = getSupabaseServerAdminClient();

		logger.info(
			{ testimonialId: id },
			"Super Admin is deleting testimonial...",
		);

		const { error } = await adminClient
			.from("testimonials")
			.delete()
			.eq("id", id);

		if (error) {
			logger.error({ testimonialId: id }, "Failed to delete testimonial");

			throw new Error("Failed to delete testimonial");
		}

		revalidatePath("/admin/testimonials", "page");

		return redirect("/admin/testimonials");
	},
	{
		schema: z.object({
			id: z.string().uuid(),
		}),
	},
);

export const addManualTestimonialAction = enhanceAction(
	async (data) => {
		await assertIsSuperAdmin();

		const logger = await getLogger();
		const adminClient = getSupabaseServerAdminClient();

		logger.info("Super Admin is adding manual testimonial...");

		const { error } = await adminClient.from("testimonials").insert({
			content: data.content.text,
			rating: data.content.rating,
			source: data.source.source,
			customer_name: data.customer.name,
			customer_company_name: data.customer.company,
			link: data.source.externalLink,
			customer_avatar_url: data.customer.avatarUrl,
		});

		if (error) {
			logger.error("Failed to add manual testimonial");

			throw new Error("Failed to add manual testimonial");
		}

		revalidatePath("/admin/testimonials", "page");

		return {
			success: true,
		};
	},
	{
		schema: AddManualTestimonialSchema,
	},
);

async function assertIsSuperAdmin() {
	const client = getSupabaseServerClient();
	const user = await requireUser(client);

	if (user.error) {
		notFound();
	}

	const isSuperAdmin = user.data.app_metadata.role === "super-admin";

	if (!isSuperAdmin) {
		notFound();
	}
}
