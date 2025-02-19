import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { getBuildingBlocksPresentation } from '../queries/building-blocks-presentation';

export function useBuildingBlocksPresentation(id: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['building-blocks-presentation', id],
    queryFn: () => getBuildingBlocksPresentation(supabase, id!),
    enabled: !!id,
  });
}
