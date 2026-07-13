import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_ADMIN = 'SUPABASE_ADMIN';

/**
 * Global module exposing a service-role Supabase client for server-side
 * work (e.g. writing PDFs to Storage, admin template management).
 *
 * IMPORTANT: this client bypasses RLS. Never use it to read/write a
 * student's resume data directly — always go through a request-scoped
 * client built from the student's own JWT (see auth/supabase-request.ts)
 * so Postgres RLS (NF-SEC-01) enforces the "own resumes only" boundary.
 */
@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.get<string>('SUPABASE_URL');
        const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) {
          throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured');
        }
        return createClient(url, key, { auth: { persistSession: false } });
      },
    },
  ],
  exports: [SUPABASE_ADMIN],
})
export class SupabaseModule {}
