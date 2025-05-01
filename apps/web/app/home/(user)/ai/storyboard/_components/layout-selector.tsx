'use client';

import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { useStoryboard } from '../_lib/providers/storyboard-provider';
import { Slide, SlideContent } from '../_lib/types';

interface LayoutSelectorProps {
  slide: Slide;
  onLayoutChange: (layoutId: string) => void;
  onContentChange: (content: SlideContent[]) => void;
}

// Placeholder for UUID generation (replace with actual utility)
function generateUuid(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Define available layouts (based on PRD and common sense) with placeholder previews
const availableLayouts = [
  { id: 'title', name: 'Title Slide', preview: 'Preview: Title Slide' },
  {
    id: 'section-header',
    name: 'Section Header',
    preview: 'Preview: Section Header',
  },
  { id: 'one-column', name: 'One Column', preview: 'Preview: One Column' },
  { id: 'two-columns', name: 'Two Columns', preview: 'Preview: Two Columns' },
  {
    id: 'three-columns',
    name: 'Three Columns',
    preview: 'Preview: Three Columns',
  },
  {
    id: 'title-and-content',
    name: 'Title and Content',
    preview: 'Preview: Title and Content',
  },
  {
    id: 'title-and-two-columns',
    name: 'Title and Two Columns',
    preview: 'Preview: Title and Two Columns',
  },
  {
    id: 'image-text',
    name: 'Image and Text',
    preview: 'Preview: Image and Text',
  },
  {
    id: 'text-image',
    name: 'Text and Image',
    preview: 'Preview: Text and Image',
  },
  { id: 'chart', name: 'Chart Slide', preview: 'Preview: Chart Slide' },
  { id: 'bullet-list', name: 'Bullet List', preview: 'Preview: Bullet List' },
  { id: 'comparison', name: 'Comparison', preview: 'Preview: Comparison' },
  {
    id: 'picture-with-caption',
    name: 'Picture with Caption',
    preview: 'Preview: Picture with Caption',
  },
  { id: 'blank', name: 'Blank', preview: 'Preview: Blank' },
];

// Define expected content areas for each layout with default type and columnIndex
const layoutContentAreas: Record<
  string,
  { area: string; type: SlideContent['type']; columnIndex: number }[]
> = {
  title: [
    { area: 'title', type: 'text', columnIndex: 0 },
    { area: 'subtitle', type: 'text', columnIndex: 0 },
  ],
  'section-header': [{ area: 'title', type: 'text', columnIndex: 0 }],
  'one-column': [{ area: 'main', type: 'text', columnIndex: 0 }],
  'two-columns': [
    { area: 'left', type: 'text', columnIndex: 0 },
    { area: 'right', type: 'text', columnIndex: 1 },
  ],
  'three-columns': [
    { area: 'left', type: 'text', columnIndex: 0 },
    { area: 'center', type: 'text', columnIndex: 1 },
    { area: 'right', type: 'text', columnIndex: 2 },
  ],
  'title-and-content': [
    { area: 'title', type: 'text', columnIndex: 0 },
    { area: 'content', type: 'text', columnIndex: 0 },
  ],
  'title-and-two-columns': [
    { area: 'title', type: 'text', columnIndex: 0 },
    { area: 'left', type: 'text', columnIndex: 0 },
    { area: 'right', type: 'text', columnIndex: 1 },
  ],
  'image-text': [
    { area: 'image', type: 'image', columnIndex: 0 },
    { area: 'text', type: 'text', columnIndex: 1 },
  ],
  'text-image': [
    { area: 'text', type: 'text', columnIndex: 0 },
    { area: 'image', type: 'image', columnIndex: 1 },
  ],
  chart: [
    { area: 'title', type: 'text', columnIndex: 0 },
    { area: 'chart', type: 'chart', columnIndex: 0 },
  ],
  'bullet-list': [
    { area: 'title', type: 'text', columnIndex: 0 }, // Title for the list
    { area: 'list', type: 'text', columnIndex: 0 }, // Main content area for the list
  ],
  comparison: [
    { area: 'title', type: 'text', columnIndex: 0 },
    { area: 'left', type: 'text', columnIndex: 0 },
    { area: 'right', type: 'text', columnIndex: 1 },
  ],
  'picture-with-caption': [
    { area: 'image', type: 'image', columnIndex: 0 },
    { area: 'caption', type: 'text', columnIndex: 0 },
  ],
  blank: [],
};

export function LayoutSelector({ slide }: LayoutSelectorProps) {
  const { updateSlide } = useStoryboard();

  const handleLayoutChange = (newLayoutId: string) => {
    const oldContent = slide.content || []; // Get existing slide content
    const newLayoutAreas = layoutContentAreas[newLayoutId] || [];

    const newContent: SlideContent[] = newLayoutAreas.map((areaInfo) => {
      // Find existing content for the same area, if any
      const existingContent = oldContent.find(
        (contentItem: SlideContent) => contentItem.area === areaInfo.area,
      );

      if (existingContent) {
        // Reuse existing content, but update columnIndex and type if layout dictates
        return {
          ...existingContent,
          columnIndex: areaInfo.columnIndex,
          type: areaInfo.type, // Update type based on new layout
        };
      } else {
        // Create new content item with default properties
        return {
          id: generateUuid(), // Generate a new ID for new content items
          area: areaInfo.area,
          type: areaInfo.type,
          columnIndex: areaInfo.columnIndex,
          // Add other default properties based on type if needed (e.g., text: '', imageUrl: '', etc.)
          // For now, rely on the type definition defaults or subsequent editing
        };
      }
    });

    // Construct the updated slide object
    const updatedSlide: Slide = {
      ...slide, // Start with the existing slide data
      layoutId: newLayoutId, // Override the layoutId
      content: newContent, // Override the contentAreas array
    };

    // Update the slide in the storyboard context
    updateSlide(updatedSlide);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`layout-${slide.id}`} className="text-sm font-medium">
        Layout
      </Label>
      <Select value={slide.layoutId} onValueChange={handleLayoutChange}>
        <SelectTrigger id={`layout-${slide.id}`} className="w-full">
          <SelectValue placeholder="Select a layout" />
        </SelectTrigger>
        <SelectContent>
          {availableLayouts.map((layout) => (
            <SelectItem key={layout.id} value={layout.id}>
              <div className="flex items-center space-x-2">
                <span>{layout.name}</span>
                {/* Placeholder for visual preview */}
                <span className="text-muted-foreground text-xs">
                  ({layout.preview})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* TODO: Display visual preview of selected layout */}
    </div>
  );
}
