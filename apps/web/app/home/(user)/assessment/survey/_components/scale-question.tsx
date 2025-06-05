"use client";

import { useState } from "react";

import { Button } from "@kit/ui/button";
import { Label } from "@kit/ui/label";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Trans } from "@kit/ui/trans";

type ScaleQuestionProps = {
	question: any;
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
			const option = question.options.find(
				(opt: any) => opt.id === selectedOption,
			);

			if (option) {
				// For scale questions, we extract the numeric value from the option
				// This assumes the option text starts with a number (e.g., "1 - Very inexperienced")
				const numericValue = Number.parseInt(option.text.split(" ")[0], 10);
				const score = Number.isNaN(numericValue) ? 0 : numericValue;

				onAnswer(question.id, option.text, score);
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
				{question.options?.map((option: any) => (
					<div
						key={option.id}
						className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-md border p-4"
						onClick={() => setSelectedOption(option.id)}
					>
						<RadioGroupItem value={option.id} id={option.id} />
						<Label
							htmlFor={option.id}
							className="flex-1 cursor-pointer font-normal"
						>
							{option.text}
						</Label>
					</div>
				))}
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
