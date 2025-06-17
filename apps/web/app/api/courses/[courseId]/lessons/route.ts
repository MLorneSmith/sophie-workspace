import { getCourseLessons } from "@kit/cms/payload";
import { enhanceRouteHandler } from "@kit/next/routes";
import { NextResponse } from "next/server";

export const GET = enhanceRouteHandler(
	async ({ params, user: _user }) => {
		if (!params?.courseId) {
			return NextResponse.json(
				{ error: "Course ID is required" },
				{ status: 400 },
			);
		}

		try {
			// TODO: Async logger needed
			// (await getLogger()).info(
			// `API - Fetching lessons for course ID: ${params.courseId}`,
			// );
			const lessons = await getCourseLessons(params.courseId);

			// Debug lessons data
			// TODO: Async logger needed
			// (await getLogger()).info("API - Lessons data:", {
			// 	count: lessons.docs?.length || 0,
			// 	sampleLesson: lessons.docs?.[0]
			// 		? {
			// 			id: lessons.docs[0].id,
			// 			title: lessons.docs[0].title,
			// 			lesson_number: lessons.docs[0].lesson_number,
			// 			quiz_id: lessons.docs[0].quiz_id,
			// 		}
			// 		: null,
			// });

			// Log detailed structure of the first lesson to understand relationship structure
			// TODO: Async logger needed - removed unused sampleLesson code

			return NextResponse.json(lessons);
		} catch (_error) {
			// TODO: Async logger needed
			// (await getLogger()).error(
			// 	"Error fetching course lessons:",
			// 	{ data: error }
			// );
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
