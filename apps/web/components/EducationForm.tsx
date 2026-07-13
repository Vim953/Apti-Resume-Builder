'use client';

import { EducationEntry } from '@/lib/types';
import { Field } from './Field';

const EMPTY: EducationEntry = { degree: '', branch: '', institution: '', years: '', cgpa: '' };

export function EducationForm({
  value,
  onChange,
}: {
  value: EducationEntry[];
  onChange: (v: EducationEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<EducationEntry>) =>
    onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { ...EMPTY }]);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Education</h3>
        <button onClick={add} className="text-xs font-semibold text-indigo hover:underline">
          + Add
        </button>
      </div>
      <div className="space-y-4">
        {value.map((e, i) => (
          <div key={i} className="rounded-xl border border-ink/10 p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Degree" value={e.degree} onChange={(v) => update(i, { degree: v })} placeholder="B.E." required />
              <Field label="Branch" value={e.branch} onChange={(v) => update(i, { branch: v })} placeholder="Computer Science" />
              <div className="col-span-2">
                <Field label="Institution" value={e.institution} onChange={(v) => update(i, { institution: v })} required />
              </div>
              <Field label="Years" value={e.years} onChange={(v) => update(i, { years: v })} placeholder="2022–2026" />
              <Field label="CGPA" value={e.cgpa ?? ''} onChange={(v) => update(i, { cgpa: v })} placeholder="8.7" />
            </div>
            <button onClick={() => remove(i)} className="mt-2 text-xs text-danger hover:underline">
              Remove
            </button>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-ink/40">No education added yet.</p>}
      </div>
    </section>
  );
}
