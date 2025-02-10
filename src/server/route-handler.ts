import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/**
 * @name minRating
 * @description Minimum rating for testimonials to be displayed
 */
const minRating = Number(process.env.TESTIMONIALS_MIN_RATING ?? 3);

/**
 * @name createTestimonialsRouteHandler
 * @description Route handler for creating testimonials
 *
 * Usage:
 * export const GET = createTestimonialsRouteHandler;
 *
 * Or for more control:
 * export const GET = (request: NextRequest) => {
 *  return createTestimonialsRouteHandler(request);
 * };
 *
 *
 * @param request
 */
export async function createTestimonialsRouteHandler(request: NextRequest) {
  const client = getSupabaseServerAdminClient();
  const searchParams = request.nextUrl.searchParams;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 30;

  if (limit > 50) {
    return new Response('Limit must be less than 50', { status: 400 });
  }

  const { data, error, count } = await client
    .from('testimonials')
    .select('*', {
      count: 'estimated',
    })
    .gte('rating', minRating)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.error();
  }

  return NextResponse.json({ data, count });
}
