'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import debounce from 'lodash/debounce';

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
import { generateGroqText } from '../../_utils/groq_generateText';
import { submitCanvasAction } from '../_actions/submitCanvasAction';
import { type FormData, useSetupForm } from './SetupFormContext';

type QuestionType = {
  field: keyof FormData;
  label: string;
  type: 'input' | 'textarea' | 'select';
  section: string;
  description: string;
};

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

const presentationTypes = [
  {
    id: 'strategy',
    label: 'What should we do?',
    description: 'A strategy deck, investment pitch, or internal plan',
  },
  {
    id: 'sales',
    label: 'You have a problem',
    description: 'A sales proposal or pitch',
  },
  {
    id: 'assessment',
    label: 'Should we do what we are thinking of doing?',
    description: 'An assessment of a plan',
  },
  {
    id: 'implementation',
    label: 'How do we implement the solution',
    description: 'An implementation plan',
  },
  {
    id: 'diagnostic',
    label: 'Do we have a problem?',
    description: 'A strategy assessment, A diagnostic',
  },
  {
    id: 'alternatives',
    label: 'Which alternative should we choose',
    description: 'An alternatives assessment',
  },
  {
    id: 'postmortem',
    label: "Why didn't it work?",
    description: 'A post mortem. An evaluation',
  },
];

function useSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const fetchSuggestions = useCallback(
    debounce(async (title: string, field: keyof FormData) => {
      setIsLoadingSuggestions(true);
      try {
        console.log('Fetching suggestions for:', field, 'with title:', title);
        let prompt = '';
        if (field === 'audience') {
          prompt = `Based on "${title}" provide 4 possible audiences for a presentation. Limit each suggestion to 4 words maximum`;
        } else {
          throw new Error('Invalid field for suggestions');
        }
        console.log('Generated prompt:', prompt);
        const result = await generateGroqText(prompt);
        console.log('Raw result from generateGroqText:', result);
        const cleanedSuggestions = cleanSuggestions(result);
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
    }, 300),
    [],
  );

  return { suggestions, isLoadingSuggestions, fetchSuggestions };
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
            ? 'bg-primary text-foreground'
            : 'bg-background hover:bg-muted'
        }`}
      >
        <div className="font-medium">{type.label}</div>
        <div
          className={`text-sm ${
            value === type.id ? 'text-foreground' : 'text-muted-foreground'
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

  const { suggestions, isLoadingSuggestions, fetchSuggestions } =
    useSuggestions();

  const router = useRouter();

  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  useEffect(() => {
    setErrors({});
  }, [formData, setErrors]);

  useEffect(() => {
    const currentQuestionData = questions[currentQuestion];
    if (currentQuestion === 1 && formData.title && currentQuestionData) {
      console.log(
        'Triggering fetchSuggestions for:',
        currentQuestionData.field,
      );
      fetchSuggestions(formData.title, currentQuestionData.field);
    }
  }, [currentQuestion, formData.title, fetchSuggestions]);

  const handleInputChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      setTouchedFields(new Set(touchedFields).add(field));
    };

  const handleSelectChange = (value: string) => {
    console.log('Selected presentation type:', value);
    setFormData({ ...formData, presentation_type: value });
    setTouchedFields(new Set(touchedFields).add('presentation_type'));
    const isValid = validateField('presentation_type');
    console.log('Is presentation type valid:', isValid);
    if (isValid) {
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
    const currentQuestionData = questions[currentQuestion];
    if (currentQuestionData) {
      const isValid = validateField(currentQuestionData.field);
      console.log(
        'Current field:',
        currentQuestionData.field,
        'Is valid:',
        isValid,
      );
      if (isValid) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        handleNext();
      }
    }
    setIsValidating(false);
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

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

  const currentQuestionData = questions[currentQuestion];
  const fallbackQuestionData = questions[0];

  return (
    <div className="container mx-auto p-4">
      <h2 className="mb-6 text-2xl font-bold">
        {currentQuestionData?.section || fallbackQuestionData?.section}
      </h2>
      <Progress
        value={((currentQuestion + 1) / questions.length) * 100}
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
            {currentQuestionData?.field &&
              currentQuestionData.field === 'audience' && (
                <SuggestionsList
                  suggestions={suggestions}
                  isLoading={isLoadingSuggestions}
                  onSelect={(suggestion: string) => {
                    if (currentQuestionData.field === 'audience') {
                      setFormData({
                        ...formData,
                        [currentQuestionData.field]: suggestion,
                      });
                      setTouchedFields(
                        new Set(touchedFields).add(currentQuestionData.field),
                      );
                      validateField(currentQuestionData.field);
                    }
                  }}
                />
              )}
            <div className="mt-4 flex justify-between">
              <Button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || isValidating || isSubmitting}
              >
                Previous
              </Button>
              {currentQuestion === questions.length - 1 ? (
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
