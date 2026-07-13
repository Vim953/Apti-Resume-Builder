'use client';

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/60">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo disabled:bg-ink/5 disabled:text-ink/55 ${
          error ? 'border-danger' : 'border-ink/15'
        }`}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function validateEmail(v: string): string | null {
  if (!v) return 'Email is required';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address';
}

export function validateUrl(v: string): string | null {
  if (!v) return null; // optional fields
  return /^https?:\/\/[^\s]+$/i.test(v) ? null : 'Enter a full URL starting with https://';
}
