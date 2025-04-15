# Lesson Page Layout Update Plan

## Overview

This document outlines the planned changes to the lesson page layout in the course section of our application. The changes aim to improve the user experience by reordering content, improving formatting, and adding support for external videos.

## Current Implementation Analysis

### Lesson Data Structure

From `CourseLessons.ts`, lesson data includes:

- `bunny_video_id` and `bunny_library_id` for Bunny.net videos
- `video_source_type` (YouTube/Vimeo) and `youtube_video_id` for external videos
- Todo fields: `todo`, `todo_complete_quiz`, `todo_watch_content`, `todo_read_content`, `todo_course_project`
- `content` field for rich text content
- `downloads` relationship to downloadable files

### Current Rendering Flow

The `LessonViewClient.tsx` component currently renders content in this order:

1. Main content with `PayloadContentRenderer`
2. Bunny video (if available)
3. Todo section with title "Lesson To-Do's" and sub-sections
4. Downloads section with title "Lesson Downloads"

## Required Changes

### 1. Reordering Content

Change from:

```
Content → Bunny Video → Todo Section → Downloads
```

To:

```
Bunny Video → External Video → Todo Section → Content → Downloads
```

### 2. New External Video Component

- Create a component to render external videos (YouTube/Vimeo)
- Check `video_source_type` to determine if it's YouTube or Vimeo
- Use `youtube_video_id` to embed the appropriate video
- For YouTube: Use `https://www.youtube.com/embed/{youtube_video_id}`
- For Vimeo: Use `https://player.vimeo.com/video/{youtube_video_id}`
- Maintain consistent styling with the Bunny video component
- Ensure videos don't autoplay

### 3. Todo Section Formatting Changes

- Remove "Lesson To-Do's" title
- Remove "General To-Do" subtitle
- Add Lucide React icons to the left of labels:
  - `CheckSquare` for Todo
  - `Play` for Watch
  - `BookOpen` for Read
  - `Briefcase` for Course Project
- Add colons after labels (e.g., "To-Do:")
- Place todo content on the same line as the label
- Remove border/outline around the section

### 4. Video Autoplay Fix

- Modify the Bunny.net iframe to remove autoplay from the `allow` attribute
- Ensure no autoplay for external videos too

### 5. Download Section Formatting

- Remove "Lesson Downloads" title
- Place filename on left and download button on right

## Implementation Approach

### 1. External Video Component

Create a new component function for rendering YouTube/Vimeo videos:

```tsx
const ExternalVideo = ({
  videoSourceType,
  videoId,
}: {
  videoSourceType: string;
  videoId: string;
}) => {
  if (!videoId) return null;

  let embedUrl = '';

  if (videoSourceType === 'youtube') {
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (videoSourceType === 'vimeo') {
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  } else {
    return null;
  }

  return (
    <div className="my-8">
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          loading="lazy"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
          title="External Video"
        />
      </div>
    </div>
  );
};
```

### 2. Todo Section Redesign

Update the todo section with new formatting:

```tsx
import { BookOpen, Briefcase, CheckSquare, Play } from 'lucide-react';

// Todo section without border/outline and with icons
{
  (lesson.todo ||
    lesson.todo_complete_quiz ||
    lesson.todo_watch_content ||
    lesson.todo_read_content ||
    lesson.todo_course_project) && (
    <div className="my-6">
      {/* Todo */}
      {lesson.todo && (
        <div className="mb-4 flex items-start">
          <CheckSquare className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">To-Do: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo} />
            </span>
          </div>
        </div>
      )}

      {/* Complete Quiz */}
      {lesson.todo_complete_quiz && (
        <div className="mb-4 flex items-start">
          <CheckSquare className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">To-Do: </span>
            <span>Complete the lesson quiz</span>
          </div>
        </div>
      )}

      {/* Watch Content */}
      {lesson.todo_watch_content && (
        <div className="mb-4 flex items-start">
          <Play className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Watch: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo_watch_content} />
            </span>
          </div>
        </div>
      )}

      {/* Read Content */}
      {lesson.todo_read_content && (
        <div className="mb-4 flex items-start">
          <BookOpen className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Read: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo_read_content} />
            </span>
          </div>
        </div>
      )}

      {/* Course Project */}
      {lesson.todo_course_project && (
        <div className="mb-4 flex items-start">
          <Briefcase className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Course Project: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo_course_project} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Downloads Section Redesign

Update the downloads section with new formatting:

```tsx
{
  /* Render Downloads if available */
}
{
  lesson.downloads && lesson.downloads.length > 0 && (
    <div className="my-6">
      <div className="space-y-2">
        {lesson.downloads.map((download: any, index: number) => {
          // Ensure we have a download with URL
          if (!download || !download.url) return null;

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex-grow">
                <p className="font-medium">
                  {download.description || download.filename}
                </p>
              </div>
              <a
                href={download.url}
                download
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4. Video Autoplay Fix

Modify the Bunny.net iframe to remove autoplay from the `allow` attribute:

```tsx
<iframe
  src={`https://iframe.mediadelivery.net/embed/${lesson.bunny_library_id || '264486'}/${lesson.bunny_video_id}`}
  loading="lazy"
  style={{
    border: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
  }}
  allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
  allowFullScreen={true}
  title={lesson.title}
/>
```

## Implementation Steps

1. Update the `LessonViewClient.tsx` component to reorder the content sections
2. Create the external video component
3. Update the Todo section formatting
4. Fix the video autoplay issue
5. Update the Downloads section formatting

## Testing Plan

1. Test the page with various lesson content to ensure correct rendering
2. Test with lessons containing YouTube and Vimeo videos
3. Test on different screen sizes to ensure responsive behavior
4. Verify that videos don't autoplay
5. Test download functionality

## Potential Challenges

1. Content may not appear as expected when todo content contains complex HTML
2. Ensuring consistent styling across different content types
3. Maintaining responsive behavior for all screen sizes

## Conclusion

These changes will improve the user experience of the lesson page by presenting content in a more logical order, improving the formatting of the Todo section, and adding support for external videos from YouTube and Vimeo.
