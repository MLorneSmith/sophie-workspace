import { type SupabaseClient } from '@supabase/supabase-js';

import { type Database } from '~/lib/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

type CanvasTitle = {
  id: string;
  title: string;
};

export async function getCanvasTitle(
  client: TypedSupabaseClient,
  id: string,
): Promise<{ data: CanvasTitle | null; error: Error | null }> {
  try {
    const { data, error } = await client
      .from('building_blocks_submissions')
      .select('id, title')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
