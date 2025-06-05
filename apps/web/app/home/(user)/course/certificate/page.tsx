import { redirect } from "next/navigation";

import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";

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

	// Get the course ID from the URL or use a default
	const courseId = "decks-for-decision-makers"; // Default course ID

	// Get the user's certificate for this course
	// Using a direct query with type assertion to handle TypeScript errors
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
