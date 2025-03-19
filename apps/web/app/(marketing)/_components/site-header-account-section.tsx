'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import type { User } from '@supabase/supabase-js';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

import { BookDemoOverlay } from './book-demo-overlay';

const ModeToggle = dynamic(() =>
  import('@kit/ui/mode-toggle').then((mod) => ({
    default: mod.ModeToggle,
  })),
);

const paths = {
  home: pathsConfig.app.home,
};

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

export function SiteHeaderAccountSection({
  user,
}: React.PropsWithChildren<{
  user: User | null;
}>) {
  if (!user) {
    return <AuthButtons />;
  }

  return <SuspendedPersonalAccountDropdown user={user} />;
}

function SuspendedPersonalAccountDropdown(props: { user: User | null }) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data ?? props.user ?? null;

  if (userData) {
    return (
      <PersonalAccountDropdown
        showProfileName={false}
        paths={paths}
        features={features}
        user={userData}
        signOutRequested={() => signOut.mutateAsync()}
      />
    );
  }

  return <AuthButtons />;
}

function AuthButtons() {
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);

  return (
    <>
      <div className={'flex space-x-2'}>
        <div className={'hidden space-x-2 md:flex'}>
          <If condition={features.enableThemeToggle}>
            <ModeToggle />
          </If>

          <Button
            variant={'outline'}
            className="font-medium"
            onClick={() => setIsBookDemoOpen(true)}
          >
            <Trans i18nKey={'common:bookDemo'} defaults="Book a demo" />
          </Button>

          <Button asChild variant={'default'}>
            <Link href={pathsConfig.auth.signIn}>
              <Trans i18nKey={'auth:signIn'} />
            </Link>
          </Button>
        </div>
      </div>

      <BookDemoOverlay
        isOpen={isBookDemoOpen}
        onClose={() => setIsBookDemoOpen(false)}
      />
    </>
  );
}
