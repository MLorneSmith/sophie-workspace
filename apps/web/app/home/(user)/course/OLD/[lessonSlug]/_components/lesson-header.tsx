'use client';

interface PostHeaderProps {
  post: {
    title: string;
    chapter?: string;
    lessonNumber?: number;
    lessonLength?: number;
    description?: string;
    image?: string;
    publishedAt?: string;
  };
}

function formatChapterSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function PostHeader({ post }: PostHeaderProps) {
  const formattedChapter = post.chapter ? formatChapterSlug(post.chapter) : '';

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {post.title}
      </h1>
      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
        {formattedChapter && <span>Chapter {formattedChapter}</span>}
        {formattedChapter && post.lessonNumber && <span>•</span>}
        {post.lessonNumber && <span>Lesson {post.lessonNumber}</span>}
        {post.lessonLength && (
          <>
            <span>•</span>
            <span>{post.lessonLength} minutes</span>
          </>
        )}
      </div>
      {post.description && (
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {post.description}
        </p>
      )}
    </div>
  );
}
