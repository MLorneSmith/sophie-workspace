"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () =>
	import("./motion-features").then((res) => res.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
	return (
		<MotionConfig reducedMotion="user">
			<LazyMotion features={loadFeatures}>{children}</LazyMotion>
		</MotionConfig>
	);
}
