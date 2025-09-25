"use client";

import type { BaseImprovement } from "@kit/ai-gateway";

// Client-side function that calls the edge API route
export async function generateIdeasActionEdge(data: {
	content: string;
	submissionId: string;
	type: "situation" | "complication" | "answer" | "outline";
	sessionId?: string;
}): Promise<{
	success: boolean;
	data?: { improvements: BaseImprovement[] };
	metadata?: { cost: number; duration: number; runtime: string };
	error?: string;
}> {
	try {
		const response = await fetch("/api/ai/generate-ideas", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return {
				success: false,
				error:
					errorData.error || `HTTP ${response.status}: ${response.statusText}`,
			};
		}

		const result = await response.json();
		return result;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Network error",
		};
	}
}
