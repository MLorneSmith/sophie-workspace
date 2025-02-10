import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { VideoTestimonialSchema } from '../schema/create-testimonial.schema';
import { createTestimonialService } from './testimonial.service';

export const createVideoTestimonialRouteHandler = enhanceRouteHandler(
  async ({ body }) => {
    const client = getSupabaseServerAdminClient();
    const service = createTestimonialService(client);

    await service.insertTestimonial(body);

    return NextResponse.json({ success: true });
  },
  {
    auth: false,
    schema: VideoTestimonialSchema,
  },
);
