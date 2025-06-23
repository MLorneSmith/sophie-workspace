"use client";

import type { BaseImprovement } from "@kit/ai-gateway/src/prompts/types/improvements";
import { createServiceLogger } from "@kit/shared/logger";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@kit/ui/resizable";
import { Spinner } from "@kit/ui/spinner";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useRef, useState } from "react";
import type { Database } from "~/lib/database.types";
import { generateIdeasAction } from "../_actions/generate-ideas";
import { generateOutlineAction } from "../_actions/generate-outline";
import { useActionWithCost } from "../_lib/hooks/use-action-with-cost";
import { ActionToolbar } from "./action-toolbar";
import type { TiptapEditorRef } from "./editor/tiptap/tiptap-editor";
import { TiptapTabContent } from "./editor/tiptap/tiptap-tab-content";
import { LoadingAnimation } from "./suggestions/loading-animation";
import { LOADING_MESSAGES } from "./suggestions/loading-messages";
import { SuggestionsPane } from "./suggestions/suggestions-pane";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

interface EditorPanelProps {
	sectionType: "situation" | "complication" | "answer" | "outline";
}

function LoadingFallback() {
	return (
		<div className="flex h-[200px] items-center justify-center">
			<Spinner className="h-6 w-6" />
		</div>
	);
}

function _ErrorBoundary({ error }: { error: Error }) {
	return (
		<div className="flex h-[200px] items-center justify-center text-red-500">
			<p>Error loading editor: {error.message}</p>
		</div>
	);
}

export function EditorPanel({ sectionType }: EditorPanelProps) {
	const searchParams = useSearchParams();
	const submissionId = searchParams.get("id") ?? "";
	const _supabase = useSupabase<Database>();
	const queryClient = useQueryClient();

	// Use cost tracking hooks
	// const { sessionId } = useCostTracking(); // Commented out as it's unused
	const generateIdeasWithCost = useActionWithCost(generateIdeasAction);

	const editorRef = useRef<TiptapEditorRef>(null);
	const [suggestions, setSuggestions] = useState<BaseImprovement[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [messageIndex, setMessageIndex] = useState(0);
	const [isRegeneratingOutline, setIsRegeneratingOutline] = useState(false);
	const [resetKey, setResetKey] = useState(0); // Add a key to force component remount

	const handleAcceptImprovement = useCallback(
		(improvement: BaseImprovement) => {
			if (!editorRef.current) return;

			try {
				// Instead of trying to access the editor inside the update callback,
				// we should be directly inserting the improvement content
				const { implementedSummaryPoint, implementedSupportingPoints } =
					improvement;

				// First insert the summary as heading
				editorRef.current.insertContent(`<h2>${implementedSummaryPoint}</h2>`);

				// Then insert each supporting point as bullet items
				if (
					implementedSupportingPoints &&
					implementedSupportingPoints.length > 0
				) {
					const bulletList = `<ul>${implementedSupportingPoints
						.map((point) => `<li>${point}</li>`)
						.join("")}</ul>`;
					editorRef.current.insertContent(bulletList);
				}

				// TODO: Async logger needed
				// TODO: Fix logger call - was: info
			} catch {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
			}
		},
		[],
	);

	const handleImproveStructure = useCallback(async () => {
		if (!editorRef.current || !submissionId) return;

		try {
			// TODO: Implement improve structure functionality
			(await getLogger()).info("Improve structure clicked");

			// When implemented, this would use the same safety pattern as handleGenerateIdeas
			// to safely get content from the editor
		} catch {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: warn
		}
	}, [submissionId]);

	const handleGenerateIdeas = useCallback(async () => {
		if (!editorRef.current || !submissionId) return;

		// Increment message index before starting loading
		setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
		setIsGenerating(true);

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
							const editor = editorRef.current?.getEditor();
							if (editor) {
								content = editor.getText();
								resolve(content);
							} else {
								resolve("");
							}
						} catch {
							// TODO: Async logger needed
							// TODO: Fix logger call - was: warn
							resolve("");
						}
					});
				} catch {
					// TODO: Async logger needed
					// TODO: Fix logger call - was: warn
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

			// Use the cost-tracking version of the action with session ID
			const result = await generateIdeasWithCost({
				content: contentToSend,
				submissionId,
				type: sectionType,
			});

			if (result.success && result.data?.improvements) {
				setSuggestions(result.data.improvements);
			}
		} catch {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
			// Could add toast notification here if needed
		} finally {
			setIsGenerating(false);
		}
	}, [submissionId, sectionType, generateIdeasWithCost]);

	return (
		<div className="flex h-[calc(100vh-180px)] flex-col">
			<ResizablePanelGroup direction="horizontal" className="mt-4 flex-1 gap-4">
				<ResizablePanel defaultSize={66}>
					<div className="flex h-full flex-col">
						<div className="flex-1 overflow-auto">
							<Suspense fallback={<LoadingFallback />}>
								{sectionType === "outline" ? (
									isRegeneratingOutline ? (
										<div className="h-full">
											<LoadingAnimation messageIndex={messageIndex} />
										</div>
									) : (
										<>
											<div className="text-muted-foreground mb-2 text-sm">
												Outline tab active - displaying combined content from
												other tabs
											</div>
											<TiptapTabContent
												ref={editorRef}
												sectionType="outline"
												key={`outline-${submissionId}-${resetKey}`} // Force remount when resetKey changes
											/>
										</>
									)
								) : (
									<TiptapTabContent ref={editorRef} sectionType={sectionType} />
								)}
							</Suspense>
						</div>
						<div className="p-4">
							<ActionToolbar
								editorRef={editorRef}
								sectionType={sectionType}
								onGenerateImprovements={handleGenerateIdeas}
								onResetOutline={
									sectionType === "outline"
										? async () => {
												try {
													setMessageIndex(
														(current) =>
															(current + 1) % LOADING_MESSAGES.length,
													);
													setIsRegeneratingOutline(true);

													(await getLogger()).info(
														"Regenerating outline for submission:",
														{ submissionId },
													);

													// Call generateOutlineAction with forceRegenerate: true
													const result = (await generateOutlineAction({
														submissionId,
														forceRegenerate: true,
													})) as {
														success: boolean;
														data?: unknown;
														error?: string;
													};

													// Invalidate the query to force a refetch AND fully remount the component
													if (result.success) {
														// TODO: Async logger needed
														// TODO: Fix logger call - was: info

														// First, invalidate the query cache
														await queryClient.invalidateQueries({
															queryKey: ["submission", submissionId, "outline"],
														});

														// Increment the reset key to force a complete remount
														setResetKey((prev: number) => prev + 1);

														// Set a brief delay to ensure everything is reset properly
														setTimeout(() => {
															setIsRegeneratingOutline(false);
														}, 500);
													} else {
														throw new Error(
															result.error || "Failed to regenerate outline",
														);
													}
												} catch {
													// TODO: Async logger needed
													// TODO: Fix logger call - was: error
												} finally {
													// Make sure we reset the loading state even if there's an error
													setTimeout(() => {
														setIsRegeneratingOutline(false);
													}, 500);
												}
											}
										: undefined
								}
								onImproveStructure={
									sectionType === "answer" ? handleImproveStructure : undefined
								}
							/>
						</div>
					</div>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize={34}>
					<Suspense fallback={<LoadingFallback />}>
						<SuggestionsPane
							_content={""}
							_submissionId={submissionId}
							_type={sectionType}
							onAcceptImprovement={handleAcceptImprovement}
							improvements={suggestions}
							onGenerateImprovements={handleGenerateIdeas}
							isLoading={isGenerating}
							messageIndex={messageIndex}
						/>
					</Suspense>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
