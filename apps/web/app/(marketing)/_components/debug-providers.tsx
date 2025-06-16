"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("MARKETING-DEBUG");

export function DebugProviders() {
	const queryClient = useQueryClient();

	useEffect(() => {
		const logStatus = async () => {
			const logger = await getLogger();

			if (!queryClient) {
				logger.error("QueryClient not available");
			} else {
				logger.info("QueryClient available", { hasClient: !!queryClient });
			}
		};

		logStatus();
	}, [queryClient]);

	if (!queryClient) {
		return <div>Providers Error</div>;
	}

	return <div>Providers OK</div>;
}
