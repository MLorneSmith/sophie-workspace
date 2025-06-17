"use client";

import type { BaseImprovement } from "@kit/ai-gateway/src/prompts/types/improvements";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import debounce from "lodash/debounce";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from "react";

import { useSaveContext } from "../../../_lib/contexts/save-context";
import { normalizeEditorContent } from "../../../_lib/utils/normalize-editor-content";
import type { EditorContentTypes } from "../../../_types/editor-types";
import { LoadingAnimation } from "../../suggestions/loading-animation";
import "./editor.css";

import { createServiceLogger } from "@kit/shared/logger";
import { Toolbar } from "./toolbar";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

interface TiptapEditorProps {
	content: string;
	submissionId: string;
	sectionType: EditorContentTypes;
	onAcceptImprovement?: (improvement: BaseImprovement) => void;
	isLoading?: boolean;
}

export interface TiptapEditorRef {
	insertContent: (content: string) => void;
	update: (fn: () => void) => void;
	getText: () => string;
	clearContent: () => void;
	getEditor: () => Editor | null;
}

interface SubmissionData {
	id: string;
	title: string;
	situation: string | null;
	complication: string | null;
	answer: string | null;
	outline: string | null;
	[key: string]: string | null;
}

interface MutationContext {
	previousContent: unknown | null;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
	function TiptapEditor(props, _ref) {
		const {
			content,
			submissionId,
			sectionType,
			// onAcceptImprovement, // Currently unused
			isLoading,
		} = props;
		const _supabase = useSupabase();
		const _queryClient = useQueryClient();
		const { setSaveStatus, registerSaveCallback } = useSaveContext();
		const _editorRef = useRef(null);

		// Parse and normalize initial content
		const initialContent = useMemo(() => {
			// TODO: Async logger needed
			// (await getLogger()).info("TiptapEditor parsing content:", {
			// 	sectionType,
			// 	contentType: typeof content,
			// 	contentLength:
			// 		typeof content === "string" ? content.length : "not a string",
			// });

			try {
				if (typeof content !== "string") {
					// TODO: Async logger needed
					// TODO: Fix logger call - was: warn
					// Create a default empty document and normalize it
					return normalizeEditorContent(
						{
							type: "doc",
							content: [{ type: "paragraph", content: [] }],
						},
						sectionType,
					);
				}

				// Parse the content string into an object
				const parsed = JSON.parse(content);
				// TODO: Async logger needed
				// (await getLogger()).info("Successfully parsed content:", {
				// 	type: parsed?.type,
				// 	contentLength: parsed?.content?.length,
				// 	firstNodeType: parsed?.content?.[0]?.type,
				// });

				// Normalize the content before passing it to the editor
				// This helps prevent ProseMirror model version conflicts
				return normalizeEditorContent(parsed, sectionType);
			} catch (_e) {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
				// Return a normalized empty document as fallback
				return normalizeEditorContent(
					{
						type: "doc",
						content: [
							{ type: "paragraph", content: [{ type: "text", text: " " }] },
						],
					},
					sectionType,
				);
			}
		}, [content, sectionType]);

		// Initialize Tiptap editor
		const editor = useEditor({
			extensions: [
				StarterKit,
				Placeholder.configure({ placeholder: "Enter your content..." }),
				Bold,
				Italic,
				Underline,
				Heading.configure({ levels: [1, 2, 3] }),
				BulletList,
				OrderedList,
				ListItem,
			],
			content: initialContent,
			editorProps: {
				attributes: {
					class: "outline-none h-full",
				},
			},
			onBlur: ({ editor }) => {
				saveContent(editor.getJSON());
			},
		});

		// Expose methods via ref
		useImperativeHandle(_ref, () => ({
			insertContent: (content: string) => {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: info
				if (editor) {
					// Make sure the editor is focused before inserting content
					editor.commands.focus();
					// Insert the content and return status
					const result = editor.commands.insertContent(content);
					// TODO: Async logger needed
					// TODO: Fix logger call - was: info
					return result;
				}
				return false;
			},
			update: (fn: () => void) => {
				if (editor) {
					// Execute function in Tiptap context
					// TODO: Async logger needed
					// TODO: Fix logger call - was: info
					editor
						.chain()
						.focus()
						.command(() => {
							fn();
							return true;
						})
						.run();
				}
			},
			getText: () => {
				return editor?.getText() ?? "";
			},
			clearContent: () => {
				if (editor) {
					editor.commands.clearContent();
				}
			},
			getEditor: () => {
				return editor;
			},
		}));

		// Mutation for saving content
		const { mutate: updateContent } = useMutation<
			SubmissionData,
			Error,
			unknown,
			MutationContext
		>({
			mutationFn: async (newContent: unknown) => {
				(await getLogger()).debug("Saving content:", {
					sectionType,
					newContent,
				});
				const { data, error } = await _supabase
					.from("building_blocks_submissions")
					.update({ [sectionType]: JSON.stringify(newContent) })
					.eq("id", submissionId)
					.select()
					.single();

				if (error) throw error;
				return data;
			},
			onMutate: async (newContent: unknown): Promise<MutationContext> => {
				// Cancel outgoing refetches
				await _queryClient.cancelQueries({
					queryKey: ["submission", submissionId, sectionType],
					exact: true,
				});

				// Save previous value
				const previousContent =
					_queryClient.getQueryData<unknown>([
						"submission",
						submissionId,
						sectionType,
					]) ?? null;

				// Update cache optimistically
				_queryClient.setQueryData(
					["submission", submissionId, sectionType],
					newContent,
				);

				return { previousContent };
			},
			onError: (_err, _newContent, context: MutationContext | undefined) => {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
				setSaveStatus("error");
				// Rollback on error
				if (context?.previousContent) {
					_queryClient.setQueryData(
						["submission", submissionId, sectionType],
						context.previousContent,
					);
				}
			},
			onSuccess: (_data) => {
				// TODO: Async logger needed
				// (await getLogger()).debug("Content saved successfully:", {
				// 	sectionType,
				// 	data: data?.[sectionType],
				// });
				setSaveStatus("saved");
				setTimeout(() => setSaveStatus("idle"), 2000);
			},
			onSettled: () => {
				// Always refetch after error or success
				_queryClient.invalidateQueries({
					queryKey: ["submission", submissionId, sectionType],
					exact: true,
				});
			},
		});

		// Save content function with normalization
		const saveContent = useCallback(
			async (editorContent: unknown) => {
				try {
					setSaveStatus("saving");
					// Normalize the content before saving to ensure it's valid
					const normalizedContent = normalizeEditorContent(
						editorContent,
						sectionType,
					);
					await updateContent(normalizedContent);
				} catch (_error) {
					// TODO: Async logger needed
					// TODO: Fix logger call - was: error
					setSaveStatus("error");
					setTimeout(() => setSaveStatus("idle"), 3000);
				}
			},
			[updateContent, setSaveStatus, sectionType],
		);

		// Debounced save handler
		const debouncedSave = useMemo(
			() => debounce(saveContent, 1000),
			[saveContent],
		);

		// Register save callback
		useEffect(() => {
			const callback = async () => {
				if (editor) {
					try {
						await saveContent(editor.getJSON());
					} catch (_error) {
						// TODO: Async logger needed
						// TODO: Fix logger call - was: error
					}
				}
			};
			registerSaveCallback(callback);
		}, [registerSaveCallback, saveContent, editor]);

		// Update editor content when it changes, with improved error handling
		useEffect(() => {
			if (!editor || !initialContent) return;

			try {
				// Log the content types for debugging
				// TODO: Async logger needed
				// (await getLogger()).info("Editor update effect with content:", {
				// 	sectionType,
				// 	initialContentType: typeof initialContent,
				// 	editorExists: !!editor,
				// });

				// Only update if content has changed to avoid loops
				const currentContent = editor.getJSON();
				const currentContentStr = JSON.stringify(currentContent);
				const initialContentStr = JSON.stringify(initialContent);

				// If content has changed, reset the editor completely to avoid ProseMirror model version conflicts
				if (currentContentStr !== initialContentStr) {
					// TODO: Async logger needed
					// TODO: Fix logger call - was: info

					// Use a try-catch to handle potential errors
					try {
						// Use a timeout to ensure clean DOM updates
						setTimeout(() => {
							if (editor) {
								try {
									// First clear content then set new content
									editor.commands.clearContent();
									// Use the normalized content to prevent model conflicts
									editor.commands.setContent(initialContent);
								} catch (_innerError) {
									// TODO: Async logger needed
									// TODO: Fix logger call - was: error

									// As a last resort, try recreating a minimal valid document
									const safeContent = normalizeEditorContent(
										{
											type: "doc",
											content: [
												{
													type: "paragraph",
													content: [{ type: "text", text: " " }],
												},
											],
										},
										sectionType,
									);

									editor.commands.setContent(safeContent);
								}
							}
						}, 0);
					} catch (_error) {
						// TODO: Async logger needed
						// TODO: Fix logger call - was: error
					}
				}
			} catch (_error) {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
			}
		}, [editor, initialContent, sectionType]);

		// Handle editor changes
		useEffect(() => {
			if (!editor) return;

			const handleUpdate = ({ editor }: { editor: Editor }) => {
				debouncedSave(editor.getJSON());
			};

			editor.on("update", handleUpdate);

			return () => {
				editor.off("update", handleUpdate);
			};
		}, [editor, debouncedSave]);

		// Cleanup debounced save on unmount
		useEffect(() => {
			return () => {
				debouncedSave.cancel();
			};
		}, [debouncedSave]);

		// Save before unload
		useEffect(() => {
			const handleBeforeUnload = () => {
				if (editor) {
					debouncedSave.cancel();
					saveContent(editor.getJSON());
				}
			};

			window.addEventListener("beforeunload", handleBeforeUnload);
			return () =>
				window.removeEventListener("beforeunload", handleBeforeUnload);
		}, [editor, debouncedSave, saveContent]);

		return (
			<div className="editor-shell relative flex h-full flex-col rounded-lg border">
				{isLoading && (
					<div className="bg-background/80 absolute inset-0 z-50 backdrop-blur-sm">
						<LoadingAnimation messageIndex={0} />
					</div>
				)}
				<Toolbar editor={editor} />
				<div className="flex-1 p-4">
					<EditorContent editor={editor} className="h-full" />
				</div>
			</div>
		);
	},
);
