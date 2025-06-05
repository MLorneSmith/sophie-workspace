"use client";

import type { Editor } from "@tiptap/react";
import {
	Bold,
	Heading1,
	Heading2,
	Italic,
	List,
	ListOrdered,
	Underline,
	Undo,
} from "lucide-react";

import { Button } from "@kit/ui/button";
import { Separator } from "@kit/ui/separator";
import { cn } from "@kit/ui/utils";

interface ToolbarProps {
	editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
	if (!editor) {
		return null;
	}

	return (
		<div className="flex items-center gap-1 border-b p-1">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBold().run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("bold") && "bg-accent text-accent-foreground",
				)}
				aria-label="Bold"
			>
				<Bold className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleItalic().run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("italic") && "bg-accent text-accent-foreground",
				)}
				aria-label="Italic"
			>
				<Italic className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("underline") && "bg-accent text-accent-foreground",
				)}
				aria-label="Underline"
			>
				<Underline className="h-4 w-4" />
			</Button>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("heading", { level: 1 }) &&
						"bg-accent text-accent-foreground",
				)}
				aria-label="Heading 1"
			>
				<Heading1 className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("heading", { level: 2 }) &&
						"bg-accent text-accent-foreground",
				)}
				aria-label="Heading 2"
			>
				<Heading2 className="h-4 w-4" />
			</Button>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("bulletList") && "bg-accent text-accent-foreground",
				)}
				aria-label="Bullet List"
			>
				<List className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				className={cn(
					"h-8 w-8 p-0",
					editor.isActive("orderedList") && "bg-accent text-accent-foreground",
				)}
				aria-label="Ordered List"
			>
				<ListOrdered className="h-4 w-4" />
			</Button>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<Button
				variant="ghost"
				size="sm"
				onClick={() => editor.chain().focus().undo().run()}
				disabled={!editor.can().undo()}
				className="h-8 w-8 p-0"
				aria-label="Undo"
			>
				<Undo className="h-4 w-4" />
			</Button>
		</div>
	);
}
