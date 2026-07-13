import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRequestScopedClient } from '../supabase/supabase-request';
import { AtsService } from '../ats/ats.service';
import { CreateResumeDto, UpdateResumeDto, UpsertSectionDto, ReorderSectionsDto } from './dto';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly config: ConfigService,
    private readonly ats: AtsService,
    private readonly integrations: IntegrationsService,
  ) {}

  private client(accessToken: string) {
    const url = this.config.get<string>('SUPABASE_URL')!;
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY') ?? this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;
    return createRequestScopedClient(url, anonKey, accessToken);
  }

  private fail(error: { message?: string; code?: string; details?: string } | null) {
    if (!error) return;
    throw new InternalServerErrorException({
      message: error.message || 'Supabase request failed',
      code: error.code,
      details: error.details,
    });
  }

  private async assertTemplateAllowed(
    supabase: ReturnType<ResumesService['client']>,
    templateId: string | undefined,
    plan: 'free' | 'pro',
  ) {
    if (!templateId) return;
    const { data: template, error } = await supabase
      .from('templates')
      .select('id, name, plan_min')
      .eq('id', templateId)
      .maybeSingle();
    this.fail(error);
    if (!template) throw new NotFoundException('Template not found');
    if (plan === 'free' && template.plan_min === 'pro') {
      throw new ForbiddenException({
        code: 'UPGRADE_REQUIRED',
        reason: `${template.name} is available for Pro users.`,
        feature: 'premium_templates',
      });
    }
  }

  async list(accessToken: string) {
    const { data, error } = await this.client(accessToken)
      .from('resumes')
      .select('*')
      .order('updated_at', { ascending: false });
    this.fail(error);
    return data;
  }

  async get(accessToken: string, id: string) {
    const supabase = this.client(accessToken);
    const { data: resume, error } = await supabase.from('resumes').select('*').eq('id', id).single();
    if (error || !resume) throw new NotFoundException('Resume not found');

    const { data: sections, error: sErr } = await supabase
      .from('resume_sections')
      .select('*')
      .eq('resume_id', id)
      .order('order', { ascending: true });
    this.fail(sErr);

    return { ...resume, sections: sections ?? [] };
  }

  // RB-ENT-01: Free plan capped at 1 saved resume.
  async create(accessToken: string, studentId: string, plan: 'free' | 'pro', dto: CreateResumeDto) {
    const supabase = this.client(accessToken);
    const prefill = await this.integrations.prefill(studentId);

    await this.assertTemplateAllowed(supabase, dto.templateId, plan);

    if (plan === 'free') {
      const { count, error: countError } = await supabase.from('resumes').select('id', { count: 'exact', head: true });
      this.fail(countError);
      if ((count ?? 0) >= 1) {
        throw new ForbiddenException({
          code: 'UPGRADE_REQUIRED',
          reason: 'Free plan is limited to 1 saved resume.',
          feature: 'multiple_resumes',
        });
      }
    }

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: studentId,
        title: dto.title,
        template_id: dto.templateId,
        target_role: dto.targetRole ?? prefill.profile?.targetRole,
        watermarked: plan === 'free',
      })
      .select('*')
      .single();
    this.fail(error);

    // Seed empty personal/education/skills/projects/certs sections so the
    // editor always has something to render (self-build happens via
    // IntegrationsService.prefill, called separately by the frontend).
    const defaults: Array<{ type: string; order: number; content: Record<string, unknown> }> = [
      {
        type: 'personal',
        order: 0,
        content: {
          fullName: prefill.profile?.fullName,
          email: prefill.profile?.email,
          phone: prefill.profile?.phone,
          location: prefill.profile?.location,
          github: prefill.profile?.github,
          linkedin: prefill.profile?.linkedin,
          portfolio: prefill.profile?.portfolio,
        },
      },
      { type: 'education', order: 1, content: { items: prefill.profile?.education ?? [] } },
      { type: 'skills', order: 2, content: { groups: prefill.profile?.skills ?? [] } },
      {
        type: 'projects',
        order: 3,
        content: { items: (prefill.projects ?? []).map((p: any) => ({ ...p, included: true })) },
      },
      {
        type: 'certs',
        order: 4,
        content: {
          items: (prefill.certifications ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            issuer: c.issuer,
            included: true,
          })),
        },
      },
    ];
    const { error: sectionError } = await supabase.from('resume_sections').insert(
      defaults.map((d) => ({ resume_id: data.id, type: d.type, order: d.order, visible: true, content: d.content })),
    );
    this.fail(sectionError);

    return data;
  }

  async update(accessToken: string, id: string, dto: UpdateResumeDto) {
    const { data, error } = await this.client(accessToken)
      .from('resumes')
      .update({
        title: dto.title,
        template_id: dto.templateId,
        target_role: dto.targetRole,
        is_default: dto.isDefault,
      })
      .eq('id', id)
      .select('*')
      .single();
    this.fail(error);
    return data;
  }

  async remove(accessToken: string, id: string) {
    const { error } = await this.client(accessToken).from('resumes').delete().eq('id', id);
    this.fail(error);
    return { ok: true };
  }

  // RB-EDT-04: autosave — upsert one section at a time from the editor.
  async upsertSection(accessToken: string, resumeId: string, dto: UpsertSectionDto) {
    const supabase = this.client(accessToken);
    let sectionId = dto.id;

    if (!sectionId) {
      const { data: existing, error: existingError } = await supabase
        .from('resume_sections')
        .select('id')
        .eq('resume_id', resumeId)
        .eq('type', dto.type)
        .maybeSingle();
      this.fail(existingError);
      sectionId = existing?.id;
    }

    const payload = {
      resume_id: resumeId,
      type: dto.type,
      order: dto.order,
      visible: dto.visible,
      content: dto.content,
    };

    const result = sectionId
      ? await supabase.from('resume_sections').update(payload).eq('id', sectionId).select('*').single()
      : await supabase.from('resume_sections').insert(payload).select('*').single();
    this.fail(result.error);

    await this.recomputeAts(accessToken, resumeId);
    return result.data;
  }

  // RB-CNT-09: section reordering and show/hide toggles.
  async reorderSections(accessToken: string, resumeId: string, dto: ReorderSectionsDto) {
    const supabase = this.client(accessToken);
    for (const s of dto.sections) {
      const { error } = await supabase.from('resume_sections').update({ order: s.order, visible: s.visible }).eq('id', s.id);
      this.fail(error);
    }
    await this.recomputeAts(accessToken, resumeId);
    return { ok: true };
  }

  // RB-ATS-01: recomputed after edits / AI changes; mirrors onto resumes.ats_score.
  async recomputeAts(accessToken: string, resumeId: string, targetKeywords: string[] = []) {
    const supabase = this.client(accessToken);
    const { data: sections, error: sectionsError } = await supabase
      .from('resume_sections')
      .select('type, visible, content')
      .eq('resume_id', resumeId);
    this.fail(sectionsError);

    const result = this.ats.score(sections ?? [], targetKeywords);

    const { error: atsInsertError } = await supabase.from('ats_scores').insert({
      resume_id: resumeId,
      total: result.total,
      components: result.components,
    });
    this.fail(atsInsertError);
    const { error: resumeUpdateError } = await supabase.from('resumes').update({ ats_score: result.total }).eq('id', resumeId);
    this.fail(resumeUpdateError);

    return result;
  }

  // RB-VER-02: duplicate an existing resume as a starting point.
  async duplicate(accessToken: string, studentId: string, plan: 'free' | 'pro', sourceId: string) {
    if (plan === 'free') {
      throw new ForbiddenException({
        code: 'UPGRADE_REQUIRED',
        reason: 'Duplicating resumes requires Pro.',
        feature: 'multiple_resumes',
      });
    }
    const source = await this.get(accessToken, sourceId);
    const supabase = this.client(accessToken);
    const { data: newResume, error } = await supabase
      .from('resumes')
      .insert({
        user_id: studentId,
        title: `${source.title} (copy)`,
        template_id: source.template_id,
        target_role: source.target_role,
        watermarked: false,
      })
      .select('*')
      .single();
    this.fail(error);

    const { error: sectionError } = await supabase.from('resume_sections').insert(
      source.sections.map((s: any) => ({
        resume_id: newResume.id,
        type: s.type,
        order: s.order,
        visible: s.visible,
        content: s.content,
      })),
    );
    this.fail(sectionError);

    return newResume;
  }
}
