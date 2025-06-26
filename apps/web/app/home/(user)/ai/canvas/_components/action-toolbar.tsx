"use client";

import { useUserWorkspace } from "@kit/accounts/hooks/use-user-workspace";
import type {
	BaseImprovement,
	ImprovementType,
} from "@kit/ai-gateway/src/prompts/types/improvements";
import type { SimplifiedContent } from "@kit/ai-gateway/src/utils/parse-simplified";
import { Button } from "@kit/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kit/ui/tooltip";
import { FileText, LayoutTemplate, Lightbulb, RotateCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { generateIdeasAction } from "../_actions/generate-ideas";
import { simplifyTextAction } from "../_actions/simplify-text";
import type { TiptapEditorRef } from "./editor/tiptap/tiptap-editor";

// Create a client-safe logger wrapper
const logger = {
	info: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.info(...args);
		}
	},
	error: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.error(...args);
		}
	},
	warn: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.warn(...args);
		}
	},
	debug: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.debug(...args);
		}
	},
};

interface ActionToolbarProps {
	editorRef: React.RefObject<TiptapEditorRef | null>;
	sectionType: ImprovementType;
	onGenerateImprovements?: (improvements: BaseImprovement[]) => void;
	onResetOutline?: () => Promise<void>;
	onImproveStructure?: () => Promise<void>;
}

export function ActionToolbar({
	editorRef,
	sectionType,
	onGenerateImprovements,
	onResetOutline,
	onImproveStructure,
}: ActionToolbarProps) {
	const [isSimplifying, setIsSimplifying] = useState(false);
	const { user } = useUserWorkspace();
	const searchParams = useSearchParams();
	const canvasId = searchParams.get("id");

	const handleSimplifyText = useCallback(async () => {
		if (!editorRef.current || !canvasId || !user) return;

		try {
			setIsSimplifying(true);

			// Get current editor content safely
			let content = "";
			try {
				// Get content directly from the editor ref
				const getContentPromise = new Promise<string>((resolve) => {
					if (!editorRef.current) {
						resolve("");
						return;
					}

					try {
						content = editorRef.current.getText();
						resolve(content);
					} catch (error) {
						logger.warn("Error getting editor content for simplify", {
							error,
							canvasId,
							sectionType,
						});
						resolve("");
					}
				});

				// Wait for content with a timeout
				content = await Promise.race([
					getContentPromise,
					new Promise<string>((resolve) => setTimeout(() => resolve(""), 1000)),
				]);

				// Call the simplify text action
				const result = await simplifyTextAction({
					content,
					userId: user.id,
					canvasId,
					sectionType,
				});

				if (result.success && result.response) {
					try {
						// Access the text content from the response before parsing
						// Access the text content from the response before parsing
						const simplified = JSON.parse(
							result.response.content,
						) as SimplifiedContent;

						// Clear current content and insert simplified sections safely
						if (editorRef.current) {
							try {
								// Clear the editor content
								editorRef.current.clearContent();

								// Insert each section using the editor instance
								const editor = editorRef.current.getEditor();
								if (editor) {
									for (const section of simplified.sections) {
										if (section.type === "heading") {
											// Insert heading
											editor.commands.insertContent({
												type: "heading",
												attrs: { level: 2 },
												content: [{ type: "text", text: section.content }],
											});
											editor.commands.enter();
										} else {
											// Insert bullet point
											editor.commands.insertContent({
												type: "paragraph",
												content: [
													{ type: "text", text: `• ${section.content}` },
												],
											});
											editor.commands.enter();
										}
									}
								}
							} catch (updateError) {
								logger.warn("Error updating editor content after simplify", {
									error: updateError,
									canvasId,
									sectionType,
								});
							}
						}
					} catch (parseError) {
						logger.error("Failed to parse simplified content", {
							error: parseError,
							canvasId,
							sectionType,
							response: result.response?.content,
						});
						return;
					}
				} else {
					logger.error("Failed to simplify text", {
						error: result.error,
						canvasId,
						sectionType,
						success: result.success,
					});
				}
			} catch (contentError) {
				logger.warn("Error getting editor content for simplify action", {
					error: contentError,
					canvasId,
					sectionType,
				});
			}
		} catch (error) {
			logger.error("Error simplifying text", {
				error,
				canvasId,
				sectionType,
				userId: user?.id,
			});
		} finally {
			setIsSimplifying(false);
		}
	}, [editorRef, canvasId, user, sectionType]);

	const handleGenerateIdeas = useCallback(async () => {
		if (!editorRef.current || !canvasId || !user) return;

		try {
			// Get content safely
			let content = "";
			try {
				// Get content directly from the editor ref
				const getContentPromise = new Promise<string>((resolve) => {
					if (!editorRef.current) {
						resolve("");
						return;
					}

					try {
						content = editorRef.current.getText();
						resolve(content);
					} catch (error) {
						logger.warn("Error getting editor content for ideas generation", {
							error,
							canvasId,
							sectionType,
						});
						resolve("");
					}
				});

				// Wait for content with a timeout
				content = await Promise.race([
					getContentPromise,
					new Promise<string>((resolve) => setTimeout(() => resolve(""), 1000)),
				]);

				// Ensure content is not empty for the API call
				const contentToSend =
					content.trim() || "Please suggest some initial ideas.";

				const result = await generateIdeasAction({
					content: contentToSend,
					submissionId: canvasId,
					type: sectionType,
				});

				if (
					result.success &&
					result.data?.improvements &&
					onGenerateImprovements
				) {
					onGenerateImprovements(result.data.improvements);
				}
			} catch (contentError) {
				logger.warn(
					"Error getting editor content for ideas generation action",
					{
						error: contentError,
						canvasId,
						sectionType,
					},
				);
			}
		} catch (error) {
			logger.error("Error generating ideas", {
				error,
				canvasId,
				sectionType,
				userId: user?.id,
			});
		}
	}, [editorRef, canvasId, user, sectionType, onGenerateImprovements]);

	return (
		<div className="flex gap-2">
			{/* Reset Outline - Only for outline tab */}
			{sectionType === "outline" && onResetOutline && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline" size="sm" onClick={onResetOutline}>
							<RotateCcw className="mr-2 h-4 w-4" />
							Reset Outline
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						Regenerate outline from current situation, complication, and answer
					</TooltipContent>
				</Tooltip>
			)}

			{/* Simplify Text - For all tabs except outline */}
			{sectionType !== "outline" && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							onClick={handleSimplifyText}
							disabled={isSimplifying}
						>
							<FileText className="mr-2 h-4 w-4" />
							Simplify Text
						</Button>
					</TooltipTrigger>
					<TooltipContent>Make the text clearer and simpler</TooltipContent>
				</Tooltip>
			)}

			{/* Add Ideas - For all tabs except outline */}
			{sectionType !== "outline" && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline" size="sm" onClick={handleGenerateIdeas}>
							<Lightbulb className="mr-2 h-4 w-4" />
							Add Ideas
						</Button>
					</TooltipTrigger>
					<TooltipContent>Generate additional ideas</TooltipContent>
				</Tooltip>
			)}

			{/* Improve Structure - Only for answer tab */}
			{sectionType === "answer" && onImproveStructure && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline" size="sm" onClick={onImproveStructure}>
							<LayoutTemplate className="mr-2 h-4 w-4" />
							Improve Structure
						</Button>
					</TooltipTrigger>
					<TooltipContent>Enhance document structure</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
