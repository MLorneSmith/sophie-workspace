'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  type PresentationPathType,
  type QuestionField,
  getPath,
} from '../_config/formContent';

export interface FormData {
  title: string;
  audience: string;
  presentation_type: string;
  question_type: string;
  situation: string;
  complication: string;
  answer: string;
}

interface FormContextType {
  formData: FormData;
  setFormData: (data: FormData) => void;
  currentQuestion: number;
  currentPath: string[];
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  validateField: (field: keyof FormData) => boolean;
}

const SetupFormContext = createContext<FormContextType | undefined>(undefined);

export function SetupFormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    audience: '',
    presentation_type: '',
    question_type: '',
    situation: '',
    complication: '',
    answer: '',
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentPath, setCurrentPath] = useState<string[]>([
    'presentation_type',
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update path when presentation type changes
  useEffect(() => {
    if (formData.presentation_type) {
      const type = formData.presentation_type as PresentationPathType;
      const newPath = getPath(type);
      setCurrentPath(newPath);
    }
  }, [formData.presentation_type]);

  const validateField = (field: keyof FormData): boolean => {
    const value = formData[field];
    let isValid = true;
    const newErrors = { ...errors };

    if (!value || value.trim() === '') {
      newErrors[field] = 'This field is required';
      isValid = false;
    } else {
      delete newErrors[field];
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    const currentField = currentPath[currentQuestion] as QuestionField;
    if (!currentField) return;

    // Move to next question if we're not at the end
    if (currentQuestion < currentPath.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only validate fields that are in the current path
    const type = formData.presentation_type as PresentationPathType;
    const pathToValidate = getPath(type);
    const validations = pathToValidate.map((field) =>
      validateField(field as keyof FormData),
    );

    if (validations.every((valid) => valid)) {
      console.log('Form submitted:', formData);
    }
  };

  return (
    <SetupFormContext.Provider
      value={{
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
      }}
    >
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
