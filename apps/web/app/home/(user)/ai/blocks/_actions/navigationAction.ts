'use server';

import { presentationTypes } from '../_config/formContent';

export type NavigationAction = {
  type: 'NEXT' | 'PREVIOUS';
  currentQuestion: number;
  maxQuestions: number;
};

export async function handleNavigation(action: NavigationAction): Promise<number> {
  switch (action.type) {
    case 'NEXT':
      return action.currentQuestion < action.maxQuestions - 1 
        ? action.currentQuestion + 1 
        : action.currentQuestion;
    case 'PREVIOUS':
      return action.currentQuestion > 0 
        ? action.currentQuestion - 1 
        : action.currentQuestion;
    default:
      return action.currentQuestion;
  }
}

export async function validateField(field: string, value: string): Promise<boolean> {
  // Don't validate empty values here - that's handled by the form
  if (!value || value.trim() === '') {
    return false;
  }

  switch (field) {
    case 'title':
      return value.length >= 3;
    case 'audience':
      return value.length >= 5;
    case 'presentation_type':
      return presentationTypes.some(type => type.id === value);
    case 'situation':
    case 'complication':
    case 'answer':
      return value.length >= 10;
    default:
      return false; // Default to false for unknown fields
  }
}
