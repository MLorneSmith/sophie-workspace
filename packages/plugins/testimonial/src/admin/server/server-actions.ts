"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import type { AddManualTestimonialData } from "../../schema/add-manual-testimonial.schema";

export const updateTestimonialStatusAction = enhanceAction(
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	async (params: any) => {
		const { id, status } = params;
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
	{ auth: false },
);

export const deleteTestimonialAction = enhanceAction(
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	async (params: any) => {
		const { id } = params;
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
	{ auth: false },
);

export const addManualTestimonialAction = enhanceAction(
	// biome-ignore lint/suspicious/noExplicitAny: Required to avoid TypeScript memory exhaustion from complex generic constraints
	async (data: any) => {
		// Type the data explicitly to avoid deep instantiation
		const typedData = data as AddManualTestimonialData;
		await assertIsSuperAdmin();

		const logger = await getLogger();
		const adminClient = getSupabaseServerAdminClient();

		logger.info("Super Admin is adding manual testimonial...");

		const { error } = await adminClient.from("testimonials").insert({
			content: typedData.content.text,
			rating: typedData.content.rating,
			source: typedData.source.source,
			customer_name: typedData.customer.name,
			customer_company_name: typedData.customer.company,
			link: typedData.source.externalLink,
			customer_avatar_url: typedData.customer.avatarUrl,
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
	{ auth: false },
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
