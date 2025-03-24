# Tiptap Editor Implementation Plan for Canvas Document Editor

## Background

We are currently experiencing issues with our Lexical rich text editor implementation in the Canvas document editor. The main problems include:

1. Bundling issues with Lexical in Next.js, causing errors like:

   ```
   Error: Unable to find an active editor state. State helpers or node methods can only be used synchronously during the callback of editor.update(), editor.read(), or editorState.read(). Detected on the page: 0 compatible editor(s) with version 0.24.0+dev.esm and incompatible editors with versions 0.24.0+dev.esm (separately built, likely a bundler configuration issue)
   ```

2. Formatting toolbar functionality failures
3. Issues with improvement suggestions not being properly inserted into the editor

After multiple attempts to resolve these issues, we've decided to migrate from Lexical to Tiptap, a more robust editor built on ProseMirror that has better compatibility with Next.js and React.

## Key Benefits of Tiptap

1. **Built on ProseMirror**: A mature, battle-tested foundation with strong community support
2. **Modern Architecture**: Extension-based architecture that's more modular and maintainable
3. **Next.js Compatibility**: Fewer bundling issues with Next.js
4. **TypeScript Support**: Excellent TypeScript support for better type safety
5. **Active Development**: Regular updates and fixes
6. **Customizability**: Highly customizable through extensions

## Implementation Plan

### Phase 1: Project Setup & Dependencies

#### 1.1 Install Core Packages

```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
```

#### 1.2 Install Essential Extensions

```bash
pnpm add @tiptap/extension-placeholder @tiptap/extension-bold @tiptap/extension-italic @tiptap/extension-underline @tiptap/extension-heading @tiptap/extension-bullet-list @tiptap/extension-ordered-list @tiptap/extension-list-item
```

#### 1.3 Create File Structure

```
apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/
├── editor.tsx                # Main editor component
├── toolbar.tsx               # Toolbar component
├── plugins/
│   ├── improvement-plugin.ts # For handling improvements
│   └── format-plugin.ts      # For format preservation
└── utils/
    ├── format-serialization.ts   # Convert between formats
    └── editor-utils.ts           # Utility functions
```

### Phase 2: Content Format Conversion

The core challenge is to convert between our current Lexical format and Tiptap's ProseMirror format. We'll implement bidirectional converters to maintain compatibility with existing data.

#### 2.1 Format Differences

**Current Lexical Format:**

```json
{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Example text",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

**Tiptap ProseMirror Format:**

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Example text"
        }
      ]
    }
  ]
}
```

#### 2.2 Conversion Utilities

We'll implement utility functions for:

- Converting Lexical format to Tiptap format for display
- Converting Tiptap format back to Lexical format for storage and compatibility with existing data

This approach ensures we won't need to migrate existing data and can maintain backward compatibility.

### Phase 3: Core Editor Implementation

#### 3.1 Main Editor Component

The TiptapEditor component will:

- Accept the same props as our current LexicalEditor
- Expose the same ref interface (insertContent, insertImprovement, update)
- Use React Query for state management, similar to our current implementation
- Handle content saving with debouncing
- Implement proper error handling and recovery

#### 3.2 Toolbar Component

The toolbar will provide buttons for:

- Bold, italic, underline formatting
- Heading formatting
- Ordered and unordered lists
- Undo functionality

Each button will respect the current state of the editor, highlighting when the format is active.

#### 3.3 Improvement Handling

For handling AI-generated improvements, we'll:

- Implement a method to insert formatted improvements
- Support both summary points (bold) and supporting points (bullet list)
- Ensure the editor's state is properly saved after insertion

### Phase 4: Integration with Existing Components

We'll update the TabContent component to use our new TiptapEditor while maintaining the existing API:

- Same ref interface to minimize changes to parent components
- Same event handlers
- Same content loading and tab switching behavior

This approach ensures minimal changes to the surrounding code.

### Phase 5: Testing Strategy

#### 5.1 Unit Testing

- Test format conversion (both directions)
- Test editor initialization with various input formats
- Test toolbar functionality
- Test content saving and loading

#### 5.2 Integration Testing

- Test tab switching with content preservation
- Test AI improvement insertion
- Test handling of edge cases (empty content, invalid content)
- Test with rapid interactions and large documents

### Phase 6: Rollout Strategy

To minimize disruption, we'll implement a gradual rollout:

1. **Development & Testing**: Implement the solution in a development environment
2. **Initial Deployment**: Deploy as feature-flagged option for limited users
3. **Feedback Collection**: Gather user feedback and fix any issues
4. **Full Rollout**: Roll out to all users once stable

### Phase 7: Cleanup and Maintenance

After successful rollout:

1. Remove Lexical-specific code
2. Clean up webpack configuration
3. Remove unused dependencies
4. Document the new implementation

## Timeline Estimate

| Phase | Description                | Duration     |
| ----- | -------------------------- | ------------ |
| 1     | Setup & Dependencies       | 0.5 day      |
| 2     | Format Conversion          | 1 day        |
| 3     | Core Editor Implementation | 2 days       |
| 4     | Integration                | 1 day        |
| 5     | Testing                    | 1.5 days     |
| 6     | Rollout                    | 1 day        |
| 7     | Cleanup                    | 0.5 day      |
|       | **Total**                  | **7.5 days** |

## Success Criteria

The implementation will be considered successful when:

1. The editor loads and functions correctly in all browsers
2. Content is properly saved and loaded
3. AI suggestions can be inserted without errors
4. Format is preserved when switching tabs
5. No console errors related to the editor
6. Performance is equal to or better than the current implementation

## Risk Assessment

| Risk                         | Impact | Likelihood | Mitigation                                    |
| ---------------------------- | ------ | ---------- | --------------------------------------------- |
| Format conversion edge cases | Medium | Medium     | Extensive testing with various content types  |
| Performance regression       | Medium | Low        | Performance benchmarking during testing       |
| Data loss                    | High   | Low        | Dual-format storage initially, with fallbacks |
| API incompatibility          | Medium | Low        | Thorough testing of all exposed methods       |

## Conclusion

Moving to Tiptap from Lexical should resolve our current editor issues while providing a more robust foundation for future enhancements. The extension-based architecture of Tiptap will make it easier to add new features, and its strong typing will reduce bugs. The implementation plan outlined above balances the need for compatibility with existing data and components while taking advantage of Tiptap's strengths.
