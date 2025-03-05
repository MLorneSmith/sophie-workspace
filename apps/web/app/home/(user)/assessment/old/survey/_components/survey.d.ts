import { ReactNode } from 'react';

declare module './SurveyPost' {
  export interface SurveyPostProps {
    survey: {
      title: string;
    };
    content: string;
  }

  export function SurveyPost(props: SurveyPostProps): JSX.Element;
}

declare module './SurveySummary' {
  export interface SurveySummaryProps {
    totalQuestions: number;
    onRetry: () => void;
    submitButton: ReactNode;
  }

  export function SurveySummary(props: SurveySummaryProps): JSX.Element;
}

declare module './SurveyQuestion' {
  export interface SurveyQuestionProps {
    survey: any; // Replace 'any' with the actual survey type
    currentQuestionIndex: number;
    updateResponse: (response: any, questionType: string) => void;
    onNextQuestion: () => void;
    onSurveyComplete: () => void;
    isLastQuestion: boolean;
  }

  export function SurveyQuestion(props: SurveyQuestionProps): JSX.Element;
}
