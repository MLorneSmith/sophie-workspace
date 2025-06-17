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

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

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
						// TODO: Async logger needed
		// (await getLogger()).warn(
							"Error getting editor content:",
							{ data: error },
						);
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
								// TODO: Async logger needed
		// (await getLogger()).warn(
									"Error updating editor content:",
									{ data: updateError },
								);
							}
						}
					} catch (parseError) {
						// TODO: Async logger needed
		// (await getLogger()).error(
							"Failed to parse simplified content:",
							{ data: parseError },
						);
						return;
					}
				} else {
					// TODO: Async logger needed
		// (await getLogger()).error(
						"Failed to simplify text:",
						{ data: result.error },
					);
				}
			} catch (contentError) {
				// TODO: Async logger needed
		// (await getLogger()).warn(
					"Error getting editor content:",
					{ data: contentError },
				);
			}
		} catch (error) {
			// TODO: Async logger needed
		// (await getLogger()).error("Error simplifying text:", {
				data: error,
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
						// TODO: Async logger needed
		// (await getLogger()).warn(
							"Error getting editor content:",
							{ data: error },
						);
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
				// TODO: Async logger needed
		// (await getLogger()).warn(
					"Error getting editor content:",
					{ data: contentError },
				);
			}
		} catch (error) {
			// TODO: Async logger needed
		// (await getLogger()).error("Error generating ideas:", {
				data: error,
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
