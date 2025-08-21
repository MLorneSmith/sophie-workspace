"use client";

import type { BaseImprovement, ImprovementType } from "@kit/ai-gateway";
import { Button } from "@kit/ui/button";
import { Spinner } from "@kit/ui/spinner";
import { useCallback, useEffect, useState } from "react";

import { ImprovementCard } from "./improvement-card";
import { LoadingAnimation } from "./loading-animation";
import { LOADING_MESSAGES } from "./loading-messages";

interface SuggestionsPaneProps {
	_content: string;
	_submissionId: string;
	_type: ImprovementType;
	onAcceptImprovement: (improvement: BaseImprovement) => void;
	improvements?: BaseImprovement[];
	onGenerateImprovements?: () => void;
	isLoading?: boolean;
	messageIndex: number;
}

export function SuggestionsPane({
	_content,
	_submissionId,
	_type,
	onAcceptImprovement,
	improvements = [],
	onGenerateImprovements,
	isLoading = false,
	messageIndex,
}: SuggestionsPaneProps) {
	const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
	const [cyclingIndex, setCyclingIndex] = useState(messageIndex);

	// Reset cycling index when base index changes
	useEffect(() => {
		setCyclingIndex(messageIndex);
	}, [messageIndex]);

	// Only cycle when loading
	useEffect(() => {
		if (isLoading) {
			const interval = setInterval(() => {
				setCyclingIndex((current) => (current + 1) % LOADING_MESSAGES.length);
			}, 3000);
			return () => clearInterval(interval);
		}
	}, [isLoading]);

	// Update visible IDs when improvements change
	useEffect(() => {
		setVisibleIds(new Set(improvements.map((imp) => imp.id)));
	}, [improvements]);

	const handleAcceptImprovement = useCallback(
		(improvement: BaseImprovement) => {
			// Remove the card when accepted
			setVisibleIds((prev) => {
				const next = new Set(prev);
				next.delete(improvement.id);
				return next;
			});
			onAcceptImprovement(improvement);
		},
		[onAcceptImprovement],
	);

	const handleRejectImprovement = useCallback(
		(improvement: BaseImprovement) => {
			// Remove the card when rejected
			setVisibleIds((prev) => {
				const next = new Set(prev);
				next.delete(improvement.id);
				return next;
			});
		},
		[],
	);

	return (
		<div className="bg-background/50 relative flex h-full flex-col rounded-md border">
			<div className="flex-1 overflow-auto">
				{isLoading ? (
					<LoadingAnimation messageIndex={cyclingIndex} />
				) : (
					<div className="space-y-4 p-4">
						{improvements
							.filter((improvement) => visibleIds.has(improvement.id))
							.map((improvement) => (
								<ImprovementCard
									key={improvement.id}
									improvement={improvement}
									isAccepted={false}
									onAccept={handleAcceptImprovement}
									onReject={handleRejectImprovement}
								/>
							))}
					</div>
				)}
			</div>
			<div className="bg-muted/5 border-t p-4">
				<Button
					onClick={onGenerateImprovements}
					className="w-full"
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<Spinner className="mr-2 h-4 w-4" />
							Generating...
						</>
					) : (
						"Generate Suggestions"
					)}
				</Button>
			</div>
		</div>
	);
}
