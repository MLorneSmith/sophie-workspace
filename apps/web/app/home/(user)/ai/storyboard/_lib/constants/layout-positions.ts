// Layout position constants for PowerPoint slides
// This file is safe to import in both client and server components

export interface PositionMap {
	title: {
		x: number;
		y: number;
		w: number;
		h: number;
		fontSize: number;
		align: string;
	};
	subheadline1: { x: number; y: number; w: number; h: number };
	subheadline2?: { x: number; y: number; w: number; h: number };
	content1: { x: number; y: number; w: number; h: number };
	content2?: { x: number; y: number; w: number; h: number };
	[key: string]:
		| {
				x: number;
				y: number;
				w: number;
				h: number;
				fontSize?: number;
				align?: string;
		  }
		| undefined;
}

// Layout definitions for different slide types
export const LAYOUT_POSITIONS: Record<string, PositionMap> = {
	title: {
		title: { x: 0.5, y: 1.0, w: 9, h: 1.5, fontSize: 44, align: "center" },
		subheadline1: { x: 0.5, y: 3.0, w: 9, h: 1 },
		content1: { x: 0.5, y: 4.5, w: 9, h: 1.5 },
	},
	section: {
		title: { x: 0.5, y: 2.5, w: 9, h: 1.5, fontSize: 40, align: "center" },
		subheadline1: { x: 0.5, y: 4.0, w: 9, h: 1 },
		content1: { x: 0.5, y: 4.0, w: 9, h: 1.5 },
	},
	"one-column": {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 0.5, y: 1.2, w: 9, h: 0.4 },
		content1: { x: 0.5, y: 1.8, w: 9, h: 4 },
	},
	"two-column": {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 0.5, y: 1.2, w: 4.25, h: 0.4 },
		subheadline2: { x: 5.25, y: 1.2, w: 4.25, h: 0.4 },
		content1: { x: 0.5, y: 1.8, w: 4.25, h: 4 },
		content2: { x: 5.25, y: 1.8, w: 4.25, h: 4 },
	},
	"bullet-list": {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 0.5, y: 1.2, w: 9, h: 0.4 },
		content1: { x: 0.5, y: 1.8, w: 9, h: 0.5 },
	},
	chart: {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 0.5, y: 1.2, w: 9, h: 0.4 },
		content1: { x: 1.0, y: 1.8, w: 8, h: 4 },
	},
	"image-text": {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 5.0, y: 1.2, w: 4.5, h: 0.4 },
		content1: { x: 0.5, y: 1.8, w: 4.0, h: 4 }, // Image position
		content2: { x: 5.0, y: 1.8, w: 4.5, h: 4 }, // Text position
	},
	"text-image": {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 0.5, y: 1.2, w: 4.5, h: 0.4 },
		content1: { x: 0.5, y: 1.8, w: 4.5, h: 4 }, // Text position
		content2: { x: 5.5, y: 1.8, w: 4.0, h: 4 }, // Image position
	},
	comparison: {
		title: { x: 0.5, y: 0.6, w: 9, h: 0.5, fontSize: 24, align: "left" },
		subheadline1: { x: 0.5, y: 1.2, w: 4.25, h: 0.4 },
		subheadline2: { x: 5.25, y: 1.2, w: 4.25, h: 0.4 },
		content1: { x: 0.5, y: 1.8, w: 4.25, h: 4 },
		content2: { x: 5.25, y: 1.8, w: 4.25, h: 4 },
	},
};
