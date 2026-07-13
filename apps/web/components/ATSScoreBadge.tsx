'use client';

import { useState } from 'react';
import { AtsResult } from '@/lib/types';

const LABELS: Record<string, string> = {
  keywordCoverage: 'Keyword coverage',
  sectionCompleteness: 'Section completeness',
  formatting: 'Formatting & parseability',
  impactQuality: 'Impact quality',
  contactCompleteness: 'Contact & links',
  lengthConciseness: 'Length & conciseness',
};

const WEIGHTS: Record<string, number> = {
  keywordCoverage: 30,
  sectionCompleteness: 20,
  formatting: 20,
  impactQuality: 15,
  contactCompleteness: 10,
  lengthConciseness: 5,
};

function scoreColor(score: number): string {
  if (score >= 75) return '#10B981'; // success
  if (score >= 50) return '#F59E0B'; // amber
  return '#EF4444'; // danger
}

function scoreBgClass(score: number): string {
  if (score >= 75) return 'bg-success/10 text-success';
  if (score >= 50) return 'bg-amber/10 text-amber';
  return 'bg-danger/10 text-danger';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Needs work';
}

export function ATSScoreBadge({ result }: { result: AtsResult | null }) {
  const [open, setOpen] = useState(false);

  if (!result) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-ink/8" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-ink/8" />
            <div className="h-2 w-16 animate-pulse rounded bg-ink/5" />
          </div>
        </div>
      </div>
    );
  }

  const color = scoreColor(result.total);

  // Gauge circle values
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = circ * (result.total / 100);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
      {/* Header row: gauge + overall score */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 text-left"
        aria-expanded={open}
      >
        {/* SVG gauge */}
        <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#F1F0FD" strokeWidth="5" />
          <circle
            cx="28" cy="28" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink">{result.total}</span>
            <span className="text-xs font-medium text-ink/40">/ 100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">ATS Score</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreBgClass(result.total)}`}>
              {scoreLabel(result.total)}
            </span>
          </div>
        </div>

        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`shrink-0 text-ink/30 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Breakdown */}
      {open && (
        <div className="mt-4 space-y-3 border-t border-ink/6 pt-4">
          {Object.entries(result.components).map(([key, c]) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink/70">{LABELS[key] ?? key}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${c.score >= 75 ? 'text-success' : c.score >= 50 ? 'text-amber' : 'text-danger'}`}>
                    {c.score}
                  </span>
                  <span className="text-[10px] text-ink/30">×{(WEIGHTS[key] ?? c.weight) / 100}w</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/6">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${c.score}%`, backgroundColor: scoreColor(c.score) }}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-ink/45">{c.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
