"use client";

import type React from "react";
import { Fragment } from "react";
import BunnyVideoComponent from "./BunnyVideo/Component";
import CallToActionComponent from "./CallToAction/Component";
import DebugBlockComponent from "./DebugBlock/Component";
import TestBlockComponent from "./TestBlock/Component";
import YouTubeVideoComponent from "./YouTubeVideo/Component";

// Define valid block types
type BlockType =
	| "call-to-action"
	| "custom-call-to-action"
	| "test-block"
	| "debug-block"
	| "bunny-video"
	| "youtube-video";

// Map block types to their respective components
const blockComponents: Record<BlockType, React.FC<any>> = {
	"call-to-action": CallToActionComponent,
	"custom-call-to-action": CallToActionComponent, // Support both slugs during transition
	"test-block": TestBlockComponent,
	"debug-block": DebugBlockComponent,
	"bunny-video": BunnyVideoComponent,
	"youtube-video": YouTubeVideoComponent,
};

type RenderBlocksProps = {
	blocks: Array<{
		blockType: string;
		[key: string]: any;
	}>;
};

export const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks }) => {
	const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

	if (hasBlocks) {
		return (
			<Fragment>
				{blocks.map((block, index) => {
					const { blockType } = block;

					// Type guard to check if blockType is a valid BlockType
					const isValidBlockType = (type: string): type is BlockType =>
						type === "call-to-action" ||
						type === "custom-call-to-action" ||
						type === "test-block" ||
						type === "debug-block" ||
						type === "bunny-video" ||
						type === "youtube-video";

					if (blockType && isValidBlockType(blockType)) {
						const Block = blockComponents[blockType];
						return <Block key={index} {...block} />;
					}

					// Fallback for unknown block types
					return (
						<div
							key={index}
							className="p-4 border-2 border-red-500 bg-red-50 rounded-md"
						>
							<h3 className="text-lg font-bold text-red-700">
								Unknown Block Type: {blockType}
							</h3>
							<pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
								{JSON.stringify(block, null, 2)}
							</pre>
						</div>
					);
				})}
			</Fragment>
		);
	}

	return null;
};

export default RenderBlocks;
