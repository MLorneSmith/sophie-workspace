"use client";

import { Button } from "@kit/ui/button";
import { Badge } from "@kit/ui/badge";
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
import {
	type Editor,
	type JSONContent,
	EditorContent,
	useEditor,
} from "@tiptap/react";
import {
	Bold as BoldIcon,
	CheckCircle,
	FileText,
	Heading1,
	Heading2,
	Italic as ItalicIcon,
	List,
	ListOrdered,
	Loader2,
	RefreshCw,
	Sparkles,
	Underline as UnderlineIcon,
	Undo,
} from "lucide-react";
import debounce from "lodash/debounce";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";

import { generateOutlineAction } from "../_actions/generate-outline.action";
import {
	useOutlineContents,
	useSaveOutlineContent,
} from "../_lib/hooks/use-outline-contents";

interface OutlineEditorProps {
	presentationId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function Toolbar({ editor }: { editor: Editor | null }) {
	if (!editor) return null;

	return (
		<div className="flex items-center gap-1 border-b border-white/10 p-1">
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
				<BoldIcon className="h-4 w-4" />
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
				<ItalicIcon className="h-4 w-4" />
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
				<UnderlineIcon className="h-4 w-4" />
			</Button>
			<div className="mx-1 h-6 w-px bg-white/10" />
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
			<div className="mx-1 h-6 w-px bg-white/10" />
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
			<div className="mx-1 h-6 w-px bg-white/10" />
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

export function OutlineEditor({ presentationId }: OutlineEditorProps) {
	const { data: outlineDoc, isPending: isLoading } =
		useOutlineContents(presentationId);
	const { mutate: saveContent } = useSaveOutlineContent(presentationId);

	const [isGenerating, startGenerating] = useTransition();
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [generationError, setGenerationError] = useState<string | null>(null);
	const hasInitialized = useRef(false);
	const [resetKey, setResetKey] = useState(0);

	const handleReset = useCallback(
		(forceRegenerate: boolean) => {
			setGenerationError(null);
			startGenerating(async () => {
				try {
					const result = await generateOutlineAction({
						presentationId,
						forceRegenerate,
					});

					if (result && "data" in result && result.data) {
						// Force editor remount with new content
						setResetKey((k) => k + 1);
					} else if (result && "error" in result) {
						setGenerationError(
							typeof result.error === "string"
								? result.error
								: "Failed to assemble outline. Try again.",
						);
					}
				} catch (err) {
					setGenerationError(
						err instanceof Error ? err.message : "Failed to assemble outline",
					);
				}
			});
		},
		[presentationId],
	);

	// Auto-generate on first load if no outline exists
	useEffect(() => {
		if (isLoading || hasInitialized.current) return;
		if (outlineDoc === null) {
			hasInitialized.current = true;
			handleReset(false);
		} else {
			hasInitialized.current = true;
		}
	}, [isLoading, outlineDoc, handleReset]);

	// Save handler
	const handleSave = useCallback(
		(json: JSONContent) => {
			setSaveStatus("saving");
			saveContent(json, {
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
		[saveContent],
	);

	const debouncedSave = useMemo(() => debounce(handleSave, 1000), [handleSave]);

	// Initialize TipTap editor
	const initialContent = useMemo(() => {
		if (!outlineDoc) return undefined;
		return outlineDoc;
	}, [outlineDoc]);

	const editor = useEditor(
		{
			immediatelyRender: false,
			extensions: [
				StarterKit,
				Placeholder.configure({
					placeholder: "Your presentation outline will appear here...",
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
					class: "outline-none min-h-[400px] p-4",
				},
			},
			onBlur: ({ editor }) => {
				debouncedSave.cancel();
				handleSave(editor.getJSON());
			},
		},
		[resetKey],
	);

	// Debounced auto-save on editor updates
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

	// Cleanup debounce on unmount
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
				handleSave(editor.getJSON());
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [editor, debouncedSave, handleSave]);

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
					Assembling outline from your responses...
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
				<Button
					variant="outline"
					size="sm"
					onClick={() => handleReset(true)}
					disabled={isGenerating}
				>
					<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
					Reset Outline
				</Button>
			</div>

			<p className="text-muted-foreground text-xs">
				Combined content from your situation, complication, and answer responses
			</p>

			{/* Generation error */}
			{generationError && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
					{generationError}
				</div>
			)}

			{/* Single TipTap editor for the full outline document */}
			<div className="rounded-lg border border-white/10 bg-white/5">
				<Toolbar editor={editor} />
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
