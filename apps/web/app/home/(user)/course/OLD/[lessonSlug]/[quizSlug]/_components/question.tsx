'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

/** Shadcn-ui components */
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardFooter } from '@kit/ui/card';

import { QuizContentItem } from '../../../../../types/courseTypes';

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

const ErrorToast = ({ message }: { message: string }) => (
  <div className="text-destructive">{message}</div>
);

interface QuizQuestionProps {
  post: QuizContentItem;
  currentQuestionIndex: number;
  updateScore: (
    isCorrect: boolean,
    questionType: 'single-answer' | 'multi-answer',
  ) => void;
  onNextQuestion: () => void;
  onQuizComplete: () => void;
}

export function QuizQuestion({
  post,
  currentQuestionIndex,
  updateScore,
  onNextQuestion,
  onQuizComplete,
}: QuizQuestionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const { questions } = post;

  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex],
    [questions, currentQuestionIndex],
  );

  const currentQuestionType = useMemo(() => {
    return currentQuestion?.questiontype || 'single-answer';
  }, [currentQuestion]);

  useEffect(() => {
    // Reset state when moving to a new question
    setSelectedAnswers([]);
    setAnswerSubmitted(false);
    console.log(
      'Question changed. Reset state for question:',
      currentQuestionIndex,
    );
  }, [currentQuestionIndex]);

  const handleAnswerChange = useCallback(
    (answer: string) => {
      if (answerSubmitted) return; // Prevent changing answer after submission
      setSelectedAnswers((prev) => {
        if (currentQuestionType === 'single-answer') {
          return [answer];
        } else {
          if (prev.includes(answer)) {
            return prev.filter((a) => a !== answer);
          } else {
            return [...prev, answer];
          }
        }
      });
      console.log('Selected answers updated:', selectedAnswers);
    },
    [currentQuestionType, answerSubmitted, selectedAnswers],
  );

  const handleSubmit = useCallback(() => {
    console.log('Answer submitted for question:', currentQuestionIndex);
    const correctAnswers = currentQuestion.answers
      .filter((a) => a.correct)
      .map((a) => a.answer);

    let correct: boolean;
    if (currentQuestionType === 'single-answer') {
      correct = selectedAnswers[0] === correctAnswers[0];
    } else {
      correct =
        selectedAnswers.length === correctAnswers.length &&
        selectedAnswers.every((answer) => correctAnswers.includes(answer));
    }

    setAnswerSubmitted(true);
    updateScore(correct, currentQuestionType);

    if (correct) {
      toast.success('Correct! Full points');
    } else {
      toast.error(<ErrorToast message="Incorrect. No points awarded." />);
    }

    console.log('Answer correctness:', correct);
  }, [
    currentQuestion,
    selectedAnswers,
    updateScore,
    currentQuestionType,
    currentQuestionIndex,
  ]);

  const handleNext = useCallback(() => {
    console.log('Next question button clicked');
    if (currentQuestionIndex < questions.length - 1) {
      onNextQuestion();
    } else {
      onQuizComplete();
    }
  }, [currentQuestionIndex, questions.length, onNextQuestion, onQuizComplete]);

  const isAnswered = selectedAnswers.length > 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  console.log('Render - Current state:', {
    currentQuestionIndex,
    answerSubmitted,
    isLastQuestion,
  });

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent>
            <div className="space-y-4">
              <h2 className="font-base mt-5 text-sm uppercase">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <h3 className="text-2xl font-medium">
                {currentQuestion.question}
              </h3>
              <h4 className="text-sm font-light">
                {currentQuestionType === 'multi-answer'
                  ? 'Choose ALL answers that apply.'
                  : 'Choose only ONE best answer.'}
              </h4>
              <div className="space-y-3">
                {currentQuestion.answers.map((answer, answerIndex) => (
                  <SelectableRow
                    key={answerIndex}
                    answer={answer.answer}
                    isSelected={selectedAnswers.includes(answer.answer)}
                    onClick={() => handleAnswerChange(answer.answer)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex flex-1 justify-center">
              {!answerSubmitted ? (
                <Button onClick={handleSubmit} disabled={!isAnswered}>
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="default"
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {isLastQuestion ? 'View Summary' : 'Next Question'}
                </Button>
              )}
            </div>
            <div className="flex-1"></div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
