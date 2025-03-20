import { LessonContent as KeystaticLessonContent } from '@kit/keystatic';

import { TransformedLessonContent } from '~/../app/_stores/content-store';
import {
  ComponentMap,
  RichTextContent,
} from '~/home/(user)/_types/courseTypes';

// Map of Keystatic component names to our ComponentMap keys
const componentNameMap: Record<string, keyof ComponentMap> = {
  bunnyvideo: 'bunny',
  cta: 'cta',
  quote: 'quote',
  highlight: 'highlight',
  tally: 'tally',
  content: 'content',
};

function transformRichTextContent(
  item: any,
): RichTextContent | (() => Promise<{ node: Node }>) {
  if (typeof item === 'function') {
    return item;
  }

  const mappedComponent = componentNameMap[item.component];
  if (!mappedComponent) {
    // Default to content component if no mapping found
    return {
      type: item.type,
      component: 'content' as keyof ComponentMap,
      props: { html: '' },
    };
  }

  return {
    type: item.type,
    component: mappedComponent,
    props: item.props,
  };
}

export function transformLessonContent(
  content: KeystaticLessonContent,
): TransformedLessonContent {
  // Transform the content to match RichTextContent type
  const transformedContent = Array.isArray(content.content)
    ? content.content.map(transformRichTextContent)
    : transformRichTextContent(content.content);

  return {
    type: 'lesson',
    title: content.title,
    description: content.description || '',
    publishedAt: content.publishedAt || new Date().toISOString(),
    language: content.language,
    order: content.order,
    lessonID: content.lessonID,
    chapter: content.chapter,
    lessonNumber: content.lessonNumber,
    lessonLength: content.lessonLength || 0,
    status: content.status,
    content: transformedContent as RichTextContent | RichTextContent[],
  };
}
