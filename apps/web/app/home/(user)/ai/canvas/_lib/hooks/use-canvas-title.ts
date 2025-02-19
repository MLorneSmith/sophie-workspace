import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { getCanvasTitle } from '../queries/canvas-title';

export function useCanvasTitle(id: string | null) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['canvas-title', id],
    queryFn: () => getCanvasTitle(supabase, id!),
    enabled: !!id,
  });
}
