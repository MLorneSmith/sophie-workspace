"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";

import { TextTestimonialFormSchema } from "../schema/create-testimonial.schema";
import { createTestimonialService } from "./testimonial.service";

export const createTestimonialAction = enhanceAction(
	async (data: any) => {
		const adminClient = getSupabaseServerAdminClient();
		const service = createTestimonialService(adminClient);

		await service.insertTestimonial(data);

		return { success: true };
	},
	{
		auth: false,
	},
);
