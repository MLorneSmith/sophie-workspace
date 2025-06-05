"use client";

import { useCallback, useState } from "react";

import { useSearchParams } from "next/navigation";

import { FileText, LayoutTemplate, Lightbulb, RotateCcw } from "lucide-react";

import { useUserWorkspace } from "@kit/accounts/hooks/use-user-workspace";
import type {
	BaseImprovement,
	ImprovementType,
} from "@kit/ai-gateway/src/prompts/types/improvements";
import type { SimplifiedContent } from "@kit/ai-gateway/src/utils/parse-simplified";
import { Button } from "@kit/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kit/ui/tooltip";

import { generateIdeasAction } from "../_actions/generate-ideas";
import { simplifyTextAction } from "../_actions/simplify-text";
import type { TiptapEditorRef } from "./editor/tiptap/tiptap-editor";

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

			// Get current editor content safely with try/catch
			let content = "";
			try {
				// Create a promise to get the content safely
				const getContentPromise = new Promise<string>((resolve) => {
					if (!editorRef.current) {
						resolve("");
						return;
					}

					try {
						editorRef.current.update(() => {
							try {
								// Get content from Tiptap editor
								const editor = (editorRef.current as any).editor;
								if (editor) {
									content = editor.getText();
									resolve(content);
								} else {
									resolve("");
								}
							} catch (error) {
								console.warn("Error getting editor content:", error);
								resolve("");
							}
						});
					} catch (error) {
						console.warn("Error updating editor:", error);
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
								editorRef.current.update(() => {
									try {
										// Get the editor instance
										const editor = (editorRef.current as any).editor;
										if (!editor) return;

										// Clear the editor content
										editor.commands.clearContent();

										// Insert each section
										simplified.sections.forEach((section) => {
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
										});
									} catch (innerError) {
										console.warn("Error updating editor content:", innerError);
									}
								});
							} catch (updateError) {
								console.warn("Error calling editor update:", updateError);
							}
						}
					} catch (parseError) {
						console.error("Failed to parse simplified content:", parseError);
						return;
					}
				} else {
					console.error("Failed to simplify text:", result.error);
				}
			} catch (contentError) {
				console.warn("Error getting editor content:", contentError);
			}
		} catch (error) {
			console.error("Error simplifying text:", error);
		} finally {
			setIsSimplifying(false);
		}
	}, [editorRef, canvasId, user, sectionType]);

	const handleGenerateIdeas = useCallback(async () => {
		if (!editorRef.current || !canvasId || !user) return;

		try {
			// Get content safely with try/catch
			let content = "";
			try {
				// Create a promise to get the content safely
				const getContentPromise = new Promise<string>((resolve) => {
					if (!editorRef.current) {
						resolve("");
						return;
					}

					try {
						editorRef.current.update(() => {
							try {
								// Get content from Tiptap editor
								const editor = (editorRef.current as any).editor;
								if (editor) {
									content = editor.getText();
									resolve(content);
								} else {
									resolve("");
								}
							} catch (error) {
								console.warn("Error getting editor content:", error);
								resolve("");
							}
						});
					} catch (error) {
						console.warn("Error updating editor:", error);
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
				console.warn("Error getting editor content:", contentError);
			}
		} catch (error) {
			console.error("Error generating ideas:", error);
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
