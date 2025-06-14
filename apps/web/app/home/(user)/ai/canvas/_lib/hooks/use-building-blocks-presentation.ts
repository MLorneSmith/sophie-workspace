import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useQuery } from "@tanstack/react-query";

import { getBuildingBlocksPresentation } from "../queries/building-blocks-presentation";

export function useBuildingBlocksPresentation(id: string | null) {
	const supabase = useSupabase();

	return useQuery({
		queryKey: ["building-blocks-presentation", id],
		queryFn: () => {
			if (!id) throw new Error("Building block ID is required");
			return getBuildingBlocksPresentation(supabase, id);
		},
		enabled: !!id,
	});
}
