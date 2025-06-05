import { useQuery } from "@tanstack/react-query";

import { useUserWorkspace } from "@kit/accounts/hooks/use-user-workspace";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";

import { getBuildingBlocksTitles } from "../queries/building-blocks-titles";

export function useBuildingBlocksTitles() {
	const supabase = useSupabase();
	const { user } = useUserWorkspace();

	return useQuery({
		queryKey: ["building-blocks-titles", user.id],
		queryFn: () => getBuildingBlocksTitles(supabase, user.id),
		enabled: !!user.id,
	});
}
