"use client";

import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { Textarea } from "@kit/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kit/ui/tooltip";
import { usePlatform } from "@kit/ui/use-platform";
import { cn } from "@kit/ui/utils";
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
	Bold as BoldIcon,
	Italic as ItalicIcon,
	List,
	ListOrdered,
	Loader2,
	RefreshCw,
	Trash2,
	Underline as UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import type {
	SlideLayout,
	StoryboardSlide,
} from "../../_lib/types/storyboard.types";

interface SlideEditorProps {
	slide: StoryboardSlide;
	onUpdate: (slide: StoryboardSlide) => void;
	onDelete: (slideId: string) => void;
	onRegenerate?: (slideId: string) => void;
	isRegenerating?: boolean;
}

function NotesToolbar({ editor }: { editor: Editor | null }) {
	const { formatShortcut } = usePlatform();

	if (!editor) return null;

	return (
		<TooltipProvider delayDuration={500}>
			<div className="flex items-center gap-0.5 border-b border-white/10 px-1 py-0.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor.chain().focus().toggleBold().run()}
							className={cn(
								"h-6 w-6 p-0",
								editor.isActive("bold") && "bg-accent text-accent-foreground",
							)}
							aria-label="Bold"
						>
							<BoldIcon className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Bold {formatShortcut("Ctrl+B")}</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor.chain().focus().toggleItalic().run()}
							className={cn(
								"h-6 w-6 p-0",
								editor.isActive("italic") && "bg-accent text-accent-foreground",
							)}
							aria-label="Italic"
						>
							<ItalicIcon className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Italic {formatShortcut("Ctrl+I")}</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor.chain().focus().toggleUnderline().run()}
							className={cn(
								"h-6 w-6 p-0",
								editor.isActive("underline") &&
									"bg-accent text-accent-foreground",
							)}
							aria-label="Underline"
						>
							<UnderlineIcon className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Underline {formatShortcut("Ctrl+U")}</p>
					</TooltipContent>
				</Tooltip>
				<div className="mx-0.5 h-3 w-px bg-white/10" />
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor.chain().focus().toggleBulletList().run()}
							className={cn(
								"h-6 w-6 p-0",
								editor.isActive("bulletList") &&
									"bg-accent text-accent-foreground",
							)}
							aria-label="Bullet List"
						>
							<List className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Bullet List {formatShortcut("Ctrl+Shift+8")}</p>
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor.chain().focus().toggleOrderedList().run()}
							className={cn(
								"h-6 w-6 p-0",
								editor.isActive("orderedList") &&
									"bg-accent text-accent-foreground",
							)}
							aria-label="Ordered List"
						>
							<ListOrdered className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Ordered List {formatShortcut("Ctrl+Shift+7")}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

export function SlideEditor({
	slide,
	onUpdate,
	onDelete,
	onRegenerate,
	isRegenerating = false,
}: SlideEditorProps) {
	const notesContent = useMemo(() => {
		if (!slide.speaker_notes) {
			return {
				type: "doc" as const,
				content: [{ type: "paragraph" as const, content: [] }],
			};
		}
		if (typeof slide.speaker_notes === "string") {
			try {
				return JSON.parse(slide.speaker_notes);
			} catch {
				return {
					type: "doc" as const,
					content: [
						{
							type: "paragraph" as const,
							content: [{ type: "text" as const, text: slide.speaker_notes }],
						},
					],
				};
			}
		}
		return slide.speaker_notes;
	}, [slide.speaker_notes]);

	const handleNotesChange = useCallback(
		(json: unknown) => {
			onUpdate({
				...slide,
				speaker_notes: json as StoryboardSlide["speaker_notes"],
			});
		},
		[slide, onUpdate],
	);

	const debouncedNotesChange = useMemo(
		() => debounce(handleNotesChange, 800),
		[handleNotesChange],
	);

	const notesEditor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Placeholder.configure({ placeholder: "Speaker notes..." }),
			Bold,
			Italic,
			Underline,
			Heading.configure({ levels: [1, 2] }),
			BulletList,
			OrderedList,
			ListItem,
		],
		content: notesContent,
		editorProps: {
			attributes: {
				class: "outline-none min-h-[120px] px-3 py-2 text-sm",
			},
		},
		onBlur: ({ editor }) => {
			debouncedNotesChange.cancel();
			handleNotesChange(editor.getJSON());
		},
	});

	useEffect(() => {
		if (!notesEditor) return;

		const handleUpdate = ({ editor }: { editor: Editor }) => {
			debouncedNotesChange(editor.getJSON());
		};

		notesEditor.on("update", handleUpdate);
		return () => {
			notesEditor.off("update", handleUpdate);
		};
	}, [notesEditor, debouncedNotesChange]);

	useEffect(() => {
		return () => {
			debouncedNotesChange.cancel();
		};
	}, [debouncedNotesChange]);

	return (
		<div className="rounded-lg border border-blue-500/40 bg-blue-500/5">
			<div className="flex items-center gap-2 border-b border-white/10 p-3">
				<span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-medium">
					{slide.order + 1}
				</span>
				<Input
					value={slide.title}
					onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
					placeholder="Slide title"
					className="h-8 border-white/10 bg-white/5 px-2 text-sm font-medium"
				/>
				<Select
					value={slide.layout}
					onValueChange={(value: SlideLayout) => {
						onUpdate({ ...slide, layout: value });
					}}
				>
					<SelectTrigger className="h-8 w-[180px] shrink-0 border-white/10 bg-white/5 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="title-only">Title Only</SelectItem>
						<SelectItem value="title-content">Title + Content</SelectItem>
						<SelectItem value="title-two-column">Two Column</SelectItem>
						<SelectItem value="section-divider">Section Divider</SelectItem>
						<SelectItem value="image-text">Image + Text</SelectItem>
						<SelectItem value="comparison">Comparison</SelectItem>
						<SelectItem value="data-chart">Data / Chart</SelectItem>
						<SelectItem value="quote">Quote</SelectItem>
						<SelectItem value="blank">Blank</SelectItem>
					</SelectContent>
				</Select>
				<TooltipProvider delayDuration={500}>
					{onRegenerate && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onRegenerate(slide.id)}
									disabled={isRegenerating}
									className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0 p-0"
									aria-label="Regenerate slide"
								>
									{isRegenerating ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<RefreshCw className="h-3.5 w-3.5" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Regenerate Slide</p>
							</TooltipContent>
						</Tooltip>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onDelete(slide.id)}
								className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 p-0"
								aria-label="Delete slide"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Delete Slide</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="space-y-4 p-4">
				<div>
					<p className="text-muted-foreground mb-1 text-xs font-medium">
						Purpose
					</p>
					<Input
						value={slide.purpose}
						onChange={(e) => onUpdate({ ...slide, purpose: e.target.value })}
						placeholder="What does this slide do? e.g., 'Establishes the market opportunity'"
						className="h-9 border-white/10 bg-white/5 text-sm"
					/>
				</div>

				<div>
					<p className="text-muted-foreground mb-1 text-xs font-medium">
						Takeaway Headline
					</p>
					<Input
						value={slide.takeaway_headline}
						onChange={(e) =>
							onUpdate({ ...slide, takeaway_headline: e.target.value })
						}
						placeholder="The one thing the audience should remember from this slide"
						className="h-9 border-white/10 bg-white/5 text-sm"
					/>
				</div>

				{(slide.layout === "title-content" ||
					slide.layout === "image-text" ||
					slide.layout === "data-chart" ||
					slide.layout === "quote" ||
					slide.layout === "blank") && (
					<div>
						<p className="text-muted-foreground mb-1 text-xs font-medium">
							Content
						</p>
						<Textarea
							value={slide.content}
							onChange={(e) => onUpdate({ ...slide, content: e.target.value })}
							placeholder={
								slide.layout === "quote" ? "Quote text..." : "Slide content..."
							}
							className="min-h-[120px] border-white/10 bg-white/5 text-sm"
						/>
					</div>
				)}

				{(slide.layout === "title-two-column" ||
					slide.layout === "comparison") && (
					<div className="flex flex-col gap-3 md:flex-row">
						<div className="flex-1">
							<p className="text-muted-foreground mb-1 text-xs font-medium">
								{slide.layout === "comparison" ? "Option A" : "Left Column"}
							</p>
							<Textarea
								value={slide.content_left ?? ""}
								onChange={(e) =>
									onUpdate({ ...slide, content_left: e.target.value })
								}
								placeholder={
									slide.layout === "comparison"
										? "Option A content..."
										: "Left column content..."
								}
								className="min-h-[120px] border-white/10 bg-white/5 text-sm"
							/>
						</div>
						<div className="flex-1">
							<p className="text-muted-foreground mb-1 text-xs font-medium">
								{slide.layout === "comparison" ? "Option B" : "Right Column"}
							</p>
							<Textarea
								value={slide.content_right ?? ""}
								onChange={(e) =>
									onUpdate({ ...slide, content_right: e.target.value })
								}
								placeholder={
									slide.layout === "comparison"
										? "Option B content..."
										: "Right column content..."
								}
								className="min-h-[120px] border-white/10 bg-white/5 text-sm"
							/>
						</div>
					</div>
				)}

				<div>
					<p className="text-muted-foreground mb-1 text-xs font-medium">
						Evidence Needed
					</p>
					<Input
						value={slide.evidence_needed}
						onChange={(e) =>
							onUpdate({ ...slide, evidence_needed: e.target.value })
						}
						placeholder="What data or proof supports this? e.g., 'Q3 revenue chart, customer quote'"
						className={cn(
							"h-9 border-white/10 bg-white/5 text-sm",
							slide.layout === "data-chart" && "border-blue-500/40",
						)}
					/>
				</div>

				<div>
					<p className="text-muted-foreground mb-1 text-xs font-medium">
						Visual Notes
					</p>
					<Input
						value={slide.visual_notes}
						onChange={(e) =>
							onUpdate({ ...slide, visual_notes: e.target.value })
						}
						placeholder={
							slide.layout === "quote"
								? "Quote attribution (person/source)"
								: "e.g., 'Chart showing market trends'"
						}
						className={cn(
							"h-9 border-white/10 bg-white/5 text-sm",
							slide.layout === "image-text" && "border-blue-500/40",
						)}
					/>
				</div>

				<div>
					<p className="text-muted-foreground mb-1 text-xs font-medium">
						Speaker Notes
					</p>
					<div className="rounded-md border border-white/10 bg-white/5">
						<NotesToolbar editor={notesEditor} />
						<EditorContent editor={notesEditor} />
					</div>
				</div>
			</div>
		</div>
	);
}
