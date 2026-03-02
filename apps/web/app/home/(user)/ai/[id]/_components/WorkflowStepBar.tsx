"use client";

import { cn } from "@kit/ui/utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

import {
	type PresentationStep,
	STEP_ACCENT_SPECTRUM,
	WORKFLOW_STEPS,
} from "../../_components/mock-presentations";

function getCurrentStepFromPathname(
	pathname: string,
	presentationId: string,
): PresentationStep {
	const base = `/home/ai/${presentationId}`;

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
		<div className="border-b border-white/5 bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6 lg:px-8">
				<nav className="w-full" aria-label="Workflow progress">
					<ol className="flex w-full items-center gap-1">
						{WORKFLOW_STEPS.map((step, idx) => {
							const isCompleted = idx < currentIndex;
							const isCurrent = idx === currentIndex;
							const isFuture = idx > currentIndex;
							const accent = STEP_ACCENT_SPECTRUM[idx] ?? "#24A9E0";

							return (
								<li key={step.key} className="flex flex-1 items-center">
									{idx !== 0 && (
										<div
											className={cn(
												"h-[2px] w-4 shrink-0 transition-colors duration-300",
												isCompleted ? "bg-white/25" : "bg-white/8",
											)}
											style={
												isCompleted
													? ({
															backgroundColor: `${accent}40`,
														} as React.CSSProperties)
													: undefined
											}
											aria-hidden="true"
										/>
									)}

									<Link
										href={`/home/ai/${props.presentationId}/${step.key}`}
										aria-disabled={isFuture}
										aria-current={isCurrent ? "step" : undefined}
										className={cn(
											"group relative flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200",
											isFuture
												? "pointer-events-none opacity-40"
												: "hover:bg-white/5",
											isCurrent && "bg-white/5",
										)}
									>
										<span
											className={cn(
												"relative grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-all duration-300",
												isCurrent && "shadow-lg",
											)}
											style={
												{
													backgroundColor: isCompleted
														? `${accent}25`
														: isCurrent
															? `${accent}20`
															: "rgba(255,255,255,0.06)",
													color:
														isCompleted || isCurrent
															? accent
															: "rgba(255,255,255,0.5)",
													boxShadow: isCurrent
														? `0 0 12px ${accent}30`
														: undefined,
												} as React.CSSProperties
											}
										>
											{isCompleted ? (
												<Check className="size-3.5" strokeWidth={2.5} />
											) : (
												<span>{idx + 1}</span>
											)}
										</span>

										<div className="min-w-0 flex-1">
											<span
												className={cn(
													"block truncate text-sm font-medium transition-colors duration-200",
													isCurrent
														? "text-foreground"
														: isCompleted
															? "text-foreground/80"
															: "text-white/50",
												)}
											>
												{step.label}
											</span>

											{isCurrent && (
												<span
													className="mt-0.5 block h-0.5 rounded-full"
													style={
														{
															backgroundColor: accent,
															width: "60%",
														} as React.CSSProperties
													}
												/>
											)}
										</div>
									</Link>
								</li>
							);
						})}
					</ol>
				</nav>
			</div>
		</div>
	);
}
