"use client";

import { Button } from "@kit/ui/button";
import { Badge } from "@kit/ui/badge";
import {
	CheckCircle,
	FileText,
	Loader2,
	Plus,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { OutlineSection } from "../../_lib/types/outline.types";
import { generateOutlineAction } from "../_actions/generate-outline.action";
import {
	useOutlineContents,
	useSaveOutlineSections,
} from "../_lib/hooks/use-outline-contents";
import { SectionEditor } from "./section-editor";

interface OutlineEditorProps {
	presentationId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function OutlineEditor({ presentationId }: OutlineEditorProps) {
	const { data: outlineData, isPending: isLoading } =
		useOutlineContents(presentationId);
	const { mutate: saveSections } = useSaveOutlineSections(presentationId);

	const [sections, setSections] = useState<OutlineSection[]>([]);
	const [isGenerating, startGenerating] = useTransition();
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [generationError, setGenerationError] = useState<string | null>(null);
	const hasInitialized = useRef(false);

	const handleGenerate = useCallback(
		(forceRegenerate: boolean) => {
			setGenerationError(null);
			startGenerating(async () => {
				try {
					const result = await generateOutlineAction({
						presentationId,
						forceRegenerate,
					});

					if (result && "data" in result && result.data?.sections) {
						setSections(result.data.sections);
					} else if (result && "error" in result) {
						setGenerationError(
							typeof result.error === "string"
								? result.error
								: "Generation failed. Try again.",
						);
					}
				} catch (err) {
					setGenerationError(
						err instanceof Error ? err.message : "Generation failed",
					);
				}
			});
		},
		[presentationId],
	);

	// Sync sections from query data
	useEffect(() => {
		if (outlineData?.sections && outlineData.sections.length > 0) {
			setSections(outlineData.sections);
			hasInitialized.current = true;
		}
	}, [outlineData]);

	// Auto-generate on first load if no sections exist
	useEffect(() => {
		if (isLoading || hasInitialized.current) return;
		if (
			outlineData === null ||
			(outlineData && outlineData.sections.length === 0)
		) {
			hasInitialized.current = true;
			handleGenerate(false);
		}
	}, [isLoading, outlineData, handleGenerate]);

	const handleSave = useCallback(
		(updatedSections: OutlineSection[]) => {
			setSaveStatus("saving");
			saveSections(updatedSections, {
				onSuccess: () => {
					setSaveStatus("saved");
					setTimeout(() => setSaveStatus("idle"), 2000);
				},
				onError: () => {
					setSaveStatus("error");
					setTimeout(() => setSaveStatus("idle"), 3000);
				},
			});
		},
		[saveSections],
	);

	const handleSectionUpdate = useCallback(
		(updated: OutlineSection) => {
			const newSections = sections.map((s) =>
				s.id === updated.id ? updated : s,
			);
			setSections(newSections);
			handleSave(newSections);
		},
		[sections, handleSave],
	);

	const handleSectionDelete = useCallback(
		(sectionId: string) => {
			const newSections = sections
				.filter((s) => s.id !== sectionId)
				.map((s, idx) => ({ ...s, order: idx }));
			setSections(newSections);
			handleSave(newSections);
		},
		[sections, handleSave],
	);

	const handleAddSection = useCallback(() => {
		const newSection: OutlineSection = {
			id: `section-${Date.now()}`,
			title: "New Section",
			body: {
				type: "doc",
				content: [{ type: "paragraph", content: [] }],
			},
			order: sections.length,
		};
		const newSections = [...sections, newSection];
		setSections(newSections);
		handleSave(newSections);
	}, [sections, handleSave]);

	// Loading state
	if (isLoading) {
		return (
			<div className="flex min-h-[300px] items-center justify-center">
				<Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
			</div>
		);
	}

	// Generating state
	if (isGenerating) {
		return (
			<div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
				<Sparkles className="h-8 w-8 animate-pulse text-blue-400" />
				<p className="text-muted-foreground text-sm">
					Generating outline from your response...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<FileText className="text-muted-foreground h-5 w-5" />
					<h2 className="text-lg font-medium">Outline</h2>
					{saveStatus === "saving" && (
						<Badge variant="secondary" className="text-xs">
							<Loader2 className="mr-1 h-3 w-3 animate-spin" />
							Saving...
						</Badge>
					)}
					{saveStatus === "saved" && (
						<Badge variant="secondary" className="text-xs text-green-400">
							<CheckCircle className="mr-1 h-3 w-3" />
							Saved
						</Badge>
					)}
					{saveStatus === "error" && (
						<Badge variant="destructive" className="text-xs">
							Save failed
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleGenerate(true)}
						disabled={isGenerating}
					>
						<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
						Regenerate
					</Button>
					<Button variant="outline" size="sm" onClick={handleAddSection}>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						Add Section
					</Button>
				</div>
			</div>

			{/* Generation error */}
			{generationError && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
					{generationError}
				</div>
			)}

			{/* Sections */}
			{sections.length === 0 ? (
				<div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
					<FileText className="text-muted-foreground h-8 w-8" />
					<p className="text-muted-foreground text-sm">
						No sections yet. Click &ldquo;Add Section&rdquo; or
						&ldquo;Regenerate&rdquo; to get started.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{sections
						.sort((a, b) => a.order - b.order)
						.map((section) => (
							<SectionEditor
								key={section.id}
								section={section}
								onUpdate={handleSectionUpdate}
								onDelete={handleSectionDelete}
							/>
						))}
				</div>
			)}
		</div>
	);
}
