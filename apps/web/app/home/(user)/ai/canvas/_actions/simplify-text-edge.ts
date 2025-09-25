"use client";

// Client-side function that calls the edge API route for simplify text
export async function simplifyTextActionEdge(data: {
	content: string;
	userId: string;
	canvasId: string;
	sectionType: string;
}): Promise<{
	success: boolean;
	response?: unknown;
	metadata?: { duration: number; runtime: string };
	error?: string;
}> {
	try {
		const response = await fetch("/api/ai/simplify-text", {
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
