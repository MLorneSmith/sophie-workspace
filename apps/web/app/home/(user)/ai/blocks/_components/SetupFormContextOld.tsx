'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { handleNavigation, validateField } from '../_actions/navigationAction';
import { submitForm } from '../_actions/submitAction';
import { type SubmitFormData } from '../_actions/submitCanvasAction';
import {
  type PresentationPathType,
  type QuestionField,
  presentationTypes,
} from '../_config/formContent';
import { useError } from '../error/ErrorContext';
import {
  ValidationError,
  isAuthError,
  isConnectionError,
} from '../lib/error-utils';

export interface SetupFormData {
  title: string;
  audience: string;
  presentation_type: PresentationPathType | '';
  question_type: string;
  situation: string;
  complication: string;
  answer: string;
}

interface FormState {
  isSubmitting: boolean;
  isValidating: boolean;
  submitError: string | null;
  retryCount: number;
}

interface FormContextType {
  formData: SetupFormData;
  setFormData: (data: Partial<SetupFormData>) => void;
  currentQuestion: number;
  currentPath: Array<keyof SetupFormData>;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  handleSubmit: () => Promise<void>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  validateField: (field: keyof SetupFormData) => Promise<boolean>;
  formState: FormState;
  resetError: () => void;
}

// Fixed path of questions in order
const QUESTION_PATH: Array<keyof SetupFormData> = [
  'title',
  'audience',
  'presentation_type',
  'situation',
  'complication',
  'answer',
];

const SetupFormContext = createContext<FormContextType | undefined>(undefined);

function isPresentationPathType(value: string): value is PresentationPathType {
  return presentationTypes
    .map((type) => type.id)
    .includes(value as PresentationPathType);
}

export function SetupFormProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { coordinator } = useError();
  const isSubmitting = useRef(false);
  const isNavigating = useRef(false);

  const [formData, setFormData] = useState<SetupFormData>({
    title: '',
    audience: '',
    presentation_type: '',
    question_type: '',
    situation: '',
    complication: '',
    answer: '',
  });

  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isValidating: false,
    submitError: null,
    retryCount: 0,
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shouldValidate, setShouldValidate] = useState(false);

  // Simple form data update without any side effects
  const handleFormDataUpdate = useCallback(
    (updates: Partial<SetupFormData>) => {
      // Only update form data, no validation or navigation
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const validateCurrentField = useCallback(
    async (field: keyof SetupFormData): Promise<boolean> => {
      // Only validate if explicitly requested
      if (!shouldValidate) return true;

      try {
        const value = formData[field];
        if (!value || value.trim() === '') {
          return false;
        }

        if (field === 'presentation_type') {
          return isPresentationPathType(value);
        }

        return await validateField(field, value);
      } catch (error) {
        return false;
      }
    },
    [formData, shouldValidate],
  );

  const handleNext = useCallback(async () => {
    // Prevent multiple navigation attempts
    if (isNavigating.current) return;
    isNavigating.current = true;

    try {
      // Guard against out of bounds
      if (currentQuestion >= QUESTION_PATH.length) {
        isNavigating.current = false;
        return;
      }

      const currentField = QUESTION_PATH[currentQuestion];
      if (!currentField) {
        isNavigating.current = false;
        return;
      }

      // Don't proceed if we're already submitting
      if (formState.isSubmitting) {
        isNavigating.current = false;
        return;
      }

      // Enable validation only during navigation
      setShouldValidate(true);
      setFormState((prev) => ({ ...prev, isValidating: true }));

      // Validate the current field
      const isValid = await validateCurrentField(currentField);
      if (!isValid) {
        const newErrors: Record<string, string> = {};
        newErrors[currentField] =
          `Please complete this field before continuing`;
        setErrors(newErrors);
        setFormState((prev) => ({ ...prev, isValidating: false }));
        isNavigating.current = false;
        return;
      }

      // Clear any existing errors
      setErrors({});
      setShouldValidate(false);
      setFormState((prev) => ({ ...prev, isValidating: false }));

      try {
        // Use server action for navigation
        const nextQuestion = await handleNavigation({
          type: 'NEXT',
          currentQuestion,
          maxQuestions: QUESTION_PATH.length,
        });

        setCurrentQuestion(nextQuestion);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } finally {
      isNavigating.current = false;
    }
  }, [currentQuestion, validateCurrentField, formState.isSubmitting]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setErrors({});
      setShouldValidate(false);
      setFormState((prev) => ({ ...prev, isValidating: false }));
    }
  }, [currentQuestion]);

  const resetError = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      submitError: null,
      retryCount: 0,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Guard against out of bounds
    if (currentQuestion >= QUESTION_PATH.length) return;

    const currentField = QUESTION_PATH[currentQuestion];
    if (!currentField) return;

    // Prevent double submission using ref
    if (isSubmitting.current || formState.isSubmitting) return;
    isSubmitting.current = true;

    try {
      // Reset any previous errors
      resetError();

      // Set submitting state
      setFormState((prev) => ({ ...prev, isSubmitting: true }));

      // Enable validation
      setShouldValidate(true);

      // Validate current field first
      const isValid = await validateCurrentField(currentField);
      if (!isValid) {
        const newErrors: Record<string, string> = {};
        newErrors[currentField] =
          `Please complete this field before submitting`;
        setErrors(newErrors);
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
        isSubmitting.current = false; // Reset submission lock
        return;
      }

      // Submit using server action
      const result = await submitForm({
        title: formData.title,
        audience: formData.audience,
        presentation_type: formData.presentation_type,
        situation: formData.situation,
        complication: formData.complication,
        answer: formData.answer,
      });

      if (result.success) {
        // Ensure we're not submitting anymore before navigation
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
        // Use Next.js 15 navigation
        router.push(`/home/ai/canvas-next/${result.submissionId}`);
      }
    } catch (error) {
      const err = error as Error;

      if (isAuthError(err)) {
        setFormState((prev) => ({
          ...prev,
          submitError:
            'Your session has expired. Please refresh and try again.',
        }));
      } else {
        setFormState((prev) => ({
          ...prev,
          submitError: err.message || 'An unexpected error occurred',
        }));
      }

      // Log error to error coordinator
      coordinator.handleError(err, 'setup-form-submission');
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
      isSubmitting.current = false; // Reset submission lock
    }
  }, [
    validateCurrentField,
    router,
    coordinator,
    resetError,
    currentQuestion,
    formData,
    formState.isSubmitting,
  ]);

  const value = {
    formData,
    setFormData: handleFormDataUpdate,
    currentQuestion,
    currentPath: QUESTION_PATH,
    handleNext,
    handlePrevious,
    handleSubmit,
    errors,
    setErrors,
    validateField: validateCurrentField,
    formState,
    resetError,
  };

  return (
    <SetupFormContext.Provider value={value}>
      {children}
    </SetupFormContext.Provider>
  );
}

export function useSetupForm() {
  const context = useContext(SetupFormContext);
  if (context === undefined) {
    throw new Error('useSetupForm must be used within a SetupFormProvider');
  }
  return context;
}
