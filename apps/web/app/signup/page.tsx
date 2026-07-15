'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function SignupPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [institution, setInstitution] = useState('');
  const [years, setYears] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [languages, setLanguages] = useState('');
  const [frameworks, setFrameworks] = useState('');
  const [tools, setTools] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const csv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError('Please accept the terms and privacy policy to continue.');
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      email,
      password,
      fullName,
      phone,
      location,
      targetRole,
      github,
      linkedin,
      portfolio,
      education: degree || institution ? [{ degree, branch, institution, years, cgpa }] : [],
      skills: [
        { group: 'languages', items: csv(languages) },
        { group: 'frameworks', items: csv(frameworks) },
        { group: 'tools', items: csv(tools) },
      ],
    };

    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!signupRes.ok) {
      const body = await signupRes.json().catch(() => ({}));
      setLoading(false);
      setError(typeof body?.message === 'string' ? body.message : 'Could not create account');
      return;
    }
    setLoading(false);
    router.push('/login?created=1');
  }

  async function signInWithProvider(provider: 'google' | 'github') {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] p-4">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-indigo/10 bg-white shadow-card lg:grid-cols-[340px_minmax(0,1fr)_380px]">
        <aside className="hidden bg-[#F4F2FF] p-8 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo text-sm font-bold text-white">R</div>
            <div className="leading-tight">
              <p className="text-xl font-extrabold leading-none text-ink">APTI</p>
              <p className="mt-1 text-xs text-ink/45">Resume Builder</p>
            </div>
          </div>
          <p className="mt-16 inline-flex rounded-full bg-indigo/10 px-3 py-1 text-xs font-semibold text-indigo">Create. Customize. Get Hired.</p>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight text-ink">
            Create your professional resume <span className="text-indigo">in minutes</span>
          </h1>
          <p className="mt-5 text-sm leading-7 text-ink/60">Sign up and let us help you build a standout resume that gets you noticed.</p>
          <div className="mt-12 rounded-3xl bg-indigo/15 p-8">
            <div className="mx-auto h-56 w-44 rounded-2xl bg-white p-5 shadow-card">
              <div className="mb-4 h-10 w-10 rounded-full bg-indigo/30" />
              <div className="space-y-2">
                <div className="h-2 w-28 rounded bg-ink/10" />
                <div className="h-2 w-32 rounded bg-ink/10" />
                <div className="h-2 w-24 rounded bg-ink/10" />
                <div className="h-2 w-28 rounded bg-ink/10" />
              </div>
            </div>
          </div>
        </aside>

        <section className="p-8 lg:p-10">
          <h1 className="text-2xl font-extrabold text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-ink/55">Tell us a few details to get started.</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-ink/60">Full name <span className="text-danger">*</span></span>
            <input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Your name" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Email <span className="text-danger">*</span></span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="you@example.com" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Password <span className="text-danger">*</span></span>
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="At least 6 characters" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Phone <span className="text-danger">*</span></span>
            <input required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="9876543210" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Location <span className="text-danger">*</span></span>
            <input required value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Bengaluru, India" />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-ink/60">Target role <span className="text-danger">*</span></span>
            <input required value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Software Engineer" />
          </label>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-3 sm:col-span-2 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink sm:col-span-2">Education <span className="text-danger">*</span></p>
            <input required value={degree} onChange={(e) => setDegree(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Degree *" />
            <input required value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Branch *" />
            <input required value={institution} onChange={(e) => setInstitution(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo sm:col-span-2" placeholder="Institution *" />
            <input required value={years} onChange={(e) => setYears(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Years, e.g. 2022-2026 *" />
            <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="CGPA" />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Languages</span>
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Java, Python, SQL" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Frameworks</span>
            <input value={frameworks} onChange={(e) => setFrameworks(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="React, Node.js" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Tools</span>
            <input value={tools} onChange={(e) => setTools(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-indigo" placeholder="Git, Docker" />
          </label>

          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger sm:col-span-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo px-4 py-3 text-sm font-semibold text-white shadow-card hover:opacity-90 disabled:opacity-50 sm:col-span-2">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/50">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo hover:underline">
            Sign in
          </Link>
        </p>
        </section>

        <aside className="border-t border-ink/8 p-8 lg:border-l lg:border-t-0 lg:p-10">
          <h2 className="text-lg font-bold text-ink">Professional Links</h2>
          <p className="mt-1 text-sm text-ink/50">Add links to help showcase your work.</p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">GitHub Profile</span>
              <input value={github} onChange={(e) => setGithub(e.target.value)} className="w-full rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-indigo" placeholder="https://github.com/username" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">LinkedIn Profile</span>
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-indigo" placeholder="https://linkedin.com/in/username" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">Portfolio / Website</span>
              <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="w-full rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-indigo" placeholder="https://yourportfolio.com" />
            </label>
          </div>
          <div className="mt-8 rounded-2xl bg-indigo/8 p-5">
            <p className="font-bold text-ink">Why we collect this information?</p>
            <p className="mt-2 text-sm leading-6 text-ink/60">We use these details to auto-fill your resume and give personalized suggestions.</p>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Profile Photo</h2>
            <p className="mt-1 text-sm text-ink/50">Optional, used only for templates that show a photo.</p>
            <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-indigo/40 bg-indigo/5 px-5 py-8 text-center text-sm font-semibold text-indigo hover:bg-indigo/10">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? '')}
              />
              {photoName || 'Click to upload'}
            </label>
          </div>
          <label className="mt-8 flex items-start gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-indigo"
            />
            <span>I agree to the Terms of Service and Privacy Policy.</span>
          </label>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => signInWithProvider('google')} className="rounded-xl border border-ink/10 px-4 py-3 text-sm font-bold text-ink hover:border-indigo/30">
              Google
            </button>
            <button type="button" onClick={() => signInWithProvider('github')} className="rounded-xl border border-ink/10 px-4 py-3 text-sm font-bold text-ink hover:border-indigo/30">
              GitHub
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
