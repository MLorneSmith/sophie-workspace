"use client";

import type { SurveyQuestion } from "@kit/cms-types";
import { createClientLogger } from "@kit/shared/logger";
import { Button } from "@kit/ui/button";
import { Label } from "@kit/ui/label";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Trans } from "@kit/ui/trans";
import { useState } from "react";
import { ScaleQuestion } from "./scale-question";
import { TextFieldQuestion } from "./text-field-question";

// Client-side logger for this component
const { getLogger } = createClientLogger("SURVEY-QUESTION-CARD");

type QuestionCardProps = {
	question: SurveyQuestion;
	onAnswer: (questionId: string, answer: string, score: number) => void;
	isLoading: boolean;
};

export function QuestionCard({
	question,
	onAnswer,
	isLoading,
}: QuestionCardProps) {
	// Always call hooks at the top level, even if not used in all branches
	const [selectedOption, _setSelectedOption] = useState<string | null>(null);

	// Render different question types based on the question type
	if (question.type === "text_field" || question.type === "textarea") {
		return (
			<TextFieldQuestion
				question={question}
				onAnswer={onAnswer}
				isLoading={isLoading}
			/>
		);
	}

	if (question.type === "scale") {
		return (
			<ScaleQuestion
				question={question}
				onAnswer={onAnswer}
				isLoading={isLoading}
			/>
		);
	}

	// Default to multiple choice question

	const _handleSubmit = () => {
		if (selectedOption) {
			// Log the selected option and available options for debugging
			getLogger().info("Selected option", {
				data: selectedOption,
				questionId: question.id,
			});
			getLogger().info("Available options", {
				data: question.options,
				questionId: question.id,
			});

			const option = question.options?.find((opt) => opt.id === selectedOption);

			if (option) {
				onAnswer(question.id, option.option, 0);
			} else {
				getLogger().error("Selected option not found", {
					selectedOption,
					questionId: question.id,
					questionType: question.type,
				});
				getLogger().error("Question options", {
					options: question.options,
					questionId: question.id,
				});
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h2 className="text-2xl font-bold">{question.text}</h2>
				{question.description && (
					<p className="text-muted-foreground">{question.description}</p>
				)}
			</div>

			<RadioGroup
				value={selectedOption || ""}
				onValueChange={_setSelectedOption}
				className="space-y-3"
			>
				{question.options?.map((option) => {
					const optionId = option.id || option.option;
					return (
						<button
							key={optionId}
							type="button"
							className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-md border p-4 text-left w-full"
							onClick={() => _setSelectedOption(optionId)}
							aria-label={`Select option: ${option.option}`}
						>
							<RadioGroupItem value={optionId} id={optionId} />
							<Label
								htmlFor={optionId}
								className="flex-1 cursor-pointer font-normal"
							>
								{option.option}
							</Label>
						</button>
					);
				})}
			</RadioGroup>

			<Button
				onClick={_handleSubmit}
				disabled={!selectedOption || isLoading}
				className="w-full"
			>
				{isLoading ? (
					<Trans i18nKey="assessment:saving" />
				) : (
					<Trans i18nKey="assessment:nextQuestion" />
				)}
			</Button>
		</div>
	);
}
