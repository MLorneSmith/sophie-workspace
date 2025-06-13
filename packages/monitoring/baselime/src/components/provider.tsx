import { useRef } from "react";

import { BaselimeRum } from "@baselime/react-rum";

import { MonitoringContext } from "@kit/monitoring-core";

import { useBaselime } from "../hooks/use-baselime";

export function BaselimeProvider({
<<<<<<< HEAD
	children,
	apiKey,
	enableWebVitals,
	ErrorPage,
}: React.PropsWithChildren<{
	apiKey?: string;
	enableWebVitals?: boolean;
	ErrorPage?: React.ReactElement;
=======
  children,
  apiKey,
  enableWebVitals,
}: React.PropsWithChildren<{
  apiKey?: string;
  enableWebVitals?: boolean;
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
}>) {
	const key = apiKey ?? process.env.NEXT_PUBLIC_BASELIME_KEY ?? "";

	if (!key) {
		console.warn(
			"You configured Baselime as monitoring provider but did not provide a key. " +
				"Please provide a key to enable monitoring with Baselime using the variable NEXT_PUBLIC_BASELIME_KEY.",
		);

		return children;
	}

<<<<<<< HEAD
	return (
		<BaselimeRum
			apiKey={key}
			enableWebVitals={enableWebVitals}
			fallback={ErrorPage ?? null}
		>
			<MonitoringProvider>{children}</MonitoringProvider>
		</BaselimeRum>
	);
=======
  return (
    <BaselimeRum apiKey={key} enableWebVitals={enableWebVitals}>
      <MonitoringProvider>{children}</MonitoringProvider>
    </BaselimeRum>
  );
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
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
