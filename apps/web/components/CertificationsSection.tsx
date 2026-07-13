'use client';

import { CertEntry } from '@/lib/types';

const emptyCert = (): CertEntry => ({
  id: `local-${Date.now()}`,
  name: '',
  issuer: '',
  included: true,
});

export function CertificationsSection({
  value,
  onChange,
}: {
  value: CertEntry[];
  onChange: (v: CertEntry[]) => void;
}) {
  const add = () => onChange([...value, emptyCert()]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<CertEntry>) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const toggle = (i: number) => update(i, { included: !value[i].included });
  const upload = (i: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update(i, { certificateUrl: String(reader.result), certificateFileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink">Certifications</h3>
          <p className="mt-1 text-xs text-ink/40">Add certificates you want shown on this resume.</p>
        </div>
        <button onClick={add} className="text-xs font-semibold text-indigo hover:underline">
          + Add
        </button>
      </div>

      <div className="space-y-3">
        {value.map((c, i) => (
          <div key={c.id} className={`rounded-xl border p-3 ${c.included ? 'border-ink/10' : 'border-ink/5 opacity-60'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs text-ink/60">
                <input type="checkbox" checked={c.included} onChange={() => toggle(i)} />
                Include
              </label>
              <button onClick={() => remove(i)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={c.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="Certificate name"
              />
              <input
                value={c.issuer}
                onChange={(e) => update(i, { issuer: e.target.value })}
                className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo"
                placeholder="Issuer"
              />
              <label className="rounded-lg border border-dashed border-ink/15 px-3 py-2 text-xs text-ink/50 sm:col-span-2">
                <span className="font-medium text-ink/60">Upload certificate</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => upload(i, e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-xs"
                />
                {c.certificateFileName && (
                  <a href={c.certificateUrl} target="_blank" rel="noreferrer" className="mt-1 block text-indigo hover:underline">
                    {c.certificateFileName}
                  </a>
                )}
              </label>
            </div>
          </div>
        ))}
        {value.length === 0 && <p className="text-xs text-ink/40">No certifications added yet.</p>}
      </div>
    </section>
  );
}
