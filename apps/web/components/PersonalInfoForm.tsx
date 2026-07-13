'use client';

import { PersonalInfo } from '@/lib/types';
import { Field, validateEmail, validateUrl } from './Field';

export function PersonalInfoForm({
  value,
  onChange,
  locked = false,
}: {
  value: PersonalInfo;
  onChange: (v: PersonalInfo) => void;
  locked?: boolean;
}) {
  const set = (k: keyof PersonalInfo) => (v: string) => onChange({ ...value, [k]: v });

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="mb-3 text-sm font-bold text-ink">Personal info</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Full name" value={value.fullName ?? ''} onChange={set('fullName')} required disabled={locked} />
        </div>
        <Field label="Email" value={value.email ?? ''} onChange={set('email')} error={validateEmail(value.email ?? '')} required disabled={locked} />
        <Field label="Phone" value={value.phone ?? ''} onChange={set('phone')} required disabled={locked} />
        <Field label="Location" value={value.location ?? ''} onChange={set('location')} placeholder="Bengaluru, India" disabled={locked} />
        <Field label="GitHub" value={value.github ?? ''} onChange={set('github')} error={validateUrl(value.github ?? '')} placeholder="https://github.com/…" />
        <Field label="LinkedIn" value={value.linkedin ?? ''} onChange={set('linkedin')} error={validateUrl(value.linkedin ?? '')} placeholder="https://linkedin.com/in/…" />
        <Field label="Portfolio" value={value.portfolio ?? ''} onChange={set('portfolio')} error={validateUrl(value.portfolio ?? '')} placeholder="https://…" />
      </div>
    </section>
  );
}
