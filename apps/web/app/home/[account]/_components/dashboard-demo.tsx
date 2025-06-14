"use client";

import { LoadingOverlay } from "@kit/ui/loading-overlay";
import dynamic from "next/dynamic";

export const DashboardDemo = dynamic(() => import("./dashboard-demo-charts"), {
	ssr: false,
	loading: () => (
		<LoadingOverlay
			fullPage={false}
			className={"flex flex-1 flex-col items-center justify-center"}
		/>
	),
});
