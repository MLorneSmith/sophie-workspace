import { redirect } from "next/navigation";

import { getCourses } from "@kit/cms/payload";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

import type { Database } from "~/lib/database.types";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

import { HomeLayoutPageHeader } from "../_components/home-page-header";
import { CourseDashboardClient } from "./_components/CourseDashboardClient";

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = "force-dynamic";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.course");

	return {
		title,
	};
};

async function CoursePage() {
	// Get the authenticated user
	const supabase = getSupabaseServerClient();
	const auth = await requireUser(supabase);

	// Check if the user needs redirect
	if (auth.error) {
		redirect(auth.redirectTo);
	}

	// User is authenticated
	const user = auth.data;

	// Get all published courses using Local API (direct DB access)
	const coursesData = await getCourses();
	const courses = coursesData.docs || [];

	// Define type alias for cleaner code
	type Course = Database["payload"]["Tables"]["courses"]["Row"];

	// Find the "Decks for Decision Makers" course
	const decksForDecisionMakersCourse =
		courses.find(
			(course: Course) => course.slug === "decks-for-decision-makers",
		) || courses[0];

	if (!decksForDecisionMakersCourse) {
		return (
			<>
				<HomeLayoutPageHeader
					title={<Trans i18nKey={"common:routes.course"} />}
					description={<Trans i18nKey={"common:courseTabDescription"} />}
				/>
				<PageBody>
					<div className="container mx-auto px-4 py-8">
						<h1 className="text-2xl font-bold">Course Dashboard</h1>
						<p className="mt-4 text-gray-600">No courses available yet.</p>
					</div>
				</PageBody>
			</>
		);
	}

	// Get user's progress for this course
	const { data: courseProgress } = await supabase
		.from("course_progress")
		.select("*")
		.eq("user_id", user.id)
		.eq("course_id", decksForDecisionMakersCourse.id)
		.single();

	// Get lessons for this course with progress
	const { data: lessonProgress } = await supabase
		.from("lesson_progress")
		.select("*")
		.eq("user_id", user.id)
		.eq("course_id", decksForDecisionMakersCourse.id);

	// Get quiz attempts
	const { data: quizAttempts } = await supabase
		.from("quiz_attempts")
		.select("*")
		.eq("user_id", user.id)
		.eq("course_id", decksForDecisionMakersCourse.id);

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.course"} />}
				description={<Trans i18nKey={"common:courseTabDescription"} />}
			/>

			<PageBody>
				<CourseDashboardClient
					course={decksForDecisionMakersCourse}
					courseProgress={courseProgress || null}
					lessonProgress={lessonProgress || []}
					quizAttempts={quizAttempts || []}
					userId={user.id}
				/>
			</PageBody>
		</>
	);
}

export default withI18n(CoursePage);
