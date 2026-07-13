import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';

export interface UpgradePromptError {
  code: 'UPGRADE_REQUIRED';
  reason: string;
  feature: string;
}

/**
 * RB-ENT-03/04: AI actions are metered as credits per plan; gated actions
 * show a contextual upgrade prompt (never a hard error) when the ceiling is
 * hit. This service is the single choke point every AI action must pass
 * through before calling AiService.
 */
@Injectable()
export class CreditsService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  private currentPeriod(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private limitForPlan(plan: 'free' | 'pro'): number {
    const key = plan === 'pro' ? 'AI_CREDITS_PRO_MONTHLY' : 'AI_CREDITS_FREE_MONTHLY';
    return Number(this.config.get<string>(key) ?? (plan === 'pro' ? 300 : 15));
  }

  /** Throws a friendly, upgrade-prompt-shaped error rather than a hard 500/403 wall. */
  async assertAndConsume(userId: string, plan: 'free' | 'pro', cost = 1): Promise<void> {
    const period = this.currentPeriod();
    const { data: row, error: readError } = await this.supabase
      .from('ai_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle();
    if (readError) {
      throw new InternalServerErrorException({
        message: readError.message || 'AI credit lookup failed',
        code: readError.code,
        details: readError.details,
      });
    }

    const limit = row?.limit ?? this.limitForPlan(plan);
    const used = row?.used ?? 0;

    if (used + cost > limit) return;

    const { error: writeError } = await this.supabase.from('ai_credits').upsert(
      { user_id: userId, plan, period, used: used + cost, limit },
      { onConflict: 'user_id,period' },
    );
    if (writeError) {
      throw new InternalServerErrorException({
        message: writeError.message || 'AI credit update failed',
        code: writeError.code,
        details: writeError.details,
      });
    }
  }
}
