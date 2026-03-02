"use client";

import type { AgentId, AgentRun } from "@kit/mastra";
import { Badge } from "@kit/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { Trans } from "@kit/ui/trans";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Props for the RunHistoryDropdown component that allows
 * selecting a historical run for comparison.
 */
interface RunHistoryDropdownProps {
	/** The agent ID to filter runs for */
	agentId: AgentId;
	/** All available runs to display in the dropdown */
	runs: AgentRun[];
	/** Currently selected run ID, or null for current run */
	selectedRunId: string | null;
	/** Callback when a run is selected (null = current run) */
	onSelectRun: (runId: string | null) => void;
	/** The current run ID to exclude from the dropdown options */
	currentRunId?: string;
}

/**
 * Formats a date string into a human-readable relative time.
 * Falls back to the original string if parsing fails.
 * @param dateStr - ISO date string to format
 * @returns Human-readable relative time (e.g., "5 minutes ago")
 */
function formatRunTime(dateStr: string) {
	try {
		return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
	} catch {
		return dateStr;
	}
}

/**
 * Returns the appropriate badge variant for a run status.
 * @param status - The status of the agent run
 * @returns Badge variant for styling
 */
function getStatusBadgeVariant(status: AgentRun["status"]) {
	switch (status) {
		case "completed":
			return "default";
		case "failed":
			return "destructive";
		case "running":
			return "secondary";
		default:
			return "outline";
	}
}

/**
 * A dropdown component for selecting a historical agent run to compare against.
 *
 * Displays runs filtered to the specified agent, sorted by creation date (newest first).
 * Includes the current run as the default option.
 *
 * @example
 * ```tsx
 * <RunHistoryDropdown
 *   agentId="partner"
 *   runs={allRuns}
 *   selectedRunId={selectedId}
 *   onSelectRun={handleSelect}
 *   currentRunId={currentRun.id}
 * />
 * ```
 */
export function RunHistoryDropdown({
	agentId,
	runs,
	selectedRunId,
	onSelectRun,
	currentRunId,
}: RunHistoryDropdownProps) {
	const { t } = useTranslation("agentSuggestions");

	// Filter to only show runs for this agent, excluding the current run
	const historicalRuns = useMemo(
		() =>
			runs
				.filter((run) => run.agentId === agentId && run.id !== currentRunId)
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				),
		[runs, agentId, currentRunId],
	);

	if (historicalRuns.length === 0) {
		return null;
	}

	return (
		<div
			className="flex items-center gap-2"
			data-testid={`run-history-dropdown-${agentId}`}
		>
			<History className="h-4 w-4 text-muted-foreground" />
			<Select
				value={selectedRunId ?? "current"}
				onValueChange={(value) =>
					onSelectRun(value === "current" ? null : value)
				}
			>
				<SelectTrigger className="h-8 w-auto min-w-[180px] text-xs">
					<SelectValue placeholder={t("comparison.selectRun")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="current" className="text-xs">
						<span className="font-medium">
							<Trans i18nKey="agentSuggestions:comparison.currentRun">
								Current Run
							</Trans>
						</span>
					</SelectItem>
					{historicalRuns.map((run) => (
						<SelectItem key={run.id} value={run.id} className="text-xs">
							<div className="flex items-center gap-2">
								<span>{formatRunTime(run.createdAt)}</span>
								<Badge
									variant={getStatusBadgeVariant(run.status)}
									className="text-[10px] px-1 py-0"
								>
									<Trans i18nKey={`agentSuggestions:runStatus.${run.status}`}>
										{run.status}
									</Trans>
								</Badge>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
