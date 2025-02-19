import { type SupabaseClient } from '@supabase/supabase-js';

import { type Database } from '~/lib/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

// Query to fetch a list of accounts
export function getAccounts(client: TypedSupabaseClient) {
  return client.from('accounts').select(`*`).throwOnError();
}

// Query to fetch a single account by ID
export function getAccountById(client: TypedSupabaseClient, accountId: string) {
  return client
    .from('accounts')
    .select(`*`)
    .eq('id', accountId)
    .throwOnError()
    .single();
}

// Mutation to create a new account
export function createAccount(
  client: TypedSupabaseClient,
  data: { name: string; email: string },
) {
  return client
    .from('accounts')
    .insert([
      {
        name: data.name,
        email: data.email,
        is_personal_account: true,
      },
    ])
    .select()
    .throwOnError()
    .single();
}
