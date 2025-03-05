'use client';

import React, { useState } from 'react';

import { toast } from 'sonner';

import { handleClientError } from '../../../../../utils/errorHandling';
import { submitSurveyAction } from '../../_actions/submitSurveyAction';
import { SurveyComponent } from './SurveyComponent';

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple_choice';
  options: string[];
  category: string;
}

interface SurveyComponentWrapperProps {
  questions: SurveyQuestion[];
}

export const SurveyComponentWrapper: React.FC<SurveyComponentWrapperProps> = ({
  questions,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSurveySubmit = async (responses: { [key: string]: string }) => {
    setIsSubmitting(true);
    try {
      const result = await submitSurveyAction('self-assessment', responses);
      if (result.success) {
        toast('Survey submitted successfully!', {
          style: { background: 'green', color: 'white' },
        });
        console.log('Survey submitted successfully:', result.responseId);
      }
    } catch (error) {
      handleClientError(error, 'Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SurveyComponent
      questions={questions}
      onSubmit={handleSurveySubmit}
      isSubmitting={isSubmitting}
    />
  );
};
