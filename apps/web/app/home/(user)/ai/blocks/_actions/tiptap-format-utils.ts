"use client";

/**
 * Utility to create a Tiptap document from plain text
 * Used for initial content creation
 */
export function createTiptapFromText(text: string) {
	// Split text into paragraphs and remove empty lines
	const paragraphs = text.split("\n").filter((line) => line.trim());

	// Convert each paragraph into a Tiptap node
	const content = paragraphs.map((paragraph) => {
		// Check if the line is a bullet point
		const trimmedParagraph = paragraph.trim();
		const isBulletPoint =
			trimmedParagraph.startsWith("-") || trimmedParagraph.startsWith("•");

		// Remove the bullet point character and trim whitespace
		const textContent = isBulletPoint
			? trimmedParagraph.substring(1).trim()
			: trimmedParagraph;

		if (isBulletPoint) {
			// Create a bullet list item
			return {
				type: "bulletList",
				content: [
					{
						type: "listItem",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text: textContent,
									},
								],
							},
						],
					},
				],
			};
		}
		// Create a regular paragraph
		return {
			type: "paragraph",
			content: [
				{
					type: "text",
					text: textContent,
				},
			],
		};
	});

	// Return Tiptap document format
	return JSON.stringify({
		type: "doc",
		content: content,
	});
}
