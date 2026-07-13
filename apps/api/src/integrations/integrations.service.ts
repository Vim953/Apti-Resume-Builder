import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';

export interface ProfilePrefill {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  targetRole?: string;
  education?: Array<{ degree: string; branch: string; institution: string; years: string; cgpa?: string }>;
  skills?: Array<{ group: string; items: string[] }>;
}

export interface ProjectRef {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  links: { github?: string; live?: string };
}

export interface CertificationRef {
  id: string;
  name: string;
  issuer: string;
  verified: boolean;
  onResume: boolean;
}

export interface TargetRoleSignal {
  role: string;
  company?: string;
  keywords: string[];
}

/**
 * Touch-points into the surrounding APTI platform (SRS §2.3, §3.6). Each
 * upstream module is a separate service in the real platform; here they're
 * called over HTTP using internal URLs from env config. If a URL isn't
 * configured (e.g. running this module standalone, per SRS §1.1), each
 * method falls back to empty/sample data so the resume builder still runs
 * on its own.
 */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
  ) {}

  private async fetchJson<T>(url: string | undefined, fallback: T): Promise<T> {
    if (!url) return fallback;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Upstream ${url} returned ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn(`Falling back to sample data for ${url}: ${(err as Error).message}`);
      return fallback;
    }
  }

  // RB-INT-01: prefill personal + education from Profile/Onboarding.
  async getProfile(studentId: string): Promise<ProfilePrefill> {
    const { data } = await this.supabase
      .from('profiles')
      .select('email, full_name, phone, location, github, linkedin, portfolio, target_role, education, skills')
      .eq('id', studentId)
      .maybeSingle();

    const { data: authData } = await this.supabase.auth.admin.getUserById(studentId);
    const metadata = authData.user?.user_metadata as Record<string, any> | undefined;

    if (data) {
      return {
        fullName: data.full_name ?? metadata?.fullName ?? '',
        email: data.email ?? authData.user?.email ?? '',
        phone: data.phone ?? metadata?.phone ?? '',
        location: data.location ?? metadata?.location ?? '',
        github: data.github ?? metadata?.github ?? '',
        linkedin: data.linkedin ?? metadata?.linkedin ?? '',
        portfolio: data.portfolio ?? metadata?.portfolio ?? '',
        targetRole: data.target_role ?? metadata?.targetRole ?? '',
        education: data.education?.length ? data.education : metadata?.education ?? [],
        skills: data.skills?.length ? data.skills : metadata?.skills ?? [],
      };
    }

    if (authData.user) {
      return {
        fullName: metadata?.fullName ?? '',
        email: authData.user.email ?? '',
        phone: metadata?.phone ?? '',
        location: metadata?.location ?? '',
        github: metadata?.github ?? '',
        linkedin: metadata?.linkedin ?? '',
        portfolio: metadata?.portfolio ?? '',
        targetRole: metadata?.targetRole ?? '',
        education: metadata?.education ?? [],
        skills: metadata?.skills ?? [],
      };
    }

    const url = this.config.get<string>('PROFILE_API_URL');
    return this.fetchJson<ProfilePrefill>(url ? `${url}/${studentId}` : undefined, {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      education: [],
      skills: [],
    });
  }

  // RB-INT-02: sync projects (changes upstream reflect here — this module
  // stores include/exclude flags + overrides, not a copy of the content).
  async getProjects(studentId: string): Promise<ProjectRef[]> {
    const url = this.config.get<string>('PROJECTS_API_URL');
    return this.fetchJson<ProjectRef[]>(url ? `${url}?studentId=${studentId}` : undefined, []);
  }

  // RB-INT-03: pull verified certifications flagged "On Resume".
  async getCertifications(studentId: string): Promise<CertificationRef[]> {
    const url = this.config.get<string>('CERTIFICATIONS_API_URL');
    const all = await this.fetchJson<CertificationRef[]>(url ? `${url}?studentId=${studentId}` : undefined, []);
    return all.filter((c) => c.verified && c.onResume);
  }

  // RB-INT-04/05: Skill Gap / Career Path / Job Board target-role signals,
  // used to drive AI Tips and ATS keyword matching.
  async getTargetRoleSignals(studentId: string, profile?: ProfilePrefill): Promise<TargetRoleSignal[]> {
    profile ??= await this.getProfile(studentId);
    if (profile.targetRole) return [{ role: profile.targetRole, keywords: [] }];

    const url = this.config.get<string>('SKILL_GAP_API_URL');
    return this.fetchJson<TargetRoleSignal[]>(url ? `${url}?studentId=${studentId}` : undefined, []);
  }

  // Combines everything into the shape the resume editor needs on first
  // open, so "self-build" (SRS §1.2/§2.1) works with zero manual typing.
  async prefill(studentId: string) {
    const profile = await this.getProfile(studentId);
    const [projects, certifications, targetRoles] = await Promise.all([
      this.getProjects(studentId),
      this.getCertifications(studentId),
      this.getTargetRoleSignals(studentId, profile),
    ]);
    return { profile, projects, certifications, targetRoles };
  }
}
