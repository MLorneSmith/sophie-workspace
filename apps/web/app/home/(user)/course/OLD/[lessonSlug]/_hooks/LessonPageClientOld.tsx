'use client';

import { Suspense, useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import ViewCertificateButton from '../../_components/course/view-certificate-button';
import { Post } from '../_components/lesson';

const DynamicQuizButton = dynamic(
  () => import('../../_components/course/quiz-button'),
  { ssr: false },
);

const DynamicCompleteLessonButton = dynamic(
  () => import('../../_components/course/complete-lesson-button'),
  { ssr: false },
);

interface LessonInfo {
  id: string;
  lessonID: number;
  course_id: string;
  title: string;
  slug: string;
  order: number;
  quiz: string | null;
}

async function generateCertificate(
  userId: string,
  courseName: string,
  completionDate: string,
): Promise<string | null> {
  try {
    console.log(
      'Generating certificate for:',
      userId,
      courseName,
      completionDate,
    );
    const response = await fetch('/api/generate-certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, courseName, completionDate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        'Failed to generate certificate:',
        response.statusText,
        errorData,
      );
      throw new Error(
        `Failed to generate certificate: ${errorData.error || response.statusText}`,
      );
    }

    const data = await response.json();
    console.log('Certificate generation response:', data);
    return data.filename;
  } catch (error) {
    console.error('Error generating certificate:', error);
    return null;
  }
}

interface LessonPageClientProps {
  post: any;
  workspace: any;
  lessonSlug: string;
}

export default function LessonPageClient({
  post,
  workspace,
  lessonSlug,
}: LessonPageClientProps) {
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] =
    useState<boolean>(false);
  const [lessonInfo, setLessonInfo] = useState<LessonInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();

  // Hardcoded course title
  const courseTitle = 'Decks for Decision Makers';

  useEffect(() => {
    async function fetchLessonInfo() {
      console.log('Fetching lesson info for slug:', lessonSlug);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, lessonID, course_id, title, slug, order, quiz')
        .eq('slug', lessonSlug)
        .single();

      if (error) {
        console.error('Error fetching lesson info:', error);
        setError('Failed to fetch lesson information. Please try again later.');
      } else if (data) {
        console.log('Lesson info fetched:', data);
        setLessonInfo({
          id: data.id,
          lessonID: data.lessonID,
          course_id: data.course_id,
          title: data.title || '',
          slug: data.slug || '',
          order: data.order || 0,
          quiz: data.quiz,
        });
      }
    }

    fetchLessonInfo();
  }, [supabase, lessonSlug]);

  useEffect(() => {
    async function fetchCertificateUrl() {
      if (!lessonInfo || !workspace.user.id) return null;

      console.log(
        'Fetching certificate URL for user:',
        workspace.user.id,
        'and course:',
        lessonInfo.course_id,
      );
      const { data: courseProgressData, error } = await supabase
        .from('course_progress')
        .select('certificate_url')
        .eq('user_id', workspace.user.id)
        .eq('course_id', lessonInfo.course_id)
        .single();

      if (error) {
        console.error('Error fetching certificate URL:', error);
        return null;
      }

      console.log(
        'Certificate URL fetched:',
        courseProgressData?.certificate_url,
      );
      return courseProgressData?.certificate_url ?? null;
    }

    async function loadCertificateUrl() {
      const url = await fetchCertificateUrl();
      setCertificateUrl(url);
    }

    if (lessonInfo && workspace.user.id) {
      loadCertificateUrl();
    }
  }, [supabase, workspace.user.id, lessonInfo]);

  const quizAvailable = !!lessonInfo?.quiz;
  const isCongratulationsLesson =
    lessonSlug.toLowerCase() === 'congratulations';

  useEffect(() => {
    async function generateCertificateIfNeeded() {
      if (
        isCongratulationsLesson &&
        !certificateUrl &&
        workspace.user.id &&
        lessonInfo?.course_id
      ) {
        setIsGeneratingCertificate(true);
        setError(null);
        console.log('Generating certificate for user:', workspace.user.id);
        try {
          const generatedCertificateUrl = await generateCertificate(
            workspace.user.id,
            lessonInfo.course_id,
            new Date().toISOString().split('T')[0],
          );
          setIsGeneratingCertificate(false);
          if (generatedCertificateUrl) {
            console.log('Certificate generated:', generatedCertificateUrl);
            setCertificateUrl(generatedCertificateUrl);

            // Update the course_progress table with the new certificate URL
            const { error: updateError } = await supabase
              .from('course_progress')
              .upsert(
                {
                  user_id: workspace.user.id,
                  course_id: lessonInfo.course_id,
                  certificate_url: generatedCertificateUrl,
                },
                { onConflict: 'user_id,course_id' },
              );

            if (updateError) {
              console.error('Error updating course progress:', updateError);
              // Don't set an error message here, as the certificate was generated successfully
            }
          } else {
            setError('Failed to generate certificate. Please try again later.');
          }
        } catch (error) {
          console.error('Error during certificate generation:', error);
          setError(
            `Failed to generate certificate: ${(error as Error).message}`,
          );
        } finally {
          setIsGeneratingCertificate(false);
        }
      }
    }

    generateCertificateIfNeeded();
  }, [
    isCongratulationsLesson,
    certificateUrl,
    workspace.user.id,
    lessonInfo,
    supabase,
  ]);

  console.log('LessonPageClient: Lesson found:', post);
  console.log('Post content:', post.content);
  console.log('Post content type:', typeof post.content);
  console.log('Quiz Slug:', lessonInfo?.quiz);
  console.log('Lesson Info:', lessonInfo);
  console.log('Quiz Available:', quizAvailable);
  console.log('Is Congratulations Lesson:', isCongratulationsLesson);
  console.log('Certificate URL:', certificateUrl);
  console.log('Course Title:', courseTitle);

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!lessonInfo || !post) {
    return <div className="text-center">Loading lesson information...</div>;
  }

  return (
    <div className="flex-grow">
      <div className={'container sm:max-w-none sm:p-0'}>
        {post.content ? (
          <Post post={post} content={post.content} />
        ) : (
          <div>No content available for this lesson.</div>
        )}
        <div className="mb-10 mt-8 flex justify-center">
          {isCongratulationsLesson ? (
            isGeneratingCertificate ? (
              <p>Generating your certificate...</p>
            ) : certificateUrl ? (
              <ViewCertificateButton
                userId={workspace.user.id}
                courseId={lessonInfo.course_id}
              />
            ) : (
              <p>Unable to generate certificate. Please try again later.</p>
            )
          ) : quizAvailable && lessonInfo.quiz ? (
            <Suspense fallback={<div>Loading quiz button...</div>}>
              <DynamicQuizButton
                quizSlug={lessonInfo.quiz}
                lessonSlug={lessonInfo.slug} // Use lessonInfo.slug instead of lessonSlug
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div>Loading complete lesson button...</div>}>
              <DynamicCompleteLessonButton
                lessonId={lessonInfo.id}
                completedLessonNumber={lessonInfo.lessonID}
                courseId={lessonInfo.course_id}
                courseTitle={courseTitle}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
