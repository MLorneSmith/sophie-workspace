"use client";

import type {
	AgentId,
	AgentRun,
	AgentSuggestion,
	AgentSuggestionPriority,
	AgentSuggestionStatus,
} from "@kit/mastra";
import { createClientLogger } from "@kit/shared/logger";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader } from "@kit/ui/card";
import { ScrollArea } from "@kit/ui/scroll-area";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";
import {
	AlertTriangle,
	Check,
	CheckCheck,
	ChevronDown,
	ChevronRight,
	Edit3,
	Loader2,
	MessageSquare,
	Sparkles,
	X,
	XSquare,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RunHistoryDropdown } from "./run-history-dropdown";
import { SuggestionDiffView } from "./suggestion-diff-view";

// Initialize logger after imports
const clientLogger = createClientLogger("AGENT-SUGGESTIONS-PANEL");
const { getLogger } = clientLogger;

// Valid view mode values for type-safe tab handling
const VIEW_MODES = ["suggestions", "comparison"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

// Agent metadata for display - i18n keys for names and descriptions
const AGENT_CONFIG: Record<
	AgentId,
	{
		nameKey: string;
		icon: typeof Sparkles;
		color: string;
		descriptionKey: string;
	}
> = {
	partner: {
		nameKey: "agentSuggestions:agent.partner.name",
		icon: Sparkles,
		color: "text-blue-500",
		descriptionKey: "agentSuggestions:agent.partner.description",
	},
	validator: {
		nameKey: "agentSuggestions:agent.validator.name",
		icon: AlertTriangle,
		color: "text-amber-500",
		descriptionKey: "agentSuggestions:agent.validator.description",
	},
	whisperer: {
		nameKey: "agentSuggestions:agent.whisperer.name",
		icon: MessageSquare,
		color: "text-purple-500",
		descriptionKey: "agentSuggestions:agent.whisperer.description",
	},
	editor: {
		nameKey: "agentSuggestions:agent.editor.name",
		icon: Edit3,
		color: "text-green-500",
		descriptionKey: "agentSuggestions:agent.editor.description",
	},
};

const STATUS_CONFIG: Record<
	AgentSuggestionStatus,
	{
		labelKey: string;
		variant: "default" | "secondary" | "outline" | "destructive";
	}
> = {
	pending: {
		labelKey: "agentSuggestions:status.pending",
		variant: "secondary",
	},
	accepted: {
		labelKey: "agentSuggestions:status.accepted",
		variant: "default",
	},
	rejected: {
		labelKey: "agentSuggestions:status.rejected",
		variant: "destructive",
	},
	applied: { labelKey: "agentSuggestions:status.applied", variant: "outline" },
};

interface SuggestionCardProps {
	suggestion: AgentSuggestion;
	onAccept: (id: string) => void;
	onReject: (id: string) => void;
	isProcessing?: boolean;
}

function SuggestionCard({
	suggestion,
	onAccept,
	onReject,
	isProcessing,
}: SuggestionCardProps) {
	const { t } = useTranslation("agentSuggestions");
	const statusConfig =
		STATUS_CONFIG[suggestion.status] ?? STATUS_CONFIG.pending;
	const isPending = suggestion.status === "pending";

	return (
		<Card
			className={cn(
				"bg-card/30 transition-opacity",
				isProcessing && "opacity-50",
			)}
			data-testid={`suggestion-card-${suggestion.id}`}
		>
			<CardHeader className="pb-2 pt-3 px-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium leading-tight line-clamp-2">
							{suggestion.summary}
						</p>
					</div>
					<Badge
						variant={statusConfig.variant}
						className="text-[10px] shrink-0"
					>
						<Trans i18nKey={statusConfig.labelKey} />
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="pb-2 pt-0 px-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Trans i18nKey={`agentSuggestions:type.${suggestion.type}`} />
						<span>•</span>
						<Trans
							i18nKey={`agentSuggestions:priority.${suggestion.priority}`}
						/>
						<span>•</span>
						<Trans
							i18nKey="agentSuggestions:slideLabel"
							values={{ slideId: suggestion.slideId }}
						/>
					</div>
					{isPending && (
						<div className="flex gap-1">
							<Button
								onClick={() => onReject(suggestion.id)}
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								disabled={isProcessing}
								aria-label={t("action.reject", { summary: suggestion.summary })}
								data-testid={`reject-suggestion-${suggestion.id}`}
							>
								<X className="h-3 w-3" />
							</Button>
							<Button
								onClick={() => onAccept(suggestion.id)}
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								disabled={isProcessing}
								aria-label={t("action.accept", { summary: suggestion.summary })}
								data-testid={`accept-suggestion-${suggestion.id}`}
							>
								<Check className="h-3 w-3" />
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

interface AgentGroupProps {
	agentId: AgentId;
	suggestions: AgentSuggestion[];
	onAccept: (id: string) => void;
	onReject: (id: string) => void;
	onAcceptAll: (agentId: AgentId) => void;
	onRejectAll: (agentId: AgentId) => void;
	processingIds: Set<string>;
	isBulkProcessing?: boolean;
	/** Run history for comparison feature */
	runHistory?: AgentRun[];
	/** Currently selected run ID for comparison */
	selectedCompareRunId?: string | null;
	/** Callback when comparison run is selected */
	onSelectCompareRun?: (agentId: AgentId, runId: string | null) => void;
	/** ID of the current run (to exclude from comparison dropdown) */
	currentRunId?: string;
	/** Suggestions from the selected previous run for comparison */
	previousRunSuggestions?: AgentSuggestion[];
	/** Whether previous suggestions are currently being loaded */
	isLoadingPreviousSuggestions?: boolean;
	/** Whether loading previous suggestions failed */
	hasFailedPreviousSuggestions?: boolean;
}

function AgentGroup({
	agentId,
	suggestions,
	onAccept,
	onReject,
	onAcceptAll,
	onRejectAll,
	processingIds,
	isBulkProcessing = false,
	runHistory = [],
	selectedCompareRunId,
	onSelectCompareRun,
	currentRunId,
	previousRunSuggestions,
	isLoadingPreviousSuggestions = false,
	hasFailedPreviousSuggestions = false,
}: AgentGroupProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [viewMode, setViewMode] = useState<ViewMode>("suggestions");
	const panelId = `agent-group-${agentId}`;
	const config = AGENT_CONFIG[agentId] ?? AGENT_CONFIG.partner;
	const Icon = config.icon;

	const pendingCount = useMemo(
		() => suggestions.filter((s) => s.status === "pending").length,
		[suggestions],
	);

	const hasPending = pendingCount > 0;
	const hasHistory = useMemo(
		() =>
			runHistory.some((r) => r.agentId === agentId && r.id !== currentRunId),
		[runHistory, agentId, currentRunId],
	);

	if (suggestions.length === 0) {
		return null;
	}

	const handleSelectCompareRun = (runId: string | null) => {
		onSelectCompareRun?.(agentId, runId);
		if (runId) {
			setViewMode("comparison");
		} else {
			setViewMode("suggestions");
		}
	};

	return (
		<div
			className="border rounded-lg overflow-hidden"
			data-testid={`agent-group-${agentId}`}
		>
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				aria-expanded={isExpanded}
				aria-controls={panelId}
				className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
			>
				<div className="flex items-center gap-2">
					{isExpanded ? (
						<ChevronDown className="h-4 w-4 text-muted-foreground" />
					) : (
						<ChevronRight className="h-4 w-4 text-muted-foreground" />
					)}
					<Icon className={cn("h-4 w-4", config.color)} />
					<span className="font-medium text-sm">
						<Trans i18nKey={config.nameKey} />
					</span>
					<Badge variant="secondary" className="text-[10px]">
						{suggestions.length}
					</Badge>
					{hasPending && (
						<Badge variant="default" className="text-[10px]">
							<Trans
								i18nKey="agentSuggestions:countPending"
								values={{ count: pendingCount }}
							/>
						</Badge>
					)}
				</div>
			</button>

			<div id={panelId} className="border-t" aria-hidden={!isExpanded}>
				{isExpanded && (
					<>
						{/* Bulk actions and comparison controls */}
						<div className="flex items-center justify-between gap-2 p-2 bg-muted/30 border-b">
							{/* Run history dropdown for comparison */}
							{hasHistory && onSelectCompareRun && (
								<RunHistoryDropdown
									agentId={agentId}
									runs={runHistory}
									selectedRunId={selectedCompareRunId ?? null}
									onSelectRun={handleSelectCompareRun}
									currentRunId={currentRunId}
								/>
							)}

							{hasPending && viewMode === "suggestions" && (
								<div className="flex items-center gap-2 ml-auto">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onRejectAll(agentId)}
										disabled={isBulkProcessing}
										className="h-7 text-xs"
										data-testid={`reject-all-${agentId}`}
									>
										<XSquare className="h-3 w-3 mr-1" />
										<Trans i18nKey="agentSuggestions:rejectAll" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onAcceptAll(agentId)}
										disabled={isBulkProcessing}
										className="h-7 text-xs"
										data-testid={`accept-all-${agentId}`}
									>
										<CheckCheck className="h-3 w-3 mr-1" />
										<Trans i18nKey="agentSuggestions:acceptAll" />
									</Button>
								</div>
							)}
						</div>

						{/* View mode tabs when comparing */}
						{selectedCompareRunId && previousRunSuggestions && (
							<Tabs
								value={viewMode}
								onValueChange={(v) => {
									if (VIEW_MODES.includes(v as ViewMode)) {
										setViewMode(v as ViewMode);
									}
								}}
								className="w-full"
							>
								<TabsList className="w-full grid grid-cols-2 h-8 rounded-none border-b">
									<TabsTrigger
										value="suggestions"
										className="text-xs data-[state=active]:shadow-none"
									>
										<Trans i18nKey="agentSuggestions:comparison.suggestionsTab">
											Suggestions
										</Trans>
									</TabsTrigger>
									<TabsTrigger
										value="comparison"
										className="text-xs data-[state=active]:shadow-none"
									>
										<Trans i18nKey="agentSuggestions:comparison.comparisonTab">
											Comparison
										</Trans>
									</TabsTrigger>
								</TabsList>

								<TabsContent value="suggestions" className="mt-0">
									{/* Suggestion cards */}
									<div className="p-2 space-y-2">
										{suggestions.map((suggestion) => (
											<SuggestionCard
												key={suggestion.id}
												suggestion={suggestion}
												onAccept={onAccept}
												onReject={onReject}
												isProcessing={
													processingIds.has(suggestion.id) || isBulkProcessing
												}
											/>
										))}
									</div>
								</TabsContent>

								<TabsContent value="comparison" className="mt-0">
									{/* TODO: Expose viewMode toggle (unified/side-by-side) in comparison tab header.
									    Currently hardcoded to "unified". SuggestionDiffView supports both modes. */}
									<SuggestionDiffView
										currentSuggestions={suggestions}
										previousSuggestions={previousRunSuggestions}
										viewMode="unified"
									/>
								</TabsContent>
							</Tabs>
						)}

						{/* Loading state when fetching previous run suggestions */}
						{selectedCompareRunId && isLoadingPreviousSuggestions && (
							<div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
								<Loader2 className="h-5 w-5 animate-spin mb-2" />
								<p className="text-xs">
									<Trans i18nKey="agentSuggestions:comparison.loadingPrevious">
										Loading previous run...
									</Trans>
								</p>
							</div>
						)}

						{/* Error state when loading previous run failed */}
						{selectedCompareRunId &&
							hasFailedPreviousSuggestions &&
							!isLoadingPreviousSuggestions && (
								<div className="flex flex-col items-center justify-center h-24 text-destructive">
									<AlertTriangle className="h-5 w-5 mb-2" />
									<p className="text-xs">
										<Trans i18nKey="agentSuggestions:comparison.errorLoading">
											Failed to load comparison
										</Trans>
									</p>
								</div>
							)}

						{/* Regular suggestion cards when not comparing */}
						{(!selectedCompareRunId ||
							(!previousRunSuggestions &&
								!isLoadingPreviousSuggestions &&
								!hasFailedPreviousSuggestions)) && (
							<div className="p-2 space-y-2">
								{suggestions.map((suggestion) => (
									<SuggestionCard
										key={suggestion.id}
										suggestion={suggestion}
										onAccept={onAccept}
										onReject={onReject}
										isProcessing={
											processingIds.has(suggestion.id) || isBulkProcessing
										}
									/>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

// Comparison state interface for consolidated state management
interface ComparisonState {
	selectedCompareRunIds: Partial<Record<AgentId, string | null>>;
	previousRunSuggestionsCache: Record<string, AgentSuggestion[]>;
	loadingPreviousRuns: Set<string>;
	failedRunIds: Set<string>;
}

export interface AgentSuggestionsPanelProps {
	suggestions: AgentSuggestion[];
	onAcceptSuggestion: (suggestionId: string) => Promise<void>;
	onRejectSuggestion: (suggestionId: string) => Promise<void>;
	onAcceptAll?: (agentId?: AgentId) => Promise<void>;
	onRejectAll?: (agentId?: AgentId) => Promise<void>;
	isLoading?: boolean;
	/** Run history for comparison feature */
	runHistory?: AgentRun[];
	/** ID of the current run (to exclude from comparison dropdown) */
	currentRunId?: string;
	/** Callback to fetch suggestions for a specific run */
	onFetchRunSuggestions?: (runId: string) => Promise<AgentSuggestion[]>;
}

export function AgentSuggestionsPanel({
	suggestions,
	onAcceptSuggestion,
	onRejectSuggestion,
	onAcceptAll,
	onRejectAll,
	isLoading = false,
	runHistory = [],
	currentRunId,
	onFetchRunSuggestions,
}: AgentSuggestionsPanelProps) {
	const [processingState, setProcessingState] = useState({
		processingIds: new Set<string>(),
		isBulkProcessing: false,
	});

	// Consolidated comparison state (Issue #11)
	const [comparisonState, setComparisonState] = useState<ComparisonState>({
		selectedCompareRunIds: {},
		previousRunSuggestionsCache: {},
		loadingPreviousRuns: new Set(),
		failedRunIds: new Set(),
	});

	// Use ref for cache to stabilize callback (Issue #9)
	// The ref provides a stable reference for the async callback (doesn't trigger re-renders
	// or cause dependency changes), while the state persists the value for renders.
	//
	// Invariant: The ref is the authoritative, write-through cache used to avoid stale
	// closures in handleSelectCompareRun (checking if a run is already cached before
	// fetching). comparisonState.previousRunSuggestionsCache drives re-renders and must
	// be updated via setComparisonState. Whenever previousRunSuggestionsCacheRef.current
	// is mutated, comparisonState.previousRunSuggestionsCache must also be updated to
	// keep UI state consistent.
	const previousRunSuggestionsCacheRef = useRef<
		Record<string, AgentSuggestion[]>
	>(comparisonState.previousRunSuggestionsCache);

	const processingIds = processingState.processingIds;
	const isBulkProcessing = processingState.isBulkProcessing;

	// Group suggestions by agent
	const suggestionsByAgent = useMemo(() => {
		const grouped: Partial<Record<AgentId, AgentSuggestion[]>> = {};

		for (const suggestion of suggestions) {
			const agentSuggestions = grouped[suggestion.agentId];
			if (!agentSuggestions) {
				grouped[suggestion.agentId] = [];
			}
			grouped[suggestion.agentId]?.push(suggestion);
		}

		// Sort each group by priority (high -> medium -> low) then by status (pending first)
		const priorityOrder: Record<AgentSuggestionPriority, number> = {
			high: 0,
			medium: 1,
			low: 2,
		};
		const statusOrder: Record<AgentSuggestionStatus, number> = {
			pending: 0,
			accepted: 1,
			rejected: 2,
			applied: 3,
		};

		for (const agentIdKey of Object.keys(grouped) as AgentId[]) {
			const agentSuggestions = grouped[agentIdKey];
			if (agentSuggestions) {
				agentSuggestions.sort((a, b) => {
					const priorityDiff =
						priorityOrder[a.priority] - priorityOrder[b.priority];
					if (priorityDiff !== 0) return priorityDiff;
					return statusOrder[a.status] - statusOrder[b.status];
				});
			}
		}

		return grouped;
	}, [suggestions]);

	// Count totals (single pass)
	const stats = useMemo(() => {
		let pending = 0;
		let accepted = 0;
		let rejected = 0;
		let applied = 0;

		for (const s of suggestions) {
			if (s.status === "pending") pending++;
			else if (s.status === "accepted") accepted++;
			else if (s.status === "rejected") rejected++;
			else if (s.status === "applied") applied++;
		}

		return { pending, accepted, rejected, applied, total: suggestions.length };
	}, [suggestions]);

	const handleAccept = useCallback(
		async (suggestionId: string) => {
			if (isBulkProcessing) return;
			setProcessingState((prev) => ({
				...prev,
				processingIds: new Set(prev.processingIds).add(suggestionId),
			}));
			try {
				await onAcceptSuggestion(suggestionId);
			} catch (error) {
				getLogger().error("Failed to accept suggestion", {
					suggestionId,
					error,
				});
			} finally {
				setProcessingState((prev) => {
					const next = new Set(prev.processingIds);
					next.delete(suggestionId);
					return { ...prev, processingIds: next };
				});
			}
		},
		[onAcceptSuggestion, isBulkProcessing],
	);

	const handleReject = useCallback(
		async (suggestionId: string) => {
			if (isBulkProcessing) return;
			setProcessingState((prev) => ({
				...prev,
				processingIds: new Set(prev.processingIds).add(suggestionId),
			}));
			try {
				await onRejectSuggestion(suggestionId);
			} catch (error) {
				getLogger().error("Failed to reject suggestion", {
					suggestionId,
					error,
				});
			} finally {
				setProcessingState((prev) => {
					const next = new Set(prev.processingIds);
					next.delete(suggestionId);
					return { ...prev, processingIds: next };
				});
			}
		},
		[onRejectSuggestion, isBulkProcessing],
	);

	const handleAcceptAllForAgent = useCallback(
		async (agentId: AgentId) => {
			if (isBulkProcessing) return;
			setProcessingState((prev) => ({ ...prev, isBulkProcessing: true }));
			try {
				if (onAcceptAll) {
					await onAcceptAll(agentId);
				} else {
					const agentSuggestions = suggestionsByAgent[agentId] || [];
					const pending = agentSuggestions.filter(
						(s) => s.status === "pending",
					);
					await Promise.all(pending.map((s) => handleAccept(s.id)));
				}
			} catch (error) {
				getLogger().error("Failed to accept all suggestions for agent", {
					agentId,
					error,
				});
			} finally {
				setProcessingState((prev) => ({ ...prev, isBulkProcessing: false }));
			}
		},
		[isBulkProcessing, onAcceptAll, suggestionsByAgent, handleAccept],
	);

	const handleRejectAllForAgent = useCallback(
		async (agentId: AgentId) => {
			if (isBulkProcessing) return;
			setProcessingState((prev) => ({ ...prev, isBulkProcessing: true }));
			try {
				if (onRejectAll) {
					await onRejectAll(agentId);
				} else {
					const agentSuggestions = suggestionsByAgent[agentId] || [];
					const pending = agentSuggestions.filter(
						(s) => s.status === "pending",
					);
					await Promise.all(pending.map((s) => handleReject(s.id)));
				}
			} catch (error) {
				getLogger().error("Failed to reject all suggestions for agent", {
					agentId,
					error,
				});
			} finally {
				setProcessingState((prev) => ({ ...prev, isBulkProcessing: false }));
			}
		},
		[isBulkProcessing, onRejectAll, suggestionsByAgent, handleReject],
	);

	// Global handlers for Accept All / Reject All
	// Note: These handlers are only called when their respective buttons are rendered,
	// which only happens when onAcceptAll/onRejectAll props are provided.
	const handleAcceptAllGlobal = useCallback(async () => {
		if (isBulkProcessing || !onAcceptAll) return;
		setProcessingState((prev) => ({ ...prev, isBulkProcessing: true }));
		try {
			await onAcceptAll();
		} catch (error) {
			getLogger().error("Failed to accept all suggestions globally", { error });
		} finally {
			setProcessingState((prev) => ({ ...prev, isBulkProcessing: false }));
		}
	}, [isBulkProcessing, onAcceptAll]);

	const handleRejectAllGlobal = useCallback(async () => {
		if (isBulkProcessing || !onRejectAll) return;
		setProcessingState((prev) => ({ ...prev, isBulkProcessing: true }));
		try {
			await onRejectAll();
		} catch (error) {
			getLogger().error("Failed to reject all suggestions globally", { error });
		} finally {
			setProcessingState((prev) => ({ ...prev, isBulkProcessing: false }));
		}
	}, [isBulkProcessing, onRejectAll]);

	// Handle selecting a comparison run for an agent
	const handleSelectCompareRun = useCallback(
		async (agentId: AgentId, runId: string | null) => {
			// Guard: exit early if this run is already being fetched
			if (runId && comparisonState.loadingPreviousRuns.has(runId)) {
				// Still update selection so UI reflects user choice
				setComparisonState((prev) => ({
					...prev,
					selectedCompareRunIds: {
						...prev.selectedCompareRunIds,
						[agentId]: runId,
					},
				}));
				return;
			}

			// Fetch suggestions for the selected run if not cached
			if (
				runId &&
				onFetchRunSuggestions &&
				!previousRunSuggestionsCacheRef.current[runId]
			) {
				// Set selected run AND loading flag together to prevent transient state flicker
				setComparisonState((prev) => {
					const nextLoading = new Set(prev.loadingPreviousRuns);
					nextLoading.add(runId);
					return {
						...prev,
						selectedCompareRunIds: {
							...prev.selectedCompareRunIds,
							[agentId]: runId,
						},
						loadingPreviousRuns: nextLoading,
					};
				});
				try {
					const runSuggestions = await onFetchRunSuggestions(runId);
					previousRunSuggestionsCacheRef.current[runId] = runSuggestions;
					setComparisonState((prev) => ({
						...prev,
						previousRunSuggestionsCache: {
							...prev.previousRunSuggestionsCache,
							[runId]: runSuggestions,
						},
						loadingPreviousRuns: (() => {
							const next = new Set(prev.loadingPreviousRuns);
							next.delete(runId);
							return next;
						})(),
						// Clear failedRunIds on successful fetch to allow retry recovery
						failedRunIds: (() => {
							const next = new Set(prev.failedRunIds);
							next.delete(runId);
							return next;
						})(),
					}));
				} catch (error) {
					getLogger().error("Failed to fetch suggestions for run", {
						runId,
						error,
					});
					setComparisonState((prev) => {
						const nextLoading = new Set(prev.loadingPreviousRuns);
						nextLoading.delete(runId);
						const nextFailed = new Set(prev.failedRunIds);
						nextFailed.add(runId);
						return {
							...prev,
							loadingPreviousRuns: nextLoading,
							failedRunIds: nextFailed,
						};
					});
				}
			} else {
				// No fetch needed - just update selected run
				setComparisonState((prev) => ({
					...prev,
					selectedCompareRunIds: {
						...prev.selectedCompareRunIds,
						[agentId]: runId,
					},
				}));
			}
		},
		[onFetchRunSuggestions, comparisonState.loadingPreviousRuns],
	);

	// Get previous run suggestions for an agent
	const getPreviousRunSuggestions = useCallback(
		(agentId: AgentId): AgentSuggestion[] | undefined => {
			const selectedRunId = comparisonState.selectedCompareRunIds[agentId];
			if (!selectedRunId) return undefined;
			return comparisonState.previousRunSuggestionsCache[selectedRunId];
		},
		[
			comparisonState.selectedCompareRunIds,
			comparisonState.previousRunSuggestionsCache,
		],
	);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
				<Loader2 className="h-8 w-8 animate-spin mb-2" />
				<p className="text-sm">
					<Trans i18nKey="agentSuggestions:loading" />
				</p>
			</div>
		);
	}

	if (suggestions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
				<Sparkles className="h-8 w-8 mb-2 opacity-50" />
				<p className="text-sm">
					<Trans i18nKey="agentSuggestions:noSuggestions" />
				</p>
				<p className="text-xs mt-1">
					<Trans i18nKey="agentSuggestions:runReview" />
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full" data-testid="agent-suggestions-panel">
			{/* Header with stats */}
			<div className="border-b p-3 bg-muted/20">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm">
						<Trans i18nKey="agentSuggestions:title" />
					</h3>
					<div className="flex items-center gap-2 text-xs">
						{stats.pending > 0 && (
							<Badge variant="secondary">
								<Trans
									i18nKey="agentSuggestions:countPending"
									values={{ count: stats.pending }}
								/>
							</Badge>
						)}
						{stats.accepted > 0 && (
							<Badge variant="default">
								<Trans
									i18nKey="agentSuggestions:countAccepted"
									values={{ count: stats.accepted }}
								/>
							</Badge>
						)}
						{stats.applied > 0 && (
							<Badge variant="outline">
								<Trans
									i18nKey="agentSuggestions:countApplied"
									values={{ count: stats.applied }}
								/>
							</Badge>
						)}
					</div>
				</div>
			</div>

			{/* Global bulk actions - only render if handlers are provided */}
			{stats.pending > 0 && (onRejectAll || onAcceptAll) && (
				<div className="flex items-center justify-end gap-2 p-2 border-b bg-muted/10">
					{onRejectAll && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRejectAllGlobal}
							disabled={isBulkProcessing}
							className="h-7 text-xs"
							data-testid="reject-all-global"
						>
							<XSquare className="h-3 w-3 mr-1" />
							<Trans i18nKey="agentSuggestions:rejectAll" />
						</Button>
					)}
					{onAcceptAll && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleAcceptAllGlobal}
							disabled={isBulkProcessing}
							className="h-7 text-xs"
							data-testid="accept-all-global"
						>
							<CheckCheck className="h-3 w-3 mr-1" />
							<Trans i18nKey="agentSuggestions:acceptAll" />
						</Button>
					)}
				</div>
			)}

			{/* Agent groups */}
			<ScrollArea className="flex-1">
				<div className="p-3 space-y-3">
					{(Object.keys(AGENT_CONFIG) as AgentId[]).map((agentId) => {
						const agentSuggestions = suggestionsByAgent[agentId];
						if (!agentSuggestions || agentSuggestions.length === 0) return null;

						const selectedCompareRunId =
							comparisonState.selectedCompareRunIds[agentId];
						const previousSuggestions = getPreviousRunSuggestions(agentId);
						const isLoadingPrevious = selectedCompareRunId
							? comparisonState.loadingPreviousRuns.has(selectedCompareRunId)
							: false;
						const hasFailedPrevious = selectedCompareRunId
							? comparisonState.failedRunIds.has(selectedCompareRunId)
							: false;

						return (
							<AgentGroup
								key={agentId}
								agentId={agentId}
								suggestions={agentSuggestions}
								onAccept={handleAccept}
								onReject={handleReject}
								onAcceptAll={handleAcceptAllForAgent}
								onRejectAll={handleRejectAllForAgent}
								processingIds={processingIds}
								isBulkProcessing={isBulkProcessing}
								runHistory={runHistory}
								selectedCompareRunId={selectedCompareRunId}
								onSelectCompareRun={handleSelectCompareRun}
								currentRunId={currentRunId}
								previousRunSuggestions={
									isLoadingPrevious || hasFailedPrevious
										? undefined
										: previousSuggestions
								}
								isLoadingPreviousSuggestions={isLoadingPrevious}
								hasFailedPreviousSuggestions={hasFailedPrevious}
							/>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}
