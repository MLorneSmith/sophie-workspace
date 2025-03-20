'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import { LessonContent } from '@kit/keystatic';

import type { Database } from '../../../../../../../packages/supabase/src/database.types';
import { Post } from './_components/lesson';

// Define types for dynamically imported components
interface QuizButtonProps {
  quizSlug: string;
  lessonSlug: string;
}

interface CompleteLessonButtonProps {
  lessonId: string;
  lessonSlug: string;
  completedLessonNumber: number;
  courseId: string;
  courseTitle: string;
}

// Dynamic imports with proper loading states
const DynamicQuizButton = dynamic<QuizButtonProps>(
  () => import('./[quizSlug]/_components/quiz-button'),
  {
    loading: () => <div className="animate-pulse">Loading quiz...</div>,
    ssr: false,
  },
);

const DynamicCompleteLessonButton = dynamic<CompleteLessonButtonProps>(
  () => import('./_components/complete-lesson-button'),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false,
  },
);

interface DatabaseLesson {
  id: string | null;
  lessonID: number;
  course_id: string | null;
  title: string | null;
  slug: string | null;
  order: number | null;
  quiz: string | null;
}

interface LessonInfo {
  id: string;
  lessonID: number;
  course_id: string;
  title: string;
  slug: string;
  order: number;
  quiz: string | null;
}

interface WorkspaceData {
  accounts: {
    label: string | null;
    value: string | null;
    image: string | null;
  }[];
  workspace: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
    subscription_status:
      | Database['public']['Enums']['subscription_status']
      | null;
  };
  user: {
    id: string;
    email?: string;
  };
}

interface LessonPageClientProps {
  post: {
    title: string;
    content: any;
  };
  workspace: WorkspaceData;
  lessonSlug: string;
}

// Type guard utilities
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isCertificateData = (data: {
  userId?: string | null;
  courseId?: string | null;
}): data is { userId: string; courseId: string } =>
  isNonEmptyString(data.userId) && isNonEmptyString(data.courseId);

// Convert database lesson to LessonInfo with type safety
const convertToLessonInfo = (data: DatabaseLesson): LessonInfo | null => {
  if (!data.id || !data.course_id) return null;

  return {
    id: data.id,
    lessonID: data.lessonID,
    course_id: data.course_id,
    title: data.title || '',
    slug: data.slug || '',
    order: data.order || 0,
    quiz: data.quiz,
  };
};

export default function LessonPageClient({
  post,
  workspace,
  lessonSlug,
}: LessonPageClientProps) {
  const [lessonInfo, setLessonInfo] = useState<LessonInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  const courseTitle = 'Decks for Decision Makers';

  // Debug: Log initial props
  useEffect(() => {
    console.log('LessonPageClient props:', {
      post,
      workspace,
      lessonSlug,
    });
    console.log('Post content:', post.content);
  }, [post, workspace, lessonSlug]);

  // Fetch lesson information
  useEffect(() => {
    let isMounted = true;

    const fetchLessonInfo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/lessons/${lessonSlug}/info`);
        if (!response.ok) {
          throw new Error('Failed to fetch lesson info');
        }
        const data = await response.json();

        // Debug: Log lesson data
        console.log('Lesson data:', data);

        if (isMounted && data.lesson) {
          const convertedData = convertToLessonInfo(data.lesson);
          if (!convertedData) {
            throw new Error('Invalid lesson data received');
          }
          setLessonInfo(convertedData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching lesson info:', err);
          setError('Failed to load lesson information. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLessonInfo();
    return () => {
      isMounted = false;
    };
  }, [lessonSlug]);

  // Handle certificate for congratulations lesson
  useEffect(() => {
    let isMounted = true;

    const handleCertificate = async () => {
      if (!lessonInfo || !workspace.user.id) return;

      const isCongratulationsLesson =
        lessonSlug.toLowerCase() === 'congratulations';
      if (!isCongratulationsLesson) return;

      try {
        const response = await fetch(
          `/api/lessons/${lessonSlug}/certificate?userId=${workspace.user.id}&courseId=${lessonInfo.course_id}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch certificate');
        }
        const data = await response.json();

        if (isMounted) {
          setCertificateUrl(data.certificateUrl);
        }
      } catch (err) {
        console.error('Error checking certificate:', err);
      }
    };

    handleCertificate();
    return () => {
      isMounted = false;
    };
  }, [lessonInfo, workspace.user.id, lessonSlug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="animate-pulse">Loading lesson...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!lessonInfo || !post) {
    return <div className="p-4 text-center">Lesson content unavailable.</div>;
  }

  // Debug: Log content before rendering
  console.log('Rendering post content:', post.content);

  const isCongratulationsLesson =
    lessonSlug.toLowerCase() === 'congratulations';
  const showQuizButton = lessonInfo.quiz && !isCongratulationsLesson;

  return (
    <div className="flex-grow">
      <div className="container sm:max-w-none sm:p-0">
        {post.content ? (
          <Post post={post} content={post.content} />
        ) : (
          <div className="p-4 text-center">No content available.</div>
        )}

        <div className="mb-10 mt-8 flex justify-center">
          {isCongratulationsLesson ? (
            isGeneratingCertificate ? (
              <div className="animate-pulse">Generating certificate...</div>
            ) : (
              certificateUrl && (
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  View Certificate
                </a>
              )
            )
          ) : showQuizButton && lessonInfo.quiz ? (
            <DynamicQuizButton
              quizSlug={lessonInfo.quiz}
              lessonSlug={lessonInfo.slug}
            />
          ) : (
            <DynamicCompleteLessonButton
              lessonId={lessonInfo.id}
              lessonSlug={lessonInfo.slug}
              completedLessonNumber={lessonInfo.lessonID}
              courseId={lessonInfo.course_id}
              courseTitle={courseTitle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
