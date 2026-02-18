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

function getNextIncompleteStep(completedThroughIndex: number) {
	return (
		WORKFLOW_STEPS[Math.min(completedThroughIndex + 1, WORKFLOW_STEPS.length - 1)] ??
		WORKFLOW_STEPS[0]
	);
}

export default function PresentationsList() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<PresentationProject | null>(null);

	const presentations = useMemo(() => MOCK_PRESENTATIONS, []);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-foreground">Your projects</h2>
					<p className="text-sm text-muted-foreground">
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
					className="bg-[#24a9e0] text-black hover:bg-[#24a9e0]/90"
				>
					New Presentation
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{presentations.map((p, idx) => {
					const accent = STEP_ACCENT_SPECTRUM[idx % STEP_ACCENT_SPECTRUM.length];
					const stepIdx = WORKFLOW_STEPS.findIndex((s) => s.key === p.currentStep);

					return (
						<motion.button
							type="button"
							key={p.id}
							onClick={() => {
								setSelected(p);
								setOpen(true);
							}}
							whileHover={{ y: -4 }}
							transition={{ type: "spring", stiffness: 400, damping: 20 }}
							className={cn(
								"group relative overflow-hidden rounded-xl border bg-white/5 text-left backdrop-blur-xl",
								"border-white/10 hover:border-white/20",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24a9e0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
							)}
							style={{
								boxShadow: `0 0 0 1px rgba(255,255,255,0.06)`,
							}}
						>
							<div
								className="relative h-[120px] w-full"
								aria-hidden="true"
							>
								<div
									className="absolute inset-0"
									style={{
										background: `linear-gradient(135deg, ${accent}22, transparent 70%)`,
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="h-12 w-16 rounded-md border border-white/10 bg-white/5" />
								</div>
							</div>

							<div className="space-y-3 p-4">
								<div className="space-y-1">
									<p className="text-xs text-white/60">
										Last updated {formatDate(p.updatedAt)}
									</p>
									<h3 className="line-clamp-2 text-base font-semibold text-foreground">
										{p.title}
									</h3>
									<p className="line-clamp-1 text-sm text-muted-foreground">
										{p.audienceName}
									</p>
								</div>

								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<div
											className="h-2.5 w-2.5 rounded-full"
											style={{ backgroundColor: STEP_ACCENT_SPECTRUM[stepIdx] ?? "#24A9E0" }}
										/>
										<p className="text-sm text-white/80">
											{WORKFLOW_STEPS[stepIdx]?.label ?? "Profile"}
										</p>
									</div>

									<p className="text-xs text-white/50">
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
							<DialogTitle>{selected.title}</DialogTitle>
							<DialogDescription>
								Created {formatDate(selected.createdAt)} • Updated{" "}
								{formatDate(selected.updatedAt)}
							</DialogDescription>
						</DialogHeader>
					) : null}

					{selected ? (
						<div className="mt-4 space-y-6">
							<div className="rounded-lg border border-white/10 bg-white/5 p-4">
								<p className="text-sm font-medium text-foreground">Audience summary</p>
								<p className="mt-2 text-sm text-muted-foreground">
									{selected.audienceSummary}
								</p>
							</div>

							<div className="space-y-2">
								<p className="text-sm font-medium text-foreground">Workflow</p>
								<div className="space-y-2">
									{WORKFLOW_STEPS.map((s, idx) => {
										const status =
											idx <= selected.completedThroughIndex
												? "Complete"
												: idx === selected.completedThroughIndex + 1
													? "Next"
													: "Not started";

										return (
											<div
												key={s.key}
												className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
											>
												<div className="min-w-0">
													<p className="text-sm font-medium text-foreground">{s.label}</p>
													<p className="text-xs text-white/60">{status}</p>
												</div>

												<Button
													variant="secondary"
													onClick={() => {
														router.push(`/home/ai/presentations/${selected.id}/${s.key}`);
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
										const next = getNextIncompleteStep(selected.completedThroughIndex);
										router.push(`/home/ai/presentations/${selected.id}/${next.key}`);
										setOpen(false);
									}}
									className="bg-[#24a9e0] text-black hover:bg-[#24a9e0]/90"
								>
									Continue
								</Button>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
