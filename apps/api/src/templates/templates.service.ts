import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';

const DEFAULT_TEMPLATES = [
  {
    name: 'Simple Clean',
    plan_min: 'free',
    ats_safe: true,
    config: { columns: 1, font: 'Plus Jakarta Sans', accent: '#5B4FE8', headingStyle: 'uppercase-underline', layout: 'simple' },
  },
  {
    name: 'Academic ATS',
    plan_min: 'pro',
    ats_safe: true,
    config: { columns: 1, font: 'Times New Roman', accent: '#111827', headingStyle: 'academic-line', layout: 'academic' },
  },
  {
    name: 'Minimal',
    plan_min: 'pro',
    ats_safe: true,
    config: { columns: 1, font: 'Plus Jakarta Sans', accent: '#A89163', headingStyle: 'line', layout: 'minimal' },
  },
  {
    name: 'Executive',
    plan_min: 'pro',
    ats_safe: true,
    config: { columns: 1, font: 'Plus Jakarta Sans', accent: '#37322D', headingStyle: 'uppercase-underline', layout: 'executive' },
  },
  {
    name: 'Professional',
    plan_min: 'pro',
    ats_safe: true,
    config: { columns: 1, font: 'Plus Jakarta Sans', accent: '#1057A8', headingStyle: 'pill', layout: 'professional' },
  },
  {
    name: 'Creative',
    plan_min: 'pro',
    ats_safe: true,
    config: { columns: 1, font: 'Plus Jakarta Sans', accent: '#507A44', headingStyle: 'line', layout: 'creative' },
  },
] as const;

@Injectable()
export class TemplatesService {
  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  private async ensureDefaultTemplates(existing: Array<{ name: string }> = []) {
    const names = new Set(existing.map((template) => template.name.toLowerCase()));
    const missing = DEFAULT_TEMPLATES.filter((template) => !names.has(template.name.toLowerCase()));
    if (!missing.length) return;
    const { error } = await this.supabase.from('templates').insert(missing);
    if (error) throw error;
  }

  // RB-TPL-01/03: Free sees only Free-tier templates; Pro sees all.
  // Gated ones are still returned (so the UI can render them dimmed with an
  // upgrade prompt per RB-ENT-04) but flagged as locked.
  async listForPlan(plan: 'free' | 'pro') {
    const { data: existing, error: readError } = await this.supabase.from('templates').select('*').order('created_at');
    if (readError) throw readError;
    await this.ensureDefaultTemplates(existing ?? []);

    const { data, error } = await this.supabase.from('templates').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((t) => ({ ...t, locked: plan === 'free' && t.plan_min === 'pro' }));
  }
}
