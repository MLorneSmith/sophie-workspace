'use server';

import { cookies } from 'next/headers';

import { prefetchQuery } from '@supabase-cache-helpers/postgrest-react-query';
import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createAccount, getAccounts } from './queries/test-queries';

export type QueryTestResponse = {
  message: string | null;
  error: string | null;
  data?: unknown;
};

const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  email: z.string().email('Valid email is required'),
});

export async function prefetchAccounts() {
  const cookieStore = cookies();
  const supabase = getSupabaseServerClient();
  const queryClient = new QueryClient();

  await prefetchQuery(queryClient, getAccounts(supabase));

  return queryClient;
}

export const createAccountAction = enhanceAction(
  async function (data, user) {
    const cookieStore = cookies();
    const supabase = getSupabaseServerClient();

    try {
      const result = await createAccount(supabase, {
        name: data.name,
        email: data.email,
      });
      return {
        message: 'Account created successfully',
        error: null,
        data: result,
      };
    } catch (err) {
      console.error('Error creating account:', err);
      return {
        message: null,
        error: err instanceof Error ? err.message : 'An error occurred',
      };
    }
  },
  {
    auth: true,
    schema: CreateAccountSchema,
  },
);
