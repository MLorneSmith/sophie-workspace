import { AppLogo } from '~/components/app-logo';

import { OnboardingForm } from './_components/onboarding-form';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

function OnboardingPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-16">
      <AppLogo />

      <div>
        <OnboardingForm />
      </div>
    </div>
  );
}

export default OnboardingPage;
