"use client";

import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
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
	Heading1,
	Heading2,
	Italic as ItalicIcon,
	List,
	ListOrdered,
	Trash2,
	Underline as UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";

import type { OutlineSection } from "../../_lib/types/outline.types";

interface SectionEditorProps {
	section: OutlineSection;
	onUpdate: (section: OutlineSection) => void;
	onDelete: (sectionId: string) => void;
}

function MiniToolbar({ editor }: { editor: Editor | null }) {
	if (!editor) return null;

	return (
		<div className="flex items-center gap-1 border-b border-white/10 p-1">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBold().run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("bold") && "bg-accent text-accent-foreground",
				)}
				aria-label="Bold"
			>
				<BoldIcon className="h-3.5 w-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleItalic().run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("italic") && "bg-accent text-accent-foreground",
				)}
				aria-label="Italic"
			>
				<ItalicIcon className="h-3.5 w-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("underline") && "bg-accent text-accent-foreground",
				)}
				aria-label="Underline"
			>
				<UnderlineIcon className="h-3.5 w-3.5" />
			</Button>
			<div className="mx-1 h-4 w-px bg-white/10" />
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("heading", { level: 1 }) &&
						"bg-accent text-accent-foreground",
				)}
				aria-label="Heading 1"
			>
				<Heading1 className="h-3.5 w-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("heading", { level: 2 }) &&
						"bg-accent text-accent-foreground",
				)}
				aria-label="Heading 2"
			>
				<Heading2 className="h-3.5 w-3.5" />
			</Button>
			<div className="mx-1 h-4 w-px bg-white/10" />
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("bulletList") && "bg-accent text-accent-foreground",
				)}
				aria-label="Bullet List"
			>
				<List className="h-3.5 w-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				className={cn(
					"h-7 w-7 p-0",
					editor.isActive("orderedList") && "bg-accent text-accent-foreground",
				)}
				aria-label="Ordered List"
			>
				<ListOrdered className="h-3.5 w-3.5" />
			</Button>
		</div>
	);
}

export function SectionEditor({
	section,
	onUpdate,
	onDelete,
}: SectionEditorProps) {
	const initialContent = useMemo(() => {
		if (!section.body) {
			return {
				type: "doc" as const,
				content: [{ type: "paragraph" as const, content: [] }],
			};
		}
		if (typeof section.body === "string") {
			try {
				return JSON.parse(section.body);
			} catch {
				return {
					type: "doc" as const,
					content: [
						{
							type: "paragraph" as const,
							content: [{ type: "text" as const, text: section.body }],
						},
					],
				};
			}
		}
		return section.body;
	}, [section.body]);

	const handleBodyChange = useCallback(
		(json: unknown) => {
			onUpdate({ ...section, body: json as OutlineSection["body"] });
		},
		[section, onUpdate],
	);

	const debouncedBodyChange = useMemo(
		() => debounce(handleBodyChange, 800),
		[handleBodyChange],
	);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: "Add your talking points...",
			}),
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
				class: "outline-none min-h-[80px] px-3 py-2 text-sm",
			},
		},
		onBlur: ({ editor }) => {
			debouncedBodyChange.cancel();
			handleBodyChange(editor.getJSON());
		},
	});

	useEffect(() => {
		if (!editor) return;

		const handleUpdate = ({ editor }: { editor: Editor }) => {
			debouncedBodyChange(editor.getJSON());
		};

		editor.on("update", handleUpdate);
		return () => {
			editor.off("update", handleUpdate);
		};
	}, [editor, debouncedBodyChange]);

	useEffect(() => {
		return () => {
			debouncedBodyChange.cancel();
		};
	}, [debouncedBodyChange]);

	return (
		<div className="group rounded-lg border border-white/10 bg-white/5">
			<div className="flex items-center gap-2 border-b border-white/10 p-3">
				<span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-medium">
					{section.order + 1}
				</span>
				<Input
					value={section.title}
					onChange={(e) => onUpdate({ ...section, title: e.target.value })}
					placeholder="Section title"
					className="h-8 border-0 bg-transparent px-2 text-sm font-medium focus-visible:ring-0"
				/>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onDelete(section.id)}
					className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
					aria-label="Delete section"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</Button>
			</div>

			<MiniToolbar editor={editor} />

			<EditorContent editor={editor} />
		</div>
	);
}
