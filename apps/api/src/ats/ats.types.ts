export type ResumeSectionType =
  | 'personal'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certs'
  | 'experience'
  | 'custom';

export interface ResumeSectionLike {
  type: ResumeSectionType;
  visible: boolean;
  content: Record<string, any>;
}

export interface AtsComponentResult {
  score: number;      // 0-100 for this component alone
  weight: number;      // weight out of 100, per §5.2
  weighted: number;    // score * weight / 100
  detail: string;      // specific, actionable fix — never a black box (RB-ATS-03)
}

export interface AtsResult {
  total: number; // 0-100
  components: Record<string, AtsComponentResult>;
}
