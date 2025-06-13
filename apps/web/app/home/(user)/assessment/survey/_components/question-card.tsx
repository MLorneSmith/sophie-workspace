"use client";

import { useState } from "react";

import { Button } from "@kit/ui/button";
import { Label } from "@kit/ui/label";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Trans } from "@kit/ui/trans";

import { ScaleQuestion } from "./scale-question";
import { TextFieldQuestion } from "./text-field-question";

interface QuestionOption {
	id: string;
	text: string;
	score?: number;
}

interface Question {
	id: string;
	type: "text_field" | "scale" | "multiple_choice";
	title: string;
	text?: string;
	description?: string;
	options?: QuestionOption[];
}

type QuestionCardProps = {
	question: Question;
	onAnswer: (questionId: string, answer: string, score: number) => void;
	isLoading: boolean;
};

export function QuestionCard({
	question,
	onAnswer,
	isLoading,
}: QuestionCardProps) {
	// Render different question types based on the question type
	if (question.type === "text_field") {
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
	const [selectedOption, setSelectedOption] = useState<string | null>(null);

	const handleSubmit = () => {
		if (selectedOption) {
			// Log the selected option and available options for debugging
			console.log("Selected option:", selectedOption);
			console.log("Available options:", question.options);

			const option = question.options?.find((opt) => opt.id === selectedOption);

			if (option) {
				onAnswer(question.id, option.text, option.score || 0);
			} else {
				console.error("Selected option not found:", selectedOption);
				console.error("Question options:", question.options);
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
				{question.options?.map((option) => (
					<button
						key={option.id}
						type="button"
						className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-md border p-4 text-left w-full"
						onClick={() => setSelectedOption(option.id)}
						aria-label={`Select option: ${option.text}`}
					>
						<RadioGroupItem value={option.id} id={option.id} />
						<Label
							htmlFor={option.id}
							className="flex-1 cursor-pointer font-normal"
						>
							{option.text}
						</Label>
					</button>
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
