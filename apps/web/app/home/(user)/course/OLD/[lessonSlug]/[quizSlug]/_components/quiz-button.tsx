'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { ArrowRightIcon } from 'lucide-react';

import { Button } from '@kit/ui/button';

export default function QuizButton({
  lessonSlug,
  quizSlug,
}: {
  lessonSlug: string;
  quizSlug: string;
}) {
  const [quizExists, setQuizExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quizUrl = `/home/course/${lessonSlug}/${quizSlug}`;
  console.log('QuizButton: Generated quiz URL:', quizUrl);

  useEffect(() => {
    async function checkQuizExists() {
      try {
        const response = await fetch(`/api/quizzes/${quizSlug}/exists`);
        if (!response.ok) {
          throw new Error('Failed to check quiz existence');
        }
        const data = await response.json();
        setQuizExists(data.exists);
      } catch (error) {
        console.error('QuizButton: Error checking quiz:', error);
        setError('Error loading quiz. Please try again later.');
        setQuizExists(false);
      }
    }

    checkQuizExists();
  }, [quizSlug]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (quizExists === null) {
    return <div>Loading quiz...</div>;
  }

  if (!quizExists) {
    return null;
  }

  return (
    <div>
      <Link href={quizUrl}>
        <Button>Take Quiz</Button>
      </Link>
    </div>
  );
}
