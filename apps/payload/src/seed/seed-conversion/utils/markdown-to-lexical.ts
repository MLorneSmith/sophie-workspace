import type { LexicalContent, LexicalNode } from "../types";

export function markdownToLexical(markdown: string): LexicalContent {
	const lines = markdown.split("\n");
	const children: LexicalNode[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		// Skip empty lines
		if (!line.trim()) {
			i++;
			continue;
		}

		// Headers
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headerMatch) {
			const level = headerMatch[1].length;
			const text = headerMatch[2];
			children.push(createHeadingNode(level as 1 | 2 | 3 | 4 | 5 | 6, text));
			i++;
			continue;
		}

		// Lists
		const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
		if (listMatch) {
			const indent = listMatch[1].length / 2;
			const text = listMatch[2];
			const listItems = [createListItemNode(text)];

			// Check for more list items
			let j = i + 1;
			while (j < lines.length) {
				const nextLine = lines[j];
				const nextListMatch = nextLine.match(/^(\s*)[-*]\s+(.+)$/);
				if (nextListMatch) {
					listItems.push(createListItemNode(nextListMatch[2]));
					j++;
				} else {
					break;
				}
			}

			children.push(createListNode("bullet", listItems));
			i = j;
			continue;
		}

		// Code blocks
		if (line.startsWith("```")) {
			const language = line.slice(3).trim();
			const codeLines: string[] = [];
			i++;

			while (i < lines.length && !lines[i].startsWith("```")) {
				codeLines.push(lines[i]);
				i++;
			}

			children.push(createCodeNode(codeLines.join("\n"), language));
			i++;
			continue;
		}

		// Bunny video component
		const bunnyMatch = line.match(
			/^{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}$/,
		);
		if (bunnyMatch) {
			const videoId = bunnyMatch[1];
			children.push(createBunnyVideoNode(videoId));
			i++;
			continue;
		}

		// Highlight component
		const highlightMatch = line.match(/^{%\s*highlight\s+/);
		if (highlightMatch) {
			// TODO: Parse highlight component attributes
			children.push(createParagraphNode("Highlight component placeholder"));
			i++;
			continue;
		}

		// Images
		const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
		if (imageMatch) {
			const alt = imageMatch[1];
			const src = imageMatch[2];
			children.push(createImageNode(src, alt));
			i++;
			continue;
		}

		// Default to paragraph
		const paragraphLines = [line];
		i++;

		// Collect continuous paragraph lines
		while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
			paragraphLines.push(lines[i]);
			i++;
		}

		children.push(createParagraphNode(paragraphLines.join(" ")));
	}

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children,
			direction: null,
		},
	};
}

function createHeadingNode(
	tag: 1 | 2 | 3 | 4 | 5 | 6,
	text: string,
): LexicalNode {
	return {
		type: "heading",
		version: 1,
		tag: `h${tag}`,
		format: "",
		indent: 0,
		children: [createTextNode(text)],
	};
}

function createParagraphNode(text: string): LexicalNode {
	return {
		type: "paragraph",
		version: 1,
		format: "",
		indent: 0,
		children: [createTextNode(text)],
	};
}

function createTextNode(text: string): LexicalNode {
	// Handle inline formatting
	const formattedNodes: LexicalNode[] = [];
	const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);

	for (const part of parts) {
		if (!part) continue;

		if (part.startsWith("**") && part.endsWith("**")) {
			formattedNodes.push({
				type: "text",
				version: 1,
				text: part.slice(2, -2),
				format: 1, // bold
				detail: 0,
				style: "",
				mode: "normal",
			});
		} else if (part.startsWith("*") && part.endsWith("*")) {
			formattedNodes.push({
				type: "text",
				version: 1,
				text: part.slice(1, -1),
				format: 2, // italic
				detail: 0,
				style: "",
				mode: "normal",
			});
		} else if (part.startsWith("`") && part.endsWith("`")) {
			formattedNodes.push({
				type: "text",
				version: 1,
				text: part.slice(1, -1),
				format: 16, // code
				detail: 0,
				style: "",
				mode: "normal",
			});
		} else {
			formattedNodes.push({
				type: "text",
				version: 1,
				text: part,
				format: 0,
				detail: 0,
				style: "",
				mode: "normal",
			});
		}
	}

	return formattedNodes.length === 1
		? formattedNodes[0]
		: {
				type: "text",
				version: 1,
				text,
				format: 0,
				detail: 0,
				style: "",
				mode: "normal",
			};
}

function createListNode(
	listType: "bullet" | "number",
	items: LexicalNode[],
): LexicalNode {
	return {
		type: "list",
		version: 1,
		listType,
		start: 1,
		format: "",
		indent: 0,
		children: items,
	};
}

function createListItemNode(text: string): LexicalNode {
	return {
		type: "listitem",
		version: 1,
		value: 1,
		format: "",
		indent: 0,
		children: [createTextNode(text)],
	};
}

function createCodeNode(code: string, language: string = ""): LexicalNode {
	return {
		type: "code",
		version: 1,
		language,
		children: [
			{
				type: "text",
				version: 1,
				text: code,
				format: 0,
				detail: 0,
				style: "",
				mode: "normal",
			},
		],
	};
}

function createImageNode(src: string, alt: string = ""): LexicalNode {
	return {
		type: "upload",
		version: 1,
		relationTo: "media",
		value: {
			id: `{ref:media:${src}}`, // Will be resolved later
		},
		fields: {
			alt,
			caption: "",
		},
	};
}

function createBunnyVideoNode(videoId: string): LexicalNode {
	return {
		type: "block",
		version: 1,
		blockType: "bunnyVideo",
		fields: {
			videoId,
			provider: "bunny",
		},
	};
}

function isSpecialLine(line: string): boolean {
	return (
		line.match(/^#{1,6}\s+/) !== null ||
		line.match(/^[-*]\s+/) !== null ||
		line.startsWith("```") ||
		line.startsWith("{%") ||
		line.match(/^!\[/) !== null
	);
}
