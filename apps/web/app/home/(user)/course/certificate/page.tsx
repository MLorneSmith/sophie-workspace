import { getCourses } from "@kit/cms/payload";
import type { Course } from "@kit/cms-types";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";
import { redirect } from "next/navigation";

import type { Database } from "~/lib/database.types";
import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

import { HomeLayoutPageHeader } from "../../_components/home-page-header";
import { CertificateViewClient } from "./_components";

type Certificate = Database["public"]["Tables"]["certificates"]["Row"];

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = "force-dynamic";

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.certificate");

	return {
		title,
	};
};

async function CertificatePage() {
	// Get the authenticated user
	const supabase = getSupabaseServerClient();
	const auth = await requireUser(supabase);

	// Check if the user needs redirect
	if (auth.error) {
		redirect(auth.redirectTo);
	}

	// User is authenticated
	const user = auth.data;

	// Get all published courses from Payload CMS (same pattern as course/page.tsx)
	const coursesData = await getCourses();
	const courses = coursesData.docs || [];

	// Find the "Decks for Decision Makers" course by slug
	const decksForDecisionMakersCourse = courses.find(
		(course: Course) => course.slug === "decks-for-decision-makers",
	);

	// If course not found, redirect to course page
	if (!decksForDecisionMakersCourse?.id) {
		redirect("/home/course");
	}

	// Use the course UUID for certificate lookup (not the slug)
	const courseId = decksForDecisionMakersCourse.id;

	// Get the user's certificate for this course using the UUID
	const { data: certificateData, error } = await supabase
		.from("certificates")
		.select("*")
		.eq("user_id", user.id)
		.eq("course_id", courseId)
		.single();

	// Type assertion to handle TypeScript errors
	const certificate = certificateData as Certificate | null;

	// If no certificate is found, redirect to the course page
	if (error || !certificate) {
		redirect("/home/course");
	}

	// Get the public URL for the certificate
	const { data: urlData } = await supabase.storage
		.from("certificates")
		.getPublicUrl(certificate.file_path);

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.certificate"} />}
				description={<Trans i18nKey={"common:certificateDescription"} />}
			/>

			<PageBody>
				<CertificateViewClient certificateUrl={urlData.publicUrl} />
			</PageBody>
		</>
	);
}

export default withI18n(CertificatePage);
