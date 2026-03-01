"use server";

import { enhanceAction } from "@kit/next/actions";

import { PptxGenerator } from "../services/powerpoint/pptx-generator";
import type { TemplateConfig } from "../../../../_lib/schemas/template-config";
import type { StoryboardData } from "../types";

/**
 * Server action to generate PowerPoint file from storyboard data
 * This runs on the server where Node.js modules are available
 *
 * @param storyboard - The storyboard data to generate the PowerPoint from
 * @param templateConfig - Optional template configuration for customization
 */
export const generatePowerPointAction = enhanceAction(
	async (
		data: { storyboard: StoryboardData; templateConfig?: TemplateConfig },
		_user,
	) => {
		try {
			// Instantiate the generator on the server with optional template config
			const generator = new PptxGenerator(data.templateConfig);

			// Generate the PowerPoint file
			const pptxBuffer = await generator.generateFromStoryboard(
				data.storyboard,
				data.templateConfig,
			);

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
	{
		auth: true,
	},
);
