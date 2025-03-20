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
      const lessons = await getCourseLessons(params.courseId);
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
