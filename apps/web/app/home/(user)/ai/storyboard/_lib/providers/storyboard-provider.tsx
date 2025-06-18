"use client";

import { toast } from "@kit/ui/sonner";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";

import {
	getPresentationAction,
	saveStoryboardAction,
} from "../services/storyboard-service";
import type {
	BuildingBlocksSubmission,
	Slide,
	StoryboardData,
	TipTapDocument,
	TipTapNode,
} from "../types";

// Basic debounce function
function debounce<T extends (...args: unknown[]) => void>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null;
	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func(...args);
		}, delay);
	};
}

type StoryboardContextType = {
	storyboard: StoryboardData | null;
	currentPresentation: BuildingBlocksSubmission | null;
	isLoading: boolean;
	isUpdating: boolean;
	error: Error | null;
	setCurrentPresentationId: (id: string | null) => void;
	updateStoryboard: (updatedStoryboard: StoryboardData) => Promise<boolean>;
	updateSlide: (updatedSlide: Slide) => void;
	addSlide: () => void;
	removeSlide: (slideId: string) => void;
	reorderSlides: (slideIds: string[]) => void;
};

const StoryboardContext = createContext<StoryboardContextType | null>(null);

interface StoryboardProviderProps {
	children: React.ReactNode;
}

export function StoryboardProvider({ children }: StoryboardProviderProps) {
	const [isPending, startTransition] = useTransition();
	const [currentPresentationId, setCurrentPresentationId] = useState<
		string | null
	>(null);
	const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
	const [currentPresentation, setCurrentPresentation] =
		useState<BuildingBlocksSubmission | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Fetch presentation data when ID changes
	useEffect(() => {
		if (!currentPresentationId) {
			setStoryboard(null);
			setCurrentPresentation(null);
			return;
		}

		const _fetchPresentation = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const presentation = await getPresentationAction({
					presentationId: currentPresentationId,
				});

				// Type assertion to handle various response formats
				const typedPresentation =
					presentation as unknown as BuildingBlocksSubmission;
				setCurrentPresentation(typedPresentation);

				// If storyboard exists, use it
				if (typedPresentation.storyboard) {
					setStoryboard(typedPresentation.storyboard as StoryboardData);
				} else if (typedPresentation.outline) {
					// Otherwise generate one from the outline
					const generatedStoryboard = generateStoryboardFromOutline(
						typedPresentation.outline || { type: "doc", content: [] },
					);
					setStoryboard(generatedStoryboard);
				} else {
					// Create an empty storyboard as fallback
					setStoryboard({
						title: typedPresentation.title || "Untitled Presentation",
						slides: [],
					});
				}
			} catch (err) {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
				setError(
					err instanceof Error
						? err
						: new Error("Failed to fetch presentation"),
				);
				toast.error("Failed to load presentation");
			} finally {
				setIsLoading(false);
			}
		};

		_fetchPresentation();
	}, [currentPresentationId]);

	// Save storyboard to database
	const updateStoryboard = useCallback(
		async (updatedStoryboard: StoryboardData) => {
			if (!currentPresentationId) return false;

			try {
				startTransition(async () => {
					setStoryboard(updatedStoryboard);
				});

				const _result = await saveStoryboardAction({
					presentationId: currentPresentationId,
					storyboard: updatedStoryboard,
				});

				// saveStoryboardAction throws an error on failure, it doesn't return { success: false, message: ... }
				// If we reach here, it means the action was successful.
				toast.success("Storyboard saved successfully");
				return true;
			} catch (err) {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
				// Check if the error is an instance of Error and has a message property
				const errorMessage =
					err instanceof Error ? err.message : "Failed to save storyboard";
				toast.error(errorMessage);
				return false;
			}
		},
		[currentPresentationId],
	);

	// Debounced save function
	const debouncedSaveStoryboard = useMemo(
		() =>
			debounce(
				(storyboardData: unknown) =>
					updateStoryboard(storyboardData as StoryboardData),
				1000,
			), // Save 1 second after last change
		[updateStoryboard],
	);

	// Auto-save effect
	useEffect(() => {
		if (storyboard && currentPresentationId) {
			// Only auto-save if a presentation is loaded
			debouncedSaveStoryboard(storyboard);
		}
	}, [debouncedSaveStoryboard, storyboard, currentPresentationId]);

	// Update a single slide
	const updateSlide = useCallback(
		(updatedSlide: Slide) => {
			if (!storyboard) return;

			const newSlides = storyboard.slides.map((slide) =>
				slide.id === updatedSlide.id ? updatedSlide : slide,
			);

			const updatedStoryboard = {
				...storyboard,
				slides: newSlides,
			};

			startTransition(() => {
				setStoryboard(updatedStoryboard);
			});

			// Auto-save will handle the actual saving
		},
		[storyboard],
	);

	// Add a new slide
	const addSlide = useCallback(() => {
		if (!storyboard) return;

		const newSlide: Slide = {
			id: `slide-${Date.now()}-${storyboard.slides.length}`,
			title: "New Slide",
			headline: "", // Add headline property
			layoutId: "content",
			content: [
				{
					id: `content-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					area: `content-area-${0}`, // Default area for now
					type: "text",
					text: "Add content here",
					columnIndex: 0,
				},
			],
			order: storyboard.slides.length,
		};

		const updatedStoryboard = {
			...storyboard,
			slides: [...storyboard.slides, newSlide],
		};

		startTransition(() => {
			setStoryboard(updatedStoryboard);
		});

		updateStoryboard(updatedStoryboard);
	}, [updateStoryboard, storyboard]);

	// Remove a slide
	const removeSlide = useCallback(
		(slideId: string) => {
			if (!storyboard) return;

			const updatedSlides = storyboard.slides
				.filter((slide) => slide.id !== slideId)
				.map((slide, index) => ({
					...slide,
					order: index,
				}));

			const updatedStoryboard = {
				...storyboard,
				slides: updatedSlides,
			};

			startTransition(() => {
				setStoryboard(updatedStoryboard);
			});

			updateStoryboard(updatedStoryboard);
		},
		[updateStoryboard, storyboard],
	);

	// Reorder slides
	const reorderSlides = useCallback(
		(slideIds: string[]) => {
			if (!storyboard) return;

			// Map current slides to new order
			const slidesMap = new Map(
				storyboard.slides.map((slide) => [slide.id, slide]),
			);

			const updatedSlides = slideIds.map((id, index) => {
				const slide = slidesMap.get(id);
				if (!slide) {
					throw new Error(`Slide with id ${id} not found`);
				}
				return {
					...slide,
					order: index,
				};
			});

			const updatedStoryboard = {
				...storyboard,
				slides: updatedSlides,
			};

			startTransition(() => {
				setStoryboard(updatedStoryboard);
			});

			updateStoryboard(updatedStoryboard);
		},
		[updateStoryboard, storyboard],
	);

	const value = useMemo(
		() => ({
			storyboard,
			currentPresentation,
			isLoading,
			isUpdating: isPending,
			error,
			setCurrentPresentationId,
			updateStoryboard,
			updateSlide,
			addSlide,
			removeSlide,
			reorderSlides,
		}),
		[
			storyboard,
			currentPresentation,
			isLoading,
			isPending,
			error,
			updateStoryboard,
			updateSlide,
			addSlide,
			removeSlide,
			reorderSlides,
		],
	);

	return (
		<StoryboardContext.Provider value={value}>
			{children}
		</StoryboardContext.Provider>
	);
}

export function useStoryboard() {
	const context = useContext(StoryboardContext);
	if (!context) {
		throw new Error("useStoryboard must be used within a StoryboardProvider");
	}
	return context;
}

// Basic transformer function from TipTap JSON to storyboard format
function generateStoryboardFromOutline(
	outline: TipTapDocument,
): StoryboardData {
	let slideCount = 0;
	const slides: Slide[] = [];
	const title = extractTitle(outline) || "Untitled Presentation";

	// Process the content to extract slides
	if (outline?.content) {
		let currentSlide: Slide | null = null;

		for (const node of outline.content) {
			// If it's a heading, create a new slide
			if (node.type === "heading") {
				const headingLevel =
					typeof node.attrs?.level === "number" ? node.attrs.level : 1;
				const headingText = extractTextFromNode(node);

				// Level 1 and 2 headings become slides
				if (headingLevel <= 2) {
					// Save the previous slide if we have one
					if (currentSlide) {
						slides.push(currentSlide);
					}

					// Create a new slide
					currentSlide = {
						id: `slide-${Date.now()}-${slideCount++}`,
						title: headingText,
						headline: "", // Add headline property
						layoutId: headingLevel === 1 ? "title" : "content",
						content: [],
						order: slides.length,
					};
				} else if (currentSlide) {
					// Add lower-level headings as content to the current slide
					currentSlide.content.push({
						id: `content-${Date.now()}-${Math.random().toString(36).substring(7)}`,
						area: `content-area-${0}`, // Default area for now
						type: "text",
						text: headingText,
						columnIndex: 0,
					});
				}
			} else if (node.type === "paragraph" && currentSlide) {
				// Add paragraphs as text content
				currentSlide.content.push({
					id: `content-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					area: `content-area-${0}`, // Default area for now
					type: "text",
					text: extractTextFromNode(node),
					columnIndex: 0,
				});
			} else if (
				(node.type === "bulletList" || node.type === "orderedList") &&
				currentSlide
			) {
				// Process list items
				_processList(node, currentSlide);
			}
		}

		// Add the last slide if we have one
		if (currentSlide) {
			slides.push(currentSlide);
		}
	}

	// Add a default slide if no slides were created
	if (slides.length === 0) {
		slides.push({
			id: `slide-${Date.now()}-0`,
			title: "Introduction",
			headline: "", // Add headline property
			layoutId: "title",
			content: [
				{
					id: `content-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					area: `content-area-${0}`, // Default area for now
					type: "text",
					text: title,
					columnIndex: 0,
				},
			],
			order: 0,
		});
	}

	return {
		title,
		slides,
	};
}

function extractTitle(outline: TipTapDocument): string | null {
	// Try to find the first level 1 heading
	if (outline?.content) {
		for (const node of outline.content) {
			if (node.type === "heading" && node.attrs?.level === 1) {
				return extractTextFromNode(node);
			}
		}
	}
	return null;
}

function extractTextFromNode(node: TipTapNode): string {
	if (!node.content) return "";

	return node.content
		.map((contentNode: TipTapNode) => {
			if (contentNode.type === "text") {
				return contentNode.text;
			}
			return extractTextFromNode(contentNode);
		})
		.join("");
}

function _processList(
	node: TipTapNode,
	slide: Slide,
	type: "bullet" | "subbullet" = "bullet",
) {
	if (!node.content) return;

	for (const item of node.content) {
		if (item.type === "listItem" && item.content) {
			for (const itemContent of item.content) {
				if (itemContent.type === "paragraph") {
					slide.content.push({
						id: `content-${Date.now()}-${Math.random().toString(36).substring(7)}`,
						area: `content-area-${0}`, // Default area for now
						type,
						text: extractTextFromNode(itemContent),
						columnIndex: 0,
					});
				} else if (
					itemContent.type === "bulletList" ||
					itemContent.type === "orderedList"
				) {
					_processList(itemContent, slide, "subbullet");
				}
			}
		}
	}
}
