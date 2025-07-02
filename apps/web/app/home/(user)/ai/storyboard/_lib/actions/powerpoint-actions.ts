"use server";

import { enhanceAction } from "@kit/next/actions";

import { PptxGenerator } from "../services/powerpoint/pptx-generator";
import type { StoryboardData } from "../types";

/**
 * Server action to generate PowerPoint file from storyboard data
 * This runs on the server where Node.js modules are available
 */
export const generatePowerPointAction = enhanceAction(
	async (storyboard: StoryboardData) => {
		try {
			// Instantiate the generator on the server
			const generator = new PptxGenerator();

			// Generate the PowerPoint file
			const pptxBuffer = await generator.generateFromStoryboard(storyboard);

			// Convert Buffer to base64 for safe transport to client
			const base64Data = pptxBuffer.toString("base64");

			return {
				success: true,
				data: base64Data,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";

			return {
				success: false,
				error: `Failed to generate PowerPoint: ${errorMessage}`,
			};
		}
	},
);
