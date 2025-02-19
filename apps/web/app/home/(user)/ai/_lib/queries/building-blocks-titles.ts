import {
  type PostgrestResponse,
  type SupabaseClient,
} from '@supabase/supabase-js';

import { type Database } from '@kit/supabase/database';

type TypedSupabaseClient = SupabaseClient<Database>;
type BuildingBlocksSubmission =
  Database['public']['Tables']['building_blocks_submissions']['Row'];

export async function getBuildingBlocksTitles(
  client: TypedSupabaseClient,
  userId: string,
): Promise<PostgrestResponse<Pick<BuildingBlocksSubmission, 'id' | 'title'>>> {
  return client
    .from('building_blocks_submissions')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .throwOnError();
}
