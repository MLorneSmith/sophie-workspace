"use client";

import type { AgentSuggestion } from "@kit/mastra";
import { Badge } from "@kit/ui/badge";
import { ScrollArea } from "@kit/ui/scroll-area";

import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Loader2,
	Minus,
	Plus,
	Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { computeDiff, type DiffChange } from "./_lib/compute-suggestion-diff";

/**
 * Static configuration for diff change types (hoisted to module scope to avoid
 * re-allocation on every render).
 */
const DIFF_TYPE_CONFIG = {
	added: {
		icon: Plus,
		iconColor: "text-green-500",
		bgColor: "bg-green-500/10 border-green-500/30",
		badgeVariant: "default" as const,
		badgeI18nKey: "agentSuggestions:comparison.added",
	},
	removed: {
		icon: Minus,
		iconColor: "text-red-500",
		bgColor: "bg-red-500/10 border-red-500/30",
		badgeVariant: "destructive" as const,
		badgeI18nKey: "agentSuggestions:comparison.removed",
	},
	modified: {
		icon: ArrowRight,
		iconColor: "text-amber-500",
		bgColor: "bg-amber-500/10 border-amber-500/30",
		badgeVariant: "secondary" as const,
		badgeI18nKey: "agentSuggestions:comparison.modified",
	},
	unchanged: {
		icon: Sparkles,
		iconColor: "text-muted-foreground",
		bgColor: "bg-muted/30",
		badgeVariant: "outline" as const,
		badgeI18nKey: "agentSuggestions:comparison.unchanged",
	},
} as const;

/**
 * Props for the SuggestionDiffView component that displays
 * a comparison between current and previous agent suggestions.
 */
interface SuggestionDiffViewProps {
	/** The current set of suggestions to compare */
	currentSuggestions: AgentSuggestion[];
	/**
	 * Previous run suggestions to compare against.
	 * - `undefined` = loading state (shows spinner)
	 * - `[]` = no previous run (shows empty state)
	 * - array = data loaded, show diff
	 */
	previousSuggestions: AgentSuggestion[] | undefined;
	/** Display mode: unified list or side-by-side columns */
	viewMode?: "unified" | "side-by-side";
}

/**
 * Props for the DiffCard component that renders a single
 * suggestion change with appropriate styling.
 */
interface DiffCardProps {
	/** The change to display */
	change: DiffChange;
}

/**
 * Renders a single diff change card with color-coded styling
 * based on the change type (added/removed/modified/unchanged).
 */
function DiffCard({ change }: DiffCardProps) {
	const { type, suggestion, previousSuggestion, changeReason } = change;

	const config = DIFF_TYPE_CONFIG[type];
	const Icon = config.icon;

	return (
		<div
			className={cn(
				"border rounded-lg p-3 transition-all",
				config.bgColor,
				type === "unchanged" && "opacity-60",
			)}
			data-testid={`diff-card-${type}-${suggestion.id}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-2 flex-1 min-w-0">
					<Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium line-clamp-2">
							{suggestion.summary}
						</p>
						<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
							<span>
								<Trans i18nKey={`agentSuggestions:type.${suggestion.type}`} />
							</span>
							<span>•</span>
							<span>
								<Trans
									i18nKey={`agentSuggestions:priority.${suggestion.priority}`}
								/>
							</span>
							<span>•</span>
							<Trans
								i18nKey="agentSuggestions:slideLabel"
								values={{ slideId: suggestion.slideId }}
							/>
						</div>
						{type === "modified" && changeReason && (
							// TODO(i18n): changeReason contains raw English strings from compute-suggestion-diff.ts
							// (e.g., "priority: high → low", "details updated"). For full i18n, computeDiff should
							// return structured change objects { field, from, to } so the UI can compose
							// translated messages. Tracked as follow-up work.
							<div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
								<ArrowUp className="h-3 w-3 inline mr-1" />
								{changeReason}
							</div>
						)}
						{type === "modified" && previousSuggestion && (
							<div className="mt-1 text-xs text-muted-foreground line-through">
								{previousSuggestion.summary}
							</div>
						)}
					</div>
				</div>
				<Badge variant={config.badgeVariant} className="text-[10px] shrink-0">
					<Trans i18nKey={config.badgeI18nKey} />
				</Badge>
			</div>
		</div>
	);
}

/**
 * Displays a diff view comparing current agent suggestions against a previous run.
 *
 * Supports two view modes:
 * - **unified**: All changes in a single sorted list with color-coded badges
 * - **side-by-side**: Two columns showing previous and current suggestions
 *
 * Automatically handles loading states and empty previous runs with appropriate UI.
 *
 * @example
 * ```tsx
 * <SuggestionDiffView
 *   currentSuggestions={currentRun.suggestions}
 *   previousSuggestions={previousRun?.suggestions}
 *   viewMode="unified"
 * />
 * ```
 */
export function SuggestionDiffView({
	currentSuggestions,
	previousSuggestions,
	viewMode = "unified",
}: SuggestionDiffViewProps) {
	// Handle loading state (undefined) vs valid data (empty array means run exists but produced 0 suggestions)
	const isLoading = previousSuggestions === undefined;
	// Note: empty array is a valid comparison input - all current suggestions will be "added"
	// We only show "no previous run" when previousSuggestions is undefined (loading/not available)

	// Skip computeDiff during loading - return empty result to avoid wasteful computation
	const diff = useMemo(() => {
		if (isLoading) {
			// Return empty diff during loading - we won't render it anyway
			return {
				added: [],
				removed: [],
				modified: [],
				unchanged: [],
				allChanges: [],
			};
		}
		return computeDiff(currentSuggestions, previousSuggestions);
	}, [currentSuggestions, previousSuggestions, isLoading]);

	// Pre-build Sets for O(1) lookups in side-by-side view (avoid O(n×m) scans)
	const diffLookup = useMemo(
		() => ({
			addedIds: new Set(diff.added.map((s) => s.id)),
			removedIds: new Set(diff.removed.map((s) => s.id)),
			modifiedCurrentIds: new Set(diff.modified.map((m) => m.current.id)),
			modifiedPreviousIds: new Set(diff.modified.map((m) => m.previous.id)),
		}),
		[diff],
	);

	const stats = useMemo(
		() => ({
			added: diff.added.length,
			removed: diff.removed.length,
			modified: diff.modified.length,
			unchanged: diff.unchanged.length,
		}),
		[diff],
	);

	// Show loading spinner while fetching previous run data
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
				<Loader2 className="h-6 w-6 mb-2 animate-spin" />
				<p className="text-sm">
					<Trans i18nKey="agentSuggestions:comparison.loading">
						Loading previous run...
					</Trans>
				</p>
			</div>
		);
	}

	// At this point, previousSuggestions is an array (possibly empty).
	// An empty array is valid - it means the previous run produced 0 suggestions,
	// so all current suggestions will appear as "added" in the diff.
	// We proceed to render the diff view.

	if (viewMode === "side-by-side") {
		return (
			<div
				className="flex flex-col h-full"
				data-testid="suggestion-diff-view-side-by-side"
			>
				{/* Stats bar */}
				<div className="flex items-center gap-3 p-2 border-b bg-muted/20">
					{stats.added > 0 && (
						<div className="flex items-center gap-1 text-xs text-green-600">
							<ArrowUp className="h-3 w-3" />
							<span>
								<Trans
									i18nKey="agentSuggestions:comparison.statsAdded"
									values={{ count: stats.added }}
								>
									{{ count: stats.added }} added
								</Trans>
							</span>
						</div>
					)}
					{stats.removed > 0 && (
						<div className="flex items-center gap-1 text-xs text-red-600">
							<ArrowDown className="h-3 w-3" />
							<span>
								<Trans
									i18nKey="agentSuggestions:comparison.statsRemoved"
									values={{ count: stats.removed }}
								>
									{{ count: stats.removed }} removed
								</Trans>
							</span>
						</div>
					)}
					{stats.modified > 0 && (
						<div className="flex items-center gap-1 text-xs text-amber-600">
							<ArrowRight className="h-3 w-3" />
							<span>
								<Trans
									i18nKey="agentSuggestions:comparison.statsModified"
									values={{ count: stats.modified }}
								>
									{{ count: stats.modified }} modified
								</Trans>
							</span>
						</div>
					)}
				</div>

				{/* Side-by-side view */}
				<div className="flex-1 grid grid-cols-2 gap-2 p-2">
					<div className="border rounded-lg overflow-hidden">
						<div className="bg-muted/30 px-3 py-2 border-b text-sm font-medium">
							<Trans i18nKey="agentSuggestions:comparison.previousRun">
								Previous Run
							</Trans>
						</div>
						<ScrollArea className="h-[300px]">
							<div className="p-2 space-y-2">
								{(previousSuggestions ?? []).map((s) => {
									const isRemoved = diffLookup.removedIds.has(s.id);
									const isModifiedPrev = diffLookup.modifiedPreviousIds.has(
										s.id,
									);
									const changeType = isRemoved
										? "removed"
										: isModifiedPrev
											? "modified"
											: "unchanged";

									return (
										<DiffCard
											key={s.id}
											change={{
												type: changeType,
												suggestion: s,
											}}
										/>
									);
								})}
							</div>
						</ScrollArea>
					</div>
					<div className="border rounded-lg overflow-hidden">
						<div className="bg-muted/30 px-3 py-2 border-b text-sm font-medium">
							<Trans i18nKey="agentSuggestions:comparison.currentRun">
								Current Run
							</Trans>
						</div>
						<ScrollArea className="h-[300px]">
							<div className="p-2 space-y-2">
								{currentSuggestions.map((s) => {
									const isAdded = diffLookup.addedIds.has(s.id);
									const isModifiedCurrent = diffLookup.modifiedCurrentIds.has(
										s.id,
									);
									const changeType = isAdded
										? "added"
										: isModifiedCurrent
											? "modified"
											: "unchanged";

									return (
										<DiffCard
											key={s.id}
											change={{
												type: changeType,
												suggestion: s,
											}}
										/>
									);
								})}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		);
	}

	// Unified view (default)
	return (
		<div
			className="flex flex-col h-full"
			data-testid="suggestion-diff-view-unified"
		>
			{/* Stats bar */}
			<div className="flex items-center gap-3 p-2 border-b bg-muted/20">
				{stats.added > 0 && (
					<Badge variant="default" className="text-[10px] bg-green-600">
						<Plus className="h-3 w-3 mr-1" />
						<Trans
							i18nKey="agentSuggestions:comparison.statsAdded"
							values={{ count: stats.added }}
						>
							{{ count: stats.added }} added
						</Trans>
					</Badge>
				)}
				{stats.removed > 0 && (
					<Badge variant="destructive" className="text-[10px]">
						<Minus className="h-3 w-3 mr-1" />
						<Trans
							i18nKey="agentSuggestions:comparison.statsRemoved"
							values={{ count: stats.removed }}
						>
							{{ count: stats.removed }} removed
						</Trans>
					</Badge>
				)}
				{stats.modified > 0 && (
					<Badge variant="secondary" className="text-[10px]">
						<ArrowRight className="h-3 w-3 mr-1" />
						<Trans
							i18nKey="agentSuggestions:comparison.statsModified"
							values={{ count: stats.modified }}
						>
							{{ count: stats.modified }} modified
						</Trans>
					</Badge>
				)}
				{stats.unchanged > 0 && (
					<Badge variant="outline" className="text-[10px]">
						<Trans
							i18nKey="agentSuggestions:comparison.statsUnchanged"
							values={{ count: stats.unchanged }}
						>
							{{ count: stats.unchanged }} unchanged
						</Trans>
					</Badge>
				)}
			</div>

			{/* Unified diff list */}
			<ScrollArea className="flex-1">
				<div className="p-2 space-y-2">
					{diff.allChanges.map((change) => (
						<DiffCard
							key={`${change.type}-${change.suggestion.id}`}
							change={change}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
