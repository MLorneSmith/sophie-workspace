'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import debounce from 'lodash/debounce';

import { getAIProvider } from '@kit/ai-gateway';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Spinner } from '@kit/ui/spinner';
import { Textarea } from '@kit/ui/textarea';

import { Progress } from '../../../../../../../../packages/ui/src/shadcn/progress';
import { submitCanvasAction } from '../_actions/submitCanvasAction';
import {
  type QuestionField,
  type QuestionType,
  getQuestion,
  presentationTypes,
} from '../_config/formContent';
import { type FormData, useSetupForm } from './SetupFormContext';

function useSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const fetchSuggestions = useCallback(
    debounce(
      async (
        field: keyof FormData,
        presentationType?: string,
        title?: string,
      ) => {
        setIsLoadingSuggestions(true);
        try {
          console.log('Fetching suggestions for:', field);
          const ai = getAIProvider('universal');
          let prompt = '';

          if (field === 'title' && presentationType) {
            switch (presentationType) {
              case 'general':
                prompt =
                  'Generate 4 clear and informative titles for an internal business presentation. Each title should be 5-8 words maximum.';
                break;
              case 'sales':
                prompt =
                  'Generate 4 compelling sales presentation titles that focus on value proposition. Each title should be 5-8 words maximum.';
                break;
              case 'consulting':
                prompt =
                  'Generate 4 professional consulting presentation titles focusing on analysis and recommendations. Each title should be 5-8 words maximum.';
                break;
              case 'fundraising':
                prompt =
                  'Generate 4 impactful fundraising presentation titles emphasizing growth potential. Each title should be 5-8 words maximum.';
                break;
              default:
                prompt =
                  'Generate 4 professional presentation titles. Each title should be 5-8 words maximum.';
            }
          } else if (field === 'audience' && title) {
            prompt = `Based on "${title}" provide 4 possible audiences for a presentation. Limit each suggestion to 4 words maximum`;
          } else {
            throw new Error(
              'Invalid field or missing required parameters for suggestions',
            );
          }

          console.log('Generated prompt:', prompt);
          const response = await ai.complete({
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            model: 'mixtral-8x7b',
            provider: 'groq',
            temperature: 0.7,
            stream: false,
          });

          console.log('Raw result from AI Gateway:', response.content);
          const cleanedSuggestions = cleanSuggestions(response.content);
          console.log('Cleaned suggestions:', cleanedSuggestions);
          setSuggestions(cleanedSuggestions);
        } catch (error) {
          console.error('Error in fetchSuggestions:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
          } else {
            console.error('Unexpected error type:', typeof error);
          }
          setSuggestions(['Error fetching suggestions']);
        } finally {
          setIsLoadingSuggestions(false);
        }
      },
      300,
    ),
    [],
  );

  return {
    suggestions,
    isLoadingSuggestions,
    fetchSuggestions,
    setSuggestions,
  };
}

const SuggestionsList = ({
  suggestions,
  isLoading,
  onSelect,
}: {
  suggestions: string[];
  isLoading: boolean;
  onSelect: (suggestion: string) => void;
}) => (
  <div className="mt-4">
    <h3 className="mb-2 text-sm font-medium">Suggestions:</h3>
    <div className="flex flex-wrap gap-2">
      {isLoading ? (
        <Spinner className="h-5 w-5" />
      ) : (
        suggestions.map((suggestion, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        ))
      )}
    </div>
  </div>
);

const PresentationTypeQuestion = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => (
  <div className="space-y-2">
    {presentationTypes.map((type) => (
      <button
        key={type.id}
        type="button"
        onClick={() => onChange(type.id)}
        className={`focus:ring-primary w-full rounded-lg p-4 text-left transition-colors duration-200 ease-in-out focus:ring-2 focus:outline-none ${
          value === type.id
            ? 'bg-primary text-white'
            : 'bg-background hover:bg-muted'
        }`}
      >
        <div className="font-medium">{type.label}</div>
        <div
          className={`text-sm ${
            value === type.id ? 'text-white' : 'text-muted-foreground'
          }`}
        >
          {type.description}
        </div>
      </button>
    ))}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

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
    setErrors,
    validateField,
  } = useSetupForm();

  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormData>>(
    new Set(),
  );

  const {
    suggestions,
    isLoadingSuggestions,
    fetchSuggestions,
    setSuggestions,
  } = useSuggestions();

  const router = useRouter();

  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  useEffect(() => {
    setErrors({});
  }, [formData, setErrors]);

  useEffect(() => {
    const currentField = currentPath[currentQuestion];
    if (!currentField) return;

    // Clear suggestions when field changes
    setSuggestions([]);

    const fetchSuggestionsForField = async () => {
      if (currentField === 'title') {
        if (formData.presentation_type) {
          console.log(
            'Triggering title suggestions for presentation type:',
            formData.presentation_type,
          );
          await fetchSuggestions('title', formData.presentation_type);
        }
      } else if (currentField === 'audience') {
        if (formData.title) {
          console.log(
            'Triggering audience suggestions for title:',
            formData.title,
          );
          await fetchSuggestions('audience', undefined, formData.title);
        }
      }
    };

    // Small delay to let the UI update before fetching suggestions
    const timer = setTimeout(fetchSuggestionsForField, 100);
    return () => clearTimeout(timer);
  }, [
    currentQuestion,
    formData.title,
    formData.presentation_type,
    fetchSuggestions,
    currentPath,
    setSuggestions,
  ]);

  const handleInputChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData({ ...formData, [field]: value });
      setTouchedFields(new Set(touchedFields).add(field));

      // Trigger suggestions when input changes
      if (
        field === 'title' &&
        currentField === 'title' &&
        formData.presentation_type
      ) {
        fetchSuggestions('title', formData.presentation_type);
      } else if (field === 'title' && currentField === 'audience') {
        // When title changes and we're on the audience field, update audience suggestions
        fetchSuggestions('audience', undefined, value);
      }
    };

  const handleSelectChange = async (value: string) => {
    console.log('Selected presentation type:', value);
    setFormData({ ...formData, presentation_type: value });
    setTouchedFields(new Set(touchedFields).add('presentation_type'));

    const isValid = validateField('presentation_type');
    console.log('Is presentation type valid:', isValid);

    if (isValid) {
      // Small delay to allow path update effect to run
      await new Promise((resolve) => setTimeout(resolve, 100));
      handleNext();
    }
  };

  const handleBlur = (field: keyof FormData) => () => {
    setTouchedFields(new Set(touchedFields).add(field));
    validateField(field);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await handleSubmit(e);
      // First submit to canvas_submissions table
      const {
        title,
        audience,
        presentation_type,
        situation,
        complication,
        answer,
      } = formData;
      await submitCanvasAction({
        title,
        audience,
        presentation_type,
        situation,
        complication,
        answer,
      });
      // Then navigate to canvas page
      const encodedFormData = encodeURIComponent(JSON.stringify(formData));
      router.push(`/home/ai/canvas?formData=${encodedFormData}`);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextClick = async () => {
    setIsValidating(true);
    try {
      const currentField = currentPath[currentQuestion];
      if (currentField) {
        console.log('Validating field:', currentField);

        const isValid = validateField(currentField);
        console.log('Field validation result:', currentField, isValid);

        if (isValid) {
          // Add field to touched fields to ensure error state is shown
          setTouchedFields(new Set(touchedFields).add(currentField));

          // Small delay for UX
          await new Promise((resolve) => setTimeout(resolve, 300));

          console.log('Moving to next question');
          handleNext();
          setErrors({}); // Clear errors after successful navigation
        } else {
          console.log('Validation failed, showing error');
          // Ensure the field is marked as touched to show the error
          setTouchedFields(new Set(touchedFields).add(currentField));
        }
      } else {
        console.error('No current field found for index:', currentQuestion);
      }
    } catch (error) {
      console.error('Error in handleNextClick:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const renderQuestion = () => {
    const currentField = currentPath[currentQuestion];
    if (!currentField) return null;

    const question = getQuestion(currentField as QuestionField);
    const field = question.field;

    const commonProps = {
      id: field,
      value: formData[field],
      onChange: handleInputChange(field),
      onBlur: handleBlur(field),
      className: `${
        touchedFields.has(field) && errors[field] ? 'border-red-500' : ''
      } ${question.type === 'textarea' ? 'min-h-[100px] resize-none overflow-y-auto' : ''}`,
    };

    switch (question.type) {
      case 'input':
        return (
          <>
            <Input
              {...commonProps}
              placeholder={`Enter the ${question.label.toLowerCase()}`}
            />
            {touchedFields.has(field) && errors[field] && (
              <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
            )}
          </>
        );
      case 'textarea':
        return (
          <>
            <Textarea
              {...commonProps}
              placeholder={`Describe the ${question.label.toLowerCase()}`}
            />
            {touchedFields.has(field) && errors[field] && (
              <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
            )}
          </>
        );
      case 'select':
        return (
          <PresentationTypeQuestion
            value={formData.presentation_type}
            onChange={handleSelectChange}
            error={touchedFields.has(field) ? errors[field] : undefined}
          />
        );
      default:
        return null;
    }
  };

  const currentField = currentPath[currentQuestion];
  const currentQuestionData = currentField
    ? getQuestion(currentField as QuestionField)
    : null;
  const fallbackQuestionData = getQuestion(currentPath[0] as QuestionField);

  return (
    <div className="container mx-auto p-4">
      <h2 className="mb-6 text-2xl font-bold">
        {currentQuestionData?.section || fallbackQuestionData?.section}
      </h2>
      <Progress
        value={((currentQuestion + 1) / currentPath.length) * 100}
        className="mb-6"
      />
      <Card>
        <CardHeader>
          <CardTitle>
            {currentQuestionData?.label || fallbackQuestionData?.label}
          </CardTitle>
          <CardDescription>
            {currentQuestionData?.description ||
              fallbackQuestionData?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-8">
            {renderQuestion()}
            {(currentField === 'audience' || currentField === 'title') && (
              <SuggestionsList
                suggestions={suggestions}
                isLoading={isLoadingSuggestions}
                onSelect={(suggestion: string) => {
                  if (currentField === 'title') {
                    setFormData({
                      ...formData,
                      title: suggestion,
                    });
                    setTouchedFields(new Set(touchedFields).add('title'));
                    validateField('title');
                  } else if (currentField === 'audience') {
                    setFormData({
                      ...formData,
                      audience: suggestion,
                    });
                    setTouchedFields(new Set(touchedFields).add('audience'));
                    validateField('audience');
                  }
                }}
              />
            )}
            <div className="mt-4 flex justify-end space-x-4">
              {currentQuestion > 0 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isValidating || isSubmitting}
                >
                  Previous
                </Button>
              )}
              {currentQuestion === currentPath.length - 1 ? (
                <Button type="submit" disabled={isValidating || isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isValidating || isSubmitting}
                >
                  {isValidating ? 'Validating...' : 'Next'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const cleanSuggestions = (rawSuggestions: string): string[] => {
  console.log('Cleaning suggestions. Raw input:', rawSuggestions);
  const lines = rawSuggestions.split('\n');
  const startIndex = lines.findIndex((line) => /^\d+\./.test(line.trim()));
  if (startIndex === -1) {
    console.log('No numbered suggestions found');
    return [];
  }

  const cleaned = lines
    .slice(startIndex)
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  console.log('Cleaned suggestions:', cleaned);
  return cleaned;
};
