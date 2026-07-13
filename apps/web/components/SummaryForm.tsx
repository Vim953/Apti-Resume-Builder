'use client';

import { useState } from 'react';
import { PersonalInfo, EducationEntry, SkillGroup, ProjectEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { AIImproveDiff } from './AIImproveDiff';

export function SummaryForm({
  value,
  onChange,
  resumeId,
  targetRole,
  plan,
  education,
  skills,
  projects,
  personal,
}: {
  value: string;
  onChange: (v: string) => void;
  resumeId: string;
  targetRole: string;
  plan: 'free' | 'pro';
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  personal: PersonalInfo;
}) {
  const [busy, setBusy] = useState(false);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [diff, setDiff] = useState<{ suggestion: string; eventId: string } | null>(null);

  function buildProfileContext(): string {
    const eduLine = education.map((e) => `${e.degree} in ${e.branch} at ${e.institution}`).join('; ');
    const skillsLine = skills.flatMap((g) => g.items).join(', ');
    const projectsLine = projects.filter((p) => p.included).map((p) => p.title).join(', ');
    return [
      personal.fullName && `Name: ${personal.fullName}`,
      personal.email && `Email: ${personal.email}`,
      personal.phone && `Phone: ${personal.phone}`,
      personal.location && `Location: ${personal.location}`,
      targetRole && `Target role: ${targetRole}`,
      eduLine && `Education: ${eduLine}`,
      skillsLine && `Skills: ${skillsLine}`,
      projectsLine && `Projects: ${projectsLine}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  async function generate() {
    setBusy(true);
    setGateMsg(null);
    try {
      const result = await api.ai.summary(resumeId, buildProfileContext(), plan, targetRole || undefined);
      setDiff({ suggestion: result.output, eventId: result.eventId });
    } catch (e: any) {
      setGateMsg(e.body?.code === 'UPGRADE_REQUIRED' ? e.body.reason : e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resolveDiff(accept: boolean) {
    if (!diff) return;
    await api.ai.accept(diff.eventId, accept);
    if (accept) onChange(diff.suggestion);
    setDiff(null);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Professional summary</h3>
        <button
          onClick={generate}
          disabled={busy}
          className="text-xs font-semibold text-violet hover:underline disabled:opacity-50"
        >
          {busy ? 'Generating…' : '✨ Generate with AI'}
        </button>
      </div>
      {gateMsg && <div className="mb-3 rounded-xl bg-amber/10 px-3 py-2 text-xs text-amber">{gateMsg}</div>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="A 2-3 sentence summary tailored to your target role — write your own or generate one with AI."
        className="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
      />

      {diff && (
        <AIImproveDiff
          original={value || '(empty)'}
          suggestion={diff.suggestion}
          onAccept={() => resolveDiff(true)}
          onReject={() => resolveDiff(false)}
        />
      )}
    </section>
  );
}
