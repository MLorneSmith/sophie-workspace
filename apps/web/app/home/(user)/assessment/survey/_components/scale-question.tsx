"use client";

import type { SurveyQuestion } from "@kit/cms-types";
import { Button } from "@kit/ui/button";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";
import { useState } from "react";

type ScaleQuestionProps = {
	question: SurveyQuestion;
	onAnswer: (questionId: string, answer: string, score: number) => void;
	isLoading: boolean;
};

export function ScaleQuestion({
	question,
	onAnswer,
	isLoading,
}: ScaleQuestionProps) {
	const [selectedOption, setSelectedOption] = useState<string | null>(null);

	const handleSubmit = () => {
		if (selectedOption) {
			const option = question.options?.find((opt) => opt.id === selectedOption);

			if (option) {
				// For scale questions, we extract the numeric value from the option
				// This assumes the option text starts with a number (e.g., "1 - Very inexperienced")
				const numericValue = Number.parseInt(
					option.option.split(" ")[0] || "0",
					10,
				);
				const score = Number.isNaN(numericValue) ? 0 : numericValue;

				onAnswer(question.id, option.option, score);
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
				onValueChange={setSelectedOption}
				className="space-y-3"
			>
				{question.options?.map((option) => {
					const optionId = option.id || option.option;
					const isSelected = selectedOption === optionId;
					return (
						<label
							key={optionId}
							htmlFor={optionId}
							className={cn(
								"flex cursor-pointer items-center space-x-4 rounded-md border p-4 text-sm transition-all",
								"focus-within:border-primary",
								{
									"bg-muted": isSelected,
									"hover:bg-muted": !isSelected,
								},
							)}
						>
							<RadioGroupItem value={optionId} id={optionId} />
							<span className="flex-1 font-normal">{option.option}</span>
						</label>
					);
				})}
			</RadioGroup>

			<Button
				onClick={handleSubmit}
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
