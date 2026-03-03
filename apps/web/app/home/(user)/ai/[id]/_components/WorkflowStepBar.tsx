"use client";

import { SidebarTrigger } from "@kit/ui/shadcn-sidebar";
import { cn } from "@kit/ui/utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

import {
	type PresentationStep,
	WORKFLOW_STEPS,
} from "../../_components/mock-presentations";

const BRAND_BLUE = "#24A9E0";

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
		<div className="border-b border-border/50 bg-background/80 backdrop-blur-md">
			{/* Sidebar trigger — matches standard page header */}
			<div className="px-4 pt-4 pb-1 lg:px-8">
				<SidebarTrigger className="text-muted-foreground hover:text-secondary-foreground hidden size-4.5 cursor-pointer lg:inline-flex" />
			</div>

			{/* Segmented step bar */}
			<div className="mx-auto max-w-6xl px-4 pt-2 pb-4 lg:px-8">
				<nav aria-label="Workflow progress">
					<ol className="flex w-full">
						{WORKFLOW_STEPS.map((step, idx) => {
							const isCompleted = idx < currentIndex;
							const isCurrent = idx === currentIndex;

							const label = (
								<span className="flex items-center justify-center gap-1.5">
									{isCompleted ? (
										<Check
											className="size-3.5"
											style={{ color: BRAND_BLUE }}
											strokeWidth={2.5}
										/>
									) : (
										<span
											className={cn(
												"text-xs tabular-nums",
												isCurrent ? "text-foreground" : "text-muted-foreground",
											)}
										>
											{idx + 1}
										</span>
									)}
									<span>{step.label}</span>
								</span>
							);

							return (
								<li key={step.key} className="flex-1 text-center">
									{isCompleted || isCurrent ? (
										<Link
											href={`/home/ai/${props.presentationId}/${step.key}`}
											aria-current={isCurrent ? "step" : undefined}
											className={cn(
												"block pb-2 text-sm transition-colors duration-200",
												isCurrent
													? "font-semibold text-foreground"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											{label}
										</Link>
									) : (
										<span
											aria-disabled="true"
											className="block cursor-default pb-2 text-sm text-muted-foreground"
										>
											{label}
										</span>
									)}
								</li>
							);
						})}
					</ol>

					{/* Segmented progress bar */}
					<div className="flex gap-1" aria-hidden="true">
						{WORKFLOW_STEPS.map((step, idx) => {
							const isFilled = idx <= currentIndex;

							return (
								<div
									key={step.key}
									className="h-[3px] flex-1 rounded-full bg-muted transition-colors duration-300"
									style={
										isFilled
											? ({ backgroundColor: BRAND_BLUE } as React.CSSProperties)
											: undefined
									}
								/>
							);
						})}
					</div>
				</nav>
			</div>
		</div>
	);
}
