"use client";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { cn } from "@kit/ui/utils";
import {
	AlignLeft,
	CheckCircle,
	Columns2,
	Download,
	Layers,
	LayoutTemplate,
	Loader2,
	Plus,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";

import type {
	SlideLayout,
	StoryboardSlide,
} from "../../_lib/types/storyboard.types";
import { exportPowerPointAction } from "../_actions/export-powerpoint.action";
import { generateStoryboardAction } from "../_actions/generate-storyboard.action";
import {
	useSaveStoryboardSlides,
	useStoryboardContents,
} from "../_lib/hooks/use-storyboard-contents";
import { SlideEditor } from "./slide-editor";

interface StoryboardEditorProps {
	presentationId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function getLayoutIcon(layout: SlideLayout) {
	switch (layout) {
		case "title-only":
			return AlignLeft;
		case "title-two-column":
			return Columns2;
		default:
			return LayoutTemplate;
	}
}

export function StoryboardEditor({ presentationId }: StoryboardEditorProps) {
	const { data: storyboardData, isPending: isLoading } =
		useStoryboardContents(presentationId);
	const { mutate: saveSlides } = useSaveStoryboardSlides(presentationId);

	const [slides, setSlides] = useState<StoryboardSlide[]>([]);
	const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
	const [isGenerating, startGenerating] = useTransition();
	const [isExporting, startExporting] = useTransition();
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [generationError, setGenerationError] = useState<string | null>(null);
	const hasInitialized = useRef(false);

	const sortedSlides = useMemo(
		() => [...slides].sort((a, b) => a.order - b.order),
		[slides],
	);
	const selectedSlide =
		sortedSlides.find((slide) => slide.id === selectedSlideId) ??
		sortedSlides[0] ??
		null;

	const handleGenerate = useCallback(
		(forceRegenerate: boolean) => {
			setGenerationError(null);
			startGenerating(async () => {
				try {
					const result = await generateStoryboardAction({
						presentationId,
						forceRegenerate,
					});

					if (result && "data" in result && result.data?.slides) {
						setSlides(result.data.slides);
						if (result.data.slides.length > 0) {
							setSelectedSlideId(result.data.slides[0]?.id ?? null);
						}
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

	useEffect(() => {
		if (storyboardData?.slides && storyboardData.slides.length > 0) {
			setSlides(storyboardData.slides);
			if (!selectedSlideId && storyboardData.slides.length > 0) {
				setSelectedSlideId(storyboardData.slides[0]?.id ?? null);
			}
			hasInitialized.current = true;
		}
	}, [storyboardData, selectedSlideId]);

	useEffect(() => {
		if (isLoading || hasInitialized.current) return;
		if (
			storyboardData === null ||
			(storyboardData && storyboardData.slides.length === 0)
		) {
			hasInitialized.current = true;
			handleGenerate(false);
		}
	}, [isLoading, storyboardData, handleGenerate]);

	const handleExport = useCallback(() => {
		startExporting(async () => {
			try {
				const result = await exportPowerPointAction({
					presentationId,
				});

				if (result && "data" in result && result.data?.base64) {
					const byteCharacters = atob(result.data.base64);
					const byteNumbers = new Array(byteCharacters.length);
					for (let i = 0; i < byteCharacters.length; i++) {
						byteNumbers[i] = byteCharacters.charCodeAt(i);
					}
					const byteArray = new Uint8Array(byteNumbers);
					const blob = new Blob([byteArray], {
						type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
					});

					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = result.data.filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				}
			} catch {
				// Export error - silent for now
			}
		});
	}, [presentationId]);

	const handleSave = useCallback(
		(updatedSlides: StoryboardSlide[]) => {
			setSaveStatus("saving");
			saveSlides(updatedSlides, {
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
		[saveSlides],
	);

	const handleSlideUpdate = useCallback(
		(updated: StoryboardSlide) => {
			const newSlides = slides.map((s) => (s.id === updated.id ? updated : s));
			setSlides(newSlides);
			handleSave(newSlides);
		},
		[slides, handleSave],
	);

	const handleSlideDelete = useCallback(
		(slideId: string) => {
			const slideIndex = sortedSlides.findIndex(
				(slide) => slide.id === slideId,
			);
			const newSlides = sortedSlides
				.filter((slide) => slide.id !== slideId)
				.map((slide, idx) => ({ ...slide, order: idx }));

			setSlides(newSlides);

			if (selectedSlideId === slideId) {
				const nextSlide =
					newSlides[slideIndex] ?? newSlides[slideIndex - 1] ?? null;
				setSelectedSlideId(nextSlide?.id ?? null);
			}

			handleSave(newSlides);
		},
		[handleSave, selectedSlideId, sortedSlides],
	);

	const handleAddSlide = useCallback(() => {
		const newSlide: StoryboardSlide = {
			id: `slide-${Date.now()}`,
			title: "New Slide",
			layout: "title-content",
			content: "",
			speaker_notes: {
				type: "doc",
				content: [{ type: "paragraph", content: [] }],
			},
			visual_notes: "",
			order: sortedSlides.length,
		};
		const newSlides = [...sortedSlides, newSlide];
		setSlides(newSlides);
		setSelectedSlideId(newSlide.id);
		handleSave(newSlides);
	}, [sortedSlides, handleSave]);

	if (isLoading) {
		return (
			<div className="flex min-h-[300px] items-center justify-center">
				<Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (isGenerating) {
		return (
			<div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
				<Sparkles className="h-8 w-8 animate-pulse text-blue-400" />
				<p className="text-muted-foreground text-sm">
					Generating slides from your outline...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Layers className="text-muted-foreground h-5 w-5" />
					<h2 className="text-lg font-medium">Storyboard</h2>
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
					<Button variant="outline" size="sm" onClick={handleAddSlide}>
						<Plus className="mr-1.5 h-3.5 w-3.5" />
						Add Slide
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={handleExport}
						disabled={isExporting || slides.length === 0}
					>
						{isExporting ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<Download className="mr-1.5 h-3.5 w-3.5" />
						)}
						Export PPTX
					</Button>
				</div>
			</div>

			{generationError && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
					{generationError}
				</div>
			)}

			{sortedSlides.length === 0 ? (
				<div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
					<Layers className="text-muted-foreground h-8 w-8" />
					<p className="text-muted-foreground text-sm">
						No slides yet. Click &ldquo;Add Slide&rdquo; or
						&ldquo;Regenerate&rdquo; to get started.
					</p>
				</div>
			) : (
				<div className="flex h-[min(70vh,720px)] gap-4">
					<div className="w-[300px] shrink-0 rounded-lg border border-white/10 bg-white/5 p-2">
						<div className="h-full space-y-2 overflow-y-auto pr-1">
							{sortedSlides.map((slide) => {
								const LayoutIcon = getLayoutIcon(slide.layout);
								const isSelected = slide.id === selectedSlide?.id;

								return (
									<button
										key={slide.id}
										type="button"
										onClick={() => setSelectedSlideId(slide.id)}
										className={cn(
											"flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
											isSelected
												? "border-blue-500/40 bg-blue-500/5"
												: "border-white/10 bg-white/5 hover:border-white/20",
										)}
									>
										<span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-medium">
											{slide.order + 1}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{slide.title || "Untitled slide"}
											</p>
										</div>
										<LayoutIcon className="text-muted-foreground h-4 w-4 shrink-0" />
									</button>
								);
							})}
						</div>
					</div>

					<div className="min-w-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-1">
						{selectedSlide && (
							<SlideEditor
								key={selectedSlide.id}
								slide={selectedSlide}
								onUpdate={handleSlideUpdate}
								onDelete={handleSlideDelete}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
