import { NextResponse } from 'next/server';

import { getCourseLessons } from '@kit/cms/payload';
import { enhanceRouteHandler } from '@kit/next/routes';

export const GET = enhanceRouteHandler(
  async function ({ params, user }) {
    if (!params?.courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 },
      );
    }

    try {
      console.log(`API - Fetching lessons for course ID: ${params.courseId}`);
      const lessons = await getCourseLessons(params.courseId);

      // Debug lessons data
      console.log('API - Lessons data:', {
        count: lessons.docs?.length || 0,
        sampleLesson: lessons.docs?.[0]
          ? {
              id: lessons.docs[0].id,
              title: lessons.docs[0].title,
              lesson_number: lessons.docs[0].lesson_number,
              quiz_id: lessons.docs[0].quiz_id,
            }
          : null,
      });

      return NextResponse.json(lessons);
    } catch (error) {
      console.error('Error fetching course lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course lessons' },
        { status: 500 },
      );
    }
  },
  {
    auth: true,
  },
);
