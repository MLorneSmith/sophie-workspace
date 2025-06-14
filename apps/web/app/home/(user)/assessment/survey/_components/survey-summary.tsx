"use client";

import { useUserWorkspace } from "@kit/accounts/hooks/use-user-workspace";
import { Button } from "@kit/ui/button";
import { Card } from "@kit/ui/card";
import { Progress } from "@kit/ui/progress";
import { Trans } from "@kit/ui/trans";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Survey } from "../../../../../../../apps/payload/payload-types";
import { useSurveyScores } from "../../_lib/client/hooks/use-survey-scores";
import { RadarChart } from "./radar-chart";

type SurveySummaryProps = {
	survey: Survey;
	categoryScores?: Record<string, number>;
	totalQuestions: number;
};

export function SurveySummary({
	survey: _survey,
	categoryScores: initialCategoryScores,
	totalQuestions: _totalQuestions,
}: SurveySummaryProps) {
	// Get the current user
	const { user } = useUserWorkspace();

	// Fetch scores from database if not provided
	const {
		categoryScores: dbCategoryScores,
		highestCategory: _dbHighestCategory,
		lowestCategory: _dbLowestCategory,
		isLoading: _isLoading,
	} = useSurveyScores(user?.id || "", String(_survey.id));

	// Use provided scores or fall back to database scores
	const categoryScores =
		initialCategoryScores && Object.keys(initialCategoryScores).length > 0
			? initialCategoryScores
			: dbCategoryScores;

	const [highestCategory, setHighestCategory] = useState<string>("");
	const [lowestCategory, setLowestCategory] = useState<string>("");

	useEffect(() => {
		// Use database values if available
		if (dbHighestCategory && !initialCategoryScores) {
			setHighestCategory(dbHighestCategory);
		}

		if (dbLowestCategory && !initialCategoryScores) {
			setLowestCategory(dbLowestCategory);
		}

		// Otherwise calculate from provided scores
		else if (Object.keys(categoryScores).length > 0) {
			const sortedCategories = Object.entries(categoryScores).sort(
				([, a], [, b]) => b - a,
			);

			if (sortedCategories.length > 0) {
				setHighestCategory(sortedCategories[0]?.[0] || "");
				setLowestCategory(
					sortedCategories[sortedCategories.length - 1]?.[0] || "",
				);
			}
		}
	}, [categoryScores, initialCategoryScores]);

	// Get category names - using the category key directly since we don't have a mapping
	const getCategoryName = (categoryKey: string) => {
		// Format the category name for display (capitalize first letter of each word)
		return categoryKey
			.split(/(?=[A-Z])/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	// Calculate max possible score for a category
	const getMaxCategoryScore = (categoryKey: string) => {
		// We need to pass the number of questions per category from the survey container
		// For now, we'll use a more accurate estimation based on the score
		// Assuming each question contributes 1-5 points to a category
		const score = categoryScores[categoryKey] || 0;

		// Estimate the number of questions in this category
		// If the score is 15, and max per question is 5, then there are at least 3 questions
		const estimatedQuestions = Math.ceil(score / 5);

		// Max possible score would be 5 points per question
		return estimatedQuestions * 5;
	};

	// Calculate percentage score for a category
	const getCategoryPercentage = (categoryKey: string) => {
		const score = categoryScores[categoryKey] || 0;
		const maxScore = getMaxCategoryScore(categoryKey);
		return (score / maxScore) * 100;
	};

	return (
		<div className="container mx-auto max-w-3xl px-4">
			<Card className="bg-card mb-8 overflow-hidden p-8 shadow-lg">
				<h1 className="mb-6 text-center text-3xl font-bold">
					<Trans i18nKey="assessment:assessmentComplete" />
				</h1>

				<div className="mb-8 space-y-2">
					<p className="text-center text-lg">
						<Trans i18nKey="assessment:thankYou" />
					</p>
				</div>

				<div className="mb-8 space-y-6">
					<h2 className="text-xl font-semibold">
						<Trans i18nKey="assessment:yourCategoryScores" />
					</h2>

					{/* Radar Chart */}
					<div className="mb-6">
						<RadarChart categoryScores={categoryScores} />
					</div>

					{/* Progress bars for each category */}
					{Object.keys(categoryScores).length > 0 ? (
						Object.entries(categoryScores).map(([category, score]) => (
							<div key={category} className="space-y-2">
								<div className="flex justify-between">
									<span className="font-medium">
										{getCategoryName(category)}
									</span>
									<span className="text-muted-foreground">
										{score} / {getMaxCategoryScore(category)}
									</span>
								</div>
								<Progress
									value={getCategoryPercentage(category)}
									className="h-2"
								/>
							</div>
						))
					) : (
						<div className="text-muted-foreground py-4 text-center">
							<p>No category scores available</p>
						</div>
					)}
				</div>

				<div className="mb-8 space-y-4">
					<h2 className="text-xl font-semibold">
						<Trans i18nKey="assessment:strengthsAndGrowth" />
					</h2>

					{highestCategory && (
						<div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
							<h3 className="mb-2 font-medium text-green-800 dark:text-green-300">
								<Trans i18nKey="assessment:strongestArea" />:{" "}
								{getCategoryName(highestCategory)}
							</h3>
							<p className="text-green-700 dark:text-green-400">
								<Trans i18nKey="assessment:strongestAreaDescription" />
							</p>
						</div>
					)}

					{lowestCategory && (
						<div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
							<h3 className="mb-2 font-medium text-amber-800 dark:text-amber-300">
								<Trans i18nKey="assessment:growthArea" />:{" "}
								{getCategoryName(lowestCategory)}
							</h3>
							<p className="text-amber-700 dark:text-amber-400">
								<Trans i18nKey="assessment:growthAreaDescription" />
							</p>
						</div>
					)}
				</div>

				{lowestCategory && (
					<div className="mb-8">
						<h2 className="mb-4 text-xl font-semibold">
							<Trans i18nKey="assessment:whatsNext" />
						</h2>
						<p className="mb-4">
							<Trans i18nKey="assessment:recommendationText" />{" "}
							{getCategoryName(lowestCategory)}.
						</p>
					</div>
				)}

				<div className="flex justify-center space-x-4">
					<Link href="/home">
						<Button variant="outline">
							<Trans i18nKey="assessment:returnToDashboard" />
						</Button>
					</Link>
					<Link href="/home/courses">
						<Button>
							<Trans i18nKey="assessment:exploreCourses" />
						</Button>
					</Link>
				</div>
			</Card>
		</div>
	);
}
