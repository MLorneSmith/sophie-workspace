"use client";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@kit/ui/sheet";
import { cn } from "@kit/ui/utils";
import type { LucideIcon } from "lucide-react";
import {
	CircleAlert,
	CircleCheck,
	Mic,
	Scissors,
	ShieldCheck,
	Sparkles,
	Target,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import type { StoryboardSlide } from "../../_lib/types/storyboard.types";
import {
	type RunAgentResult,
	runAgentAction,
} from "../_actions/run-agent.action";
import { AgentProgress } from "./agent-progress";
import { EditorResults } from "./agent-results/editor-results";
import { PartnerResults } from "./agent-results/partner-results";
import { ValidatorResults } from "./agent-results/validator-results";
import { WhispererResults } from "./agent-results/whisperer-results";

const AGENT_IDS = ["partner", "validator", "whisperer", "editor"] as const;
type LaunchAgentId = (typeof AGENT_IDS)[number];

export interface AgentPanelCatalogEntry {
	id: LaunchAgentId;
	name: string;
	description: string;
	icon: "target" | "shield-check" | "mic" | "scissors";
	category: string;
}

interface AgentPanelProps {
	presentationId: string;
	agents: ReadonlyArray<AgentPanelCatalogEntry>;
	slides: StoryboardSlide[];
}

type AgentRunStatus = "idle" | "running" | "complete" | "error";

interface AgentRunState {
	status: AgentRunStatus;
	result?: RunAgentResult;
	error?: string;
}

const ICON_MAP: Record<AgentPanelCatalogEntry["icon"], LucideIcon> = {
	target: Target,
	"shield-check": ShieldCheck,
	mic: Mic,
	scissors: Scissors,
};

const CATEGORY_CLASSNAME: Record<string, string> = {
	review: "border-blue-500/20 bg-blue-500/10 text-blue-300",
	enhance: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
	optimize: "border-violet-500/20 bg-violet-500/10 text-violet-300",
};

function createInitialState(): Record<LaunchAgentId, AgentRunState> {
	return Object.fromEntries(
		AGENT_IDS.map((id) => [id, { status: "idle" } satisfies AgentRunState]),
	) as Record<LaunchAgentId, AgentRunState>;
}

function renderAgentResults(result: RunAgentResult) {
	switch (result.agentId) {
		case "partner":
			return <PartnerResults result={result.result} />;
		case "validator":
			return <ValidatorResults result={result.result} />;
		case "whisperer":
			return <WhispererResults result={result.result} />;
		case "editor":
			return <EditorResults result={result.result} />;
		default:
			return null;
	}
}

function formatDuration(durationMs: number): string {
	if (durationMs < 1000) {
		return `${durationMs}ms`;
	}

	const totalSeconds = Math.floor(durationMs / 1000);
	if (totalSeconds < 60) {
		return `${(durationMs / 1000).toFixed(1)}s`;
	}

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function AgentPanel({
	presentationId,
	agents,
	slides,
}: AgentPanelProps) {
	const [agentStates, setAgentStates] = useState(createInitialState);
	const [selectedAgentId, setSelectedAgentId] = useState<LaunchAgentId | null>(
		null,
	);
	const [isOpen, setIsOpen] = useState(false);

	const runningAgentId = useMemo(
		() => AGENT_IDS.find((id) => agentStates[id].status === "running") ?? null,
		[agentStates],
	);

	const selectedResult = useMemo(() => {
		if (!selectedAgentId) {
			return null;
		}

		const state = agentStates[selectedAgentId];
		if (state.status !== "complete" || !state.result) {
			return null;
		}

		return state.result;
	}, [agentStates, selectedAgentId]);

	const handleRunAgent = useCallback(
		async (agentId: LaunchAgentId) => {
			setSelectedAgentId(agentId);
			setAgentStates((previous) => ({
				...previous,
				[agentId]: {
					status: "running",
					error: undefined,
					result: previous[agentId].result,
				},
			}));

			try {
				const response = await runAgentAction({
					presentationId,
					agentId,
				});

				if (!response.success) {
					const errorMessage =
						"error" in response && typeof response.error === "string"
							? response.error
							: "Agent run failed";
					throw new Error(errorMessage);
				}

				setAgentStates((previous) => ({
					...previous,
					[agentId]: {
						status: "complete",
						result: response.data,
						error: undefined,
					},
				}));
			} catch (error) {
				setAgentStates((previous) => ({
					...previous,
					[agentId]: {
						status: "error",
						error:
							error instanceof Error ? error.message : "Agent execution failed",
					},
				}));
			}
		},
		[presentationId],
	);

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button
					variant="default"
					size="sm"
					disabled={slides.length === 0}
					data-testid="storyboard-ai-agents-button"
				>
					✨ AI Agents
				</Button>
			</SheetTrigger>
			<SheetContent
				side="right"
				className="w-full border-white/10 bg-[#0b0b0f] p-0 sm:max-w-5xl"
			>
				<div className="flex h-full min-h-0 flex-col">
					<SheetHeader className="border-b border-white/10 px-6 py-5">
						<SheetTitle>AI Agents</SheetTitle>
						<SheetDescription>
							Run specialized agents on your storyboard
						</SheetDescription>
					</SheetHeader>

					<div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[360px_minmax(0,1fr)]">
						<div className="overflow-y-auto p-4">
							<div className="space-y-3">
								{agents.map((agent) => {
									const Icon = ICON_MAP[agent.icon];
									const state = agentStates[agent.id];
									const isRunning = state.status === "running";
									const isDisabled =
										runningAgentId !== null && runningAgentId !== agent.id;

									return (
										<Card
											key={agent.id}
											className={cn(
												"border-white/10 bg-white/5",
												selectedAgentId === agent.id &&
													"border-blue-500/30 bg-blue-500/10",
											)}
										>
											<CardHeader className="space-y-2 pb-2">
												<div className="flex items-start justify-between gap-3">
													<div className="flex items-center gap-2">
														<div className="rounded-md border border-white/10 bg-black/20 p-1.5">
															<Icon className="h-4 w-4 text-white/80" />
														</div>
														<div>
															<CardTitle className="text-sm">
																{agent.name}
															</CardTitle>
															<p className="text-muted-foreground mt-1 text-xs">
																{agent.description}
															</p>
														</div>
													</div>
													<Badge
														className={
															CATEGORY_CLASSNAME[agent.category] ??
															"border-white/20 bg-white/10 text-white/80"
														}
													>
														{agent.category}
													</Badge>
												</div>
											</CardHeader>

											<CardContent className="space-y-2 pt-1">
												{isRunning ? (
													<AgentProgress
														agentName={agent.name}
														slideCount={slides.length}
													/>
												) : null}

												{state.status === "idle" ? (
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleRunAgent(agent.id)}
														disabled={isDisabled || slides.length === 0}
													>
														Run
													</Button>
												) : null}

												{state.status === "complete" ? (
													<div className="flex items-center gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => setSelectedAgentId(agent.id)}
														>
															View Results
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleRunAgent(agent.id)}
															disabled={isDisabled || slides.length === 0}
														>
															Re-run
														</Button>
														<CircleCheck className="h-4 w-4 text-green-400" />
													</div>
												) : null}

												{state.status === "error" ? (
													<div className="space-y-2">
														<div className="flex items-start gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-[11px] text-red-200">
															<CircleAlert className="mt-0.5 h-3 w-3 shrink-0" />
															<p>{state.error ?? "Agent failed"}</p>
														</div>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleRunAgent(agent.id)}
															disabled={isDisabled || slides.length === 0}
														>
															Retry
														</Button>
													</div>
												) : null}
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>

						<div className="min-h-0 border-t border-white/10 p-4 md:border-t-0 md:border-l">
							<div className="h-full overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-4">
								{selectedResult ? (
									<div className="space-y-3">
										<div className="flex items-center justify-between gap-2">
											<h3 className="text-sm font-medium">
												{
													agents.find(
														(agent) => agent.id === selectedResult.agentId,
													)?.name
												}
												{" Results"}
											</h3>
											<span className="text-muted-foreground text-xs">
												Completed in {formatDuration(selectedResult.durationMs)}
											</span>
										</div>
										{renderAgentResults(selectedResult)}
									</div>
								) : (
									<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
										<Sparkles className="h-6 w-6 text-white/40" />
										<div className="space-y-1">
											<p className="text-sm font-medium text-white/85">
												No results yet
											</p>
											<p className="text-muted-foreground text-xs">
												Run an agent to see feedback here.
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
