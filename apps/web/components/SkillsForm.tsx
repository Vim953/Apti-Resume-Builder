'use client';

import { useState } from 'react';
import { SkillGroup } from '@/lib/types';
import { api } from '@/lib/api';

export function SkillsForm({
  value,
  onChange,
  resumeId,
  targetRole,
  plan,
}: {
  value: SkillGroup[];
  onChange: (v: SkillGroup[]) => void;
  resumeId: string;
  targetRole: string;
  plan: 'free' | 'pro';
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [tip, setTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);

  const groupNames = ['languages', 'frameworks', 'tools'];
  const groupFor = (name: string) => value.find((g) => g.group === name) ?? { group: name, items: [] };

  const addSkill = (group: string) => {
    const text = (draft[group] ?? '').trim();
    if (!text) return;
    const existing = groupFor(group);
    const next = value.filter((g) => g.group !== group).concat({ ...existing, items: [...existing.items, text] });
    onChange(next);
    setDraft({ ...draft, [group]: '' });
  };

  const removeSkill = (group: string, item: string) => {
    const existing = groupFor(group);
    onChange(
      value
        .filter((g) => g.group !== group)
        .concat({ ...existing, items: existing.items.filter((i) => i !== item) }),
    );
  };

  async function getTip() {
    setTipLoading(true);
    setTipError(null);
    try {
      const allSkills = value.flatMap((g) => g.items);
      const result = await api.ai.tip(resumeId, allSkills, targetRole || 'Software Engineer', plan);
      setTip(result.output);
    } catch (e: any) {
      setTipError(e.body?.code === 'UPGRADE_REQUIRED' ? e.body.reason : e.message);
    } finally {
      setTipLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Skills</h3>
        <button
          onClick={getTip}
          disabled={tipLoading}
          className="text-xs font-semibold text-violet hover:underline disabled:opacity-50"
        >
          {tipLoading ? 'Thinking…' : '✨ AI Tip'}
        </button>
      </div>

      {tip && (
        <div className="mb-4 rounded-xl border border-violet/30 bg-violet/5 px-3 py-2 text-xs text-violet">
          <strong>Missing for this role:</strong> {tip}
        </div>
      )}
      {tipError && <div className="mb-4 rounded-xl bg-amber/10 px-3 py-2 text-xs text-amber">{tipError}</div>}

      <div className="space-y-4">
        {groupNames.map((name) => {
          const g = groupFor(name);
          return (
            <div key={name}>
              <p className="mb-1.5 text-xs font-medium capitalize text-ink/60">{name}</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <span key={item} className="flex items-center gap-1 rounded-full bg-indigo/10 px-2.5 py-1 text-xs text-indigo">
                    {item}
                    <button onClick={() => removeSkill(name, item)} aria-label={`Remove ${item}`} className="text-indigo/60 hover:text-indigo">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={draft[name] ?? ''}
                onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(name))}
                placeholder={`Add a ${name.slice(0, -1)}, press Enter`}
                className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-xs outline-none focus:border-indigo"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
