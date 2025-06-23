"use client";

import { Button } from "@kit/ui/button";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";
import { Trans } from "@kit/ui/trans";
import { useId, useState } from "react";

import type { SurveyQuestion } from "../../../../../../../payload/payload-types";

type TextFieldQuestionProps = {
	question: SurveyQuestion;
	onAnswer: (questionId: string, answer: string, score: number) => void;
	isLoading: boolean;
};

export function TextFieldQuestion({
	question,
	onAnswer,
	isLoading,
}: TextFieldQuestionProps) {
	const [answer, setAnswer] = useState<string>("");
	const answerId = useId();

	const handleSubmit = () => {
		if (answer.trim()) {
			// For text fields, we don't have a score, so we use 0
			onAnswer(question.id, answer, 0);
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

			<div className="space-y-2">
				<Label htmlFor={answerId}>Your Answer</Label>
				<Textarea
					id={answerId}
					value={answer}
					onChange={(e) => setAnswer(e.target.value)}
					placeholder="Type your answer here..."
					className="min-h-[100px]"
				/>
			</div>

			<Button
				onClick={handleSubmit}
				disabled={!answer.trim() || isLoading}
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
