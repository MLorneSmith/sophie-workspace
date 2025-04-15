# YouTube Video Component Implementation Plan

## Overview

This document outlines the plan for creating a new YouTube video custom component for Payload CMS. This component will allow content editors to embed YouTube videos in Course Lessons, blog posts, and private post pages.

## Context

We have already implemented a BunnyVideo component for embedding Bunny.net videos. The YouTube component will follow a similar pattern but will be adapted for YouTube's embedding requirements.

## Component Structure

The component will be created in the following directory structure:

```
apps/payload/src/blocks/YouTubeVideo/
├── Component.tsx    # Frontend rendering component
├── Field.tsx        # Editor UI component
├── config.ts        # Block configuration
└── index.ts         # Export file
```

## Implementation Details

### 1. Component.tsx

The frontend rendering component will:

- Accept a YouTube video ID
- Render a responsive iframe embedding the YouTube video
- Support customizable aspect ratios (16:9, 4:3, 1:1)
- Include an optional preview image with play button overlay
- Display a placeholder when no video ID is provided
- Support a customizable title

### 2. Field.tsx

The admin UI component will provide fields for:

- YouTube Video ID input (with helper text for format)
- Toggle for showing a preview image before playing
- Custom preview image URL input (optional)
- Video title input
- Aspect ratio selector (16:9, 4:3, 1:1)

### 3. config.ts

The block configuration will:

- Define the block slug as `youtube-video`
- Set up the appropriate labels and descriptions
- Configure all necessary fields for the component
- Ensure proper TypeScript interfaces

### 4. index.ts

Simple export file for the component.

## YouTube Video Embedding Approach

The component will use the standard YouTube iframe API:

```html
<iframe
  src="https://www.youtube.com/embed/{VIDEO_ID}"
  width="560"
  height="315"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
```

### Video ID Handling

The component will accept both:

1. Full YouTube URLs (https://www.youtube.com/watch?v=dQw4w9WgXcQ)
2. Direct video IDs (dQw4w9WgXcQ)

The component will extract just the ID for embedding purposes.

### Preview Image Feature

The component will support:

- Default YouTube thumbnail preview: `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`
- Custom preview image option
- Click-to-play functionality

## Integration Steps

1. Create all component files following the Payload CMS custom component pattern
2. Register the component in `apps/payload/src/payload.config.ts`
3. Update the content renderer if needed to handle the new component type

## Content Migration Considerations

Since our content migration system has been recently fixed after significant work, we will:

- Ensure this component is purely additive and doesn't affect existing migrations
- Not modify any existing migration scripts
- Test the component thoroughly after implementation to ensure it works with the existing content migration system

## Testing Plan

After implementation, we will:

1. Test component creation in the Payload CMS admin UI
2. Verify rendering in Course Lessons, blog posts, and private posts
3. Confirm that the content migration system works with content containing the new component
4. Test various YouTube video formats and preview options
