'use client';

import { useEffect, useState } from 'react';

export interface DetermineHasQuizProps {
  lessonSlug: string;
}

export default function hasQuiz(lessonSlug: string): Promise<boolean> {
  return fetch(`/api/lessons/${lessonSlug}/has-quiz`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to check quiz status');
      }
      return response.json();
    })
    .then((data) => data.hasQuiz)
    .catch((error) => {
      console.error('Error checking quiz status:', error);
      return false;
    });
}
