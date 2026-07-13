'use client';

import { Template } from '@/lib/types';

export function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  onUpgradeNeeded,
}: {
  templates: Template[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpgradeNeeded: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <h3 className="mb-3 text-sm font-bold text-ink">Templates</h3>
      <div className="flex gap-3 overflow-x-auto">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => (t.locked ? onUpgradeNeeded() : onSelect(t.id))}
            className={`relative w-28 shrink-0 rounded-2xl border bg-white p-2 text-left transition hover:-translate-y-0.5 ${
              selectedId === t.id ? 'border-indigo shadow-card' : 'border-ink/10'
            } ${t.locked ? 'opacity-55' : ''}`}
          >
            <div className="mb-2 h-20 w-full rounded-xl border border-ink/5 bg-white p-2 shadow-sm" style={{ borderTop: `3px solid ${t.config.accent}` }}>
              <div className="mb-1 h-2 w-12 rounded-full" style={{ backgroundColor: t.config.accent }} />
              <div className="mb-2 h-1.5 w-16 rounded-full bg-ink/15" />
              <div className="mb-1 h-px w-full" style={{ backgroundColor: `${t.config.accent}55` }} />
              <div className="space-y-1">
                <div className="h-1.5 w-20 rounded-full bg-ink/10" />
                <div className="h-1.5 w-14 rounded-full bg-ink/10" />
                <div className="h-1.5 w-18 rounded-full bg-ink/10" />
              </div>
            </div>
            <p className="text-[10px] font-semibold text-ink">{t.name}</p>
            {t.locked && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] text-ink/50">Pro</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
