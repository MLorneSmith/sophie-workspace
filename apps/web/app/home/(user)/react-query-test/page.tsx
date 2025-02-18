'use client';

import { useActionState } from 'react';

import { useFormStatus } from 'react-dom';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type Database } from '@kit/supabase/database';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { Input } from '@kit/ui/input';

import { type QueryTestResponse, createAccountAction } from './actions';
import { getAccounts } from './queries/test-queries';

type Account = Database['public']['Tables']['accounts']['Row'];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating...' : 'Create Account'}
    </Button>
  );
}

export default function ReactQueryTestPage() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  // Initial state for the form action
  const initialState: QueryTestResponse = {
    message: null,
    error: null,
  };

  const [state, formAction] = useActionState(
    async (state: QueryTestResponse, formData: FormData) => {
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      return createAccountAction({ name, email });
    },
    initialState,
  );

  // Query for fetching accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await getAccounts(supabase);
      return data;
    },
  });

  // Mutation for optimistic updates
  const mutation = useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      const result = await createAccountAction({ name, email });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">React Query Test</h1>

      {/* Create Account Form */}
      <Card className="mb-4 p-4">
        <form action={formAction}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Account Name
              </label>
              <Input
                name="name"
                placeholder="Enter account name"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email Address
              </label>
              <Input
                name="email"
                type="email"
                placeholder="Enter email address"
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-4">
            <SubmitButton />
          </div>
        </form>
      </Card>

      {/* Status Messages */}
      {state?.error && (
        <Card className="bg-destructive/10 mb-4 p-4">
          <p className="text-destructive">Error: {state.error}</p>
        </Card>
      )}

      {state?.message && (
        <Card className="bg-success/10 mb-4 p-4">
          <p className="text-success">{state.message}</p>
        </Card>
      )}

      {/* Accounts List */}
      <Card className="p-4">
        <h2 className="mb-4 text-xl font-semibold">Accounts List</h2>
        {isLoading ? (
          <p>Loading accounts...</p>
        ) : (
          <ul className="space-y-2">
            {accounts?.map((account: Account) => (
              <li
                key={account.id}
                className="border-border flex items-center justify-between border-b p-2"
              >
                <div>
                  <span className="font-medium">{account.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {account.email}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
