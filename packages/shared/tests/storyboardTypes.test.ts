import { describe, expect, test } from 'vitest';

import type {
  PresentationStructure,
  SlideContent,
  SlideContentItem,
  TipTapDocument,
  TipTapTextNode,
} from '../src/types/storyboard';

describe('Storyboard Type Definitions', () => {
  test('TipTapDocument structure', () => {
    const doc: TipTapDocument = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Introduction' } as TipTapTextNode],
        },
      ],
    };

    expect(doc).toBeDefined();
    expect(doc.content[0].type).toBe('heading');
  });

  test('PresentationStructure validation', () => {
    const presentation: PresentationStructure = {
      slides: [
        {
          id: 'slide-1',
          layout: 'title',
          headline: 'Main Title',
          contentAreas: [],
        },
      ],
      metadata: {
        title: 'Test Presentation',
        author: 'Test User',
        created: new Date(),
        modified: new Date(),
      },
    };

    expect(presentation.slides.length).toBe(1);
    expect(presentation.metadata.title).toBe('Test Presentation');
  });

  test('SlideContentItem type guards', () => {
    const textContent: SlideContentItem = {
      id: 'text-1',
      type: 'text',
      content: 'Sample text',
      position: { x: 0, y: 0, width: 100, height: 50 },
    };

    const chartContent: SlideContentItem = {
      id: 'chart-1',
      type: 'chart',
      chartType: 'bar',
      data: [{ label: 'Q1', value: 100 }],
      position: { x: 0, y: 0, width: 100, height: 50 },
    };

    expect(textContent.type).toBe('text');
    expect(chartContent.chartType).toBe('bar');
  });
});
