"use client";

import { useState } from "react";

import { getLogger } from "@kit/shared/logger";
import { Button } from "@kit/ui/button";

import { useStoryboard } from "../_lib/providers/storyboard-provider";
// Assuming PptxGenerator is located here based on common project structure
import { PptxGenerator } from "../_lib/services/powerpoint/pptx-generator";

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
			// Instantiate the generator
			const generator = new PptxGenerator();

			// Generate the PowerPoint file (assuming generate method returns a Buffer)
			// The PptxGenerator class details mention a generateFromStoryboard method.
			const pptxBuffer = await generator.generateFromStoryboard(storyboard);

			// Convert Buffer to Blob for download
			const pptxBlob = new Blob([pptxBuffer], {
				type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			});

			// Create a download link and trigger download
			const url = URL.createObjectURL(pptxBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "presentation.pptx"; // Default filename
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
