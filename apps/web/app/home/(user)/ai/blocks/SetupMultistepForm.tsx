'use client';

import { PageBody } from '@kit/ui/page';

import { ErrorProvider } from './/error/ErrorContext';
import { SetupFormProvider } from './_components/SetupFormContextOld';
import { SetupFormErrorBoundary } from './_components/SetupFormErrorBoundary';
import { SetupForm } from './_components/SetupFormOld';

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
