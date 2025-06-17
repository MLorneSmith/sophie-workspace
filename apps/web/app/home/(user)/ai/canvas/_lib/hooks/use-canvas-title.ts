import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useQuery } from "@tanstack/react-query";

import { getCanvasTitle } from "../queries/canvas-title";

export function useCanvasTitle(id: string | null) {
	const supabase = useSupabase();

	return useQuery({
		queryKey: ["canvas-title", id],
		queryFn: () => {
			if (!id) throw new Error("Canvas ID is required");
			return getCanvasTitle(supabase, id);
		},
		enabled: !!id,
	// });
}
