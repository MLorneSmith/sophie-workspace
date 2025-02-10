import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { TestimonialsMasonaryGrid } from '@kit/ui/testimonial-masonary-grid';

const minRating = Number(process.env.TESTIMONIALS_MIN_RATING ?? 3);

export async function TestimonialsMasonaryGridServer() {
  const client = getSupabaseServerClient();

  const { data: testimonialData, error } = await client
    .from('testimonials')
    .select('*')
    .gte('rating', minRating)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error('Error fetching testimonials:', error);
    return null;
  }

  if (!testimonialData || testimonialData.length === 0) {
    return null;
  }

  // Ensure stable data structure for hydration
  const testimonials = testimonialData.map((testimonial) => ({
    name: testimonial.customer_name,
    content: testimonial.content,
    avatar_url: testimonial.customer_avatar_url || undefined,
    title: testimonial.customer_company_name || undefined,
  }));

  return <TestimonialsMasonaryGrid testimonials={testimonials} />;
}
