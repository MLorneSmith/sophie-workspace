"use client";

import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Textarea } from "@kit/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { cn } from "@kit/ui/utils";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import {
	Bold as BoldIcon,
	Italic as ItalicIcon,
	List,
	ListOrdered,
	Trash2,
	Underline as UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";

import type {
	SlideLayout,
	StoryboardSlide,
} from "../../_lib/types/storyboard.types";

interface SlideEditorProps {
	slide: StoryboardSlide;
	onUpdate: (slide: StoryboardSlide) => void;
	onDelete: (slideId: string) => void;
	isSelected: boolean;
	onSelect: () => void;
}

function NotesToolbar({ editor }: { editor: Editor | null }) {
	if (!editor) return null;

	return (
		<div className="flex items-center gap-0.5 border-b border-white/10 px-1 py-0.5">
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
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				className={cn(
					"h-6 w-6 p-0",
					editor.isActive("underline") && "bg-accent text-accent-foreground",
				)}
				aria-label="Underline"
			>
				<UnderlineIcon className="h-3 w-3" />
			</Button>
			<div className="mx-0.5 h-3 w-px bg-white/10" />
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				className={cn(
					"h-6 w-6 p-0",
					editor.isActive("bulletList") && "bg-accent text-accent-foreground",
				)}
				aria-label="Bullet List"
			>
				<List className="h-3 w-3" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				className={cn(
					"h-6 w-6 p-0",
					editor.isActive("orderedList") && "bg-accent text-accent-foreground",
				)}
				aria-label="Ordered List"
			>
				<ListOrdered className="h-3 w-3" />
			</Button>
		</div>
	);
}

export function SlideEditor({
	slide,
	onUpdate,
	onDelete,
	isSelected,
	onSelect,
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
				class: "outline-none min-h-[60px] px-2 py-1.5 text-xs",
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
		<button
			type="button"
			className={cn(
				"group w-full cursor-pointer rounded-lg border text-left transition-colors",
				isSelected
					? "border-blue-500/40 bg-blue-500/5"
					: "border-white/10 bg-white/5 hover:border-white/20",
			)}
			onClick={onSelect}
		>
			{/* Slide header */}
			<div className="flex items-center gap-2 border-b border-white/10 p-3">
				<span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-medium">
					{slide.order + 1}
				</span>
				<Input
					value={slide.title}
					onChange={(e) => {
						e.stopPropagation();
						onUpdate({ ...slide, title: e.target.value });
					}}
					onClick={(e) => e.stopPropagation()}
					placeholder="Slide title"
					className="h-7 border-0 bg-transparent px-2 text-sm font-medium focus-visible:ring-0"
				/>
				<Select
					value={slide.layout}
					onValueChange={(value: SlideLayout) => {
						onUpdate({ ...slide, layout: value });
					}}
				>
					<SelectTrigger
						className="h-7 w-[140px] shrink-0 border-white/10 text-xs"
						onClick={(e) => e.stopPropagation()}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="title-only">Title Only</SelectItem>
						<SelectItem value="title-content">Title + Content</SelectItem>
						<SelectItem value="title-two-column">Two Column</SelectItem>
					</SelectContent>
				</Select>
				<Button
					variant="ghost"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(slide.id);
					}}
					className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
					aria-label="Delete slide"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</div>

			{/* Slide content */}
			{isSelected && (
				<div className="space-y-3 p-3">
					{slide.layout !== "title-only" && (
						<div>
							<p className="text-muted-foreground mb-1 text-xs font-medium">
								Content
							</p>
							<Textarea
								value={slide.content}
								onChange={(e) =>
									onUpdate({ ...slide, content: e.target.value })
								}
								placeholder="Slide content..."
								className="min-h-[80px] border-white/10 bg-white/5 text-sm"
							/>
						</div>
					)}

					<div>
						<p className="text-muted-foreground mb-1 text-xs font-medium">
							Visual Notes
						</p>
						<Input
							value={slide.visual_notes}
							onChange={(e) =>
								onUpdate({ ...slide, visual_notes: e.target.value })
							}
							placeholder="e.g., 'Chart showing market trends'"
							className="h-8 border-white/10 bg-white/5 text-sm"
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
			)}
		</button>
	);
}
