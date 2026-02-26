import type { AgentSuggestion } from "@kit/mastra";

/**
 * Represents a single change in the diff view, including the change type,
 * the suggestion being changed, and optional metadata for modified items.
 */
export interface DiffChange {
	type: "added" | "removed" | "modified" | "unchanged";
	suggestion: AgentSuggestion;
	previousSuggestion?: AgentSuggestion;
	changeReason?: string;
}

/**
 * The complete result of comparing two sets of agent suggestions,
 * categorized by the type of change.
 */
export interface DiffResult {
	/** Suggestions that exist in current but not in previous */
	added: AgentSuggestion[];
	/** Suggestions that exist in previous but not in current */
	removed: AgentSuggestion[];
	/** Suggestions that exist in both but with changed properties */
	modified: Array<{
		current: AgentSuggestion;
		previous: AgentSuggestion;
		changes: string[];
	}>;
	/** Suggestions that are identical between both sets */
	unchanged: AgentSuggestion[];
	/** All changes combined and sorted for unified view rendering */
	allChanges: DiffChange[];
}

/**
 * Computes the diff between two sets of agent suggestions, categorizing
 * each suggestion as added, removed, modified, or unchanged.
 *
 * The algorithm uses a two-phase matching strategy:
 * 1. Exact match by summary (fast path)
 * 2. Fuzzy match by slideId, type, and text similarity (for renamed items)
 *
 * @param current - The current set of suggestions
 * @param previous - The previous set of suggestions to compare against
 * @returns A DiffResult containing categorized changes
 *
 * @example
 * ```ts
 * const diff = computeDiff(currentSuggestions, previousSuggestions);
 * console.log(`Added: ${diff.added.length}, Removed: ${diff.removed.length}`);
 * ```
 */
export function computeDiff(
	current: AgentSuggestion[],
	previous: AgentSuggestion[],
): DiffResult {
	const added: AgentSuggestion[] = [];
	const removed: AgentSuggestion[] = [];
	const modified: Array<{
		current: AgentSuggestion;
		previous: AgentSuggestion;
		changes: string[];
	}> = [];
	const unchanged: AgentSuggestion[] = [];

	// Create map keyed by summary for matching (groups allow duplicates)
	// Note: Only previousBySummary is needed - we iterate over current suggestions
	// and look them up in previous, not the other way around.
	const previousBySummary = new Map<string, AgentSuggestion[]>();

	for (const s of previous) {
		const bySummary = previousBySummary.get(s.summary) ?? [];
		bySummary.push(s);
		previousBySummary.set(s.summary, bySummary);
	}

	// Track which previous suggestions have been matched (to prevent double-matching)
	const consumedPreviousIds = new Set<string>();

	/**
	 * Score-based fuzzy matching for finding the best previous suggestion match.
	 * Returns the best match or undefined if no suitable match found.
	 */
	function findBestFuzzyMatch(
		currentSuggestion: AgentSuggestion,
		previousSuggestions: AgentSuggestion[],
		consumedIds: Set<string>,
	): AgentSuggestion | undefined {
		// Score each candidate based on similarity criteria
		const candidates = previousSuggestions
			.filter(
				(p) =>
					p.id !== currentSuggestion.id &&
					!consumedIds.has(p.id) &&
					p.summary !== currentSuggestion.summary,
			)
			.map((p) => {
				let score = 0;

				// Same slideId is a strong signal (weight: 3)
				if (p.slideId === currentSuggestion.slideId) {
					score += 3;
				}

				// Same type is a strong signal (weight: 2)
				if (p.type === currentSuggestion.type) {
					score += 2;
				}

				// Same priority is a weak signal (weight: 1)
				if (p.priority === currentSuggestion.priority) {
					score += 1;
				}

				// Text similarity bonus (simple word overlap)
				const currentWords = new Set(
					currentSuggestion.summary.toLowerCase().split(/\s+/),
				);
				const prevWords = new Set(p.summary.toLowerCase().split(/\s+/));
				const overlap = [...currentWords].filter((w) =>
					prevWords.has(w),
				).length;
				score += Math.min(overlap * 0.5, 2); // Cap at 2 points

				return { suggestion: p, score };
			})
			.filter((c) => c.score >= 3); // Minimum threshold: slideId OR type match

		if (candidates.length === 0) {
			return undefined;
		}

		// Return the highest-scoring candidate
		candidates.sort((a, b) => b.score - a.score);
		const bestMatch = candidates[0];
		return bestMatch ? bestMatch.suggestion : undefined;
	}

	// Find added and modified
	for (const suggestion of current) {
		const summary = suggestion.summary;
		const prevMatches = previousBySummary.get(summary);

		if (!prevMatches || prevMatches.length === 0) {
			// Use score-based fuzzy matching to find the best previous suggestion
			const possibleMatch = findBestFuzzyMatch(
				suggestion,
				previous,
				consumedPreviousIds,
			);

			if (possibleMatch) {
				const changes: string[] = [];
				if (possibleMatch.priority !== suggestion.priority) {
					changes.push(
						`priority: ${possibleMatch.priority} → ${suggestion.priority}`,
					);
				}
				if (possibleMatch.status !== suggestion.status) {
					changes.push(
						`status: ${possibleMatch.status} → ${suggestion.status}`,
					);
				}
				if (possibleMatch.summary !== suggestion.summary) {
					changes.push("summary changed");
				}
				if (possibleMatch.detail !== suggestion.detail) {
					changes.push("details updated");
				}
				modified.push({
					current: suggestion,
					previous: possibleMatch,
					changes,
				});
				consumedPreviousIds.add(possibleMatch.id);
			} else {
				added.push(suggestion);
			}
		} else {
			// Exact summary match - find first unconsumed match
			const exactMatch = prevMatches.find(
				(p) => !consumedPreviousIds.has(p.id),
			);
			if (!exactMatch) {
				// All exact matches consumed — try fuzzy matching before classifying as added
				const possibleMatch = findBestFuzzyMatch(
					suggestion,
					previous,
					consumedPreviousIds,
				);
				if (possibleMatch) {
					const changes: string[] = [];
					if (possibleMatch.priority !== suggestion.priority) {
						changes.push(
							`priority: ${possibleMatch.priority} → ${suggestion.priority}`,
						);
					}
					if (possibleMatch.status !== suggestion.status) {
						changes.push(
							`status: ${possibleMatch.status} → ${suggestion.status}`,
						);
					}
					if (possibleMatch.summary !== suggestion.summary) {
						changes.push("summary changed");
					}
					if (possibleMatch.detail !== suggestion.detail) {
						changes.push("details updated");
					}
					modified.push({
						current: suggestion,
						previous: possibleMatch,
						changes,
					});
					consumedPreviousIds.add(possibleMatch.id);
				} else {
					added.push(suggestion);
				}
				continue;
			}

			const changes: string[] = [];

			if (exactMatch.priority !== suggestion.priority) {
				changes.push(
					`priority: ${exactMatch.priority} → ${suggestion.priority}`,
				);
			}
			if (exactMatch.status !== suggestion.status) {
				changes.push(`status: ${exactMatch.status} → ${suggestion.status}`);
			}
			if (exactMatch.detail !== suggestion.detail) {
				changes.push("details updated");
			}

			if (changes.length > 0) {
				modified.push({ current: suggestion, previous: exactMatch, changes });
			} else {
				unchanged.push(suggestion);
			}
			consumedPreviousIds.add(exactMatch.id);
		}
	}

	// Find removed (not consumed = not matched to current)
	for (const suggestion of previous) {
		if (!consumedPreviousIds.has(suggestion.id)) {
			removed.push(suggestion);
		}
	}

	// Build all changes for unified view
	const allChanges: DiffChange[] = [
		...added.map((s) => ({ type: "added" as const, suggestion: s })),
		...removed.map((s) => ({ type: "removed" as const, suggestion: s })),
		...modified.map((m) => ({
			type: "modified" as const,
			suggestion: m.current,
			previousSuggestion: m.previous,
			changeReason: m.changes.join(", "),
		})),
		...unchanged.map((s) => ({ type: "unchanged" as const, suggestion: s })),
	].sort((a, b) => {
		// Sort: added first, then modified, then unchanged, then removed
		const order = { added: 0, modified: 1, unchanged: 2, removed: 3 };
		return order[a.type] - order[b.type];
	});

	return { added, removed, modified, unchanged, allChanges };
}
