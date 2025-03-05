'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardFooter } from '@kit/ui/card';

import { SurveyResponseOption } from '../../../_types/survey';

interface SelectableRowProps {
  answer: string;
  isSelected: boolean;
  onClick: () => void;
}

const SelectableRow: React.FC<SelectableRowProps> = ({
  answer,
  isSelected,
  onClick,
}) => (
  <div
    className={`flex cursor-pointer items-center space-x-4 rounded-lg border p-4 transition-colors ${
      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
    }`}
    onClick={onClick}
  >
    <span className="text-base font-normal">{answer}</span>
  </div>
);

export interface SurveyQuestionProps {
  survey: {
    questions: Array<{
      type: string;
      question: string;
      options?: SurveyResponseOption[];
      category: string;
      questionspin: 'Positive' | 'Negative';
    }>;
  };
  currentQuestionIndex: number;
  onNextQuestion: (response: SurveyResponseOption, category: string) => void;
  isLastQuestion: boolean;
  updateResponse: (response: SurveyResponseOption, category: string) => void;
  onSurveyComplete: () => void;
}

export function SurveyQuestion({
  survey,
  currentQuestionIndex,
  onNextQuestion,
  isLastQuestion,
  updateResponse,
  onSurveyComplete,
}: SurveyQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<
    SurveyResponseOption | ''
  >('');

  const currentQuestion = useMemo(
    () => survey.questions[currentQuestionIndex],
    [survey.questions, currentQuestionIndex],
  );

  const handleAnswerChange = useCallback(
    (answer: SurveyResponseOption) => {
      if (!currentQuestion) return;
      setSelectedAnswer(answer);
      updateResponse(answer, currentQuestion.category);
    },
    [currentQuestion, updateResponse],
  );

  const handleNext = useCallback(() => {
    if (!currentQuestion || selectedAnswer.length === 0) return;
    onNextQuestion(
      selectedAnswer as SurveyResponseOption,
      currentQuestion.category,
    );
    if (isLastQuestion) {
      onSurveyComplete();
    }
    setSelectedAnswer('');
  }, [
    selectedAnswer,
    currentQuestion,
    onNextQuestion,
    isLastQuestion,
    onSurveyComplete,
  ]);

  if (!currentQuestion) {
    return <div>Error: Question not found</div>;
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent>
          <div className="space-y-4">
            <h2 className="font-base mt-5 text-sm uppercase">
              Question {currentQuestionIndex + 1} of {survey.questions.length}
            </h2>
            <h3 className="text-2xl font-medium">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.type === 'text' ? (
                <textarea
                  className="w-full rounded border p-2"
                  value={selectedAnswer}
                  onChange={(e) =>
                    handleAnswerChange(e.target.value as SurveyResponseOption)
                  }
                  rows={4}
                />
              ) : (
                currentQuestion.options?.map((option, index) => (
                  <SelectableRow
                    key={index}
                    answer={option}
                    isSelected={selectedAnswer === option}
                    onClick={() => handleAnswerChange(option)}
                  />
                ))
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex flex-1 justify-center">
            <Button
              onClick={handleNext}
              disabled={selectedAnswer.length === 0}
              variant="default"
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isLastQuestion ? 'Complete Survey' : 'Next Question'}
            </Button>
          </div>
          <div className="flex-1"></div>
        </CardFooter>
      </Card>
    </div>
  );
}
