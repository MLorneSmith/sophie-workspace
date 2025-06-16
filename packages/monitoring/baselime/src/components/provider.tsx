import { BaselimeRum } from "@baselime/react-rum";
import { MonitoringContext } from "@kit/monitoring-core";
import { useRef } from "react";

import { useBaselime } from "../hooks/use-baselime";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("PROVIDER");

export function BaselimeProvider({
	children,
	apiKey,
	enableWebVitals,
	ErrorPage,
}: React.PropsWithChildren<{
	apiKey?: string;
	enableWebVitals?: boolean;
	ErrorPage?: React.ReactElement;
}>) {
	const key = apiKey ?? process.env.NEXT_PUBLIC_BASELIME_KEY ?? "";

	if (!key) {
		/* TODO: Async logger needed */ logger.warn("You configured Baselime as monitoring provider but did not provide a key. " +
				"Please provide a key to enable monitoring with Baselime using the variable NEXT_PUBLIC_BASELIME_KEY.", { data:  });

		return children;
	}

	return (
		<BaselimeRum
			apiKey={key}
			enableWebVitals={enableWebVitals}
			fallback={ErrorPage ?? null}
		>
			<MonitoringProvider>{children}</MonitoringProvider>
		</BaselimeRum>
	);
}

function MonitoringProvider(props: React.PropsWithChildren) {
	const service = useBaselime();
	const provider = useRef(service);

	return (
		<MonitoringContext.Provider value={provider.current}>
			{props.children}
		</MonitoringContext.Provider>
	);
}
