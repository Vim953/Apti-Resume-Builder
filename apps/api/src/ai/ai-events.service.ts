import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';
import { AiActionResult } from './ai.service';

// Rough blended per-token cost estimate for the cost dashboard (NF-COST-*).
// Swap for real per-model pricing before shipping.
const COST_PER_1K_INPUT = 0.003;
const COST_PER_1K_OUTPUT = 0.015;

@Injectable()
export class AiEventsService {
  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  async log(
    resumeId: string,
    action: 'improve' | 'tip' | 'summary' | 'desc',
    input: string,
    output: string,
    usage: AiActionResult,
  ): Promise<string> {
    const cost =
      (usage.inputTokens / 1000) * COST_PER_1K_INPUT + (usage.outputTokens / 1000) * COST_PER_1K_OUTPUT;

    const { data, error } = await this.supabase
      .from('resume_ai_events')
      .insert({
        resume_id: resumeId,
        action,
        input,
        output,
        tokens: usage.inputTokens + usage.outputTokens,
        cost_usd: Number(cost.toFixed(6)),
      })
      .select('id')
      .single();

    if (error) {
      throw new InternalServerErrorException({
        message: error.message || 'AI event logging failed',
        code: error.code,
        details: error.details,
      });
    }
    return data.id as string;
  }

  // RB-AI-04: records the student's accept/reject decision on the diff.
  async setAccepted(eventId: string, accepted: boolean): Promise<void> {
    const { error } = await this.supabase.from('resume_ai_events').update({ accepted }).eq('id', eventId);
    if (error) {
      throw new InternalServerErrorException({
        message: error.message || 'AI event update failed',
        code: error.code,
        details: error.details,
      });
    }
  }
}
