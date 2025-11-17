"use client";

import { useCallback } from "react";

import { useCostTracking } from "../contexts/cost-tracking-context";

// Generic type for the action function
type ActionFunction<T, R> = (data: T) => Promise<R>;

export function useActionWithCost<
	T extends Record<string, unknown>,
	R extends { success: boolean; metadata?: { cost?: number } },
>(action: ActionFunction<T, R>) {
	const { addCost, sessionId } = useCostTracking();

	const wrappedAction = useCallback(
		async (data: T) => {
			// Add session ID to the request data
			const dataWithSession = {
				...data,
				sessionId,
			};

			// Call the original action
			const result = await action(dataWithSession as T);

			// If successful and cost is available, update the cost
			// Wrap in try-catch to prevent cost tracking errors from breaking the action
			if (result.success && result.metadata?.cost) {
				try {
					addCost(result.metadata.cost);
				} catch (error) {
					// Silently fail - cost tracking should not break the action
					if (process.env.NODE_ENV === "development") {
						// biome-ignore lint/suspicious/noConsole: Development logging
						console.warn("Failed to track cost:", error);
					}
				}
			}

			return result;
		},
		[action, addCost, sessionId],
	);

	return wrappedAction;
}
