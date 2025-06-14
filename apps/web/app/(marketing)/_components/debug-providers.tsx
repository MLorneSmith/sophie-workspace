"use client";

import { useQueryClient } from "@tanstack/react-query";

export function DebugProviders() {
	const queryClient = useQueryClient();

	if (!queryClient) {
		console.error("QueryClient not available");
		return <div>Providers Error</div>;
	}

	console.log("QueryClient available:", !!queryClient);
	return <div>Providers OK</div>;
}
