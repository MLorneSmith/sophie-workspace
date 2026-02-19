"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@kit/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@kit/ui/dialog";
import { cn } from "@kit/ui/utils";
import { FileText } from "lucide-react";
import { motion } from "motion/react";

import { createPresentationAction } from "../_lib/server/create-presentation.action";
import type { PresentationRow } from "../_lib/server/list-presentations.loader";
import {
	STEP_ACCENT_SPECTRUM,
	WORKFLOW_STEPS,
	type PresentationStep,
} from "./mock-presentations";

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return iso;
	}
}

function hexToRgba(hex: string, alpha: number) {
	const raw = hex.replace("#", "");

	const normalized =
		raw.length === 3
			? raw
					.split("")
					.map((c) => `${c}${c}`)
					.join("")
			: raw;

	const r = Number.parseInt(normalized.slice(0, 2), 16);
	const g = Number.parseInt(normalized.slice(2, 4), 16);
	const b = Number.parseInt(normalized.slice(4, 6), 16);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getNextIncompleteStep(completedThroughIndex: number) {
	return (
		WORKFLOW_STEPS[
			Math.min(completedThroughIndex + 1, WORKFLOW_STEPS.length - 1)
		] ?? WORKFLOW_STEPS[0]
	);
}

function getCompletedThroughIndex(
	currentStep: PresentationStep,
	completedSteps: string[],
) {
	const completedIndexes = completedSteps
		.map((step) => WORKFLOW_STEPS.findIndex((s) => s.key === step))
		.filter((idx) => idx >= 0);

	const completedThroughIndex =
		completedIndexes.length > 0 ? Math.max(...completedIndexes) : -1;

	// If `current_step` is ahead of the completed steps list, we still want the
	// UI to reflect at least the current step.
	const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);

	return Math.max(completedThroughIndex, currentIdx - 1);
}

export default function PresentationsList(props: {
	presentations: PresentationRow[];
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<PresentationRow | null>(null);
	const [createError, setCreateError] = useState<string | null>(null);
	const [isCreating, startCreating] = useTransition();

	const presentations = useMemo(() => props.presentations, [props.presentations]);

	const selectedStep = (selected?.current_step ?? "profile") as PresentationStep;
	const completedThroughIndex = selected
		? getCompletedThroughIndex(selectedStep, selected.completed_steps ?? [])
		: -1;
	const nextStep = selected ? getNextIncompleteStep(completedThroughIndex) : null;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-app-h2 font-semibold text-foreground">
						Your projects
					</h2>
					<p className="text-app-body text-muted-foreground">
						Pick up where you left off — or start something new.
					</p>
				</div>

				<Button
					disabled={isCreating}
					onClick={() => {
						setCreateError(null);

						startCreating(async () => {
							try {
								const result = await createPresentationAction({});

								if (result.success) {
									router.push(`/home/ai/${result.id}/profile`);
									return;
								}

								throw new Error(
									"error" in result
										? String(result.error)
										: "Failed to create presentation",
								);
							} catch (err) {
								setCreateError(
									err instanceof Error
										? err.message
										: "Failed to create presentation",
								);
							}
						});
					}}
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{isCreating ? "Creating…" : "New Presentation"}
				</Button>
			</div>

			{createError ? (
				<p className="text-app-sm text-destructive">{createError}</p>
			) : null}

			{presentations.length === 0 ? (
				<div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
					<p className="text-app-h4 font-semibold text-foreground">
						No presentations yet
					</p>
					<p className="mt-2 text-app-body text-muted-foreground">
						Click “New Presentation” to get started.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{presentations.map((p, idx) => {
					const accent =
						STEP_ACCENT_SPECTRUM[idx % STEP_ACCENT_SPECTRUM.length] ??
						"#24A9E0";

					const currentStep = (p.current_step ?? "profile") as PresentationStep;
					const completedThroughIndex = getCompletedThroughIndex(
						currentStep,
						p.completed_steps ?? [],
					);
					const stepIdx = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);

					return (
						<motion.button
							type="button"
							key={p.id}
							onClick={() => {
								setSelected(p);
								setOpen(true);
							}}
							whileHover={{
								y: -4,
								boxShadow: `0 8px 30px ${hexToRgba(accent, 0.25)}`,
								borderColor: hexToRgba(accent, 0.5),
							}}
							transition={{ type: "spring", stiffness: 400, damping: 20 }}
							className={cn(
								"group relative overflow-hidden rounded-xl border bg-white/5 text-left backdrop-blur-xl",
								"border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							)}
						>
							<div className="relative h-[160px] w-full" aria-hidden="true">
								<div
									className="absolute inset-0"
									style={{
										background: `linear-gradient(135deg, ${hexToRgba(
											accent,
											0.24,
										)}, transparent 70%)`,
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

								<div className="absolute inset-0 flex items-center justify-center p-4">
									<div className="relative w-full max-w-[320px]">
										<div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
											<div className="absolute inset-0">
												<div className="absolute left-3 right-10 top-3 h-2 rounded bg-white/10" />
												<div className="absolute left-3 right-16 top-7 h-2 rounded bg-white/10" />
												<div className="absolute left-3 top-12 h-10 w-[45%] rounded-md bg-white/5" />
												<div className="absolute right-3 top-12 h-16 w-[40%] rounded-md bg-white/5" />
												<div className="absolute bottom-3 left-3 right-3 h-2 rounded bg-white/10" />
											</div>

											<div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[11px] text-white/70 backdrop-blur">
												<FileText className="size-3" />
												<span>No slides yet</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="space-y-3 p-4">
								<div className="space-y-1">
									<p className="text-app-xs text-white/60">
										Last updated {formatDate(p.updated_at)}
									</p>
									<h3 className="line-clamp-2 text-app-h4 font-semibold text-foreground">
										{p.title}
									</h3>
									<p className="line-clamp-1 text-app-sm text-muted-foreground">
										{p.audience_profile_id ? "Audience set" : "No audience yet"}
									</p>
								</div>

								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<div
											className="h-2.5 w-2.5 rounded-full"
											style={{
												backgroundColor:
													STEP_ACCENT_SPECTRUM[stepIdx] ?? "#24A9E0",
											}}
										/>
										<p className="text-app-sm text-white/80">
											{WORKFLOW_STEPS[stepIdx]?.label ?? "Profile"}
										</p>
									</div>

									<p className="text-app-xs text-white/50">
										{Math.max(completedThroughIndex + 1, 0)}/5 complete
									</p>
								</div>
							</div>
						</motion.button>
					);
				})}
			</div>
		)}

			<Dialog
				open={open}
				onOpenChange={(v) => {
					setOpen(v);
					if (!v) setSelected(null);
				}}
			>
				<DialogContent className="max-w-2xl">
					{selected ? (
						<DialogHeader>
							<DialogTitle className="text-app-h3 font-semibold">
								{selected.title}
							</DialogTitle>
							<DialogDescription className="text-app-sm">
								Created {formatDate(selected.created_at)} • Updated{" "}
								{formatDate(selected.updated_at)}
							</DialogDescription>
						</DialogHeader>
					) : null}

					{selected ? (
						<div className="mt-4 space-y-6">
							<div className="rounded-lg border border-white/10 bg-white/5 p-4">
								<p className="text-app-sm font-medium text-foreground">
									Audience
								</p>
								<p className="mt-2 text-app-body text-muted-foreground">
									{selected.audience_profile_id
										? "Audience profile selected"
										: "No audience profile yet"}
								</p>
							</div>

							<div className="space-y-2">
								<p className="text-app-sm font-medium text-foreground">
									Workflow
								</p>
								<div className="space-y-2">
									{WORKFLOW_STEPS.map((s, idx) => {
										const status =
											idx <= completedThroughIndex
												? "Complete"
												: idx === completedThroughIndex + 1
													? "Next"
													: "Not started";

										const stepColor =
											STEP_ACCENT_SPECTRUM[idx % STEP_ACCENT_SPECTRUM.length] ??
											"#24A9E0";

										return (
											<div
												key={s.key}
												className="flex items-center justify-between gap-3 rounded-lg border bg-white/5 p-3"
												style={{
													borderColor: hexToRgba(stepColor, 0.25),
												}}
											>
												<div className="flex min-w-0 items-center gap-3">
													<span
														className="grid size-6 place-items-center rounded-full border"
														style={{ borderColor: hexToRgba(stepColor, 0.45) }}
													>
														<span
															className="size-2.5 rounded-full"
															style={{ backgroundColor: stepColor }}
														/>
													</span>

													<div className="min-w-0">
														<p className="text-app-body font-medium text-foreground">
															{s.label}
														</p>
														<p className="text-app-xs text-white/60">
															{status}
														</p>
													</div>
												</div>

												<Button
													variant="secondary"
													onClick={() => {
														router.push(`/home/ai/${selected.id}/${s.key}`);
														setOpen(false);
													}}
												>
													Jump
												</Button>
											</div>
										);
									})}
								</div>
							</div>

							<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
								<Button
									variant="secondary"
									onClick={() => {
										router.push(`/home/ai/${selected.id}`);
										setOpen(false);
									}}
								>
									Open
								</Button>

								<Button
									onClick={() => {
										if (!nextStep) return;
										router.push(`/home/ai/${selected.id}/${nextStep.key}`);
										setOpen(false);
									}}
									className="bg-primary text-primary-foreground hover:bg-primary/90"
								>
									{nextStep ? `Continue to ${nextStep.label} →` : "Continue"}
								</Button>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
