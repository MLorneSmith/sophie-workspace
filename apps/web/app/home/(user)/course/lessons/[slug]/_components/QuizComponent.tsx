'use client';

import { useState } from 'react';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Label } from '@kit/ui/label';
import { Progress } from '@kit/ui/progress';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';

interface QuizComponentProps {
  quiz: any;
  onSubmit: (
    answers: Record<string, any>,
    score: number,
    passed: boolean,
  ) => void;
  previousAttempts: any[];
}

// Quiz Summary component
function QuizSummary({
  score,
  totalQuestions,
  passingScore,
  passed,
  onRetry,
}: {
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  onRetry: () => void;
}) {
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Quiz Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                {passed ? 'Congratulations! 🎉' : 'Quiz Result'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {passed
                  ? 'You have successfully passed this quiz!'
                  : 'You did not pass this quiz. Please try again.'}
              </p>
            </div>

            <div className="w-full max-w-md">
              <div className="mb-2 flex justify-between text-sm">
                <span>Score</span>
                <span>
                  {score} of {totalQuestions} ({percentage}%)
                </span>
              </div>
              <Progress
                value={percentage}
                className={`h-3 ${passed ? 'bg-green-600' : 'bg-red-600'}`}
              />
              <p className="text-muted-foreground mt-2 text-center text-sm">
                Passing score: {passingScore}%
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {!passed && (
            <Button onClick={onRetry} className="mr-2">
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export function QuizComponent({
  quiz,
  onSubmit,
  previousAttempts = [],
}: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  // Check if there are previous attempts
  const hasPreviousAttempts = previousAttempts.length > 0;
  const lastAttempt = hasPreviousAttempts ? previousAttempts[0] : null;

  // If there's a previous successful attempt, show the results
  if (hasPreviousAttempts && lastAttempt.passed) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/50">
          <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
            Quiz Passed! 🎉
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-400">
            You have successfully passed this quiz with a score of{' '}
            {lastAttempt.score}%.
          </p>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const passingScore = quiz.passingScore || 70;

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: optionIndex,
    });
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;

      questions.forEach((question: any, questionIndex: number) => {
        const selectedOptionIndex = answers[questionIndex];

        if (selectedOptionIndex !== undefined) {
          const options = question.options || [];
          const selectedOption = options[selectedOptionIndex];

          if (selectedOption && selectedOption.isCorrect) {
            correctAnswers++;
          }
        }
      });

      const calculatedScore = correctAnswers;
      const calculatedPercentage = Math.round(
        (correctAnswers / totalQuestions) * 100,
      );
      const hasPassed = calculatedPercentage >= passingScore;

      setScore(calculatedScore);
      setPassed(hasPassed);
      setShowSummary(true);

      // Call the onSubmit callback
      onSubmit(answers, calculatedPercentage, hasPassed);
    }
  };

  // Move to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Retry quiz
  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowSummary(false);
  };

  // If showing summary
  if (showSummary) {
    return (
      <QuizSummary
        score={score}
        totalQuestions={totalQuestions}
        passingScore={passingScore}
        passed={passed}
        onRetry={handleRetry}
      />
    );
  }

  // Show the current question
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between text-sm">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>
            {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <Progress
          value={((currentQuestionIndex + 1) / totalQuestions) * 100}
          className="h-2"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion?.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={
              answers[currentQuestionIndex] !== undefined
                ? answers[currentQuestionIndex].toString()
                : undefined
            }
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            {(currentQuestion?.options || []).map(
              (option: any, optionIndex: number) => (
                <div
                  key={optionIndex}
                  className="hover:bg-accent flex items-center space-x-2 rounded-md p-2"
                >
                  <RadioGroupItem
                    value={optionIndex.toString()}
                    id={`q${currentQuestionIndex}-o${optionIndex}`}
                  />
                  <Label htmlFor={`q${currentQuestionIndex}-o${optionIndex}`}>
                    {option.text}
                  </Label>
                </div>
              ),
            )}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={answers[currentQuestionIndex] === undefined}
          >
            {currentQuestionIndex === totalQuestions - 1
              ? 'Finish Quiz'
              : 'Next Question'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
