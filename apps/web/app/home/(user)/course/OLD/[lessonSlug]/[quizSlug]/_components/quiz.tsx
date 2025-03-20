import { QuizContentItem } from '../../../../_types/quiz';
import { QuizHeader } from './quiz-header';

export function QuizPost({
  post,
  content,
}: {
  post: QuizContentItem;
  content: unknown;
}) {
  return <QuizHeader post={post} />;
}
