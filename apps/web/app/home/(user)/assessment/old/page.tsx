import React from 'react';

import { Metadata } from 'next';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';

export const metadata: Metadata = {
  title: 'Self-Assessment Survey Introduction',
};

export default async function AssessmentIntroPage() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-2xl rounded-lg bg-card p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Self-Assessment Survey
        </h1>
        <p className="mb-4 text-lg">
          Welcome to the Self-Assessment Survey. This survey is designed to help
          you evaluate your current skills and knowledge in various areas
          related to public speaking and presentation.
        </p>
        <p className="mb-4 text-lg">
          The survey consists of multiple-choice questions covering different
          aspects such as structure, story, substance, style, and
          self-confidence. Your responses will help us tailor our guidance and
          resources to your specific needs.
        </p>
        <p className="mb-6 text-lg">
          Please answer each question honestly and to the best of your ability.
          There are no right or wrong answers – the goal is to get an accurate
          picture of your current strengths and areas for improvement.
        </p>
        <div className="flex justify-center">
          <Link href="/home/assessment/survey">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Take Survey
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
