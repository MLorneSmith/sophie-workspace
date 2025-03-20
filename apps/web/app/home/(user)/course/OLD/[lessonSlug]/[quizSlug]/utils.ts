import { QuizContent as KeystaticQuizContent } from '@kit/keystatic';

import { TransformedQuizContent } from '../../../../../_stores/content-store';
import { ComponentMap, RichTextContent } from '../../../_types/courseTypes';

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

export function transformQuizContent(
  content: KeystaticQuizContent & { slug: string },
): TransformedQuizContent {
  // Transform the content to match RichTextContent type
  const transformedContent = Array.isArray(content.content)
    ? content.content.map(transformRichTextContent)
    : transformRichTextContent(content.content);

  // Ensure we include all required fields from KeystaticQuizContent
  return {
    type: 'quiz',
    title: content.title,
    description: content.description || '',
    publishedAt: content.publishedAt || new Date().toISOString(),
    language: content.language,
    order: content.order,
    status: content.status,
    content: transformedContent as RichTextContent | RichTextContent[],
    questions: content.questions.map((q) => ({
      question: q.question,
      questiontype: q.questiontype,
      answers: q.answers.map((a) => ({
        answer: a.answer,
        correct: a.correct,
      })),
    })),
  };
}
