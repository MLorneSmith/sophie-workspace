'use client';

import React from 'react';

import styles from '~/(marketing)/blog/_components/html-renderer.module.css';
import { RichTextContent } from '~/home/(user)/_types/courseTypes';
import { ContentRenderer } from '~/home/_components/content/base-renderer/base-renderer';

import { PostHeader } from './lesson-header';

interface PostProps {
  post: {
    title: string;
    chapter?: string;
    lessonNumber?: number;
    lessonLength?: number;
    description?: string;
    image?: string;
    publishedAt?: string;
  };
  content: RichTextContent | RichTextContent[];
}

export function Post({ post, content }: PostProps) {
  // Debug log the content on mount
  React.useEffect(() => {
    console.log('Post component mounted with content:', {
      isArray: Array.isArray(content),
      content: content,
    });

    // Log each content item if it's an array
    if (Array.isArray(content)) {
      content.forEach((item, index) => {
        console.log(`Content item ${index}:`, {
          type: item.type,
          component: item.component,
          props: item.props,
        });
      });
    }
  }, [content]);

  // Validate content
  if (!content) {
    console.error('Post component received null/undefined content');
    return (
      <div className="flex-grow">
        <div className="container mx-auto sm:max-w-none sm:p-0">
          <PostHeader post={post} />
          <div className="mx-auto flex max-w-3xl flex-col space-y-6 py-8">
            <article className={styles.HTML}>
              <div className="text-red-500">Content not available</div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  // Ensure content is an array
  const contentArray = Array.isArray(content) ? content : [content];

  // Validate content array
  if (contentArray.length === 0) {
    console.error('Post component received empty content array');
    return (
      <div className="flex-grow">
        <div className="container mx-auto sm:max-w-none sm:p-0">
          <PostHeader post={post} />
          <div className="mx-auto flex max-w-3xl flex-col space-y-6 py-8">
            <article className={styles.HTML}>
              <div className="text-red-500">No content available</div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  // Log if we have any video components
  const hasVideo = contentArray.some((item) => item.component === 'bunny');
  console.log('Content has video:', hasVideo);

  return (
    <div className="flex-grow">
      <div className="container mx-auto sm:max-w-none sm:p-0">
        <PostHeader post={post} />
        <div className="mx-auto flex max-w-3xl flex-col space-y-6 py-2">
          <article className={styles.HTML}>
            <ContentRenderer content={contentArray} />
          </article>
        </div>
      </div>
    </div>
  );
}
