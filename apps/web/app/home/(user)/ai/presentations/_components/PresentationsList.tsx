"use client";

import { useMemo, useState } from "react";
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

import {
	MOCK_PRESENTATIONS,
	STEP_ACCENT_SPECTRUM,
	WORKFLOW_STEPS,
	type PresentationProject,
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

export default function PresentationsList() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<PresentationProject | null>(null);

	const presentations = useMemo(() => MOCK_PRESENTATIONS, []);
	const nextStep = selected
		? getNextIncompleteStep(selected.completedThroughIndex)
		: null;

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
					onClick={() => {
						const id =
							typeof crypto !== "undefined" && "randomUUID" in crypto
								? crypto.randomUUID()
								: `pres-${Date.now()}`;

						router.push(`/home/ai/presentations/${id}/profile`);
					}}
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					New Presentation
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{presentations.map((p, idx) => {
					const accent =
						STEP_ACCENT_SPECTRUM[idx % STEP_ACCENT_SPECTRUM.length] ?? "#24A9E0";
					const stepIdx = WORKFLOW_STEPS.findIndex(
						(s) => s.key === p.currentStep,
					);

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
										Last updated {formatDate(p.updatedAt)}
									</p>
									<h3 className="line-clamp-2 text-app-h4 font-semibold text-foreground">
										{p.title}
									</h3>
									<p className="line-clamp-1 text-app-sm text-muted-foreground">
										{p.audienceName}
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
										{Math.max(p.completedThroughIndex + 1, 0)}/5 complete
									</p>
								</div>
							</div>
						</motion.button>
					);
				})}
			</div>

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
								Created {formatDate(selected.createdAt)} • Updated{" "}
								{formatDate(selected.updatedAt)}
							</DialogDescription>
						</DialogHeader>
					) : null}

					{selected ? (
						<div className="mt-4 space-y-6">
							<div className="rounded-lg border border-white/10 bg-white/5 p-4">
								<p className="text-app-sm font-medium text-foreground">
									Audience summary
								</p>
								<p className="mt-2 text-app-body text-muted-foreground">
									{selected.audienceSummary}
								</p>
							</div>

							<div className="space-y-2">
								<p className="text-app-sm font-medium text-foreground">
									Workflow
								</p>
								<div className="space-y-2">
									{WORKFLOW_STEPS.map((s, idx) => {
										const status =
											idx <= selected.completedThroughIndex
												? "Complete"
												: idx === selected.completedThroughIndex + 1
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
														<p className="text-app-xs text-white/60">{status}</p>
													</div>
												</div>

												<Button
													variant="secondary"
													onClick={() => {
														router.push(
															`/home/ai/presentations/${selected.id}/${s.key}`,
														);
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
										router.push(`/home/ai/presentations/${selected.id}`);
										setOpen(false);
									}}
								>
									Open
								</Button>

								<Button
									onClick={() => {
										if (!nextStep) return;
										router.push(
											`/home/ai/presentations/${selected.id}/${nextStep.key}`,
										);
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
