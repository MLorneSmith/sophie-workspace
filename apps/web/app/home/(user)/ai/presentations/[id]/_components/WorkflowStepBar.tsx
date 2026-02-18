"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@kit/ui/utils";
import { Check } from "lucide-react";

import {
	STEP_ACCENT_SPECTRUM,
	WORKFLOW_STEPS,
	type PresentationStep,
} from "../../_components/mock-presentations";

function getCurrentStepFromPathname(
	pathname: string,
	presentationId: string,
): PresentationStep {
	const base = `/home/ai/presentations/${presentationId}`;

	if (pathname === base) {
		return "profile";
	}

	for (const step of WORKFLOW_STEPS) {
		if (pathname.startsWith(`${base}/${step.key}`)) {
			return step.key;
		}
	}

	return "profile";
}

export function WorkflowStepBar(props: { presentationId: string }) {
	const pathname = usePathname();
	const currentStep = getCurrentStepFromPathname(
		pathname,
		props.presentationId,
	);
	const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);

	return (
		<div className="border-b border-white/5 bg-background/50 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6 lg:px-8">
				<ol className="flex w-full items-center">
					{WORKFLOW_STEPS.map((step, idx) => {
						const isCompleted = idx < currentIndex;
						const isCurrent = idx === currentIndex;
						const isFuture = idx > currentIndex;
						const accent = STEP_ACCENT_SPECTRUM[idx] ?? "#24A9E0";

						return (
							<li
								key={step.key}
								className={cn(
									"relative flex items-center",
									idx === 0 ? "" : "flex-1",
								)}
							>
								{idx !== 0 ? (
									<div
										className={cn(
											"mx-2 h-px flex-1",
											isFuture ? "bg-white/10" : "bg-white/20",
										)}
										aria-hidden="true"
									/>
								) : null}

								<Link
									href={`/home/ai/presentations/${props.presentationId}/${step.key}`}
									aria-disabled={isFuture}
									className={cn(
										"group inline-flex min-w-0 items-center gap-2 rounded-full px-2 py-1 transition",
										isFuture
											? "pointer-events-none opacity-50"
											: "hover:bg-white/5",
									)}
								>
									<span
										className={cn(
											"grid size-6 place-items-center rounded-full border text-app-xs",
											isCurrent
												? "border-[#24a9e0]/50 bg-[#24a9e0]/15 text-[#24a9e0]"
												: isCompleted
													? "border-white/20 bg-white/5 text-white"
													: "border-white/15 bg-transparent text-white/80",
										)}
										style={
											isCurrent
												? ({
														borderColor: `${accent}66`,
													} as React.CSSProperties)
												: undefined
										}
									>
										{isCompleted ? (
											<Check className="size-4" style={{ color: accent }} />
										) : (
											<span className="font-medium">{idx + 1}</span>
										)}
									</span>

									<span
										className={cn(
											"truncate text-app-sm font-medium",
											isCurrent ? "text-foreground" : "text-white/80",
										)}
									>
										{step.label}
									</span>
								</Link>
							</li>
						);
					})}
				</ol>
			</div>
		</div>
	);
}
