import type { BaseImprovement } from "@kit/ai-gateway";
import type { Editor } from "@tiptap/react";

/**
 * Inserts an AI-generated improvement into the Tiptap editor
 *
 * @param editor The Tiptap editor instance
 * @param improvement The improvement object containing summary and supporting points
 */
export function insertImprovement(
	editor: Editor,
	improvement: BaseImprovement,
) {
	if (!editor) return;

	// Insert the summary point as a heading
	editor
		.chain()
		.focus()
		.insertContent({
			type: "heading",
			attrs: { level: 2 },
			content: [{ type: "text", text: improvement.implementedSummaryPoint }],
		})
		.enter()
		.run();

	// Insert each supporting point as a bullet list item
	if (improvement.implementedSupportingPoints.length > 0) {
		// Create a bullet list with all supporting points
		const bulletListContent = {
			type: "bulletList",
			content: improvement.implementedSupportingPoints.map((point: string) => ({
				type: "listItem",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: point }],
					},
				],
			})),
		};

		// Insert the bullet list
		editor.chain().focus().insertContent(bulletListContent).run();
	}
}
