import { BaselimeRum } from "@baselime/react-rum";
import { MonitoringContext } from "@kit/monitoring-core";
import { useRef } from "react";

import { useBaselime } from "../hooks/use-baselime";

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
		// TODO: Async logger needed
		// (await getLogger()).warn("You configured Baselime as monitoring provider but did not provide a key. " +
		//		"Please provide a key to enable monitoring with Baselime using the variable NEXT_PUBLIC_BASELIME_KEY.");

		return children;
	}

	return (
		<BaselimeRum
			apiKey={key}
			enableWebVitals={enableWebVitals}
			// @ts-expect-error - BaselimeRum expects React 18 types, but we're using React 19
			fallback={ErrorPage ?? undefined}
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
			{/* @ts-expect-error - React 18/19 type mismatch with BaselimeRum */}
			{props.children}
		</MonitoringContext.Provider>
	);
}
