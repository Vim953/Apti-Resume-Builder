'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Template } from '@/lib/types';

type TemplateId = 'simple' | 'academic' | 'minimal' | 'executive' | 'professional' | 'creative';

const templateList: Array<{
  id: TemplateId;
  name: string;
  group: 'basic' | 'premium';
  subtitle: string;
  tags: string[];
}> = [
  { id: 'simple', name: 'Simple Clean', group: 'basic', subtitle: 'Free clean layout for students', tags: ['ATS Friendly', 'One Page', 'A4 Size'] },
  { id: 'academic', name: 'Academic ATS', group: 'premium', subtitle: 'Best for students and freshers', tags: ['ATS Friendly', 'One Page', 'Clean Layout'] },
  { id: 'minimal', name: 'Minimal', group: 'premium', subtitle: 'Clean and minimal design', tags: ['Minimal', 'One Page', 'Easy to Edit'] },
  { id: 'executive', name: 'Executive', group: 'premium', subtitle: 'For experienced professionals', tags: ['Premium', 'Leadership', 'A4 Size'] },
  { id: 'professional', name: 'Professional', group: 'premium', subtitle: 'Modern and professional', tags: ['Modern', 'ATS Friendly', 'A4 Size'] },
  { id: 'creative', name: 'Creative', group: 'premium', subtitle: 'Stand out with style', tags: ['Creative', 'Profile', 'A4 Size'] },
];

function ResumeMock({ id, large = false, full = false }: { id: TemplateId; large?: boolean; full?: boolean }) {
  const h = full ? 'h-[72vh]' : large ? 'h-[310px]' : 'h-24';
  const academic = id === 'academic';
  const darkRail = id === 'executive';
  const blueRail = id === 'professional';
  const greenRail = id === 'creative';
  const simple = id === 'simple';
  const railColor =
    id === 'executive' ? 'bg-[#37322D]' :
    blueRail ? 'bg-[#1057A8]' :
    greenRail ? 'bg-[#507A44]' :
    'bg-[#F1ECE2]';
  const line = 'h-1.5 rounded-full bg-ink/10';

  return (
    <div className={`${h} overflow-hidden rounded-xl border border-ink/8 bg-white shadow-sm`}>
      <div className={`grid h-full ${simple || academic ? 'grid-cols-1' : 'grid-cols-[30%_1fr]'}`}>
        {!simple && !academic && (
          <aside className={`${railColor} p-2 ${darkRail || blueRail || greenRail ? 'text-white' : 'text-ink'}`}>
            <div className={`mx-auto mb-2 aspect-square w-9 rounded-full ${darkRail || blueRail || greenRail ? 'bg-white/85' : 'bg-[#ddd3bf]'}`} />
            <div className="mb-3 h-px bg-current opacity-20" />
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-1 rounded-full bg-current opacity-25" />)}
            </div>
          </aside>
        )}
        <main className="p-2.5">
          {academic ? (
            <div className="mb-2 text-center">
              <div className="mx-auto mb-1 h-2.5 w-28 rounded bg-ink/70" />
              <div className="mx-auto h-1 w-44 rounded bg-ink/15" />
            </div>
          ) : (
            <div className={`mb-2 h-2.5 rounded ${simple ? 'w-36 bg-indigo' : blueRail ? 'w-24 bg-[#1057A8]' : greenRail ? 'w-24 bg-[#507A44]' : 'w-24 bg-ink/50'}`} />
          )}
          {['Education', 'Experience', 'Projects', 'Skills'].map((section, index) => (
            <section key={section} className={large || full ? 'mb-4' : 'mb-1.5'}>
              <p className={`mb-2 border-b pb-1 text-[7px] font-bold uppercase tracking-widest ${simple ? 'border-indigo/25 text-indigo' : academic ? 'border-ink/30 text-ink/80' : 'border-ink/15 text-ink/70'}`}>
                {section}
              </p>
              <div className="space-y-1.5">
                <div className={`${line} ${index % 2 ? 'w-8/12' : 'w-11/12'}`} />
                <div className={`${line} w-10/12`} />
                {(large || full) && <div className={`${line} w-7/12`} />}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const nav = [
    ['Dashboard', '/dashboard'],
    ['Resumes', '/dashboard#resumes'],
    ['Templates', '/templates'],
    ['AI Tools', '/dashboard'],
    ['ATS Checker', '/dashboard'],
    ['Cover Letters', '/dashboard'],
    ['Saved Content', '/dashboard'],
    ['Billing & Plans', '/dashboard'],
    ['Settings', '/dashboard'],
  ];

  return (
    <aside className="hidden h-screen border-r border-ink/8 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-ink/8 px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo text-sm font-bold text-white shadow-card">R</div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xl font-extrabold leading-5 text-ink">APTI</p>
          <p className="text-xs leading-4 text-ink/45">Resume Builder</p>
        </div>
      </div>
      <nav className="space-y-1 p-4 text-sm">
        {nav.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${label === 'Templates' ? 'bg-indigo/10 text-indigo' : 'text-ink/65 hover:bg-indigo/5 hover:text-indigo'}`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mx-5 mt-auto rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
        <p className="font-bold text-indigo">Free Plan</p>
        <ul className="mt-3 space-y-1.5 text-xs text-ink/60">
          <li>1 Resume</li>
          <li>Simple Clean Template</li>
          <li>PDF Export</li>
          <li>AI on first resume</li>
        </ul>
        <button className="mt-4 w-full rounded-xl border border-indigo px-4 py-2 text-sm font-bold text-indigo">Upgrade to Pro</button>
      </div>
      <div className="m-5 rounded-2xl border border-ink/8 bg-white p-4 text-xs text-ink/55 shadow-sm">
        <p className="font-bold text-ink">Need help?</p>
        <p className="mt-1">Check guides or contact support.</p>
      </div>
    </aside>
  );
}

function PremiumTemplateModal({ templateName, onClose }: { templateName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo/10 text-sm font-extrabold text-indigo">PRO</div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-indigo">Premium Template</p>
              <h2 className="mt-1 text-xl font-extrabold text-ink">Unlock {templateName}</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full px-2 text-xl leading-none text-ink/40 hover:bg-ink/5 hover:text-ink">x</button>
        </div>

        <p className="mt-4 text-sm leading-6 text-ink/60">This template is available exclusively for Pro users.</p>

        <div className="mt-5 rounded-2xl bg-indigo/5 p-4">
          <p className="text-sm font-bold text-ink">What you&apos;ll unlock:</p>
          <div className="mt-3 grid gap-2 text-sm text-ink/70 sm:grid-cols-2">
            {['20+ Premium Templates', 'Unlimited Resumes', 'AI Resume Review', 'Cover Letter Generator', 'Unlimited PDF Exports'].map((item) => (
              <p key={item} className="flex items-center gap-2">
                <span className="text-success">✓</span>
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between rounded-2xl border border-ink/8 p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink/40">Current Plan</p>
            <p className="mt-1 font-extrabold text-ink">FREE</p>
          </div>
          <p className="text-2xl font-extrabold text-ink">₹299 <span className="text-sm font-semibold text-ink/45">/ month</span></p>
        </div>

        <div className="mt-6">
          <button onClick={onClose} className="w-full rounded-xl bg-indigo px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-indigo/90">Upgrade to Pro</button>
        </div>
      </div>
    </div>
  );
}

function FullPreviewModal({ template, onClose }: { template: (typeof templateList)[number]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-5xl flex-col rounded-3xl border border-ink/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-indigo">Full Template Preview</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">{template.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-bold text-ink hover:border-indigo hover:text-indigo">Close</button>
        </div>
        <div className="min-h-0 overflow-auto rounded-2xl bg-[#FAFAFD] p-4">
          <ResumeMock id={template.id} full />
        </div>
      </div>
    </div>
  );
}

function TemplatesContent() {
  const router = useRouter();
  const { plan } = useAuth();
  const [selected, setSelected] = useState<TemplateId>('simple');
  const [premiumTemplate, setPremiumTemplate] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);
  const [fullPreview, setFullPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const selectedTemplate = useMemo(() => templateList.find((template) => template.id === selected)!, [selected]);
  const basic = templateList.filter((template) => template.group === 'basic');
  const premium = templateList.filter((template) => template.group === 'premium');

  useEffect(() => {
    api.templates.list().then(setDbTemplates).catch(() => setDbTemplates([]));
  }, []);

  function backendTemplateFor(template: typeof selectedTemplate, source = dbTemplates): Template | undefined {
    const byName = source.find((item) => item.name.toLowerCase() === template.name.toLowerCase());
    if (byName) return byName;
    if (template.id === 'simple') {
      return source.find((item) => item.plan_min === 'free') ?? source[0];
    }
    return source.find((item) => item.plan_min === 'pro' && item.name.toLowerCase().includes(template.id));
  }

  async function useTemplate() {
    setTemplateError(null);
    setCreating(true);
    try {
      let templates = dbTemplates;
      if (!templates.length) {
        templates = await api.templates.list();
        setDbTemplates(templates);
      }
      const backendTemplate = backendTemplateFor(selectedTemplate, templates);
      if (selectedTemplate.group === 'premium' && !backendTemplate) {
        setTemplateError('Template catalog is still loading. Please try again.');
        return;
      }
      const resume = await api.resumes.create(plan, 'Untitled Resume', backendTemplate?.id);
      router.push(`/resume/${resume.id}`);
    } catch (e: any) {
      if (selectedTemplate.group === 'basic') {
        const existing = await api.resumes.list();
        if (existing[0]?.id) {
          router.push(`/resume/${existing[0].id}`);
          return;
        }
        setTemplateError(e.message ?? 'Could not open the free resume. Please try again.');
        return;
      }
      setPremiumTemplate(selectedTemplate.name);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFD] text-ink">
      <div className="grid h-full lg:grid-cols-[250px_minmax(0,1fr)]">
        <Sidebar />
        <div className="min-w-0 overflow-hidden">
          <header className="flex h-20 items-center justify-between border-b border-ink/8 bg-white/90 px-8 backdrop-blur">
            <div />
            <div className="flex items-center gap-4">
              <button className="relative h-10 w-10 rounded-xl border border-ink/10 text-ink/60">!</button>
              <UserMenu />
            </div>
          </header>

          <main className="grid h-[calc(100vh-80px)] gap-5 px-8 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.95fr)]">
            <section className="min-w-0 overflow-hidden">
              <div className="mb-4">
                <h1 className="text-3xl font-extrabold text-ink">Templates</h1>
                <p className="mt-2 text-sm text-ink/55">Choose a template to start building your resume</p>
              </div>

              <div className="space-y-4">
                <section>
                  <h2 className="text-lg font-extrabold text-ink">Basic Templates (Free)</h2>
                  <p className="mt-1 text-xs text-ink/55">These templates are available for free users.</p>
                  <div className="mt-3 grid max-w-md gap-3">
                    {basic.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelected(template.id)}
                        className={`relative rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${selected === template.id ? 'border-indigo ring-2 ring-indigo/15' : 'border-ink/10'}`}
                      >
                        <ResumeMock id={template.id} />
                        {selected === template.id && <span className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo text-white">✓</span>}
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-ink">{template.name}</p>
                            <p className="mt-1 text-xs text-ink/50">{template.subtitle}</p>
                          </div>
                          <span className="rounded-lg bg-success/10 px-3 py-1 text-xs font-bold text-success">FREE</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-ink/8" />

                <section>
                  <h2 className="text-lg font-extrabold text-ink">Premium Templates (Pro)</h2>
                  <p className="mt-1 text-xs text-ink/55">Upgrade to Pro to unlock premium templates.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {premium.slice(0, 3).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelected(template.id)}
                        className={`relative rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${selected === template.id ? 'border-indigo ring-2 ring-indigo/15' : 'border-ink/10'}`}
                      >
                        <ResumeMock id={template.id} />
                        <span className="absolute right-5 top-5 rounded-full bg-indigo/10 px-3 py-1 text-xs font-bold text-indigo">PRO</span>
                        <p className="mt-3 font-bold text-ink">{template.name}</p>
                        <p className="mt-1 text-xs text-ink/50">{template.subtitle}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </section>

            <aside className="min-w-0">
              <div className="h-full rounded-2xl border border-ink/8 bg-white p-5 shadow-card">
                <h2 className="text-lg font-extrabold text-ink">Preview</h2>
                <div className="mt-4">
                  <ResumeMock id={selected} large />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-extrabold text-ink">{selectedTemplate.name}</h3>
                      <span className={`rounded-lg px-3 py-1 text-xs font-bold ${selectedTemplate.group === 'basic' ? 'bg-success/10 text-success' : 'bg-indigo/10 text-indigo'}`}>
                        {selectedTemplate.group === 'basic' ? 'FREE' : 'PRO'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/55">{selectedTemplate.subtitle}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-ink/60">
                  {selectedTemplate.tags.map((tag) => <div key={tag} className="rounded-xl bg-indigo/6 px-3 py-3 text-center font-semibold">{tag}</div>)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setFullPreview(true)} className="rounded-xl border border-ink/10 px-5 py-3 text-sm font-bold text-ink hover:border-indigo hover:text-indigo">Preview Full Size</button>
                  <button onClick={useTemplate} disabled={creating} className="rounded-xl bg-indigo px-5 py-3 text-sm font-bold text-white shadow-card hover:bg-indigo/90 disabled:opacity-60">
                    {creating ? 'Creating...' : 'Use This Template'}
                  </button>
                </div>
                {templateError && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">{templateError}</p>}
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-indigo/5 p-3 text-xs">
                  <p className="text-ink/65">You can create 1 resume with your free plan.</p>
                  <button onClick={() => setPremiumTemplate('APTI Pro')} className="font-bold text-indigo">Upgrade Now</button>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
      {premiumTemplate && <PremiumTemplateModal templateName={premiumTemplate} onClose={() => setPremiumTemplate(null)} />}
      {fullPreview && <FullPreviewModal template={selectedTemplate} onClose={() => setFullPreview(false)} />}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <AuthGuard>
      <TemplatesContent />
    </AuthGuard>
  );
}
