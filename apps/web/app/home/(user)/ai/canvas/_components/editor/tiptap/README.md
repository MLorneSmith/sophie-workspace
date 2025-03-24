# Tiptap Editor Implementation

This directory contains the implementation of the Tiptap editor for the SlideHeroes Canvas application. Tiptap is a headless, extensible rich text editor framework for React that provides a more modern and maintainable alternative to the previously used Lexical editor.

## Directory Structure

- `tiptap-editor.tsx`: The main editor component that integrates with Tiptap
- `tiptap-tab-content.tsx`: Tab content component that loads and displays the editor
- `toolbar.tsx`: Formatting toolbar component for the editor
- `editor.css`: Styling for the Tiptap editor
- `plugins/`: Custom plugins for the editor
  - `improvement-plugin.ts`: Plugin for inserting AI-generated improvements
- `utils/`: Utility functions
  - `format-conversion.ts`: Utilities for converting between Lexical and Tiptap formats

## Feature Flag

The Tiptap editor implementation is controlled by a feature flag in `apps/web/app/home/(user)/ai/canvas/_lib/config.ts`. To enable or disable the Tiptap editor, modify the `useTiptapEditor` flag:

```typescript
export const FEATURES = {
  useTiptapEditor: true, // Set to false to use Lexical editor
};
```

## Data Migration

When switching from Lexical to Tiptap, existing data needs to be converted. A data migration utility is provided at `apps/web/app/home/(user)/ai/canvas/_actions/convert-editor-data.ts`. This utility can be run from the admin page at `/home/ai/canvas/admin/convert`.

## Key Components

### TiptapEditor

The main editor component that wraps the Tiptap editor. It handles:

- Content initialization and parsing
- Auto-saving content
- Integration with the React Query cache
- Exposing methods via ref for parent components

### TiptapTabContent

A wrapper component that loads content from the database and renders the editor. It handles:

- Loading content from the database
- Converting Lexical format to Tiptap format if needed
- Rendering the editor with the correct content

### Toolbar

A formatting toolbar that provides buttons for common formatting options:

- Bold, Italic, Underline
- Headings
- Bullet and ordered lists
- Undo

## Format Conversion

The `format-conversion.ts` utility provides functions for converting between Lexical and Tiptap formats:

- `lexicalToTiptap`: Converts Lexical editor state to Tiptap format
- `createEmptyTiptapDocument`: Creates an empty Tiptap document
- `createTiptapFromText`: Creates a Tiptap document from plain text

## Improvement Plugin

The `improvement-plugin.ts` provides a function for inserting AI-generated improvements into the editor:

- `insertImprovement`: Inserts an improvement object into the editor at the current cursor position

## Usage

The editor is used in the Canvas application for editing different sections of a presentation:

- Situation
- Complication
- Answer
- Outline

Each section is rendered in a tab, and the editor is loaded with the appropriate content for that section.

## Extending the Editor

To add new features to the editor:

1. Install the required Tiptap extension: `pnpm add @tiptap/extension-name --filter web`
2. Import the extension in `tiptap-editor.tsx`
3. Add the extension to the `extensions` array in the `useEditor` hook
4. Add any necessary UI components to the toolbar
