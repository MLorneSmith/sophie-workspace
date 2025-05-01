export interface BuildingBlocksSubmission {
  id: string;
  title?: string;
  outline?: any;
  storyboard?: StoryboardData;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoryboardData {
  title: string;
  slides: Slide[];
}

export interface Slide {
  id: string;
  title: string;
  headline: string; // Added based on error message
  layoutId: string;
  content: SlideContent[];
  order: number;
  subheadlines?: string[];
}

export interface SlideContentFormatting {
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface SlideContent {
  id: string; // Add ID to SlideContent
  area: string; // Add area property
  type: 'text' | 'bullet' | 'subbullet' | 'image' | 'chart' | 'table';
  text?: string;
  columnIndex: number;
  imageUrl?: string;
  chartType?:
    | 'bar'
    | 'line'
    | 'pie'
    | 'area'
    | 'scatter'
    | 'bubble'
    | 'radar'
    | 'doughnut';
  chartData?: any;
  tableData?: any;
  formatting?: SlideContentFormatting;
  // Add position property based on PRD's ContentArea?
  // position?: { x: number; y: number; w: number; h: number };
}
