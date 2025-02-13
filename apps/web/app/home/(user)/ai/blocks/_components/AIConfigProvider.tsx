'use server';

import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function getAIConfig() {
  const client = getSupabaseServerClient();
  const auth = await requireUser(client);

  if (auth.error) {
    throw new Error('Unauthorized');
  }

  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    gatewayId: process.env.CLOUDFLARE_GATEWAY_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    groqApiKey: process.env.GROQ_API_KEY,
  };
}
