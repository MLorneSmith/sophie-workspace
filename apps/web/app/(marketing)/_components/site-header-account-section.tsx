'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
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

export function SiteHeaderAccountSection() {
  const session = useSession();
  const signOut = useSignOut();

  if (session.data) {
    return (
      <PersonalAccountDropdown
        showProfileName={false}
        paths={paths}
        features={features}
        user={session.data.user}
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
      <div className={'animate-in fade-in flex gap-x-2.5 duration-500'}>
        <div className={'hidden md:flex'}>
          <If condition={features.enableThemeToggle}>
            <ModeToggle />
          </If>
        </div>

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

      <BookDemoOverlay
        isOpen={isBookDemoOpen}
        onClose={() => setIsBookDemoOpen(false)}
      />
    </>
  );
}

function useSession() {
  const client = useSupabase();

  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await client.auth.getSession();

      return data.session;
    },
  });
}
