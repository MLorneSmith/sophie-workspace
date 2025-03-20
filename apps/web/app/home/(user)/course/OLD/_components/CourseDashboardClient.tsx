'use client';

import { type FC, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { CheckCircle, XCircle } from 'lucide-react';

import { LessonContent } from '@kit/keystatic';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import { useContentStore } from '../../../../_stores/content-store';
import { transformKeystaticContent } from '../../../../lib/markdoc-transformer';
import type {
  Course,
  KeystaticLesson,
  LessonCompletion,
  RichTextContent,
} from '../../_types/courseTypes';
import { RadialProgress } from './RadialProgress';
import CourseProgressBar from './course/CourseProgressBar';

interface LessonWithContent extends KeystaticLesson {
  id: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  image: string;
  lessonLength: number;
  quiz: string | null;
  content: LessonContent | null;
}

interface CourseDashboardClientProps {
  course: Course;
  lessons: LessonWithContent[];
  progress: LessonCompletion[];
  userId: string;
}

export const CourseDashboardClient: FC<CourseDashboardClientProps> = ({
  course,
  lessons,
  progress,
  userId,
}) => {
  const { contentCache, setContent } = useContentStore();
  const [transformedLessons, setTransformedLessons] = useState<
    Record<string, RichTextContent[]>
  >({});

  // Transform lesson content
  useEffect(() => {
    const transformLessons = async () => {
      const transformed: Record<string, RichTextContent[]> = {};

      for (const lesson of lessons) {
        if (lesson.content?.content) {
          try {
            const content = await transformKeystaticContent(
              lesson.content.content,
            );
            transformed[lesson.id] = content;
          } catch (error) {
            console.error(
              `Error transforming content for lesson ${lesson.slug}:`,
              error,
            );
          }
        }
      }

      setTransformedLessons(transformed);
    };

    transformLessons();
  }, [lessons]);

  const getLessonProgress = (lessonId: string) => {
    return progress.find((p) => p.lesson_id === lessonId);
  };

  const calculateCourseCompletion = () => {
    const completedLessons = progress.filter((p) => p.completed_at).length;
    return (completedLessons / (course.total_lessons || 1)) * 100;
  };

  const courseCompletionPercentage = calculateCourseCompletion();

  return (
    <div className="container mx-auto flex max-w-4xl flex-col space-y-6 p-4">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">{course.name}</h1>
      </div>

      <CourseProgressBar
        userId={userId}
        totalLessons={course.total_lessons || 1}
      />

      {lessons
        .filter((lesson) => {
          // Filter out congratulations lessons if course not complete
          if (courseCompletionPercentage < 100) {
            return (
              lesson.content?.title !== 'Congratulations' &&
              lesson.content?.title !== 'Before you go...'
            );
          }
          return true;
        })
        .map((lesson) => {
          const lessonProgress = getLessonProgress(lesson.id);
          const isCompleted = !!lessonProgress?.completed_at;
          const quizScore = lessonProgress?.quiz_score ?? null;
          const transformedContent = transformedLessons[lesson.id];

          return (
            <div key={lesson.id}>
              <Link href={`/home/course/${lesson.slug}`}>
                <Card className="hover:shadow-sm hover:outline hover:outline-1 hover:outline-sky-500/50">
                  <CardHeader className="hover:outline-sky-500">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {lesson.content?.title || lesson.title}
                      </CardTitle>
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
                              lesson.image ||
                              '/placeholder.svg?height=155&width=275'
                            }
                            alt={`Illustration for ${lesson.content?.title ?? lesson.title}`}
                            className="rounded-lg object-cover"
                            fill
                            sizes="(max-width: 640px) 100vw, 275px"
                            priority={true}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="ml-2 mr-28 text-muted-foreground">
                            {lesson.description ||
                              lesson.content?.description ||
                              'No description available.'}
                          </p>
                        </div>
                      </div>
                      {isCompleted &&
                        lesson.quiz &&
                        typeof quizScore === 'number' && (
                          <div className="flex flex-col items-center justify-center">
                            <h6 className="mb-2 font-semibold">Quiz Score</h6>
                            <RadialProgress value={quizScore} />
                          </div>
                        )}
                    </div>
                    <div className="absolute bottom-2 right-4 text-sm text-muted-foreground">
                      <p>{lesson.lessonLength || 0} minutes</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          );
        })}
    </div>
  );
};
