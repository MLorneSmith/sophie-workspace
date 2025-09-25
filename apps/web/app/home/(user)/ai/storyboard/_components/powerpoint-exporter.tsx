"use client";

import { getLogger } from "@kit/shared/logger";
import { Button } from "@kit/ui/button";
import { useState } from "react";

import { generatePowerPointAction } from "../_lib/actions/powerpoint-actions";
import { useStoryboard } from "../_lib/providers/storyboard-provider";

export function PowerPointExporter() {
	const { storyboard } = useStoryboard();
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleExport = async () => {
		setIsGenerating(true);
		setError(null);

		if (!storyboard) {
			setError("No storyboard data available to export.");
			setIsGenerating(false);
			return;
		}

		try {
			// Call the server action to generate PowerPoint
			const result = await generatePowerPointAction(storyboard);

			if (!result.success) {
				throw new Error(result.error || "Failed to generate PowerPoint");
			}

			// Convert base64 to blob for download
			const binaryData = atob(result.data as string);
			const bytes = new Uint8Array(binaryData.length);
			for (let i = 0; i < binaryData.length; i++) {
				bytes[i] = binaryData.charCodeAt(i);
			}

			const pptxBlob = new Blob([bytes], {
				type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			});

			// Create a download link and trigger download
			const url = URL.createObjectURL(pptxBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = storyboard.title
				? `${storyboard.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pptx`
				: "presentation.pptx";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url); // Clean up the URL object
		} catch (err) {
			// Use the shared logger for error tracking
			const logger = await getLogger();
			const errorMessage =
				err instanceof Error ? err.message : "An unknown error occurred";
			logger.error({ error: err }, "Error generating PowerPoint");

			// Provide a more user-friendly error message to the user
			setError(
				`Failed to generate PowerPoint. Details: ${errorMessage}. Please check the storyboard data and try again.`,
			);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div>
			<Button onClick={handleExport} disabled={isGenerating || !storyboard}>
				{isGenerating ? "Generating..." : "Export to PowerPoint"}
			</Button>

			{error && <p className="mt-2 text-sm text-red-500">{error}</p>}
		</div>
	);
}
