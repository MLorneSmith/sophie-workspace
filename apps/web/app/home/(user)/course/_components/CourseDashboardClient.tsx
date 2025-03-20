'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import { CourseProgressBar } from './CourseProgressBar';
import { RadialProgress } from './RadialProgress';

interface CourseDashboardClientProps {
  course: any;
  courseProgress: any;
  lessonProgress: any[];
  quizAttempts: any[];
  userId: string;
}

export function CourseDashboardClient({
  course,
  courseProgress,
  lessonProgress,
  quizAttempts,
  userId,
}: CourseDashboardClientProps) {
  const supabase = useSupabase();
  const [lessons, setLessons] = useState<any[]>([]);

  // Fetch lessons for this course
  const { data: lessonsData, isLoading } = useQuery({
    queryKey: ['course-lessons', course.id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${course.id}/lessons`);
      if (!response.ok) {
        throw new Error('Failed to fetch course lessons');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (lessonsData) {
      setLessons(lessonsData.docs || []);
    }
  }, [lessonsData]);

  // Get completion status for a specific lesson
  const getLessonCompletionStatus = (lessonId: string) => {
    const progress = lessonProgress.find((p) => p.lesson_id === lessonId);
    return progress?.completed_at ? true : false;
  };

  // Get quiz score for a specific lesson
  const getLessonQuizScore = (lessonId: string) => {
    const attempts = quizAttempts
      .filter((a) => a.lesson_id === lessonId)
      .sort((a, b) => {
        const dateA = new Date(b.completed_at || 0).getTime();
        const dateB = new Date(a.completed_at || 0).getTime();
        return dateA - dateB;
      });

    return attempts.length > 0 ? attempts[0].score : null;
  };

  if (isLoading) {
    return <div>Loading course...</div>;
  }

  return (
    <div className="container mx-auto flex max-w-4xl flex-col space-y-6 p-4">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">{course.title}</h1>
        <div
          className="mb-6"
          dangerouslySetInnerHTML={{ __html: course.description }}
        />
      </div>

      <CourseProgressBar
        percentage={courseProgress?.completion_percentage || 0}
        totalLessons={lessons.length}
        completedLessons={lessonProgress.filter((p) => p.completed_at).length}
      />

      {lessons.map((lesson) => {
        const isCompleted = getLessonCompletionStatus(lesson.id);
        const quizScore = getLessonQuizScore(lesson.id);

        return (
          <div key={lesson.id}>
            <Link href={`/home/course/lessons/${lesson.slug}`}>
              <Card className="hover:shadow-sm hover:outline hover:outline-sky-500/50">
                <CardHeader className="hover:outline-sky-500">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <Badge variant={isCompleted ? 'default' : 'secondary'}>
                      {isCompleted ? (
                        <CheckCircle className="mr-1 h-4 w-4" />
                      ) : (
                        <XCircle className="mr-1 h-4 w-4" />
                      )}
                      {isCompleted ? 'Completed' : 'Incomplete'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative pb-8">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                      <div className="relative h-[155px] w-[275px] flex-shrink-0">
                        <Image
                          src={
                            lesson.featuredImage?.url ||
                            '/placeholder.svg?height=155&width=275'
                          }
                          alt={`Illustration for ${lesson.title}`}
                          className="rounded-lg object-cover"
                          fill
                          sizes="(max-width: 640px) 100vw, 275px"
                          priority={true}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground mr-28 ml-2">
                          {lesson.description || 'No description available.'}
                        </p>
                      </div>
                    </div>
                    {isCompleted && quizScore !== null && (
                      <div className="flex flex-col items-center justify-center">
                        <h6 className="mb-2 font-semibold">Quiz Score</h6>
                        <RadialProgress value={quizScore} />
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground absolute right-4 bottom-2 text-sm">
                    <p>{lesson.estimatedDuration || 0} minutes</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        );
      })}

      {courseProgress?.completed_at && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/50">
          <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
            Course Complete! 🎉
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-400">
            Congratulations on completing the course.
          </p>
          <div className="mt-4 flex justify-end">
            <Link href="/home/course/certificate">
              <button className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                View Certificate
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
