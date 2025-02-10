'use client';

import React from 'react';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { AppLogo } from '~/components/app-logo';
import pathsConfig from '~/config/paths.config';

export function FooterLogoSection() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-6">
        <AppLogo />
        <Button asChild className="group font-medium" variant="default">
          <Link href={pathsConfig.auth.signUp}>
            <Trans i18nKey="auth:signUp" />
            <ArrowRight
              className={cn(
                'ml-1 hidden h-4 w-4 transition-transform duration-500',
                'group-hover:translate-x-1 lg:block',
              )}
            />
          </Link>
        </Button>
      </div>
      <p className={cn('small text-muted-foreground max-w-xl')}>
        SlideHeroes arms individuals & teams with neccessary presentation tools
        & skills to impress, convince & close.
      </p>
    </div>
  );
}
