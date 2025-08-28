import { createAuthCallbackService } from "@kit/supabase/auth";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import pathsConfig from "~/config/paths.config";

export async function GET(request: NextRequest) {
	const supabase = getSupabaseServerClient();
	const service = createAuthCallbackService(supabase);

	const { nextPath } = await service.exchangeCodeForSession(request, {
		joinTeamPath: pathsConfig.app.joinTeam,
		redirectPath: pathsConfig.app.home,
	});

	// Check if user has completed onboarding
	const { data: userData } = await supabase.auth.getUser();
	const isOnboarded = userData?.user?.user_metadata?.onboarded === true;

	// If user hasn't completed onboarding and isn't joining a team, redirect to onboarding
	if (!isOnboarded && !nextPath.includes(pathsConfig.app.joinTeam)) {
		return redirect("/onboarding");
	}

	return redirect(nextPath);
}
