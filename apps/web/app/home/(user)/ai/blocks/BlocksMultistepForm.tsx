'use client';

import { type AIGatewayProviderConfig } from '@kit/ai-gateway';
import { PageBody } from '@kit/ui/page';

import { SetupForm } from './_components/BlocksForm';
import { SetupFormProvider } from './_components/BlocksFormContext';
import { SetupFormErrorBoundary } from './_components/BlocksFormErrorBoundary';
import { ErrorProvider } from './error/ErrorContext';

interface SetupMultistepFormProps {
  aiConfig: AIGatewayProviderConfig;
}

export default function SetupMultistepForm({
  aiConfig,
}: SetupMultistepFormProps) {
  return (
    <PageBody>
      <ErrorProvider>
        <SetupFormErrorBoundary componentName="setup-multistep-form">
          <SetupFormProvider>
            <SetupForm aiConfig={aiConfig} />
          </SetupFormProvider>
        </SetupFormErrorBoundary>
      </ErrorProvider>
    </PageBody>
  );
}
