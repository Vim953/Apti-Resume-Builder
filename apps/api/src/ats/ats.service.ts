import { Injectable } from '@nestjs/common';
import { AtsComponentResult, AtsResult, ResumeSectionLike } from './ats.types';

const ACTION_VERBS = [
  'built', 'led', 'designed', 'implemented', 'launched', 'optimized', 'reduced',
  'increased', 'automated', 'architected', 'shipped', 'improved', 'created',
  'developed', 'deployed', 'managed', 'drove', 'scaled', 'migrated', 'refactored',
];

const QUANTIFIER_RE = /(\d+(\.\d+)?\s*(%|percent|x|k|m|ms|s|hrs?|hours?|users?|students?))/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

/**
 * Deterministic ATS scorer, per SRS §5.2. Weights are admin-configurable in
 * principle (kept as constants here; wire to the `templates`/config table
 * if/when an admin UI for weight tuning is built).
 *
 * Runs with zero LLM calls (NF-COST-03) — pure text/structure heuristics.
 */
@Injectable()
export class AtsService {
  private readonly weights = {
    keywordCoverage: 30,
    sectionCompleteness: 20,
    formatting: 20,
    impactQuality: 15,
    contactCompleteness: 10,
    lengthConciseness: 5,
  };

  score(sections: ResumeSectionLike[], targetKeywords: string[] = []): AtsResult {
    const components: Record<string, AtsComponentResult> = {
      keywordCoverage: this.scoreKeywordCoverage(sections, targetKeywords),
      sectionCompleteness: this.scoreSectionCompleteness(sections),
      formatting: this.scoreFormatting(sections),
      impactQuality: this.scoreImpactQuality(sections),
      contactCompleteness: this.scoreContactCompleteness(sections),
      lengthConciseness: this.scoreLength(sections),
    };

    const total = Math.round(
      Object.values(components).reduce((sum, c) => sum + c.weighted, 0),
    );

    return { total: Math.min(100, Math.max(0, total)), components };
  }

  // ── §5.2 row: Keyword / skill coverage vs target role — weight 30 ──────
  private scoreKeywordCoverage(sections: ResumeSectionLike[], targetKeywords: string[]): AtsComponentResult {
    const weight = this.weights.keywordCoverage;
    if (targetKeywords.length === 0) {
      // No target role selected yet — neutral score, nudge student to set one.
      return this.result(60, weight, 'Set a target role to get precise keyword matching.');
    }
    const haystack = this.flattenText(sections).toLowerCase();
    const matched = targetKeywords.filter((k) => haystack.includes(k.toLowerCase()));
    const pct = matched.length / targetKeywords.length;
    const missing = targetKeywords.filter((k) => !matched.includes(k));
    const score = Math.round(pct * 100);
    const detail = missing.length
      ? `Missing skills for this role: ${missing.slice(0, 5).join(', ')}`
      : 'All target-role keywords present.';
    return this.result(score, weight, detail);
  }

  // ── Section completeness — weight 20 ────────────────────────────────────
  private scoreSectionCompleteness(sections: ResumeSectionLike[]): AtsComponentResult {
    const weight = this.weights.sectionCompleteness;
    const required: ResumeSectionLike['type'][] = ['personal', 'education', 'skills'];
    const hasExperienceLike = sections.some(
      (s) => s.visible && (s.type === 'projects' || s.type === 'experience') && this.sectionHasContent(s),
    );
    const presentRequired = required.filter((t) =>
      sections.some((s) => s.type === t && s.visible && this.sectionHasContent(s)),
    );
    const total = required.length + 1; // +1 for projects/experience
    const present = presentRequired.length + (hasExperienceLike ? 1 : 0);
    const score = Math.round((present / total) * 100);
    const missing: string[] = required
      .filter((t) => !presentRequired.includes(t))
      .map((t) => String(t))
      .concat(hasExperienceLike ? [] : ['projects/experience']);
    const detail = missing.length
      ? `Add or fill in: ${missing.join(', ')}`
      : 'All core sections present.';
    return this.result(score, weight, detail);
  }

  // ── Formatting & parseability — weight 20 ───────────────────────────────
  // Template-level guarantee (RB-TPL-02: single column, standard headings,
  // selectable text). We still check content-side pitfalls here.
  private scoreFormatting(sections: ResumeSectionLike[]): AtsComponentResult {
    const weight = this.weights.formatting;
    const text = this.flattenText(sections);
    const hasWeirdChars = /[\u2022\u25CF]/.test(text) === false; // literal bullet glyphs should not appear in stored content
    const hasTables = false; // templates are single-column by construction (RB-TPL-02)
    const score = hasWeirdChars && !hasTables ? 100 : 70;
    const detail = score === 100
      ? 'Formatting is ATS-safe: single column, standard headings, selectable text.'
      : 'Remove manually-typed bullet characters or multi-column layouts.';
    return this.result(score, weight, detail);
  }

  // ── Impact quality — weight 15 ──────────────────────────────────────────
  private scoreImpactQuality(sections: ResumeSectionLike[]): AtsComponentResult {
    const weight = this.weights.impactQuality;
    const bullets = this.extractBullets(sections);
    if (bullets.length === 0) {
      return this.result(30, weight, 'Add bullet points to your projects/experience with concrete outcomes.');
    }
    let verbHits = 0;
    let quantHits = 0;
    for (const b of bullets) {
      const lower = b.toLowerCase().trim();
      if (ACTION_VERBS.some((v) => lower.startsWith(v))) verbHits++;
      if (QUANTIFIER_RE.test(b)) quantHits++;
    }
    const verbPct = verbHits / bullets.length;
    const quantPct = quantHits / bullets.length;
    const score = Math.round((verbPct * 0.5 + quantPct * 0.5) * 100);
    const detail = quantPct < 0.5
      ? `Add quantified outcomes to more bullets (e.g. "reduced load time by 40%"). Currently ${quantHits}/${bullets.length} bullets are quantified.`
      : 'Good mix of action verbs and quantified results.';
    return this.result(score, weight, detail);
  }

  // ── Contact & links completeness — weight 10 ────────────────────────────
  private scoreContactCompleteness(sections: ResumeSectionLike[]): AtsComponentResult {
    const weight = this.weights.contactCompleteness;
    const personal = sections.find((s) => s.type === 'personal')?.content ?? {};
    const checks = {
      email: EMAIL_RE.test(personal.email ?? ''),
      phone: Boolean(personal.phone),
      github: URL_RE.test(personal.github ?? ''),
      linkedin: URL_RE.test(personal.linkedin ?? ''),
      portfolio: Boolean(personal.portfolio),
    };
    const present = Object.values(checks).filter(Boolean).length;
    const score = Math.round((present / Object.keys(checks).length) * 100);
    const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
    const detail = missing.length ? `Add or fix: ${missing.join(', ')}` : 'Contact block is complete.';
    return this.result(score, weight, detail);
  }

  // ── Length & conciseness — weight 5 ─────────────────────────────────────
  private scoreLength(sections: ResumeSectionLike[]): AtsComponentResult {
    const weight = this.weights.lengthConciseness;
    const words = this.flattenText(sections).split(/\s+/).filter(Boolean).length;
    // Fresher resume target: roughly 350–600 words fits one page.
    let score: number;
    let detail: string;
    if (words <= 600) {
      score = 100;
      detail = 'Length fits comfortably on one page.';
    } else if (words <= 800) {
      score = 70;
      detail = 'Slightly long for a fresher resume — trim less-relevant bullets.';
    } else {
      score = 40;
      detail = 'Resume is likely over one page — tighten bullets and remove low-impact content.';
    }
    return this.result(score, weight, detail);
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  private result(score: number, weight: number, detail: string): AtsComponentResult {
    const clamped = Math.min(100, Math.max(0, Math.round(score)));
    return { score: clamped, weight, weighted: (clamped * weight) / 100, detail };
  }

  private sectionHasContent(s: ResumeSectionLike): boolean {
    return this.valueHasContent(s.content);
  }

  private valueHasContent(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.some((item) => this.valueHasContent(item));
    if (typeof value === 'object') {
      if (value.included === false || value.visible === false) return false;
      return Object.entries(value)
        .filter(([key]) => !['id', 'included', 'visible', 'order'].includes(key))
        .some(([, nested]) => this.valueHasContent(nested));
    }
    return false;
  }

  private flattenText(sections: ResumeSectionLike[]): string {
    return sections
      .filter((s) => s.visible)
      .map((s) => JSON.stringify(s.content))
      .join(' ')
      .replace(/[{}[\]",:]/g, ' ');
  }

  private extractBullets(sections: ResumeSectionLike[]): string[] {
    const bullets: string[] = [];
    for (const s of sections) {
      if (!s.visible) continue;
      if (s.type !== 'projects' && s.type !== 'experience') continue;
      const items = Array.isArray(s.content?.items) ? s.content.items : [];
      for (const item of items) {
        if (item?.included === false || item?.visible === false) continue;
        if (Array.isArray(item.bullets)) bullets.push(...item.bullets);
        if (typeof item.description === 'string' && item.description.trim()) {
          bullets.push(item.description);
        }
      }
    }
    return bullets;
  }
}
