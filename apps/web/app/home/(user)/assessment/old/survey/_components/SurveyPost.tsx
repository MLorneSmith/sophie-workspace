import React from 'react';

export interface SurveyPostProps {
  survey: {
    title: string;
  };
  content: string;
}

export function SurveyPost({ survey, content }: SurveyPostProps) {
  return (
    <div className="prose max-w-none">
      <h1>{survey.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
