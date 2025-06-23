"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { z } from "zod";

import {
	TextTestimonialFormSchema,
	VideoTestimonialSchema,
} from "../schema/create-testimonial.schema";
import { createTestimonialService } from "./testimonial.service";

const CreateTestimonialSchema = z.union([
	TextTestimonialFormSchema,
	VideoTestimonialSchema,
]);

export const createTestimonialAction = enhanceAction(
	async (data: z.infer<typeof CreateTestimonialSchema>) => {
		const adminClient = getSupabaseServerAdminClient();
		const service = createTestimonialService(adminClient);

		await service.insertTestimonial(data);

		return { success: true };
	},
	{
		auth: false,
	},
);
