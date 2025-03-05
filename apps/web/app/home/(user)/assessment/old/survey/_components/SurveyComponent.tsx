import React, { useState } from 'react';

import { Trans } from '@kit/ui/trans';

import { SurveyQuestion } from './SurveyQuestion';

interface SurveyQuestionType {
  id: string;
  text: string;
  type: 'multiple_choice';
  options: string[];
  category: string;
}

interface SurveyComponentProps {
  questions: SurveyQuestionType[];
  onSubmit: (responses: { [key: string]: string }) => void;
  isSubmitting: boolean;
}

export const SurveyComponent: React.FC<SurveyComponentProps> = ({
  questions,
  onSubmit,
  isSubmitting,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});

  const handleResponseChange = (questionId: string, response: string) => {
    console.log(`Response changed for question ${questionId}: ${response}`);
    setResponses((prev) => ({ ...prev, [questionId]: response }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      console.log(`Moving to next question: ${currentQuestionIndex + 1}`);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      console.log(`Moving to previous question: ${currentQuestionIndex - 1}`);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting survey responses:', responses);
    onSubmit(responses);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (!currentQuestion) {
    console.log('No questions available.');
    return <div>No questions available.</div>;
  }

  console.log(
    `Rendering question ${currentQuestionIndex + 1} of ${questions.length}`,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SurveyQuestion
        question={currentQuestion}
        selectedAnswer={responses[currentQuestion.id] || null}
        onSelectAnswer={(answer) =>
          handleResponseChange(currentQuestion.id, answer)
        }
      />
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 disabled:opacity-50"
        >
          <Trans i18nKey="common:previous" />
        </button>
        {isLastQuestion ? (
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={
              isSubmitting || Object.keys(responses).length !== questions.length
            }
          >
            {isSubmitting ? (
              <Trans i18nKey="common:submitting" />
            ) : (
              <Trans i18nKey="common:submit" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!responses[currentQuestion.id]}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            <Trans i18nKey="common:next" />
          </button>
        )}
      </div>
      <div className="text-center text-sm text-gray-500">
        <Trans
          i18nKey="assessment:questionProgress"
          values={{
            current: currentQuestionIndex + 1,
            total: questions.length,
          }}
        />
      </div>
    </form>
  );
};
