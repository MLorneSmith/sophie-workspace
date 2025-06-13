'use client';

import { useMemo } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { UserCheck } from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { useLastAuthMethod } from '../hooks/use-last-auth-method';

interface ExistingAccountHintProps {
  signInPath?: string;
  className?: string;
}

// we force dynamic import to avoid hydration errors
export const ExistingAccountHint = dynamic(
  async () => ({ default: ExistingAccountHintImpl }),
  {
    ssr: false,
  },
);

export function ExistingAccountHintImpl({
  signInPath = '/auth/sign-in',
  className,
}: ExistingAccountHintProps) {
  const { hasLastMethod, methodType, providerName, isOAuth } =
    useLastAuthMethod();

  // Get the appropriate method description for the hint
  // This must be called before any conditional returns to follow Rules of Hooks
  const methodDescription = useMemo(() => {
    if (isOAuth && providerName) {
      return providerName;
    }

    switch (methodType) {
      case 'password':
        return 'email and password';
      case 'otp':
        return 'email verification';
      case 'magic_link':
        return 'email link';
      default:
        return 'another method';
    }
  }, [methodType, isOAuth, providerName]);

  // Don't show anything until loaded or if no last method
  if (!hasLastMethod) {
    return null;
  }

  return (
    <If condition={Boolean(methodDescription)}>
      <Alert
        data-test={'existing-account-hint'}
        variant="info"
        className={className}
      >
        <UserCheck className="h-4 w-4" />

        <AlertDescription>
          <Trans
            i18nKey="auth:existingAccountHint"
            values={{ method: methodDescription }}
            components={{
              method: <span className="font-medium" />,
              signInLink: (
                <Link
                  href={signInPath}
                  className="font-medium underline hover:no-underline"
                />
              ),
            }}
          />
        </AlertDescription>
      </Alert>
    </If>
  );
}
