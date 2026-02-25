"use client";

import type {
	AgentId,
	AgentSuggestion,
	AgentSuggestionPriority,
	AgentSuggestionStatus,
} from "@kit/mastra";
import { createClientLogger } from "@kit/shared/logger";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader } from "@kit/ui/card";
import { ScrollArea } from "@kit/ui/scroll-area";
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
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Initialize logger after imports
const clientLogger = createClientLogger("AGENT-SUGGESTIONS-PANEL");
const { getLogger } = clientLogger;

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
}: AgentGroupProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const panelId = `agent-group-${agentId}`;
	const config = AGENT_CONFIG[agentId] ?? AGENT_CONFIG.partner;
	const Icon = config.icon;

	const pendingCount = useMemo(
		() => suggestions.filter((s) => s.status === "pending").length,
		[suggestions],
	);

	const hasPending = pendingCount > 0;

	if (suggestions.length === 0) {
		return null;
	}

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
						{/* Bulk actions for pending suggestions */}
						{hasPending && (
							<div className="flex items-center justify-end gap-2 p-2 bg-muted/30 border-b">
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
					</>
				)}
			</div>
		</div>
	);
}

export interface AgentSuggestionsPanelProps {
	suggestions: AgentSuggestion[];
	onAcceptSuggestion: (suggestionId: string) => Promise<void>;
	onRejectSuggestion: (suggestionId: string) => Promise<void>;
	onAcceptAll?: (agentId?: AgentId) => Promise<void>;
	onRejectAll?: (agentId?: AgentId) => Promise<void>;
	isLoading?: boolean;
}

export function AgentSuggestionsPanel({
	suggestions,
	onAcceptSuggestion,
	onRejectSuggestion,
	onAcceptAll,
	onRejectAll,
	isLoading = false,
}: AgentSuggestionsPanelProps) {
	const [processingState, setProcessingState] = useState({
		processingIds: new Set<string>(),
		isBulkProcessing: false,
	});

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
							/>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}

export default AgentSuggestionsPanel;
