# Lesson Page Template Tag Rendering Fix

## Problem Analysis

After investigating the lesson pages, we've identified two key issues that need to be addressed:

### 1. Content Field Contains Raw Template Tags

The content field is displaying raw template tags rather than rendering them properly:

```
{% bunny bunnyvideoid="70b1f616-8e55-4c58-8898-c5cefa05417b" /%}
To-Do - Complete the lesson quiz
Watch - None
Read - None
{% custombullet status="right-arrow" /%}
Course Project - None
```

Our review indicates:

- The content field contains mixed content including template tags
- These template tags ({% ... %}) are being rendered as literal text
- The `PayloadContentRenderer` doesn't recognize this template syntax
- The renderer primarily handles Lexical-formatted content and specific block types

### 2. Downloads Section Not Rendering Properly

The downloads section is showing raw template tags instead of formatted download buttons:

```
### Lesson Downloads
{% r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf" filedescription="'Our Process' Lesson slides" /%}
{% r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf" filedescription="Second download (The Who)" /%}
This is an R2 File
```

Specific issues:

- Custom `{% r2file %}` template tags aren't being processed
- There's no handler in the renderer for these custom tags
- The downloads relationship mechanism doesn't appear to be picking up these files

## Root Causes

1. **Content Field Population**:

   - Despite our attempts to set the content field to NULL during migration, it's still being populated with template tags
   - The content might be coming from a different source in the migration pipeline

2. **Template Tag Processing**:

   - The `PayloadContentRenderer` component doesn't have tag processors for:
     - `{% r2file ... %}` tags for file downloads
     - `{% bunny ... %}` for Bunny.net videos
     - `{% custombullet ... %}` for custom bullet points

3. **Download Relationships**:
   - While the LessonViewClient has code to render downloads from the relationship table, these downloads may not be properly connected in the database

## Comprehensive Solution

We'll implement a two-part solution to fix both issues:

### Part 1: Clear Content Field in Database

1. **Direct SQL Update**:

   - Create a SQL update script to NULL out the content field for all lessons
   - Example: `UPDATE payload.course_lessons SET content = NULL;`

2. **Modify Migration Script**:

   - Review the content migration pipeline to ensure the content field remains NULL
   - Confirm that template tags are extracted and processed separately from content

3. **Verification**:
   - Add verification checks to confirm the content field is NULL after migration
   - Log any non-NULL content fields for manual review

### Part 2: Create Custom Template Tag Handler

1. **Custom Template Processor**:

   - Create a wrapper component for `PayloadContentRenderer` that pre-processes template tags
   - Use regex patterns to identify and parse template syntax
   - Convert template tags into proper React components

2. **Tag Handlers for Common Patterns**:

   - `r2file` tags: Extract URL and description parameters, render as download buttons
   - `bunny` tags: Extract video ID and render using the Bunny.net player component
   - `custombullet` tags: Render styled bullet points based on status

3. **Integration with Existing Components**:
   - Add a preprocessing step before Lexical rendering
   - Fall back to standard Lexical rendering for content without template tags

### Implementation Details

#### Template Tag Preprocessor Component

```tsx
type TemplateTagProcessorProps = {
  content: string;
};

export function TemplateTagProcessor({ content }: TemplateTagProcessorProps) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Process r2file tags
  const processR2FileTags = (text: string) => {
    const r2filePattern =
      /{%\s*r2file\s+awsurl="([^"]+)"\s+filedescription="([^"]+)"\s*\/%}/g;

    return text.replace(r2filePattern, (match, url, description) => {
      return `<div class="r2file-download" data-url="${url}" data-description="${description}"></div>`;
    });
  };

  // Process bunny video tags
  const processBunnyVideoTags = (text: string) => {
    const bunnyPattern = /{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/g;

    return text.replace(bunnyPattern, (match, videoId) => {
      return `<div class="bunny-video" data-videoid="${videoId}"></div>`;
    });
  };

  // Process custom bullet tags
  const processCustomBulletTags = (text: string) => {
    const bulletPattern = /{%\s*custombullet\s+status="([^"]+)"\s*\/%}/g;

    return text.replace(bulletPattern, (match, status) => {
      return `<div class="custom-bullet" data-status="${status}"></div>`;
    });
  };

  // Apply all processors
  let processedContent = content;
  processedContent = processR2FileTags(processedContent);
  processedContent = processBunnyVideoTags(processedContent);
  processedContent = processCustomBulletTags(processedContent);

  // Render processed content
  return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
}
```

#### Enhanced PayloadContentRenderer

```tsx
export function EnhancedPayloadContentRenderer({
  content,
}: {
  content: unknown;
}) {
  // Handle string content with template tags
  if (
    typeof content === 'string' &&
    (content.includes('{%') || content.includes('%}'))
  ) {
    return <TemplateTagProcessor content={content} />;
  }

  // For Lexical format content or other content types, use standard renderer
  return <PayloadContentRenderer content={content} />;
}
```

## Development and Testing Plan

1. **Database Update**:

   - Create and test the SQL update script
   - Run against development database
   - Verify content fields are NULL

2. **Template Tag Processor**:

   - Create test cases for all template tag patterns
   - Develop processor functions for each tag type
   - Test with sample lesson content

3. **Integration Testing**:

   - Test enhanced renderer with various content types
   - Verify downloads render correctly
   - Ensure video tags render properly
   - Check custom bullet rendering

4. **Migration Validation**:
   - Run full migration process
   - Verify content fields remain NULL
   - Confirm download relationships are correctly established

## Benefits

- **Clean Content Rendering**: Removes raw template tags from lesson display
- **Proper Download Formatting**: Downloads will appear with proper buttons and styling
- **Flexible Template Processing**: System can be extended to handle additional template tags
- **Improved User Experience**: Content appears as intended with proper formatting

## Conclusion

This solution addresses both the content field and downloads rendering issues by:

1. Ensuring content fields don't contain raw template tags
2. Processing template tags when they do appear in content
3. Rendering downloads with proper formatting

The approach is robust and maintainable, allowing for future expansion of template tag types as needed.
