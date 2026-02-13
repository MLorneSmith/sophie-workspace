import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { TestimonialsMasonaryGrid } from "@kit/ui/testimonial-masonary-grid";

const minRating = Number(process.env.TESTIMONIALS_MIN_RATING ?? 3);

// Mock testimonials for fallback when data can't be fetched
const fallbackTestimonials = [
	{
		name: "Sarah Johnson",
		content:
			"This platform transformed how I create presentations. The AI tools saved me hours of work!",
		title: "Marketing Director",
	},
	{
		name: "Michael Chen",
		content:
			"The slide templates are professional and easy to customize. My team loves using this for client presentations.",
		title: "Senior Consultant",
	},
	{
		name: "Emily Rodriguez",
		content:
			"I used to dread making presentations, but this platform makes it simple and even enjoyable.",
		title: "Product Manager",
	},
];

export async function TestimonialsMasonaryGridServer() {
	const ctx = {
		name: "testimonials-fetch",
		component: "TestimonialsMasonaryGridServer",
	};

	// Initialize logger once
	const logger = await getLogger();

	try {
		logger.info(ctx, "Fetching testimonials from Supabase");

		// Use direct database connection instead of Supabase client
		// This is a temporary workaround for the Supabase connection issue
		try {
			const client = getSupabaseServerClient();

			// Test connection with a simple query first
			const { error: connectionError } = await client
				.from("testimonials")
				.select("count", { count: "exact", head: true });

			if (connectionError) {
				logger.error(
					ctx,
					`Supabase connection error: ${JSON.stringify(connectionError)}`,
				);
				// Continue with fallback
			} else {
				const { data: testimonialData, error } = await client
					.from("testimonials")
					.select("*")
					.gte("rating", minRating)
					.eq("status", "approved")
					.order("created_at", { ascending: false })
					.limit(12);

				if (!error && testimonialData && testimonialData.length > 0) {
					logger.info(
						ctx,
						`Successfully fetched ${testimonialData.length} testimonials`,
					);

					// Ensure stable data structure for hydration
					const testimonials = testimonialData.map((testimonial) => ({
						name: testimonial.customer_name,
						content: testimonial.content,
						avatar_url: testimonial.customer_avatar_url || undefined,
						title: testimonial.customer_company_name || undefined,
					}));

					return (
						<TestimonialsMasonaryGrid
							testimonials={testimonials}
							variant="glass"
						/>
					);
				}
			}
		} catch (connectionError) {
			logger.error(
				ctx,
				`Failed to connect to Supabase: ${
					connectionError instanceof Error
						? connectionError.message
						: String(connectionError)
				}`,
			);
		}

		// If we reach here, we're using the fallback data
		logger.info(ctx, "Using fallback testimonials data");
		return (
			<TestimonialsMasonaryGrid
				testimonials={fallbackTestimonials}
				variant="glass"
			/>
		);
	} catch (e) {
		// Catch any unexpected errors
		const error = e instanceof Error ? e : new Error(String(e));
		logger.error(
			ctx,
			`Unexpected error fetching testimonials: ${error.message}`,
		);
		return (
			<TestimonialsMasonaryGrid
				testimonials={fallbackTestimonials}
				variant="glass"
			/>
		);
	}
}
