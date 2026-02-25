"use client";

import { animate } from "motion";
import { useInView } from "motion/react";
import { useEffect, useRef } from "react";

interface UseCountUpOptions {
	target: number;
	duration?: number;
	formatter?: (value: number) => string;
	disabled?: boolean;
}

function defaultFormatter(value: number): string {
	return Math.round(value).toLocaleString();
}

export function useCountUp({
	target,
	duration = 2,
	formatter = defaultFormatter,
	disabled = false,
}: UseCountUpOptions): React.RefObject<HTMLSpanElement | null> {
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once: true });

	useEffect(() => {
		if (disabled || !isInView || !ref.current) return;

		const controls = animate(0, target, {
			duration,
			onUpdate: (latest) => {
				if (ref.current) {
					ref.current.textContent = formatter(latest);
				}
			},
		});

		return () => controls.stop();
	}, [disabled, isInView, target, duration, formatter]);

	return ref;
}
