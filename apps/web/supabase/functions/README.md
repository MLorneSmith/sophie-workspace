# Supabase Edge Functions

This directory contains Supabase Edge Functions for the SlideHeroes platform.

## Available Functions

### hello

A basic health check function that verifies the Edge Runtime is working correctly.

**Endpoint:** `http://127.0.0.1:54321/functions/v1/hello`

**Example Usage:**

```bash
curl -H "Authorization: Bearer <anon_key>" http://127.0.0.1:54321/functions/v1/hello
```

## Development

Edge Functions use Deno and run in the Supabase Edge Runtime. See the [Supabase Edge Functions documentation](https://supabase.com/docs/guides/functions) for more details.

### Local Development

1. Functions are automatically served when running `pnpm supabase start`
2. The Edge Runtime runs on port 54321 alongside the main API
3. Use the anon key from `pnpm supabase start` output for authentication

### Adding New Functions

1. Create a new directory under `functions/`
2. Add an `index.ts` file with your function logic
3. Restart Supabase to pick up the new function
4. Test with `curl` or your application

## Troubleshooting

If the Edge Runtime container exits:

1. Ensure functions directory exists and contains valid TypeScript
2. Check Docker logs: `docker logs supabase_edge_runtime_2025slideheroes-db`
3. Restart Supabase: `pnpm supabase stop && pnpm supabase start`
