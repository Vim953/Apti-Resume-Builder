'use client';

import { useState } from 'react';
import { ProjectEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { AIImproveDiff } from './AIImproveDiff';

const emptyProject = (): ProjectEntry => ({
  id: `local-${Date.now()}`,
  title: '',
  description: '',
  techStack: [],
  links: {},
  included: true,
});

export function ProjectsSection({
  value,
  onChange,
  resumeId,
  targetRole,
  plan,
  studentContext,
}: {
  value: ProjectEntry[];
  onChange: (v: ProjectEntry[]) => void;
  resumeId: string;
  targetRole: string;
  plan: 'free' | 'pro';
  studentContext: string;
}) {
  const [diff, setDiff] = useState<{ index: number; suggestion: string; eventId: string } | null>(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [techDrafts, setTechDrafts] = useState<Record<string, string>>({});

  const add = () => onChange([...value, emptyProject()]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<ProjectEntry>) =>
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const toggleInclude = (i: number) => update(i, { included: !value[i].included });
  const parseTech = (text: string) => text.split(',').map((item) => item.trim()).filter(Boolean);
  const techText = (p: ProjectEntry) => techDrafts[p.id] ?? p.techStack.join(', ');
  const setTech = (p: ProjectEntry, text: string) => {
    setTechDrafts((current) => ({ ...current, [p.id]: text }));
    update(value.findIndex((item) => item.id === p.id), { techStack: parseTech(text) });
  };
  const inferTechStack = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('resume')) return ['React', 'Node.js', 'Supabase', 'Tailwind CSS'];
    if (lower.includes('library')) return ['React', 'Node.js', 'SQL', 'Supabase'];
    if (lower.includes('ecommerce') || lower.includes('shop')) return ['React', 'Node.js', 'MongoDB', 'Stripe'];
    if (lower.includes('portfolio')) return ['Next.js', 'Tailwind CSS', 'TypeScript'];
    if (lower.includes('ai') || lower.includes('ml')) return ['Python', 'Machine Learning', 'SQL'];
    return ['React', 'Node.js', 'SQL'];
  };

  async function improve(i: number) {
    setBusyIndex(i);
    setGateMsg(null);
    try {
      const p = value[i];
      const context = `${studentContext}\nProject tools: ${p.techStack.join(', ')}`;
      const result = await api.ai.improve(resumeId, p.description, plan, targetRole, context);
      setDiff({ index: i, suggestion: result.output, eventId: result.eventId });
    } catch (e: any) {
      setGateMsg(e.body?.code === 'UPGRADE_REQUIRED' ? e.body.reason : e.message);
    } finally {
      setBusyIndex(null);
    }
  }

  async function generateDescription(i: number) {
    setBusyIndex(i);
    setGateMsg(null);
    try {
      const p = value[i];
      const techStack = p.techStack.length ? p.techStack : inferTechStack(p.title);
      if (!p.techStack.length) {
        setTechDrafts((current) => ({ ...current, [p.id]: techStack.join(', ') }));
      }
      const result = await api.ai.projectDescription(resumeId, p.title, techStack, plan, targetRole, studentContext);
      update(i, { techStack, description: result.output });
      await api.ai.accept(result.eventId, true);
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
          <h3 className="text-sm font-bold text-ink">Projects</h3>
          <p className="mt-1 text-xs text-ink/40">Add projects manually or improve descriptions with AI.</p>
        </div>
        <button onClick={add} className="text-xs font-semibold text-indigo hover:underline">
          + Add
        </button>
      </div>

      {gateMsg && <div className="mb-3 rounded-xl bg-amber/10 px-3 py-2 text-xs text-amber">{gateMsg}</div>}

      <div className="space-y-3">
        {value.map((p, i) => (
          <div key={p.id} className={`rounded-xl border p-3 ${p.included ? 'border-ink/10' : 'border-ink/5 opacity-60'}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs text-ink/60">
                <input type="checkbox" checked={p.included} onChange={() => toggleInclude(i)} />
                Include
              </label>
              <button onClick={() => remove(i)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={p.title}
                onChange={(e) => update(i, { title: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="Project title"
              />
              <input
                value={techText(p)}
                onChange={(e) => setTech(p, e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="Tech stack, comma separated"
              />
              <textarea
                value={p.description}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="What did you build and what was the result?"
              />
              <input
                value={p.links?.github ?? ''}
                onChange={(e) => update(i, { links: { ...(p.links ?? {}), github: e.target.value } })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="GitHub link"
              />
              <input
                value={p.links?.live ?? ''}
                onChange={(e) => update(i, { links: { ...(p.links ?? {}), live: e.target.value } })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="Live/demo link"
              />
            </div>

            <div className="mt-2 flex gap-3 text-xs font-semibold">
              <button onClick={() => generateDescription(i)} disabled={busyIndex === i || !p.title} className="text-violet hover:underline disabled:opacity-50">
                {busyIndex === i ? 'Generating...' : 'Generate description'}
              </button>
              <button onClick={() => improve(i)} disabled={busyIndex === i || !p.description} className="text-violet hover:underline disabled:opacity-50">
                {busyIndex === i ? 'Improving...' : 'AI Improve'}
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-ink/40">No projects added yet.</p>}
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
