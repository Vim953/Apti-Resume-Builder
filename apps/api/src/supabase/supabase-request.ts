import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Builds a Supabase client authenticated as the requesting student, so every
 * query it makes is subject to the RLS policies in
 * supabase/migrations/0001_init.sql (a student only ever sees their own
 * rows). Use this in controllers/services instead of the admin client for
 * anything that touches resumes/resume_sections/resume_ai_events/ats_scores.
 */
export function createRequestScopedClient(url: string, anonKey: string, accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}
