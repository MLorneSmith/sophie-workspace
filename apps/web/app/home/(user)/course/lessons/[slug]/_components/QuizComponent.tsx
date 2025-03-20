'use client';

import { useState } from 'react';

import { PayloadContentRenderer } from '@kit/cms/payload';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Label } from '@kit/ui/label';
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

export function QuizComponent({
  quiz,
  onSubmit,
  previousAttempts = [],
}: QuizComponentProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  // Check if there are previous attempts
  const hasPreviousAttempts = previousAttempts.length > 0;
  const lastAttempt = hasPreviousAttempts ? previousAttempts[0] : null;

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    setAnswers({
      ...answers,
      [questionIndex]: optionIndex,
    });
  };

  // Calculate score and submit quiz
  const handleSubmit = () => {
    // Calculate score
    let correctAnswers = 0;
    const questions = quiz.questions || [];

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

    const calculatedScore = Math.round(
      (correctAnswers / questions.length) * 100,
    );
    const hasPassed = calculatedScore >= (quiz.passingScore || 70);

    setScore(calculatedScore);
    setPassed(hasPassed);
    setSubmitted(true);

    // Call the onSubmit callback
    onSubmit(answers, calculatedScore, hasPassed);
  };

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

        <h3 className="text-lg font-semibold">Quiz Questions</h3>
        {(quiz.questions || []).map((question: any, questionIndex: number) => (
          <Card key={questionIndex} className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup disabled>
                {(question.options || []).map(
                  (option: any, optionIndex: number) => {
                    const userAnswer = lastAttempt.answers?.[questionIndex];
                    const isSelected = userAnswer === optionIndex;
                    const isCorrect = option.isCorrect;

                    return (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={optionIndex.toString()}
                          id={`q${questionIndex}-o${optionIndex}`}
                          checked={isSelected}
                          className={
                            isSelected && isCorrect
                              ? 'border-green-500 text-green-500'
                              : isSelected && !isCorrect
                                ? 'border-red-500 text-red-500'
                                : ''
                          }
                        />
                        <Label
                          htmlFor={`q${questionIndex}-o${optionIndex}`}
                          className={
                            isCorrect
                              ? 'font-medium text-green-700 dark:text-green-400'
                              : isSelected && !isCorrect
                                ? 'text-red-700 dark:text-red-400'
                                : ''
                          }
                        >
                          {option.text}
                          {isCorrect && ' ✓'}
                        </Label>
                      </div>
                    );
                  },
                )}
              </RadioGroup>

              {question.explanation && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <h4 className="font-semibold">Explanation:</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <PayloadContentRenderer content={question.explanation} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If the quiz has been submitted but not passed, show the results
  if (submitted) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-lg border p-4 shadow-sm ${
            passed
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/50'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/50'
          }`}
        >
          <h2
            className={`text-xl font-bold ${
              passed
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300'
            }`}
          >
            {passed ? 'Quiz Passed! 🎉' : 'Quiz Failed'}
          </h2>
          <p
            className={`mt-2 ${
              passed
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            Your score: {score}% (Passing score: {quiz.passingScore || 70}%)
          </p>
        </div>

        <h3 className="text-lg font-semibold">Quiz Questions</h3>
        {(quiz.questions || []).map((question: any, questionIndex: number) => (
          <Card key={questionIndex} className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup disabled>
                {(question.options || []).map(
                  (option: any, optionIndex: number) => {
                    const isSelected = answers[questionIndex] === optionIndex;
                    const isCorrect = option.isCorrect;

                    return (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={optionIndex.toString()}
                          id={`q${questionIndex}-o${optionIndex}`}
                          checked={isSelected}
                          className={
                            isSelected && isCorrect
                              ? 'border-green-500 text-green-500'
                              : isSelected && !isCorrect
                                ? 'border-red-500 text-red-500'
                                : ''
                          }
                        />
                        <Label
                          htmlFor={`q${questionIndex}-o${optionIndex}`}
                          className={
                            isCorrect
                              ? 'font-medium text-green-700 dark:text-green-400'
                              : isSelected && !isCorrect
                                ? 'text-red-700 dark:text-red-400'
                                : ''
                          }
                        >
                          {option.text}
                          {isCorrect && ' ✓'}
                        </Label>
                      </div>
                    );
                  },
                )}
              </RadioGroup>

              {question.explanation && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <h4 className="font-semibold">Explanation:</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <PayloadContentRenderer content={question.explanation} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {!passed && (
          <CardFooter className="flex justify-end">
            <Button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Try Again
            </Button>
          </CardFooter>
        )}
      </div>
    );
  }

  // Show the quiz questions
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{quiz.title}</h3>
      <p className="text-muted-foreground">{quiz.description}</p>
      <p className="text-muted-foreground text-sm">
        Passing score: {quiz.passingScore || 70}%
      </p>

      {(quiz.questions || []).map((question: any, questionIndex: number) => (
        <Card key={questionIndex} className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={
                answers[questionIndex] !== undefined
                  ? answers[questionIndex].toString()
                  : undefined
              }
              onValueChange={(value) =>
                handleAnswerSelect(questionIndex, parseInt(value))
              }
            >
              {(question.options || []).map(
                (option: any, optionIndex: number) => (
                  <div
                    key={optionIndex}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={optionIndex.toString()}
                      id={`q${questionIndex}-o${optionIndex}`}
                    />
                    <Label htmlFor={`q${questionIndex}-o${optionIndex}`}>
                      {option.text}
                    </Label>
                  </div>
                ),
              )}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < (quiz.questions || []).length}
        >
          Submit Quiz
        </Button>
      </CardFooter>
    </div>
  );
}
