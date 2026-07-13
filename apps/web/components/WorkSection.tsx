'use client';

import { useState } from 'react';
import { WorkEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { AIImproveDiff } from './AIImproveDiff';

const emptyWork = (title: string): WorkEntry => ({
  id: `local-${Date.now()}`,
  role: '',
  organization: '',
  startDate: '',
  endDate: '',
  description: '',
  included: true,
});

export function WorkSection({
  title,
  roleLabel,
  orgLabel,
  value,
  onChange,
  resumeId,
  targetRole,
  plan,
  studentContext,
}: {
  title: string;
  roleLabel: string;
  orgLabel: string;
  value: WorkEntry[];
  onChange: (v: WorkEntry[]) => void;
  resumeId: string;
  targetRole: string;
  plan: 'free' | 'pro';
  studentContext: string;
}) {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [diff, setDiff] = useState<{ index: number; suggestion: string; eventId: string } | null>(null);

  const add = () => onChange([...value, emptyWork(title)]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<WorkEntry>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  const toggle = (i: number) => update(i, { included: !value[i].included });

  async function improve(i: number) {
    setBusyIndex(i);
    setGateMsg(null);
    try {
      const item = value[i];
      const context = [
        studentContext,
        `${roleLabel}: ${item.role}`,
        `${orgLabel}: ${item.organization}`,
        `Dates: ${item.startDate ?? ''} - ${item.endDate ?? ''}`,
      ].join('\n');
      const result = await api.ai.improve(resumeId, item.description, plan, targetRole, context);
      setDiff({ index: i, suggestion: result.output, eventId: result.eventId });
    } catch (e: any) {
      setGateMsg(e.body?.code === 'UPGRADE_REQUIRED' ? e.body.reason : e.message);
    } finally {
      setBusyIndex(null);
    }
  }

  async function resolveDiff(accept: boolean) {
    if (!diff) return;
    await api.ai.accept(diff.eventId, accept);
    if (accept) update(diff.index, { description: diff.suggestion });
    setDiff(null);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <p className="mt-1 text-xs text-ink/40">Add entries and improve descriptions with AI.</p>
        </div>
        <button onClick={add} className="text-xs font-semibold text-indigo hover:underline">
          + Add
        </button>
      </div>

      {gateMsg && <div className="mb-3 rounded-xl bg-amber/10 px-3 py-2 text-xs text-amber">{gateMsg}</div>}

      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={item.id} className={`rounded-xl border p-3 ${item.included ? 'border-ink/10' : 'border-ink/5 opacity-60'}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs text-ink/60">
                <input type="checkbox" checked={item.included} onChange={() => toggle(i)} />
                Include
              </label>
              <button onClick={() => remove(i)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={item.role}
                onChange={(e) => update(i, { role: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder={roleLabel}
              />
              <input
                value={item.organization}
                onChange={(e) => update(i, { organization: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder={orgLabel}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={item.startDate ?? ''}
                  onChange={(e) => update(i, { startDate: e.target.value })}
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                  placeholder="Start date"
                />
                <input
                  value={item.endDate ?? ''}
                  onChange={(e) => update(i, { endDate: e.target.value })}
                  className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                  placeholder="End date"
                />
              </div>
              <textarea
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="Describe what you did, built, improved, or learned."
              />
            </div>

            <button
              onClick={() => improve(i)}
              disabled={busyIndex === i || !item.description}
              className="mt-2 text-xs font-semibold text-violet hover:underline disabled:opacity-50"
            >
              {busyIndex === i ? 'Improving...' : 'AI Improve'}
            </button>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-ink/40">No entries added yet.</p>}
      </div>

      {diff && (
        <AIImproveDiff
          original={value[diff.index].description}
          suggestion={diff.suggestion}
          onAccept={() => resolveDiff(true)}
          onReject={() => resolveDiff(false)}
        />
      )}
    </section>
  );
}
