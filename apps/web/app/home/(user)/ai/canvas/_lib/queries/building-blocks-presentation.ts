import { type SupabaseClient } from '@supabase/supabase-js';

import { type Database } from '~/lib/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

type PresentationDetails = {
  id: string;
  title: string;
  audience: string | null;
};

export async function getBuildingBlocksPresentation(
  client: TypedSupabaseClient,
  id: string,
): Promise<{ data: PresentationDetails | null; error: Error | null }> {
  try {
    const { data, error } = await client
      .from('building_blocks_submissions')
      .select('id, title, audience')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
