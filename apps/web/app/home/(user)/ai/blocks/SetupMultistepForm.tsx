'use client';

import React from 'react';

import { PageBody } from '@kit/ui/page';

import { SetupForm } from './_components/SetupForm';
import { SetupFormProvider } from './_components/SetupFormContext';
import { SetupFormErrorBoundary } from './_components/SetupFormErrorBoundary';
import { ErrorProvider } from './context/error/ErrorContext';

export default function SetupMultistepForm() {
  return (
    <PageBody>
      <ErrorProvider>
        <SetupFormErrorBoundary componentName="setup-multistep-form">
          <SetupFormProvider>
            <SetupForm />
          </SetupFormProvider>
        </SetupFormErrorBoundary>
      </ErrorProvider>
    </PageBody>
  );
}
