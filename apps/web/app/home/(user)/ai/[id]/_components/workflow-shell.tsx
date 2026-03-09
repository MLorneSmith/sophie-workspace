"use client";

import { cn } from "@kit/ui/utils";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { ContinueButton } from "../../_components/ContinueButton";
import {
	type PresentationStep,
	WORKFLOW_STEPS,
} from "../../_components/mock-presentations";
import { WorkflowStepBar } from "./WorkflowStepBar";

function getStepFromPath(
	pathname: string,
	presentationId: string,
): PresentationStep {
	const base = `/home/ai/${presentationId}`;

	if (pathname === base) {
		return "profile";
	}

	for (const s of WORKFLOW_STEPS) {
		if (pathname.startsWith(`${base}/${s.key}`)) {
			return s.key;
		}
	}

	return "profile";
}

function getNextStep(current: PresentationStep): PresentationStep {
	const idx = WORKFLOW_STEPS.findIndex((s) => s.key === current);
	const next = WORKFLOW_STEPS[Math.min(idx + 1, WORKFLOW_STEPS.length - 1)];
	return next?.key ?? "generate";
}

const STEP_HINTS: Record<string, string> = {
	profile: "Research your audience to continue.",
	assemble: "Complete the presentation setup to continue.",
	outline: "Generate or write your outline to continue.",
	storyboard: "Generate your storyboard to continue.",
	generate: "Export your presentation.",
};

export function WorkflowShell(props: {
	presentationId: string;
	completedSteps: string[];
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();

	const currentStep = useMemo(
		() => getStepFromPath(pathname, props.presentationId),
		[pathname, props.presentationId],
	);

	const showAgentRail =
		currentStep === "outline" ||
		currentStep === "storyboard" ||
		currentStep === "generate";

	return (
		<div className="min-h-[calc(100vh-3.5rem)]">
			<WorkflowStepBar presentationId={props.presentationId} />

			<div
				className={cn(
					"mx-auto grid max-w-7xl gap-0 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10",
					showAgentRail ? "grid-cols-[1fr_48px]" : "grid-cols-1",
				)}
			>
				<div className="min-w-0">
					<div className="rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
						{props.children}

						{currentStep !== "profile" && (
							<ContinueButton
								enabled={props.completedSteps.includes(currentStep)}
								hint={
									STEP_HINTS[currentStep] ?? "Complete this step to continue."
								}
								onContinue={() => {
									const next = getNextStep(currentStep);
									router.push(`/home/ai/${props.presentationId}/${next}`);
								}}
							/>
						)}
					</div>
				</div>

				{showAgentRail ? (
					<aside
						className="ml-4 h-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl"
						aria-label="Agent rail placeholder"
					>
						<div className="flex h-full flex-col items-center justify-start gap-3 py-4">
							<div className="size-8 rounded-full bg-white/10" />
							<div className="size-8 rounded-full bg-white/10" />
							<div className="size-8 rounded-full bg-white/10" />
						</div>
					</aside>
				) : null}
			</div>
		</div>
	);
}
