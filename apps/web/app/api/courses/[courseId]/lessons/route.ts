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
			if (lessons.docs?.[0]) {
				const _sampleLesson = lessons.docs[0];
				// TODO: Async logger needed
				// (await getLogger()).info(
				// 	"API - Detailed sample lesson structure:",
				// 	{
				// 		featured_image_id: sampleLesson.featured_image_id,
				// 		// Check if it's an object with nested properties
				// 		hasNestedUrl: !!sampleLesson.featured_image_id?.url,
				// 		// Check if it's a direct property
				// 		directUrl: sampleLesson.url,
				// }
				// );
			}

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
