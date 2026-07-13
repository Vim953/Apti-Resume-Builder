export type Plan = 'free' | 'pro';

export type SectionType = 'personal' | 'education' | 'skills' | 'projects' | 'certs' | 'experience' | 'custom';

export interface ResumeSection {
  id: string;
  resume_id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  content: Record<string, any>;
}

export interface Resume {
  id: string;
  title: string;
  template_id: string | null;
  target_role: string | null;
  ats_score: number | null;
  is_default: boolean;
  watermarked: boolean;
  created_at: string;
  updated_at: string;
  sections?: ResumeSection[];
}

export interface AtsComponentResult {
  score: number;
  weight: number;
  weighted: number;
  detail: string;
}

export interface AtsResult {
  total: number;
  components: Record<string, AtsComponentResult>;
}

export interface Template {
  id: string;
  name: string;
  plan_min: Plan;
  ats_safe: boolean;
  locked: boolean;
  config: { columns: number; font: string; accent: string; headingStyle: string; layout?: string };
}

export interface PersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  summary?: string;
}

export interface EducationEntry {
  degree: string;
  branch: string;
  institution: string;
  years: string;
  cgpa?: string;
}

export interface SkillGroup {
  group: string; // languages | frameworks | tools
  items: string[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  links?: { github?: string; live?: string };
  included: boolean;
}

export interface CertEntry {
  id: string;
  name: string;
  issuer: string;
  certificateUrl?: string;
  certificateFileName?: string;
  included: boolean;
}

export interface WorkEntry {
  id: string;
  role: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  description: string;
  included: boolean;
}

export interface AiEventResult {
  eventId: string;
  output: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}
