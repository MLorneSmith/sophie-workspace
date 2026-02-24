"use client";

import {
	closestCenter,
	DndContext,
	DragOverlay,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { cn } from "@kit/ui/utils";
import {
	ArrowLeftRight,
	BarChart3,
	CheckCircle,
	Columns2,
	Download,
	FileText,
	GripVertical,
	Image,
	Layers,
	Loader2,
	Minus,
	Plus,
	Quote,
	RefreshCw,
	Sparkles,
	Square,
	Type,
} from "lucide-react";
import {
	type ComponentPropsWithoutRef,
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
import { AgentPanel, type AgentPanelCatalogEntry } from "./agent-panel";
import { SlideEditor } from "./slide-editor";

interface StoryboardEditorProps {
	presentationId: string;
	agentCatalog: ReadonlyArray<AgentPanelCatalogEntry>;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function getLayoutIcon(layout: SlideLayout) {
	switch (layout) {
		case "title-only":
			return Type;
		case "title-content":
			return FileText;
		case "title-two-column":
			return Columns2;
		case "section-divider":
			return Minus;
		case "image-text":
			return Image;
		case "comparison":
			return ArrowLeftRight;
		case "data-chart":
			return BarChart3;
		case "quote":
			return Quote;
		case "blank":
			return Square;
		default:
			return FileText;
	}
}

function normalizeSlide(slide: StoryboardSlide): StoryboardSlide {
	return {
		...slide,
		purpose: slide.purpose ?? "",
		takeaway_headline: slide.takeaway_headline ?? "",
		evidence_needed: slide.evidence_needed ?? "",
		content_left: slide.content_left ?? "",
		content_right: slide.content_right ?? "",
	};
}

interface SlideThumbCardProps {
	slide: StoryboardSlide;
	isSelected: boolean;
	isDragging?: boolean;
	onSelect?: () => void;
	handleProps?: Omit<ComponentPropsWithoutRef<"button">, "ref">;
	handleRef?: (element: HTMLButtonElement | null) => void;
}

function SlideThumbCard({
	slide,
	isSelected,
	isDragging = false,
	onSelect,
	handleProps,
	handleRef,
}: SlideThumbCardProps) {
	const LayoutIcon = getLayoutIcon(slide.layout);

	return (
		<div
			className={cn(
				"flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
				isSelected
					? "border-blue-500/40 bg-blue-500/5"
					: "border-white/10 bg-white/5 hover:border-white/20",
				isDragging && "opacity-40",
			)}
		>
			<button
				ref={handleRef}
				type="button"
				aria-label="Drag to reorder slide"
				className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
				{...handleProps}
				onClick={(event) => event.preventDefault()}
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={onSelect}
				className="flex min-w-0 flex-1 items-center gap-2 text-left"
			>
				<span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-medium">
					{slide.order + 1}
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">
						{slide.title || "Untitled slide"}
					</p>
					{slide.takeaway_headline ? (
						<p className="text-muted-foreground truncate text-xs">
							{slide.takeaway_headline}
						</p>
					) : null}
				</div>
				<LayoutIcon className="text-muted-foreground h-4 w-4 shrink-0" />
			</button>
		</div>
	);
}

interface SortableSlideThumbProps {
	slide: StoryboardSlide;
	isSelected: boolean;
	onSelect: () => void;
}

function SortableSlideThumb({
	slide,
	isSelected,
	onSelect,
}: SortableSlideThumbProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: slide.id });

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
		>
			<SlideThumbCard
				slide={slide}
				isSelected={isSelected}
				isDragging={isDragging}
				onSelect={onSelect}
				handleProps={{ ...attributes, ...listeners }}
				handleRef={setActivatorNodeRef}
			/>
		</div>
	);
}

export function StoryboardEditor({
	presentationId,
	agentCatalog,
}: StoryboardEditorProps) {
	const { data: storyboardData, isPending: isLoading } =
		useStoryboardContents(presentationId);
	const { mutate: saveSlides } = useSaveStoryboardSlides(presentationId);

	const [slides, setSlides] = useState<StoryboardSlide[]>([]);
	const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
	const [isGenerating, startGenerating] = useTransition();
	const [isExporting, startExporting] = useTransition();
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [activeDragSlideId, setActiveDragSlideId] = useState<string | null>(
		null,
	);
	const hasInitialized = useRef(false);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 6,
			},
		}),
	);

	const sortedSlides = useMemo(
		() => [...slides].sort((a, b) => a.order - b.order),
		[slides],
	);
	const selectedSlide =
		sortedSlides.find((slide) => slide.id === selectedSlideId) ??
		sortedSlides[0] ??
		null;
	const activeDragSlide =
		sortedSlides.find((slide) => slide.id === activeDragSlideId) ?? null;

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
						const normalizedSlides = result.data.slides.map(normalizeSlide);
						setSlides(normalizedSlides);
						if (normalizedSlides.length > 0) {
							setSelectedSlideId(normalizedSlides[0]?.id ?? null);
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
			const normalizedSlides = storyboardData.slides.map(normalizeSlide);
			setSlides(normalizedSlides);
			if (!selectedSlideId && normalizedSlides.length > 0) {
				setSelectedSlideId(normalizedSlides[0]?.id ?? null);
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
			content_left: "",
			content_right: "",
			purpose: "",
			takeaway_headline: "",
			evidence_needed: "",
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

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setActiveDragSlideId(null);
			const { active, over } = event;

			if (!over || active.id === over.id) return;

			const oldIndex = sortedSlides.findIndex(
				(slide) => slide.id === active.id,
			);
			const newIndex = sortedSlides.findIndex((slide) => slide.id === over.id);
			if (oldIndex === -1 || newIndex === -1) return;

			const reorderedSlides = arrayMove(sortedSlides, oldIndex, newIndex).map(
				(slide, index) => ({
					...slide,
					order: index,
				}),
			);

			setSlides(reorderedSlides);
			handleSave(reorderedSlides);
		},
		[sortedSlides, handleSave],
	);

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
					<AgentPanel
						presentationId={presentationId}
						agents={agentCatalog}
						slides={sortedSlides}
					/>
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
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragStart={(event) =>
								setActiveDragSlideId(String(event.active.id))
							}
							onDragEnd={handleDragEnd}
							onDragCancel={() => setActiveDragSlideId(null)}
						>
							<div className="h-full overflow-y-auto pr-1">
								<SortableContext
									items={sortedSlides.map((slide) => slide.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className="space-y-2">
										{sortedSlides.map((slide) => (
											<SortableSlideThumb
												key={slide.id}
												slide={slide}
												isSelected={slide.id === selectedSlide?.id}
												onSelect={() => setSelectedSlideId(slide.id)}
											/>
										))}
									</div>
								</SortableContext>
							</div>

							<DragOverlay>
								{activeDragSlide ? (
									<div className="w-[282px]">
										<SlideThumbCard
											slide={activeDragSlide}
											isSelected={activeDragSlide.id === selectedSlide?.id}
										/>
									</div>
								) : null}
							</DragOverlay>
						</DndContext>
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
