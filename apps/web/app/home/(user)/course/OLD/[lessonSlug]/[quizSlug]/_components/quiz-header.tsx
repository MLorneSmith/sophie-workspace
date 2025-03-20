import { QuizContentItem } from '../../../../_types/quiz';

export function QuizHeader({ post }: { post: QuizContentItem }) {
  return (
    <div className="mb-8">
      <h1 className="mb-4 text-3xl font-bold">{post.title}</h1>
      {post.description && (
        <p className="text-lg text-muted-foreground">{post.description}</p>
      )}
    </div>
  );
}
