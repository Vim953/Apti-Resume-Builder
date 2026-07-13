'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Resume } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';

function atsColor(score: number | null): string {
  if (score === null) return 'text-ink/40 bg-ink/5';
  if (score >= 75) return 'text-success bg-success/10';
  if (score >= 50) return 'text-amber bg-amber/10';
  return 'text-danger bg-danger/10';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DashboardContent() {
  const { plan, user } = useAuth();
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState('Dashboard');

  useEffect(() => {
    api.resumes.list().then(setResumes).catch((e) => setError(e.message));
  }, []);

  async function deleteResume(id: string) {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.resumes.remove(id);
      setResumes((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const nav = ['Dashboard', 'Resumes', 'Templates', 'AI Tools', 'ATS Checker', 'Cover Letters', 'Saved Content', 'Billing & Plans', 'Settings'];
  const panelCopy: Record<string, { title: string; body: string; actions: string[] }> = {
    'AI Tools': {
      title: 'AI Tools',
      body: 'Use Generate with AI, AI Improve, project descriptions, and skill tips from inside the resume editor.',
      actions: ['Open a resume', 'Go to Professional Summary', 'Use AI Improve on projects or experience'],
    },
    'ATS Checker': {
      title: 'ATS Checker',
      body: 'ATS score is recalculated after resume edits. Open a resume and check the score card in the right panel.',
      actions: ['Open a resume', 'Fill skills/projects', 'Download an ATS-friendly PDF'],
    },
    'Cover Letters': {
      title: 'Cover Letters',
      body: 'Cover letter generation is planned. Current AI features are focused on resume content.',
      actions: ['Use resume summary', 'Use project descriptions', 'Export resume first'],
    },
    'Saved Content': {
      title: 'Saved Content',
      body: 'Saved resume sections are available inside each resume through autosaved sections.',
      actions: ['Open resume', 'Edit section', 'Autosave stores changes'],
    },
    'Billing & Plans': {
      title: 'Billing & Plans',
      body: 'Free plan is configured for one resume and basic templates. Pro controls can be wired to payment later.',
      actions: ['1 Resume', '15 AI actions/month product limit', 'PDF export'],
    },
    Settings: {
      title: 'Settings',
      body: 'Account settings are handled through your signed-in Supabase account. Profile data is collected during signup.',
      actions: ['Sign out', 'Create a new account', 'Update resume profile fields'],
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFAFD]">
      <div className="grid min-h-screen lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-ink/8 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-ink/8 px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo text-sm font-bold text-white">R</div>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="text-xl font-extrabold leading-5 text-ink">APTI</p>
              <p className="text-xs leading-4 text-ink/45">Resume Builder</p>
            </div>
          </div>

          <nav className="space-y-1 p-4 text-sm">
            {nav.map((item) => (
              item === 'Templates' ? (
                <Link
                  key={item}
                  href="/templates"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-ink/70 hover:bg-indigo/5 hover:text-indigo"
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  <span>{item}</span>
                </Link>
              ) : (
                <button
                  key={item}
                  onClick={() => {
                    setActivePanel(item);
                    setError(null);
                    if (item === 'Resumes') document.getElementById('resumes')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activePanel === item ? 'bg-indigo/8 text-indigo' : 'text-ink/70 hover:bg-indigo/5 hover:text-indigo'}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  <span>{item}</span>
                </button>
              )
            ))}
          </nav>

          <div className="mx-4 mt-auto rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
            <p className="text-xs text-ink/50">You are on</p>
            <p className="font-bold text-indigo">{plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
            <ul className="mt-4 space-y-2 text-xs text-ink/60">
              <li>1 Resume</li>
              <li>15 AI actions / month</li>
              <li>Export in PDF</li>
            </ul>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/8">
              <div className="h-full w-1/5 rounded-full bg-indigo" />
            </div>
            <button onClick={() => setError('Plans page is coming soon.')} className="mt-4 w-full rounded-xl bg-indigo px-4 py-2.5 text-sm font-bold text-white">
              Upgrade to Pro
            </button>
          </div>

          <div className="m-4 rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
            <p className="font-bold text-ink">Need help?</p>
            <p className="mt-1 text-xs text-ink/50">Check our guides or contact support.</p>
            <button onClick={() => setError('Support page is coming soon.')} className="mt-3 text-sm font-bold text-indigo">Get Help</button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-end border-b border-ink/8 bg-white/90 px-6 backdrop-blur">
            <UserMenu />
          </header>

          <main className="mx-auto max-w-7xl px-6 py-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-lg font-bold text-indigo">Welcome back, {user?.email?.split('@')[0] ?? 'there'}!</p>
                <h1 className="text-4xl font-extrabold text-ink">Resume Builder</h1>
                <p className="mt-3 text-sm text-ink/55">Build professional resumes that get you hired.</p>
              </div>
              <Link href="/templates" className="rounded-xl bg-indigo px-6 py-3 text-sm font-bold text-white shadow-card hover:bg-indigo/90">
                + Create Resume
              </Link>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
                <p className="flex-1 text-sm text-danger">{error}</p>
                <button onClick={() => setError(null)} className="text-lg leading-none text-danger/70 hover:text-danger">x</button>
              </div>
            )}

            {activePanel !== 'Dashboard' && activePanel !== 'Resumes' && panelCopy[activePanel] && (
              <section className="mb-8 rounded-2xl border border-indigo/15 bg-white p-6 shadow-card">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo">{activePanel}</p>
                <h2 className="mt-2 text-2xl font-extrabold text-ink">{panelCopy[activePanel].title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{panelCopy[activePanel].body}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {panelCopy[activePanel].actions.map((action) => (
                    <div key={action} className="rounded-xl bg-indigo/6 px-4 py-3 text-sm font-semibold text-ink/70">
                      {action}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Resume Created', resumes?.length ?? 0],
                ['AI Actions Used', '3 / 15'],
                ['Templates Used', 0],
                ['Downloads This Month', 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
                  <p className="text-3xl font-extrabold text-ink">{value}</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{label}</p>
                </div>
              ))}
            </div>

            <section id="resumes" className="mt-10">
              <h2 className="mb-5 text-xl font-extrabold text-ink">Your Resumes</h2>
              {!resumes ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {[0, 1].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-ink/5" />)}
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {resumes.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-indigo/20 bg-white p-5 shadow-card">
                      <div className="flex gap-5">
                        <Link href={`/resume/${r.id}`} className="h-52 w-36 shrink-0 overflow-hidden rounded-xl border border-ink/8 bg-white p-3 shadow-sm">
                          <div className="mb-2 h-4 w-24 rounded bg-indigo/20" />
                          <div className="space-y-2">
                            {[0, 1, 2, 3, 4, 5].map((line) => <div key={line} className="h-1.5 rounded bg-ink/10" />)}
                          </div>
                        </Link>
                        <div className="min-w-0 flex-1 py-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${atsColor(r.ats_score)}`}>
                            {r.ats_score !== null ? `ATS ${r.ats_score}` : 'Not scored'}
                          </span>
                          <h3 className="mt-5 truncate text-xl font-extrabold text-ink">{r.title}</h3>
                          <p className="mt-2 text-sm text-ink/55">Last edited on {formatDate(r.updated_at)}</p>
                          <div className="mt-8 flex flex-wrap gap-3">
                            <Link href={`/resume/${r.id}`} className="rounded-xl border border-ink/10 px-5 py-2 text-sm font-bold text-ink hover:border-indigo hover:text-indigo">Edit</Link>
                            <Link href={`/resume/${r.id}`} className="rounded-xl border border-ink/10 px-5 py-2 text-sm font-bold text-ink hover:border-indigo hover:text-indigo">Preview</Link>
                            <button onClick={() => deleteResume(r.id)} disabled={deletingId === r.id} className="rounded-xl border border-danger/20 px-5 py-2 text-sm font-bold text-danger hover:bg-danger/5 disabled:opacity-50">
                              {deletingId === r.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}

                  <Link href="/templates" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/12 bg-white p-8 text-center shadow-sm hover:border-indigo/40">
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10 text-3xl text-indigo">+</span>
                    <span className="text-lg font-extrabold text-ink">Create New Resume</span>
                    <span className="mt-2 max-w-xs text-sm text-ink/55">Start building your next career-winning resume.</span>
                  </Link>
                </div>
              )}
            </section>

            {resumes && plan === 'free' && (
              <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-indigo/15 bg-indigo/5 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-extrabold text-ink">Unlock more with APTI Pro</p>
                  <p className="mt-2 text-sm text-ink/60">Unlimited resumes, premium templates, full AI improve, ATS scoring, and no watermark on exports.</p>
                </div>
                <button onClick={() => setError('Plans page is coming soon.')} className="rounded-xl bg-indigo px-6 py-3 text-sm font-bold text-white">See Plans & Pricing</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
