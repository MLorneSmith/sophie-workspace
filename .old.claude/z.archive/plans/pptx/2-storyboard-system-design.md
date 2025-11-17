# Storyboard System: Design, Architecture & Implementation Plan

## 1. Overview

The Storyboard system will serve as a critical bridge between the Canvas Editor's outline creation and the final PowerPoint export functionality. It will provide a drag-and-drop interface that allows users to:

1. Organize slides in a presentation
2. Define main headlines and sub-headlines for each slide
3. Select appropriate layouts for slides
4. Specify content formats (text, charts, images)
5. Preview slide organization before export

This document outlines the comprehensive design and implementation plan for the Storyboard system.

## 2. Core Data Structures

### Slide Layout Definition

```typescript
interface ContentArea {
  id: string;
  type: 'text' | 'chart' | 'image' | 'table';
  // Position and size (percentage of slide)
  position: { x: number; y: number; w: number; h: number };
  // Which column this content belongs to (0-based index)
  columnIndex: number;
}

interface SlideLayout {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  // Number of columns/sub-headlines this layout supports
  columns: number;
  contentAreas: ContentArea[];
}
```

### Slide Data Model

```typescript
interface SlideData {
  id: string;
  // Main headline at the top of the card
  mainHeadline: string;
  // Array of sub-headlines, one per column defined by layout.columns
  subHeadlines: string[];
  // Selected layout ID
  layoutId: string;
  // Content for each area defined by the layout
  content: {
    areaId: string;
    content: any; // Typed based on area type
  }[];
  // Position in presentation
  order: number;
}

interface StoryboardData {
  id: string;
  title: string;
  submissionId: string;
  slides: SlideData[];
  createdAt: string;
  updatedAt: string;
}
```

### Key Characteristics

- `subHeadlines` is an array where each entry corresponds to a column in the layout
- The length of `subHeadlines` array matches the `columns` value in the selected layout
- Each content area has a `columnIndex` that associates it with a specific sub-headline
- Layout defines both the visual arrangement and the data structure requirements

## 3. Database Schema Extension

The Storyboard data will be stored in the existing `building_blocks_submissions` table using a new JSONB column:

```sql
ALTER TABLE public.building_blocks_submissions
ADD COLUMN IF NOT EXISTS storyboard JSONB;
```

This approach allows us to:

- Store complex nested structures without schema migrations for each change
- Query and update specific parts of the storyboard without retrieving the entire object
- Maintain backward compatibility with existing code

## 4. Component Architecture

```
StoryboardTab/
├── StoryboardProvider           # Context for storyboard state
├── StoryboardPanel              # Main container component
│   ├── SlideList                # Sortable list of slide cards
│   │   └── SortableSlideCard    # Individual draggable slide
│   ├── SlideEditor              # Editor for selected slide
│   │   ├── HeadlineEditor       # Editor for main headline
│   │   ├── LayoutSelector       # Layout picker UI
│   │   ├── SubheadlineEditors   # Dynamic array of editors for sub-headlines
│   │   └── ContentAreaEditors   # Content editors based on layout
│   └── ExportPanel              # PowerPoint export UI
└── SlideLayoutLibrary           # Layout definition and management
```

### Component Responsibilities

1. **StoryboardProvider**: Manages state and provides context to all child components
2. **StoryboardPanel**: Main container that orchestrates the editing experience
3. **SlideList**: Manages the list of slides and drag-drop reordering
4. **SortableSlideCard**: Individual slide card with drag handles and basic editing
5. **SlideEditor**: Detailed editor for the selected slide
6. **LayoutSelector**: UI for selecting predefined layouts
7. **SubheadlineEditors**: Dynamic editors for each column's sub-headline
8. **ContentAreaEditors**: Specialized editors for different content types
9. **ExportPanel**: Controls for generating the PowerPoint file

## 5. Canvas Editor Integration

The Storyboard system will be integrated as a new tab in the existing Canvas editor:

```tsx
// Modification to apps/web/app/home/(user)/ai/canvas/_components/canvas-page.tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 px-4">
  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
    <TabsTrigger value="situation">Situation</TabsTrigger>
    <TabsTrigger value="complication">Complication</TabsTrigger>
    <TabsTrigger value="answer">Answer</TabsTrigger>
    <TabsTrigger value="outline">Outline</TabsTrigger>
    <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
  </TabsList>
  {/* Existing content... */}
  <TabsContent value="storyboard" className="mt-0">
    <StoryboardPanel />
  </TabsContent>
</Tabs>
```

## 6. Predefined Slide Layouts

The system will provide a library of predefined slide layouts:

```typescript
const PRESET_LAYOUTS: SlideLayout[] = [
  {
    id: 'title',
    name: 'Title Slide',
    description: 'Main title slide with subtitle',
    columns: 1, // 1 sub-headline
    contentAreas: [
      {
        id: 'subtitle',
        type: 'text',
        columnIndex: 0, // Associated with first sub-headline
        position: { x: 0.1, y: 0.6, w: 0.8, h: 0.2 },
      },
    ],
  },
  {
    id: 'one-column',
    name: 'One Column',
    description: 'Single column of text',
    columns: 1, // 1 sub-headline
    contentAreas: [
      {
        id: 'main-content',
        type: 'text',
        columnIndex: 0, // Associated with first sub-headline
        position: { x: 0.1, y: 0.3, w: 0.8, h: 0.6 },
      },
    ],
  },
  {
    id: 'two-column',
    name: 'Two Columns',
    description: 'Two equal columns of content',
    columns: 2, // 2 sub-headlines
    contentAreas: [
      {
        id: 'left-content',
        type: 'text',
        columnIndex: 0, // Associated with first sub-headline
        position: { x: 0.05, y: 0.3, w: 0.425, h: 0.6 },
      },
      {
        id: 'right-content',
        type: 'text',
        columnIndex: 1, // Associated with second sub-headline
        position: { x: 0.525, y: 0.3, w: 0.425, h: 0.6 },
      },
    ],
  },
  {
    id: 'image-text',
    name: 'Image and Text',
    description: 'Left image with right text column',
    columns: 2, // 2 sub-headlines
    contentAreas: [
      {
        id: 'image',
        type: 'image',
        columnIndex: 0, // Associated with first sub-headline
        position: { x: 0.05, y: 0.3, w: 0.425, h: 0.6 },
      },
      {
        id: 'text',
        type: 'text',
        columnIndex: 1, // Associated with second sub-headline
        position: { x: 0.525, y: 0.3, w: 0.425, h: 0.6 },
      },
    ],
  },
  {
    id: 'three-column',
    name: 'Three Columns',
    description: 'Three equal columns',
    columns: 3, // 3 sub-headlines
    contentAreas: [
      {
        id: 'left-content',
        type: 'text',
        columnIndex: 0, // First sub-headline
        position: { x: 0.05, y: 0.3, w: 0.28, h: 0.6 },
      },
      {
        id: 'middle-content',
        type: 'text',
        columnIndex: 1, // Second sub-headline
        position: { x: 0.36, y: 0.3, w: 0.28, h: 0.6 },
      },
      {
        id: 'right-content',
        type: 'text',
        columnIndex: 2, // Third sub-headline
        position: { x: 0.67, y: 0.3, w: 0.28, h: 0.6 },
      },
    ],
  },
  {
    id: 'chart',
    name: 'Chart Slide',
    description: 'Center chart with description',
    columns: 1, // 1 sub-headline
    contentAreas: [
      {
        id: 'chart',
        type: 'chart',
        columnIndex: 0,
        position: { x: 0.1, y: 0.3, w: 0.8, h: 0.5 },
      },
      {
        id: 'description',
        type: 'text',
        columnIndex: 0,
        position: { x: 0.1, y: 0.8, w: 0.8, h: 0.1 },
      },
    ],
  },
];
```

## 7. Drag and Drop Implementation with dndkit

The drag-and-drop functionality for slide reordering will use dndkit's sortable functionality:

```tsx
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function SlideList({ slides, onReorderSlides }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = slides.findIndex((slide) => slide.id === active.id);
      const newIndex = slides.findIndex((slide) => slide.id === over.id);

      // Update slide order
      const reorderedSlides = arrayMove(slides, oldIndex, newIndex);

      // Update order property on each slide
      const slidesWithUpdatedOrder = reorderedSlides.map((slide, index) => ({
        ...slide,
        order: index,
      }));

      onReorderSlides(slidesWithUpdatedOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={slides.map((slide) => slide.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {slides.map((slide) => (
            <SortableSlideCard
              key={slide.id}
              id={slide.id}
              slide={slide}
              layout={
                PRESET_LAYOUTS.find((l) => l.id === slide.layoutId) ||
                PRESET_LAYOUTS[0]
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

## 8. Dynamic SubheadlineEditors Management

The system will dynamically adjust sub-headline fields based on layout changes:

```tsx
// In SlideEditor component
function handleLayoutChange(layoutId: string) {
  const newLayout = PRESET_LAYOUTS.find((l) => l.id === layoutId);
  if (!newLayout) return;

  // Get current slide
  const currentSlide = { ...slide };

  // Prepare the subHeadlines array based on new column count
  let newSubHeadlines: string[] = [];

  // If new layout has more columns, add empty strings to match
  if (newLayout.columns > currentSlide.subHeadlines.length) {
    newSubHeadlines = [
      ...currentSlide.subHeadlines,
      ...Array(newLayout.columns - currentSlide.subHeadlines.length).fill(''),
    ];
  }
  // If new layout has fewer columns, truncate the array
  else if (newLayout.columns < currentSlide.subHeadlines.length) {
    newSubHeadlines = currentSlide.subHeadlines.slice(0, newLayout.columns);
  }
  // Same number of columns, keep as is
  else {
    newSubHeadlines = [...currentSlide.subHeadlines];
  }

  // Update slide with new layout and adjusted subHeadlines
  const updatedSlide = {
    ...currentSlide,
    layoutId,
    subHeadlines: newSubHeadlines,
    // Potentially remap content areas based on new layout
    content: mapContentToNewLayout(
      currentSlide.content,
      currentSlide.layoutId,
      layoutId,
    ),
  };

  onUpdateSlide(updatedSlide);
}
```

## 9. PowerPoint Generation with PptxGenJS

The PowerPoint generation will leverage PptxGenJS's slide master functionality:

```typescript
async function generatePowerPoint(
  storyboard: StoryboardData,
): Promise<ArrayBuffer> {
  const pptx = new pptxgen();

  // Define slide masters for consistent styling
  defineSlideTemplates(pptx);

  // Process each slide
  for (const slide of storyboard.slides) {
    // Get layout template
    const layout = PRESET_LAYOUTS.find((l) => l.id === slide.layoutId);
    if (!layout) continue;

    // Add slide with master layout
    const pptxSlide = pptx.addSlide({
      masterName: `MASTER_${layout.id.toUpperCase()}`,
    });

    // Add main headline
    pptxSlide.addText(slide.mainHeadline, {
      placeholder: 'mainHeadline',
      x: 0.5,
      y: 0.1,
      w: 9,
      h: 0.5,
      fontSize: 24,
      bold: true,
    });

    // Add each sub-headline
    slide.subHeadlines.forEach((subHeadline, index) => {
      if (index < layout.columns) {
        // Find content areas for this column
        const contentAreas = layout.contentAreas.filter(
          (area) => area.columnIndex === index,
        );
        if (contentAreas.length === 0) return;

        // Use first content area's x position for the sub-headline
        const area = contentAreas[0];

        pptxSlide.addText(subHeadline, {
          placeholder: `subHeadline${index + 1}`,
          x: area.position.x,
          y: 0.7, // Position sub-headline above the content area
          w: area.position.w,
          h: 0.3,
          fontSize: 18,
        });
      }
    });

    // Add content for each area
    for (const content of slide.content) {
      const areaConfig = layout.contentAreas.find(
        (area) => area.id === content.areaId,
      );
      if (!areaConfig) continue;

      // Add content based on area type
      if (areaConfig.type === 'text') {
        pptxSlide.addText(content.content, {
          x: areaConfig.position.x,
          y: areaConfig.position.y,
          w: areaConfig.position.w,
          h: areaConfig.position.h,
          fontSize: 16,
        });
      } else if (areaConfig.type === 'image' && content.content) {
        pptxSlide.addImage({
          data: content.content,
          x: areaConfig.position.x,
          y: areaConfig.position.y,
          w: areaConfig.position.w,
          h: areaConfig.position.h,
        });
      } else if (areaConfig.type === 'chart' && content.content) {
        // Add chart with PptxGenJS chart functionality
        addChartToSlide(pptxSlide, content.content, areaConfig.position);
      }
    }
  }

  // Generate and return PowerPoint file
  return await pptx.write('nodebuffer');
}
```

### Slide Master Templates

```typescript
function defineSlideTemplates(pptx) {
  // Title slide master
  pptx.defineSlideMaster({
    title: 'MASTER_TITLE',
    background: { color: 'FFFFFF' },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: 'F1F1F1' } } },
      {
        text: {
          placeholder: 'mainHeadline',
          options: {
            x: 0.5,
            y: 0.2,
            w: 9,
            h: 1.5,
            fontSize: 44,
            bold: true,
            align: 'center',
          },
        },
      },
      {
        text: {
          placeholder: 'subHeadline1',
          options: { x: 0.5, y: 2, w: 9, h: 1, fontSize: 24, align: 'center' },
        },
      },
    ],
    slideNumber: { x: 0.3, y: '95%' },
  });

  // Two column slide master
  pptx.defineSlideMaster({
    title: 'MASTER_TWO_COLUMN',
    background: { color: 'FFFFFF' },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: 'F1F1F1' } } },
      {
        text: {
          placeholder: 'mainHeadline',
          options: { x: 0.5, y: 0.1, w: 9, h: 0.5, fontSize: 24, bold: true },
        },
      },
      // Sub-headlines for each column
      {
        text: {
          placeholder: 'subHeadline1',
          options: { x: 0.5, y: 0.7, w: 4.25, h: 0.3, fontSize: 18 },
        },
      },
      {
        text: {
          placeholder: 'subHeadline2',
          options: { x: 5.25, y: 0.7, w: 4.25, h: 0.3, fontSize: 18 },
        },
      },
    ],
    slideNumber: { x: 0.3, y: '95%' },
  });

  // Three column slide master
  pptx.defineSlideMaster({
    title: 'MASTER_THREE_COLUMN',
    background: { color: 'FFFFFF' },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: 'F1F1F1' } } },
      {
        text: {
          placeholder: 'mainHeadline',
          options: { x: 0.5, y: 0.1, w: 9, h: 0.5, fontSize: 24, bold: true },
        },
      },
      // Three sub-headlines, one for each column
      {
        text: {
          placeholder: 'subHeadline1',
          options: { x: 0.5, y: 0.7, w: 2.8, h: 0.3, fontSize: 16 },
        },
      },
      {
        text: {
          placeholder: 'subHeadline2',
          options: { x: 3.6, y: 0.7, w: 2.8, h: 0.3, fontSize: 16 },
        },
      },
      {
        text: {
          placeholder: 'subHeadline3',
          options: { x: 6.7, y: 0.7, w: 2.8, h: 0.3, fontSize: 16 },
        },
      },
    ],
    slideNumber: { x: 0.3, y: '95%' },
  });
}
```

## 10. Initial Storyboard Creation from Outline

Converting the Tiptap JSON outline to an initial storyboard:

```typescript
function createInitialStoryboard(
  outlineJson: string,
  submissionId: string,
): StoryboardData {
  // Parse the Tiptap JSON
  const outlineDoc = JSON.parse(outlineJson);

  // Create a new storyboard
  const storyboard: StoryboardData = {
    id: uuidv4(),
    title: 'New Presentation',
    submissionId,
    slides: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Process outline content to create slides
  processNodesRecursive(outlineDoc.content, storyboard);

  return storyboard;
}

function processNodesRecursive(nodes, storyboard, level = 0) {
  let currentSlide = null;

  for (const node of nodes) {
    // Handle different node types
    if (node.type === 'heading') {
      const headingLevel = node.attrs.level;
      const headingText = extractTextFromNode(node);

      if (headingLevel === 1) {
        // Title slide
        currentSlide = {
          id: uuidv4(),
          mainHeadline: headingText,
          subHeadlines: [''], // Start with one empty sub-headline
          layoutId: 'title', // Default to title layout
          content: [],
          order: storyboard.slides.length,
        };
        storyboard.slides.push(currentSlide);
      } else if (headingLevel === 2) {
        // New content slide
        currentSlide = {
          id: uuidv4(),
          mainHeadline: headingText,
          subHeadlines: [''], // Start with one empty sub-headline
          layoutId: 'one-column', // Default layout
          content: [],
          order: storyboard.slides.length,
        };
        storyboard.slides.push(currentSlide);
      } else if (headingLevel > 2 && currentSlide) {
        // Sub-heading - could be a new column in a multi-column layout
        const columnIndex = Math.min(headingLevel - 3, 2); // Map heading levels to columns (0-based)

        // Update layout to match the number of columns needed
        if (columnIndex + 1 > getColumnsForLayout(currentSlide.layoutId)) {
          // Need a layout with more columns
          const newLayoutId = getLayoutWithColumns(columnIndex + 1);

          // Update layout and ensure enough sub-headlines
          currentSlide.layoutId = newLayoutId;

          // Expand sub-headlines array if needed
          while (currentSlide.subHeadlines.length < columnIndex + 1) {
            currentSlide.subHeadlines.push('');
          }
        }

        // Set this sub-heading as the sub-headline for its column
        if (columnIndex < currentSlide.subHeadlines.length) {
          currentSlide.subHeadlines[columnIndex] = headingText;
        }
      }
    } else if (
      (node.type === 'paragraph' ||
        node.type === 'bulletList' ||
        node.type === 'orderedList') &&
      currentSlide
    ) {
      // Add content to current slide
      const contentText = extractContentFromNode(node);

      // Find layout to determine content areas
      const layout = PRESET_LAYOUTS.find((l) => l.id === currentSlide.layoutId);
      if (!layout) continue;

      // Find appropriate content area for this content
      // Use column index 0 as default if we can't determine better
      let targetColumnIndex = 0;

      // Try to determine column based on position in document
      if (node.attrs?.indent) {
        targetColumnIndex = Math.min(node.attrs.indent, layout.columns - 1);
      }

      // Find a content area for this column index
      const contentArea = layout.contentAreas.find(
        (area) =>
          area.columnIndex === targetColumnIndex && area.type === 'text',
      );

      if (contentArea) {
        // Check if we already have content for this area
        const existingContentIndex = currentSlide.content.findIndex(
          (c) => c.areaId === contentArea.id,
        );

        if (existingContentIndex >= 0) {
          // Append to existing content
          currentSlide.content[existingContentIndex].content +=
            '\n' + contentText;
        } else {
          // Add new content entry
          currentSlide.content.push({
            areaId: contentArea.id,
            content: contentText,
          });
        }
      }
    }

    // Process child nodes recursively
    if (node.content && Array.isArray(node.content)) {
      processNodesRecursive(node.content, storyboard, level + 1);
    }
  }
}
```

## 11. Implementation Challenges and Solutions

### Challenge: Layout Changes Affecting Sub-headlines

When a user changes the slide layout, the number of sub-headlines may need to be adjusted:

```typescript
// Solution: Smart sub-headline management
function updateSlideLayout(slide: SlideData, newLayoutId: string): SlideData {
  const oldLayout = PRESET_LAYOUTS.find((l) => l.id === slide.layoutId);
  const newLayout = PRESET_LAYOUTS.find((l) => l.id === newLayoutId);

  if (!oldLayout || !newLayout) return slide;

  // Adjust sub-headlines array based on new column count
  let updatedSubHeadlines = [...slide.subHeadlines];

  // Add empty sub-headlines if the new layout has more columns
  while (updatedSubHeadlines.length < newLayout.columns) {
    updatedSubHeadlines.push('');
  }

  // Truncate array if the new layout has fewer columns
  if (updatedSubHeadlines.length > newLayout.columns) {
    updatedSubHeadlines = updatedSubHeadlines.slice(0, newLayout.columns);
  }

  // Remap content to the new layout
  const updatedContent = remapContentToNewLayout(
    slide.content,
    oldLayout,
    newLayout,
  );

  return {
    ...slide,
    layoutId: newLayoutId,
    subHeadlines: updatedSubHeadlines,
    content: updatedContent,
  };
}
```

### Challenge: Content Mapping Between Layouts

When switching layouts, content areas need to be intelligently mapped:

```typescript
// Solution: Column-based content remapping
function remapContentToNewLayout(
  content: Array<{ areaId: string; content: any }>,
  oldLayout: SlideLayout,
  newLayout: SlideLayout,
): Array<{ areaId: string; content: any }> {
  // If layouts are the same, no remapping needed
  if (oldLayout.id === newLayout.id) return [...content];

  const newContent: Array<{ areaId: string; content: any }> = [];

  // Process each existing content item
  content.forEach((item) => {
    // Find the original content area for this item
    const oldArea = oldLayout.contentAreas.find(
      (area) => area.id === item.areaId,
    );
    if (!oldArea) return; // Skip if area not found

    // Find a matching area in the new layout with the same column index and type
    const matchingNewArea = newLayout.contentAreas.find(
      (area) =>
        area.columnIndex === oldArea.columnIndex && area.type === oldArea.type,
    );

    if (matchingNewArea) {
      // Found a direct match
      newContent.push({
        areaId: matchingNewArea.id,
        content: item.content,
      });
    } else {
      // Find any area with matching column index
      const sameColumnArea = newLayout.contentAreas.find(
        (area) => area.columnIndex === oldArea.columnIndex,
      );

      if (sameColumnArea) {
        // Map to this area even if type is different
        newContent.push({
          areaId: sameColumnArea.id,
          content: item.content,
        });
      } else if (newLayout.contentAreas.length > 0) {
        // Last resort: map to first available area
        newContent.push({
          areaId: newLayout.contentAreas[0].id,
          content: item.content,
        });
      }
    }
  });

  return newContent;
}
```

### Challenge: Tiptap to Storyboard Transformation

Converting the hierarchical Tiptap JSON structure to slide data:

```typescript
// Solution: Hierarchical analysis and mapping
function extractHeadingHierarchy(nodes) {
  const hierarchy = [];
  let currentL1 = null;
  let currentL2 = null;

  function processNode(node) {
    if (node.type === 'heading') {
      const level = node.attrs.level;
      const text = extractTextFromNode(node);

      if (level === 1) {
        currentL1 = { text, children: [] };
        hierarchy.push(currentL1);
        currentL2 = null;
      } else if (level === 2) {
        currentL2 = { text, children: [] };
        if (currentL1) {
          currentL1.children.push(currentL2);
        } else {
          // Create implicit L1 if needed
          currentL1 = { text: 'Untitled Section', children: [currentL2] };
          hierarchy.push(currentL1);
        }
      } else if (level > 2) {
        const item = { text, level };
        if (currentL2) {
          currentL2.children.push(item);
        } else if (currentL1) {
          // Create implicit L2 if needed
          currentL2 = { text: 'Untitled Slide', children: [item] };
          currentL1.children.push(currentL2);
        }
      }
    }

    // Process child nodes
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(processNode);
    }
  }

  nodes.forEach(processNode);
  return hierarchy;
}

// Then convert hierarchy to slides
function convertHierarchyToSlides(hierarchy) {
  const slides = [];

  hierarchy.forEach(section => {
    // Create title slide for each major section
    const titleSlide = {
      id: uuidv4(),
      mainHeadline: section.text,
      subHeadlines: [''],
      layoutId: 'title',
      content: [],
      order: slides.length
    };
    slides.push(titleSlide);

    // Create content slides for each subsection
    section.children.forEach(subsection => {
      const contentSlide = {
        id: uuidv4(),
        mainHeadline: subsection.text,
        subHeadlines: [],
        layout
```
