import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';

export type Plan = 'free' | 'pro';

export interface AuthedRequest extends Request {
  studentId: string;
  accessToken: string;
  /**
   * Server-resolved entitlement plan (SRS §2.3 Subscription-module
   * touch-point) — read from `profiles.plan` with the service-role client,
   * never from a client-supplied query/body param. Endpoints must use this
   * for any gating decision (RB-ENT-*); a client-supplied `plan` value is
   * for display/back-compat only and is never authoritative.
   */
  plan: Plan;
}

/**
 * Verifies the Supabase-issued access token on every request (NF-SEC-01)
 * and exposes studentId / accessToken so downstream services can build an
 * RLS-scoped Supabase client (see supabase/supabase-request.ts) rather than
 * trusting any client-supplied user id.
 *
 * IMPORTANT: this asks Supabase to validate the token (`auth.getUser`)
 * rather than verifying the JWT signature locally with a static secret.
 * Supabase projects created since late 2024 default to asymmetric
 * (ES256/RS256) JWT signing keys, not the legacy shared HS256 "JWT
 * Secret" — a local `jsonwebtoken.verify(token, SUPABASE_JWT_SECRET)`
 * call fails on those projects even with a perfectly correct secret,
 * which is what produces a misleading "Invalid or expired token" error
 * for every request. Delegating to Supabase avoids depending on which
 * signing scheme the project uses, and also respects token revocation.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(@Inject(SUPABASE_ADMIN) private readonly admin: SupabaseClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length);

    const { data, error } = await this.admin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.studentId = data.user.id;
    req.accessToken = token;
    req.plan = await this.resolvePlan(data.user.id);
    return true;
  }

  private async resolvePlan(userId: string): Promise<Plan> {
    try {
      const { data } = await this.admin.from('profiles').select('plan').eq('id', userId).maybeSingle();
      return data?.plan === 'pro' ? 'pro' : 'free';
    } catch {
      // profiles row missing / table not migrated yet — safe default.
      return 'free';
    }
  }
}
