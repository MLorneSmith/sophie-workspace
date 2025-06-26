# Test Cases: pptx-generator.ts

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: In Progress
- **Total Test Cases**: 25
- **Completed Test Cases**: 0
- **Coverage**: 0%

## File: `apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.ts`

### Test Setup

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Slide, SlideContent, StoryboardData } from '../../types';
import { LAYOUT_POSITIONS, PptxGenerator } from './pptx-generator';

// Mock PptxGenJS
const mockPptxGen = {
  title: '',
  subject: '',
  author: '',
  defineSlideMaster: vi.fn(),
  addSlide: vi.fn(() => mockSlide),
  write: vi.fn(),
  ChartType: {
    bar: 'bar',
    line: 'line',
    pie: 'pie',
    area: 'area',
    scatter: 'scatter',
    bubble: 'bubble',
    radar: 'radar',
    doughnut: 'doughnut',
  },
};

const mockSlide = {
  addText: vi.fn(),
  addChart: vi.fn(),
  addImage: vi.fn(),
  addTable: vi.fn(),
};

vi.mock('pptxgenjs', () => ({
  default: vi.fn(() => mockPptxGen),
}));

// Mock Logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
};

vi.mock('@kit/shared/logger', () => ({
  getLogger: vi.fn().mockResolvedValue(mockLogger),
}));

describe('PptxGenerator', () => {
  let generator: PptxGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new PptxGenerator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test cases below
});
```

### Test Cases Checklist

#### Constructor & Initialization

- [ ] **Test Case**: Initializes PptxGenJS instance correctly

  - **Input**: `new PptxGenerator()`
  - **Expected Output**: PptxGenerator instance with defined slide masters
  - **Status**: ❌ Not Started
  - **Notes**: Should call defineSlideMaster for all layouts

- [ ] **Test Case**: Sets up logger correctly
  - **Input**: Constructor call
  - **Expected Output**: Logger instance properly initialized
  - **Status**: ❌ Not Started
  - **Notes**: Should handle async logger setup with placeholder

#### Slide Master Definition

- [ ] **Test Case**: Defines all required slide masters
  - **Input**: Constructor initialization
  - **Expected Output**: All 9 slide masters defined (MASTER_TITLE, MASTER_SECTION, etc.)
  - **Status**: ❌ Not Started
  - **Notes**: Should verify all master types are created

#### Core PowerPoint Generation

- [ ] **Test Case**: Generates valid PowerPoint from complete storyboard

  - **Input**: Complete storyboard with multiple slides and content types
  - **Expected Output**: Buffer containing PPTX file
  - **Status**: ❌ Not Started
  - **Notes**: Main integration test for full functionality

- [ ] **Test Case**: Sets presentation metadata correctly

  - **Input**: Storyboard with title
  - **Expected Output**: PPTX with correct title, subject, and author
  - **Status**: ❌ Not Started
  - **Notes**: Should verify pptx.title, pptx.subject, pptx.author are set

- [ ] **Test Case**: Processes slides in correct order
  - **Input**: Storyboard with slides having different order values
  - **Expected Output**: Slides added to PPTX in order of slide.order field
  - **Status**: ❌ Not Started
  - **Notes**: Should test sorting functionality

#### Layout Handling

- [ ] **Test Case**: Maps layout IDs to correct master names

  - **Input**: Various layout IDs (title, section, one-column, two-column, etc.)
  - **Expected Output**: Correct master name for each layout
  - **Status**: ❌ Not Started
  - **Notes**: Test getMasterNameForLayout method

- [ ] **Test Case**: Uses default master for unknown layout
  - **Input**: Unknown/invalid layout ID
  - **Expected Output**: MASTER_ONE_COLUMN as fallback
  - **Status**: ❌ Not Started
  - **Notes**: Should handle unknown layouts gracefully

#### Title Addition

- [ ] **Test Case**: Adds title with correct positioning for title layout

  - **Input**: Slide with layoutId "title" and title text
  - **Expected Output**: Title added with large font size and center alignment
  - **Status**: ❌ Not Started
  - **Notes**: Should verify position, font size (40), and center alignment

- [ ] **Test Case**: Adds title with correct positioning for section layout

  - **Input**: Slide with layoutId "section" and title text
  - **Expected Output**: Title added with appropriate section styling
  - **Status**: ❌ Not Started
  - **Notes**: Should verify different positioning from title layout

- [ ] **Test Case**: Adds title with correct positioning for content layouts
  - **Input**: Slide with content layout (one-column, two-column, etc.)
  - **Expected Output**: Title added with smaller font and left alignment
  - **Status**: ❌ Not Started
  - **Notes**: Should verify font size (24) and left alignment

#### Content Grouping

- [ ] **Test Case**: Groups content by column index correctly
  - **Input**: Multiple content items with different columnIndex values
  - **Expected Output**: Content organized by column in object structure
  - **Status**: ❌ Not Started
  - **Notes**: Test groupContentByColumn method

#### Content Addition - Text

- [ ] **Test Case**: Adds text content with correct formatting

  - **Input**: Text content item with formatting options
  - **Expected Output**: Text added to slide with specified formatting
  - **Status**: ❌ Not Started
  - **Notes**: Should verify font, color, bold, italic, underline

- [ ] **Test Case**: Adds bullet content with bullet formatting

  - **Input**: Bullet content item
  - **Expected Output**: Text added with bullet: { type: "bullet" }
  - **Status**: ❌ Not Started
  - **Notes**: Should verify bullet type is set correctly

- [ ] **Test Case**: Adds subbullet content with indentation
  - **Input**: Subbullet content item
  - **Expected Output**: Text added with indent and circle bullet
  - **Status**: ❌ Not Started
  - **Notes**: Should verify x position is indented by 0.5

#### Content Addition - Charts

- [ ] **Test Case**: Adds bar chart with correct data

  - **Input**: Chart content with chartType "bar" and chartData
  - **Expected Output**: Bar chart added to slide with parsed data
  - **Status**: ❌ Not Started
  - **Notes**: Should verify ChartType.bar is used

- [ ] **Test Case**: Handles all supported chart types

  - **Input**: Chart content with each supported chart type
  - **Expected Output**: Correct chart type used for each
  - **Status**: ❌ Not Started
  - **Notes**: Test bar, line, pie, area, scatter, bubble, radar, doughnut

- [ ] **Test Case**: Falls back to bar chart for unknown chart type

  - **Input**: Chart content with unknown chartType
  - **Expected Output**: Bar chart created as fallback
  - **Status**: ❌ Not Started
  - **Notes**: Should verify default behavior

- [ ] **Test Case**: Handles chart errors gracefully
  - **Input**: Chart content that causes addChart to throw error
  - **Expected Output**: Error text added instead of chart
  - **Status**: ❌ Not Started
  - **Notes**: Should catch errors and add error message text

#### Content Addition - Images

- [ ] **Test Case**: Adds image with correct URL

  - **Input**: Image content with valid imageUrl
  - **Expected Output**: Image added to slide with correct positioning
  - **Status**: ❌ Not Started
  - **Notes**: Should verify addImage is called with correct parameters

- [ ] **Test Case**: Handles image loading errors gracefully
  - **Input**: Image content with invalid/missing imageUrl
  - **Expected Output**: Error text added instead of image
  - **Status**: ❌ Not Started
  - **Notes**: Should catch image errors and show error message

#### Content Addition - Tables

- [ ] **Test Case**: Adds table with parsed JSON data

  - **Input**: Table content with JSON string tableData
  - **Expected Output**: Table added with parsed data
  - **Status**: ❌ Not Started
  - **Notes**: Should verify JSON parsing and table creation

- [ ] **Test Case**: Adds table with object data

  - **Input**: Table content with object tableData
  - **Expected Output**: Table added directly without parsing
  - **Status**: ❌ Not Started
  - **Notes**: Should handle pre-parsed table data

- [ ] **Test Case**: Handles table errors gracefully
  - **Input**: Table content with invalid tableData
  - **Expected Output**: Error text added instead of table
  - **Status**: ❌ Not Started
  - **Notes**: Should catch table errors and show error message

#### Position Calculation

- [ ] **Test Case**: Calculates correct positions for single column layouts

  - **Input**: Content in one-column layout
  - **Expected Output**: Content positioned in full width
  - **Status**: ❌ Not Started
  - **Notes**: Test getPositionForContent method

- [ ] **Test Case**: Calculates correct positions for two-column layouts
  - **Input**: Content in two-column layout with different column indices
  - **Expected Output**: Content positioned in left/right columns
  - **Status**: ❌ Not Started
  - **Notes**: Should verify different positions for columnIndex 0 vs 1

#### Chart Data Parsing

- [ ] **Test Case**: Parses chart data from string format

  - **Input**: Chart content with JSON string chartData
  - **Expected Output**: Parsed chart data in PptxGenJS format
  - **Status**: ❌ Not Started
  - **Notes**: Test parseChartData method

- [ ] **Test Case**: Returns default chart data when missing
  - **Input**: Chart content without chartData
  - **Expected Output**: Default sample chart data
  - **Status**: ❌ Not Started
  - **Notes**: Should provide fallback chart data

#### Edge Cases

- [ ] **Test Case**: Handles empty storyboard

  - **Input**: Storyboard with empty slides array
  - **Expected Output**: PPTX file with no content slides, just metadata
  - **Status**: ❌ Not Started
  - **Notes**: Should not throw errors for empty storyboard

- [ ] **Test Case**: Handles slide with no content
  - **Input**: Slide with empty content array
  - **Expected Output**: Slide created with only title
  - **Status**: ❌ Not Started
  - **Notes**: Should handle slides without content gracefully

#### Error Scenarios

- [ ] **Test Case**: Handles PptxGenJS write method failure

  - **Input**: Storyboard that causes write method to throw
  - **Expected Output**: Error thrown with descriptive message
  - **Status**: ❌ Not Started
  - **Notes**: Should catch and re-throw with context

- [ ] **Test Case**: Handles missing storyboard title
  - **Input**: Storyboard without title property
  - **Expected Output**: PowerPoint generated with empty/default title
  - **Status**: ❌ Not Started
  - **Notes**: Should handle missing metadata gracefully

### Coverage Report

- Lines: 0%
- Branches: 0%
- Functions: 0%
- Statements: 0%

### Notes

- Dependencies mocked: pptxgenjs, @kit/shared/logger
- Special considerations:
  - Complex chart data parsing logic needs thorough testing
  - Error handling is extensive and needs verification
  - Position calculations are layout-dependent
  - Async logger initialization needs proper testing
- Time spent: [Track time for estimation accuracy]

### Example Test Implementation

```typescript
it('should generate PowerPoint from storyboard data', async () => {
  // Arrange
  const storyboard: StoryboardData = {
    title: 'Test Presentation',
    slides: [
      {
        id: '1',
        title: 'Test Slide',
        layoutId: 'one-column',
        order: 1,
        content: [
          {
            type: 'text',
            text: 'Hello World',
            columnIndex: 0,
            order: 1,
          },
        ],
      },
    ],
  };

  mockPptxGen.write.mockResolvedValue(Buffer.from('mock-pptx-data'));

  // Act
  const result = await generator.generateFromStoryboard(storyboard);

  // Assert
  expect(result).toBeInstanceOf(Buffer);
  expect(mockPptxGen.title).toBe('Test Presentation');
  expect(mockPptxGen.addSlide).toHaveBeenCalled();
  expect(mockSlide.addText).toHaveBeenCalledWith(
    'Test Slide',
    expect.any(Object),
  );
});
```
