"use client";

import { Sparkles } from "lucide-react";

import { LOADING_MESSAGES } from "./loading-messages";

interface LoadingAnimationProps {
	messageIndex: number;
}

export function LoadingAnimation({ messageIndex }: LoadingAnimationProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
			<div className="relative">
				<div className="border-muted border-t-primary h-12 w-12 animate-spin rounded-full border-4" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<Sparkles className="text-primary h-6 w-6 animate-pulse" />
				</div>
			</div>
			<p className="text-muted-foreground animate-pulse transition-opacity duration-300">
				{LOADING_MESSAGES[messageIndex]}
			</p>
		</div>
	);
}
