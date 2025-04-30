/**
 * Represents a TipTap document structure
 */
export interface TipTapDocument {
  type: 'doc';
  content: TipTapNode[];
}

/**
 * Base interface for TipTap nodes
 */
export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: Array<{ type: string }>;
  text?: string;
}

/**
 * Specialized interface for text nodes
 */
export interface TipTapTextNode extends TipTapNode {
  type: 'text';
  text: string;
}

/**
 * Main structure for presentation storyboard
 */
export interface PresentationStructure {
  slides: SlideContent[];
  metadata: {
    title: string;
    author: string;
    created: Date;
    modified: Date;
  };
}

/**
 * Represents content for a single slide
 */
export interface SlideContent {
  id: string;
  layout: 'title' | 'section' | 'oneColumn' | 'twoColumn' | 'contentFocus';
  headline: string;
  subheadlines?: string[];
  contentAreas: SlideContentItem[];
  notes?: string;
}

/**
 * Union type for different content types in slides
 */
export type SlideContentItem =
  | TextContent
  | BulletListContent
  | ChartContent
  | ImageContent
  | TableContent;

interface BaseContent {
  id: string;
  type: 'text' | 'bullets' | 'chart' | 'image' | 'table';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextContent extends BaseContent {
  type: 'text';
  content: string;
  formatting?: {
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
  };
}

export interface BulletListContent extends BaseContent {
  type: 'bullets';
  items: string[];
  level?: number;
}

export interface ChartContent extends BaseContent {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  data: Array<{ label: string; value: number }>;
}

export interface ImageContent extends BaseContent {
  type: 'image';
  src: string;
  altText: string;
}

export interface TableContent extends BaseContent {
  type: 'table';
  headers: string[];
  rows: string[][];
}
