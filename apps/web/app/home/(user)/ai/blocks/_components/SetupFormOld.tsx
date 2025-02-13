'use client';

import { useCallback } from 'react';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Progress } from '@kit/ui/progress';
import { Spinner } from '@kit/ui/spinner';
import { Textarea } from '@kit/ui/textarea';

import { PresentationPathType, QuestionType } from '../_config/formContent';
import { PresentationTypeSelect } from './PresentationTypeSelect';
import { type SetupFormData, useSetupForm } from './SetupFormContextOld';

// Match the order in QUESTION_PATH from SetupFormContext
const questions: QuestionType[] = [
  {
    field: 'title',
    label: 'Enter your presentation title below',
    type: 'input',
    section: 'Setup our presentation narrative',
    description:
      'Great titles are short and descriptive. They can include the questions being answered, the main topic, or the audience we are presenting to.',
  },
  {
    field: 'audience',
    label: 'Who is your audience?',
    type: 'input',
    section: 'Setup our presentation narrative',
    description:
      'Describe your audience in detail. Consider their background, interests and expectations.',
  },
  {
    field: 'presentation_type',
    label: 'What type of presentation is this?',
    type: 'select',
    section: 'Categorize the type of problem our presentation answers',
    description:
      'Presentations answer a question in the mind of the audience. Most presentations answer one of the following questions. Which question fits best with your presentation?',
  },
  {
    field: 'situation',
    label: 'Describe the Situation or Context behind this presentation',
    type: 'textarea',
    section: 'Establish the foundation of our Introduction',
    description:
      "Describe the undesired state of today. Describe the problem. Describe the 'Opening Scene'",
  },
  {
    field: 'complication',
    label:
      'Describe the Complication that has created the need for this presentation',
    type: 'textarea',
    section: 'Establish the foundation of our Introduction',
    description: 'Describe what has changed to create the problem',
  },
  {
    field: 'answer',
    label: 'Describe your solution to the problem',
    type: 'textarea',
    section: 'Structure our Answer',
    description: 'Attempt to structure your answer',
  },
];

export function SetupForm() {
  const {
    formData,
    setFormData,
    currentQuestion,
    currentPath,
    handleNext,
    handlePrevious,
    handleSubmit,
    errors,
    formState,
  } = useSetupForm();

  // Ensure currentField is always a valid key of SetupFormData
  const currentField = currentPath[currentQuestion] as keyof SetupFormData;
  const currentQuestionData = questions.find((q) => q.field === currentField);

  // Guard against invalid state
  if (!currentQuestionData || !currentField) {
    return null;
  }

  const progress = ((currentQuestion + 1) / currentPath.length) * 100;
  const isLastQuestion = currentQuestion === currentPath.length - 1;

  const handleFieldChange = useCallback(
    (field: keyof SetupFormData, value: string) => {
      // Just update the form data, don't trigger any navigation
      setFormData({ [field]: value });
    },
    [setFormData],
  );

  const handlePresentationTypeChange = useCallback(
    (value: string) => {
      // Update form data without triggering navigation
      setFormData({ presentation_type: value as PresentationPathType });
    },
    [setFormData],
  );

  const handleButtonClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (formState.isSubmitting) return;

      if (isLastQuestion) {
        await handleSubmit();
      } else {
        await handleNext();
      }
    },
    [formState.isSubmitting, isLastQuestion, handleSubmit, handleNext],
  );

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto py-8">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{currentQuestionData.section}</CardTitle>
            <CardDescription>{currentQuestionData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <label
                  htmlFor={currentField}
                  className="block text-sm font-medium text-gray-700"
                >
                  {currentQuestionData.label}
                </label>
                {currentQuestionData.type === 'input' && (
                  <Input
                    id={currentField}
                    name={currentField}
                    value={formData[currentField] || ''}
                    onChange={(e) =>
                      handleFieldChange(currentField, e.target.value)
                    }
                    className={errors[currentField] ? 'border-red-500' : ''}
                    disabled={formState.isSubmitting}
                  />
                )}
                {currentQuestionData.type === 'select' && (
                  <PresentationTypeSelect
                    value={formData[currentField] || ''}
                    onChange={handlePresentationTypeChange}
                    disabled={formState.isSubmitting}
                    error={!!errors[currentField]}
                  />
                )}
                {currentQuestionData.type === 'textarea' && (
                  <Textarea
                    id={currentField}
                    name={currentField}
                    value={formData[currentField] || ''}
                    onChange={(e) =>
                      handleFieldChange(currentField, e.target.value)
                    }
                    className={errors[currentField] ? 'border-red-500' : ''}
                    disabled={formState.isSubmitting}
                    rows={6}
                  />
                )}
                {errors[currentField] && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors[currentField]}
                  </p>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0 || formState.isSubmitting}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleButtonClick}
                    disabled={formState.isSubmitting || formState.isValidating}
                  >
                    {formState.isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        {isLastQuestion ? 'Submitting...' : 'Validating...'}
                      </>
                    ) : formState.isValidating ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Validating...
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                </div>

                {formState.submitError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                      {formState.submitError}
                    </p>
                  </div>
                )}

                <div>
                  <Progress value={progress} className="h-2" />
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Question {currentQuestion + 1} of {currentPath.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
