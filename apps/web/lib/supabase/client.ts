'use client';

import { createBrowserClient } from '@supabase/ssr';

// Fails loudly and early if the app is misconfigured, rather than silently
// making unauthenticated requests that later blow up with "Missing bearer
// token" deep inside an API call.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy apps/web/.env.example to apps/web/.env.local and fill in your Supabase project URL + anon key.`,
    );
  }
  return value;
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a singleton Supabase client for use in Client Components.
 * Uses @supabase/ssr's cookie-backed storage so the session is visible to
 * both the browser and the Next.js middleware/server (needed for protected
 * routes + redirects to work without a flash of unauthenticated content).
 */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  return browserClient;
}
