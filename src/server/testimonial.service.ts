import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@kit/supabase/database';

import {
  TextTestimonialFormSchema,
  VideoTestimonialSchema,
} from '../schema/create-testimonial.schema';

/* eslint-disable @typescript-eslint/no-unused-vars */
const CreateTestimonialSchema = z.union([
  TextTestimonialFormSchema,
  VideoTestimonialSchema,
]);

export function createTestimonialService(client: SupabaseClient<Database>) {
  return new TestimonialService(client);
}

class TestimonialService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getTestimonial(id: string) {
    const { data, error } = await this.client
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async insertTestimonial(data: z.infer<typeof CreateTestimonialSchema>) {
    if (data.type === 'video') {
      const fileName = Math.random().toString(36).substring(12);
      const path = `testimonials/${fileName}.mp4`;
      const contentType = 'video/mp4';

      const fileBody = Buffer.from(
        data.video.replace(`data:${contentType};base64,`, ''),
        'base64',
      );

      const bucket = this.client.storage.from('testimonials');

      const uploadResult = await bucket.upload(path, fileBody, {
        contentType,
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const url = bucket.getPublicUrl(path);

      const { error } = await this.client.from('testimonials').insert({
        customer_name: data.customerName,
        content: data.content ?? '',
        rating: data.rating,
        video_url: url.data.publicUrl,
      });

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await this.client.from('testimonials').insert({
        customer_name: data.customerName,
        content: data.content,
        rating: data.rating,
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  }
}
