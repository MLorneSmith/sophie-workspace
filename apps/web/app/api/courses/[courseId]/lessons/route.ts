import { enhanceRouteHandler } from "@kit/next/routes";
import { getCourseLessons } from "@kit/payload";
import { createServiceLogger } from "@kit/shared/logger";
import { NextResponse } from "next/server";

const { getLogger } = createServiceLogger("COURSE-LESSONS-API");

export const GET = enhanceRouteHandler(
	async ({ params, user: _user }) => {
		if (!params?.courseId) {
			return NextResponse.json(
				{ error: "Course ID is required" },
				{ status: 400 },
			);
		}

		try {
			const logger = await getLogger();
			logger.info("Fetching lessons for course", {
				operation: "fetch_course_lessons",
				courseId: params.courseId,
			});

			const lessons = await getCourseLessons(params.courseId);

			logger.info("Course lessons fetched successfully", {
				operation: "fetch_course_lessons",
				courseId: params.courseId,
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
			const logger = await getLogger();
			logger.error("Error fetching course lessons", {
				operation: "fetch_course_lessons",
				courseId: params.courseId,
				error,
			});
			return NextResponse.json(
				{ error: "Failed to fetch course lessons" },
				{ status: 500 },
			);
		}
	},
	{
		auth: true,
	},
);
