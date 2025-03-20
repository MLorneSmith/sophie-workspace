import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import { Skeleton } from '@kit/ui/skeleton';

import { calculateCourseCompletion } from '../_actions/CalculateCourseCompletion';

interface CourseProgressProps {
  userId: string;
  totalLessons: number;
}

const CourseProgress = async ({
  userId,
  totalLessons,
}: CourseProgressProps) => {
  const client = getSupabaseServerClient();

  const { data: courseProgressData, error: progressError } = await client
    .from('course_progress')
    .select('id, completed_lessons')
    .eq('user_id', userId);

  if (progressError) {
    console.error('Error fetching course progress data:', progressError);
    return <div>Error loading progress data</div>;
  }

  const course = { total_lessons: totalLessons };
  const lessonCompletionsData = courseProgressData?.map((progress) => ({
    id: progress.id,
    user_id: userId,
    completed_at: null,
    quiz_score: null,
    completed_lesson: Array.isArray(progress.completed_lessons)
      ? progress.completed_lessons
      : progress.completed_lessons
        ? [progress.completed_lessons]
        : [], // Ensure it's always an array
  }));

  const courseCompletionPercentage = calculateCourseCompletion(
    course,
    lessonCompletionsData ?? null,
  );

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Overall Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {courseProgressData && courseProgressData.length > 0 ? (
          <div>
            <Progress value={courseCompletionPercentage} className="w-full" />
            <p className="mt-2 text-sm text-muted-foreground">
              {courseCompletionPercentage}% Complete
            </p>
          </div>
        ) : (
          <div>
            <Skeleton className="h-4 w-full" />
            <p className="mt-2 text-sm text-muted-foreground">
              No progress yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseProgress;
