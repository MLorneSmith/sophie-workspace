"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { Spinner } from "@kit/ui/spinner";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";

import type { Database } from "~/lib/database.types";

import { generateOutlineAction } from "../../../_actions/generate-outline";

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
import { normalizeEditorContent } from "../../../_lib/utils/normalize-editor-content";
import type { EditorContentTypes } from "../../../_types/editor-types";
import {
	TiptapEditor as TiptapEditorComponent,
	type TiptapEditorRef,
} from "./tiptap-editor";

interface TabContentProps {
	sectionType: EditorContentTypes;
}

const EMPTY_EDITOR_STATE = {
	type: "doc",
	content: [
		{
			type: "paragraph",
			content: [],
		},
	],
};

export const TiptapTabContent = forwardRef<TiptapEditorRef, TabContentProps>(
	function TiptapTabContent({ sectionType }, ref) {
		// Add state to track content loading errors
		const [contentError, setContentError] = useState<string | null>(null);
		const searchParams = useSearchParams();
		const id = searchParams.get("id");
		const supabase = useSupabase<Database>();
		// Add a ref to track component mount status
		const isMountedRef = useRef(true);

		useEffect(() => {
			// Set mounted flag to true when component mounts
			isMountedRef.current = true;

			return () => {
				// Set mounted flag to false on unmount
				isMountedRef.current = false;
			};
		}, []);

		const { data: content, isLoading } = useQuery({
			queryKey: ["submission", id, sectionType],
			queryFn: async () => {
				setContentError(null); // Reset error state
				if (!id) return EMPTY_EDITOR_STATE;

				const { data, error } = await supabase
					.from("building_blocks_submissions")
					.select("*")
					.eq("id", id)
					.single();

				if (error) throw error;
				if (!data) return EMPTY_EDITOR_STATE;

				// Special handling for outline section
				if (sectionType === "outline") {
					logger.info("Processing outline section", {
						sectionType,
						submissionId: id,
					});
					const rawContent = data.outline;

					// If outline exists and has valid content, parse, normalize and return it
					if (rawContent) {
						try {
							const parsedContent = JSON.parse(rawContent);

							// Check if it's a valid document structure
							if (
								typeof parsedContent === "object" &&
								parsedContent !== null &&
								"type" in parsedContent &&
								parsedContent.type === "doc" &&
								Array.isArray(parsedContent.content)
							) {
								// We found existing outline content, normalize it to ensure integrity
								logger.info("Found existing outline content", {
									sectionType,
									contentType: parsedContent.type,
								});
								return normalizeEditorContent(parsedContent, "outline");
							}
						} catch (_e) {
							logger.error("Failed to parse existing outline content", {
								sectionType,
								error: _e,
							});
							// Continue to outline generation if parsing fails
						}
					}

					// If we get here, we need to generate the outline
					logger.info("Generating new outline content", {
						sectionType,
						submissionId: id,
					});
					try {
						const result = (await generateOutlineAction({
							submissionId: id,
							forceRegenerate: false,
						})) as { success: boolean; data?: unknown; error?: string };

						if (result.success && result.data) {
							logger.info("Successfully generated outline content", {
								sectionType,
								submissionId: id,
							});
							return normalizeEditorContent(result.data, "outline");
						}
						logger.error("Failed to generate outline content", {
							sectionType,
							submissionId: id,
							error: result.error,
						});
						setContentError(
							"Failed to generate outline. Please try again or reset the outline.",
						);
					} catch (_err) {
						logger.error("Exception during outline generation", {
							sectionType,
							submissionId: id,
							error: _err,
						});
						setContentError("Error generating outline. Please try again.");
					}

					return EMPTY_EDITOR_STATE;
				}

				// Standard handling for other sections
				const rawContent = (data as Record<string, unknown>)[sectionType];
				logger.debug("Processing standard section content", {
					sectionType,
					rawContentType: typeof rawContent,
					hasContent: !!rawContent,
				});

				if (!rawContent) return EMPTY_EDITOR_STATE;

				// If content is already stored as JSON object, validate and return it
				if (
					typeof rawContent === "object" &&
					rawContent !== null &&
					"type" in rawContent &&
					rawContent.type === "doc"
				) {
					// Normalize all content to ensure consistency
					return normalizeEditorContent(rawContent, sectionType);
				}

				// Try to parse string content as JSON
				try {
					const parsed = JSON.parse(rawContent as string);
					if (
						typeof parsed === "object" &&
						parsed !== null &&
						"type" in parsed &&
						parsed.type === "doc"
					) {
						// Normalize all content to ensure consistency
						return normalizeEditorContent(parsed, sectionType);
					}

					// If it's Lexical format, convert it
					if (
						typeof parsed === "object" &&
						parsed !== null &&
						"root" in parsed
					) {
						// Import the conversion utility dynamically to avoid circular dependencies
						const { lexicalToTiptap } = await import(
							"./utils/format-conversion"
						);
						const convertedContent = lexicalToTiptap(parsed);
						return normalizeEditorContent(convertedContent, sectionType);
					}

					logger.debug(
						"Content parsing successful but not in expected format",
						{
							sectionType,
							parsedType: typeof parsed,
						},
					);
					return EMPTY_EDITOR_STATE;
				} catch (_e) {
					logger.debug("Failed to parse content as JSON", {
						sectionType,
						error: _e,
						contentType: typeof rawContent,
					});
					return EMPTY_EDITOR_STATE;
				}
			},
			enabled: !!id,
		});

		if (!id) {
			return <div>No submission ID provided</div>;
		}

		if (isLoading) {
			return (
				<div className="flex h-[200px] items-center justify-center">
					<Spinner className="h-6 w-6" />
				</div>
			);
		}

		if (contentError) {
			return (
				<div className="flex h-[200px] flex-col items-center justify-center text-red-500">
					<p className="mb-2">{contentError}</p>
					<button
						type="button"
						className="bg-primary text-primary-foreground rounded px-3 py-1"
						onClick={async () => {
							if (id) {
								try {
									await generateOutlineAction({
										submissionId: id,
										forceRegenerate: true,
									});
									// Force refetch
									window.location.reload();
								} catch (_err) {
									logger.error("Failed to retry outline generation", {
										sectionType,
										error: _err,
									});
								}
							}
						}}
					>
						Retry
					</button>
				</div>
			);
		}

		// Prepare the content for the editor in a safe way
		let editorContent = "";
		try {
			if (typeof content === "string") {
				// Parse and stringify to ensure clean JSON
				const parsed = JSON.parse(content);
				// Normalize content to prevent ProseMirror model conflicts
				const normalized = normalizeEditorContent(parsed, sectionType);
				editorContent = JSON.stringify(normalized);
			} else if (content) {
				// The content is already an object, normalize and stringify it
				const normalized = normalizeEditorContent(content, sectionType);
				editorContent = JSON.stringify(normalized);
			} else {
				editorContent = JSON.stringify(EMPTY_EDITOR_STATE);
			}
			logger.info("Prepared editor content:", {
				sectionType,
				contentType: typeof editorContent,
				contentLength: editorContent.length,
			});
		} catch (_e) {
			logger.error("Failed to prepare editor content", {
				sectionType,
				error: _e,
			});
			editorContent = JSON.stringify(EMPTY_EDITOR_STATE);
		}

		return (
			<div className="h-full">
				<TiptapEditorComponent
					ref={ref}
					content={editorContent}
					submissionId={id}
					sectionType={sectionType}
				/>
			</div>
		);
	},
);
