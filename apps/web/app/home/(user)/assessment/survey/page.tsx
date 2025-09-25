import type { SurveyQuestion } from "@kit/cms-types";
import { getSurvey, getSurveyQuestions } from "@kit/payload";
import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { Card } from "@kit/ui/card";
import { PageBody } from "@kit/ui/page";
import { Trans } from "@kit/ui/trans";
import { redirect } from "next/navigation";

import { createI18nServerInstance } from "~/lib/i18n/i18n.server";
import { withI18n } from "~/lib/i18n/with-i18n";

import { HomeLayoutPageHeader } from "../../_components/home-page-header";
// Import from the current directory
import { SurveyContainer } from "./_components/survey-container";

const { getLogger } = createServiceLogger("ASSESSMENT-SURVEY");

// Helper function to process questions with logging
async function processQuestions(questions: SurveyQuestion[]) {
	const logger = await getLogger();

	// Process and sort questions
	const processedQuestions = questions.map((question) => {
		// For multiple_choice questions, add default options if none exist
		if (
			question.type === "multiple_choice" &&
			(!question.options || question.options.length === 0)
		) {
			logger.info("Adding default options for question", {
				questionId: question.id,
			});

			// Default options for Likert scale
			const defaultOptions = [
				{ option: "Strongly disagree" },
				{ option: "Disagree" },
				{ option: "Neither agree nor disagree" },
				{ option: "Agree" },
				{ option: "Strongly agree" },
			];

			// Return question with default options
			return {
				...question,
				options: defaultOptions,
			};
		}

		// Return question as-is if it already has options
		return question;
	});

	// Sort questions by position
	return [...processedQuestions].sort(
		(a, b) => (a.position || 0) - (b.position || 0),
	);
}

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("common:routes.assessment");

	return {
		title,
	};
};

async function SurveyPage() {
	const client = getSupabaseServerClient();
	const {
		data: { user },
	} = await client.auth.getUser();

	if (!user) {
		redirect("/auth/sign-in");
	}

	// Get the assessment survey
	const surveyData = await getSurvey("self-assessment");
	const survey = surveyData.docs?.[0];

	if (!survey) {
		redirect("/home/assessment");
	}

	// Get the survey questions
	const questionsData = await getSurveyQuestions(survey.id);
	const questions = questionsData.docs || [];

	if (questions.length === 0) {
		return (
			<>
				<HomeLayoutPageHeader
					title={<Trans i18nKey={"common:routes.assessment"} />}
					description={<Trans i18nKey={"common:assessmentTabDescription"} />}
				/>
				<PageBody>
					<Card className="mx-auto max-w-2xl p-8 shadow-lg">
						<h1 className="mb-6 text-center text-3xl font-bold">
							<Trans i18nKey="assessment:noQuestionsAvailable" />
						</h1>
						<p className="mb-6 text-lg">
							<Trans i18nKey="assessment:questionsNotAvailable" />
						</p>
					</Card>
				</PageBody>
			</>
		);
	}

	// Get user's progress if any
	const { data: progressData } = await client
		.from("survey_progress")
		.select("*")
		.eq("user_id", user.id)
		.eq("survey_id", String(survey.id))
		.maybeSingle();

	// Process questions with logging in async helper
	const sortedQuestions = await processQuestions(questions as SurveyQuestion[]);

	return (
		<>
			<HomeLayoutPageHeader
				title={<Trans i18nKey={"common:routes.assessment"} />}
				description={<Trans i18nKey={"common:assessmentTabDescription"} />}
			/>
			<PageBody>
				<SurveyContainer
					survey={survey}
					questions={sortedQuestions}
					userId={user.id}
					initialProgress={progressData?.current_question_index || 0}
				/>
			</PageBody>
		</>
	);
}

export default withI18n(SurveyPage);
