'use client';

// @ts-ignore - Disable TypeScript errors for this file
import { useState } from 'react';

import { ChevronRight } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Checkbox } from '@kit/ui/checkbox';
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
  courseId: string;
  currentLessonId: string;
  currentLessonNumber: number;
}

// Quiz Summary component
function QuizSummary({
  score,
  totalQuestions,
  passingScore,
  passed,
  onRetry,
  onNextLesson,
}: {
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  onRetry: () => void;
  onNextLesson: () => void;
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
          {passed ? (
            <Button onClick={onNextLesson} className="mr-2">
              Next Lesson
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
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
  courseId,
  currentLessonId,
  currentLessonNumber,
}: QuizComponentProps) {
  // Define state for the quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number[]>
  >({});
  const [showSummary, setShowSummary] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  // Validate quiz data
  if (!quiz || !quiz.id) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-900/50">
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300">
            Quiz Unavailable
          </h2>
          <p className="mt-2 text-amber-700 dark:text-amber-400">
            The quiz for this lesson is currently unavailable. Please try again
            later or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  // Check if there are previous attempts
  const hasPreviousAttempts = previousAttempts.length > 0;
  const lastAttempt = hasPreviousAttempts ? previousAttempts[0] : null;

  // If there's a previous successful attempt, show the results
  if (hasPreviousAttempts && lastAttempt?.passed) {
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

  // Check if questions are available
  if (!questions.length) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-900/50">
          <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300">
            Quiz Questions Unavailable
          </h2>
          <p className="mt-2 text-amber-700 dark:text-amber-400">
            The questions for this quiz are currently unavailable. Please try
            again later or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const passingScore = quiz.passingScore || 70;

  // Helper function to determine if a question allows multiple answers
  const isMultiAnswerQuestion = (question: any): boolean => {
    // Check if the question type is multi-answer
    if (question?.questiontype === 'multi-answer') {
      return true;
    }

    // Count correct options
    const correctOptions = (question?.options || []).filter(
      (option: any) => option.isCorrect,
    );

    // If more than one correct option, treat as multi-answer
    return correctOptions.length > 1;
  };

  // Handle answer selection for single-answer questions
  const handleSingleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: [optionIndex],
    });
  };

  // Handle answer selection for multi-answer questions
  const handleMultiAnswerSelect = (optionIndex: number, isChecked: boolean) => {
    const currentAnswers = selectedAnswers[currentQuestionIndex] || [];

    let newAnswers;
    if (isChecked) {
      // Add the option if it's checked and not already in the array
      newAnswers = [...currentAnswers, optionIndex];
    } else {
      // Remove the option if it's unchecked
      newAnswers = currentAnswers.filter((index) => index !== optionIndex);
    }

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: newAnswers,
    });
  };

  // Check if an option is selected for multi-answer questions
  const isOptionSelected = (optionIndex: number): boolean => {
    const currentAnswers = selectedAnswers[currentQuestionIndex] || [];
    return currentAnswers.includes(optionIndex);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;

      questions.forEach((question: any, questionIndex: number) => {
        const selectedOptionIndices = selectedAnswers[questionIndex] || [];

        if (selectedOptionIndices.length > 0) {
          const options = question?.options || [];

          if (isMultiAnswerQuestion(question)) {
            // For multi-answer questions, check if all correct options are selected
            // and no incorrect options are selected
            let allCorrectSelected = true;
            let noIncorrectSelected = true;

            // Check each option
            for (let optIndex = 0; optIndex < options.length; optIndex++) {
              const option = options[optIndex];
              if (!option) continue; // Skip undefined options

              // Check if this is a correct option that wasn't selected
              if (
                option.isCorrect === true &&
                !selectedOptionIndices.includes(optIndex)
              ) {
                allCorrectSelected = false;
              }

              // Check if this is an incorrect option that was selected
              if (
                option.isCorrect === false &&
                selectedOptionIndices.includes(optIndex)
              ) {
                noIncorrectSelected = false;
              }
            }

            if (allCorrectSelected && noIncorrectSelected) {
              correctAnswers++;
            }
          } else {
            // For single-answer questions, check if the selected option is correct
            const selectedIndex = selectedOptionIndices[0];
            // Add guard clause to check if selectedIndex is defined
            if (selectedIndex !== undefined) {
              const selectedOption = options[selectedIndex];
              if (selectedOption && selectedOption.isCorrect === true) {
                correctAnswers++;
              }
            }
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
      onSubmit(selectedAnswers, calculatedPercentage, hasPassed);
    }
  };

  // Move to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Move to the previous question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Retry quiz
  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowSummary(false);
  };

  // Function to find and navigate to the next lesson
  const navigateToNextLesson = async () => {
    try {
      // Import the getCourseLessons function
      const { getCourseLessons } = await import('@kit/cms/payload');

      // Fetch all lessons for this course
      const lessonsData = await getCourseLessons(courseId);

      if (lessonsData?.docs && lessonsData.docs.length > 0) {
        try {
          // Sort lessons by lesson_number with proper type casting
          const sortedLessons = [...lessonsData.docs].sort((a: any, b: any) => {
            const lessonA = a;
            const lessonB = b;
            if (lessonA?.lesson_number && lessonB?.lesson_number) {
              return lessonA.lesson_number - lessonB.lesson_number;
            }
            return 0;
          });

          // Find the index of the current lesson
          const currentIndex = sortedLessons.findIndex(
            (lesson: any) => lesson && lesson.id === currentLessonId,
          );

          // If we found the current lesson and it's not the last one
          if (currentIndex !== -1 && currentIndex < sortedLessons.length - 1) {
            // Get the next lesson
            const nextLesson = sortedLessons[currentIndex + 1];

            // Safe type checking for slug property
            const slug =
              nextLesson &&
              typeof nextLesson === 'object' &&
              'slug' in nextLesson &&
              nextLesson.slug
                ? String(nextLesson.slug)
                : null;

            if (slug) {
              window.location.href = `/home/course/lessons/${slug}`;
              return;
            }
          }
        } catch (err) {
          console.error('Error navigating to next lesson:', err);
        }
      }

      // If we couldn't find the next lesson or there was an error, go back to the course page
      window.location.href = '/home/course';
    } catch (error) {
      // Fallback to course page
      window.location.href = '/home/course';
    }
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
        onNextLesson={navigateToNextLesson}
      />
    );
  }

  // Check if answers exist for the current question
  const hasCurrentAnswers =
    selectedAnswers &&
    Object.prototype.hasOwnProperty.call(
      selectedAnswers,
      currentQuestionIndex,
    ) &&
    selectedAnswers[currentQuestionIndex] &&
    selectedAnswers[currentQuestionIndex].length > 0;

  // Show the current question
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between text-sm">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>
            {Math.round((currentQuestionIndex / totalQuestions) * 100)}%
          </span>
        </div>
        <Progress
          value={(currentQuestionIndex / totalQuestions) * 100}
          className="h-2"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="mb-2 text-xl leading-7 font-semibold">
            {currentQuestion?.question}
          </CardTitle>
          {isMultiAnswerQuestion(currentQuestion) && (
            <div className="text-muted-foreground text-sm">
              Select all that apply
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isMultiAnswerQuestion(currentQuestion) ? (
            // Render checkboxes for multi-answer questions
            <div className="space-y-4">
              {(currentQuestion?.options || []).map(
                (option: any, optionIndex: number) => {
                  return (
                    <div
                      key={optionIndex}
                      className="hover:bg-accent flex cursor-pointer items-start rounded-md p-3 transition-colors"
                      onClick={() =>
                        handleMultiAnswerSelect(
                          optionIndex,
                          !isOptionSelected(optionIndex),
                        )
                      }
                    >
                      <div className="flex w-full items-center space-x-3">
                        <Checkbox
                          id={`q${currentQuestionIndex}-o${optionIndex}`}
                          checked={isOptionSelected(optionIndex)}
                          onCheckedChange={(checked) =>
                            handleMultiAnswerSelect(
                              optionIndex,
                              checked === true,
                            )
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`q${currentQuestionIndex}-o${optionIndex}`}
                          className="flex-1 cursor-pointer leading-6"
                          onClick={(e) => {
                            // Prevent the default behavior to avoid conflicts with the parent onClick
                            e.preventDefault();
                            handleMultiAnswerSelect(
                              optionIndex,
                              !isOptionSelected(optionIndex),
                            );
                          }}
                        >
                          {option.text}
                        </Label>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            // Render radio buttons for single-answer questions
            <RadioGroup
              key={`question-${currentQuestionIndex}`}
              value={
                selectedAnswers[currentQuestionIndex]?.length > 0
                  ? String(selectedAnswers[currentQuestionIndex][0])
                  : undefined
              }
              onValueChange={(value) =>
                handleSingleAnswerSelect(parseInt(value))
              }
              className="space-y-4"
            >
              {(currentQuestion?.options || []).map(
                (option: any, optionIndex: number) => {
                  return (
                    <div
                      key={optionIndex}
                      className="hover:bg-accent flex cursor-pointer items-start space-x-3 rounded-md p-3"
                      onClick={() => handleSingleAnswerSelect(optionIndex)}
                    >
                      <RadioGroupItem
                        value={optionIndex.toString()}
                        id={`q${currentQuestionIndex}-o${optionIndex}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`q${currentQuestionIndex}-o${optionIndex}`}
                        className="flex-1 cursor-pointer leading-6"
                      >
                        {option.text}
                      </Label>
                    </div>
                  );
                },
              )}
            </RadioGroup>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button onClick={handleNextQuestion} disabled={!hasCurrentAnswers}>
            {currentQuestionIndex === totalQuestions - 1
              ? 'Finish Quiz'
              : 'Next Question'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
