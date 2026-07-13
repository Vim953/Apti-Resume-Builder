'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function signInWithProvider(provider: 'google' | 'github') {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function sendPasswordReset() {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setError(resetError ? resetError.message : 'Password reset link sent to your email.');
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-6 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-indigo/10 bg-white shadow-card lg:grid-cols-2">
        <section className="hidden bg-[#F4F2FF] p-10 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo text-sm font-bold text-white">R</div>
            <div className="leading-tight">
              <p className="text-xl font-extrabold leading-none text-ink">APTI</p>
              <p className="mt-1 text-xs text-ink/45">Resume Builder</p>
            </div>
          </div>
          <div className="mt-14 inline-flex w-fit rounded-full bg-indigo/10 px-3 py-1 text-xs font-semibold text-indigo">
            Build. Customize. Get Hired.
          </div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight text-ink">
            Welcome back!<br />Let&apos;s build your<br /><span className="text-indigo">dream resume</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-ink/60">
            Sign in to access your saved resumes, templates and personalized suggestions.
          </p>
          <div className="mt-12 flex flex-1 items-center justify-center">
            <div className="relative h-64 w-80 rounded-3xl bg-indigo/15 p-8 shadow-card">
              <div className="h-full rounded-2xl bg-white/80 p-5">
                <div className="mb-4 h-10 w-10 rounded-full bg-indigo/30" />
                <div className="space-y-2">
                  <div className="h-2 w-40 rounded bg-ink/10" />
                  <div className="h-2 w-52 rounded bg-ink/10" />
                  <div className="h-2 w-44 rounded bg-ink/10" />
                  <div className="h-2 w-36 rounded bg-ink/10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-8 lg:p-14">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-extrabold text-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-ink/55">Sign in to continue to APTI Resume Builder</p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Email address</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-indigo"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-indigo"
                  placeholder="Enter your password"
                />
              </label>
              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex items-center gap-2 text-ink/60">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-indigo" />
                  Remember me
                </label>
                <button type="button" onClick={sendPasswordReset} className="font-semibold text-indigo hover:underline">
                  Forgot password?
                </button>
              </div>
              {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-indigo py-3 text-sm font-bold text-white shadow-card disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8">
              <div className="flex items-center gap-3 text-xs text-ink/40">
                <span className="h-px flex-1 bg-ink/10" />
                <span>or continue with</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => signInWithProvider('google')} className="rounded-xl border border-ink/10 px-4 py-3 text-sm font-bold text-ink hover:border-indigo/30">
                  Google
                </button>
                <button type="button" onClick={() => signInWithProvider('github')} className="rounded-xl border border-ink/10 px-4 py-3 text-sm font-bold text-ink hover:border-indigo/30">
                  GitHub
                </button>
              </div>
            </div>

            <p className="mt-10 text-center text-sm text-ink/55">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-bold text-indigo hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
