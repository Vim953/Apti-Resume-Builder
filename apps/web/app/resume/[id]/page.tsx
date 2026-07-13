'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Resume,
  ResumeSection,
  Template,
  AtsResult,
  PersonalInfo,
  EducationEntry,
  SkillGroup,
  ProjectEntry,
  CertEntry,
  WorkEntry,
} from '@/lib/types';
import { PersonalInfoForm } from '@/components/PersonalInfoForm';
import { SummaryForm } from '@/components/SummaryForm';
import { EducationForm } from '@/components/EducationForm';
import { SkillsForm } from '@/components/SkillsForm';
import { ProjectsSection } from '@/components/ProjectsSection';
import { CertificationsSection } from '@/components/CertificationsSection';
import { WorkSection } from '@/components/WorkSection';
import { LivePreview } from '@/components/LivePreview';
import { ATSScoreBadge } from '@/components/ATSScoreBadge';
import { TemplateSelector } from '@/components/TemplateSelector';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useAuth } from '@/lib/auth-context';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';

function findSection(sections: ResumeSection[] | undefined, type: string) {
  return sections?.find((s) => s.type === type);
}

function firstFilled<T>(current: T | undefined, fallback: T | undefined): T | undefined {
  if (typeof current === 'string') return (current.trim() ? current : fallback) as T | undefined;
  return current ?? fallback;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function EmptySection({ title }: { title: string }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <p className="mt-2 text-xs text-ink/45">This section can be added next. Use Projects, Education, Skills, and Certifications for the current resume content.</p>
    </section>
  );
}

function ResumeEditorContent() {
  const { id } = useParams<{ id: string }>();
  const { plan } = useAuth();

  const [resume, setResume] = useState<Resume | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [ats, setAts] = useState<AtsResult | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Personal Info');
  const [profileTargetRole, setProfileTargetRole] = useState('');

  const [personal, setPersonal] = useState<PersonalInfo>({});
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [skills, setSkills] = useState<SkillGroup[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [certs, setCerts] = useState<CertEntry[]>([]);
  const [experience, setExperience] = useState<WorkEntry[]>([]);
  const [internships, setInternships] = useState<WorkEntry[]>([]);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [r, tpls] = await Promise.all([api.resumes.get(id), api.templates.list()]);
      setResume(r);
      setTemplates(tpls);

      const personalSec = findSection(r.sections, 'personal');
      const eduSec = findSection(r.sections, 'education');
      const skillsSec = findSection(r.sections, 'skills');
      const projSec = findSection(r.sections, 'projects');
      const certSec = findSection(r.sections, 'certs');
      const expSec = findSection(r.sections, 'experience');

      const currentPersonal = personalSec?.content ?? {};
      const currentEducation = eduSec?.content?.items ?? [];
      const currentSkills = skillsSec?.content?.groups ?? [];
      const currentProjects = projSec?.content?.items ?? [];
      const currentCerts = certSec?.content?.items ?? [];
      const currentExperience = expSec?.content?.items ?? [];
      const currentInternships = expSec?.content?.internships ?? [];

      try {
        const prefill = await api.integrations.prefill();
        setProfileTargetRole(prefill.profile?.targetRole ?? '');
        setPersonal({
          fullName: firstFilled(currentPersonal.fullName, prefill.profile?.fullName),
          email: firstFilled(currentPersonal.email, prefill.profile?.email),
          phone: firstFilled(currentPersonal.phone, prefill.profile?.phone),
          location: firstFilled(currentPersonal.location, prefill.profile?.location),
          github: firstFilled(currentPersonal.github, prefill.profile?.github),
          linkedin: firstFilled(currentPersonal.linkedin, prefill.profile?.linkedin),
          portfolio: firstFilled(currentPersonal.portfolio, prefill.profile?.portfolio),
          summary: currentPersonal.summary,
        });
        setEducation(currentEducation.length ? currentEducation : prefill.profile?.education ?? []);
        setSkills(currentSkills.length ? currentSkills : prefill.profile?.skills ?? []);
        setProjects(currentProjects.length ? currentProjects : (prefill.projects ?? []).map((p: any) => ({ ...p, included: true })));
        setCerts(currentCerts.length ? currentCerts : (prefill.certifications ?? []).map((c: any) => ({ id: c.id, name: c.name, issuer: c.issuer, included: true })));
        setExperience(currentExperience);
        setInternships(currentInternships);
      } catch {
        setPersonal(currentPersonal);
        setEducation(currentEducation);
        setSkills(currentSkills);
        setProjects(currentProjects);
        setCerts(currentCerts);
        setExperience(currentExperience);
        setInternships(currentInternships);
      }
    })();
  }, [id]);

  const autosave = useCallback(
    (type: string, content: unknown) => {
      if (!resume) return;
      setSaveState('saving');
      clearTimeout(saveTimers.current[type]);
      saveTimers.current[type] = setTimeout(async () => {
        try {
          setSaveError(null);
          const existing = findSection(resume.sections, type);
          const savedSection = await api.resumes.upsertSection(resume.id, {
            id: existing?.id,
            type: type as ResumeSection['type'],
            order: existing?.order ?? 0,
            visible: existing?.visible ?? true,
            content: content as Record<string, unknown>,
          });
          setResume((current) => current && current.id === resume.id
            ? {
                ...current,
                sections: [
                  ...(current.sections ?? []).filter((section) => section.type !== savedSection.type),
                  savedSection,
                ],
              }
            : current);
          setAts(null);
          api.resumes.recomputeAts(resume.id).then(setAts).catch(() => undefined);
          setSaveState('saved');
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaveState('idle'), 2000);
        } catch (e: any) {
          setSaveError(e.message);
          setSaveState('error');
        }
      }, 600);
    },
    [resume],
  );

  const saveSectionNow = useCallback(
    async (type: ResumeSection['type'], content: Record<string, unknown>) => {
      if (!resume) return;
      setSaveState('saving');
      const existing = findSection(resume.sections, type);
      const savedSection = await api.resumes.upsertSection(resume.id, {
        id: existing?.id,
        type,
        order: existing?.order ?? 0,
        visible: existing?.visible ?? true,
        content,
      });
      setResume((current) => current && current.id === resume.id
        ? {
            ...current,
            sections: [
              ...(current.sections ?? []).filter((section) => section.type !== savedSection.type),
              savedSection,
            ],
          }
        : current);
      setAts(null);
      api.resumes.recomputeAts(resume.id).then(setAts).catch(() => undefined);
      setSaveError(null);
      setSaveState('saved');
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2000);
    },
    [resume],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resume) autosave('personal', personal); }, [personal]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resume) autosave('education', { items: education }); }, [education]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resume) autosave('skills', { groups: skills }); }, [skills]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resume) autosave('projects', { items: projects }); }, [projects]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resume) autosave('certs', { items: certs }); }, [certs]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resume) autosave('experience', { items: experience, internships }); }, [experience, internships]);

  async function selectTemplate(templateId: string) {
    if (!resume) return;
    const updated = await api.resumes.update(resume.id, { templateId } as any);
    setResume(updated);
  }

  async function exportPdf() {
    if (!resume) return;
    setExporting(true);
    try {
      const selectedTemplate = templates.find((t) => t.id === resume.template_id) ?? templates[0];
      const { url, fileName } = await api.pdf.export(
        resume.id,
        {
          personal,
          summary: personal.summary,
          education,
          skills,
          projects: projects.filter((p) => p.included),
          experience: experience.filter((item) => item.included).map((item) => ({
            role: item.role,
            org: item.organization,
            dates: [item.startDate, item.endDate].filter(Boolean).join(' - '),
            bullets: item.description ? [item.description] : [],
          })),
          certifications: certs.filter((c) => c.included).map((c) => ({ name: c.name, issuer: c.issuer })),
          accent: selectedTemplate?.config.accent ?? '#5B4FE8',
        },
        resume.watermarked,
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function saveCurrentAndContinue() {
    try {
      if (activeSection === 'Personal Info' || activeSection === 'Professional Summary' || activeSection === 'Social Links') {
        await saveSectionNow('personal', personal as Record<string, unknown>);
      } else if (activeSection === 'Education') {
        await saveSectionNow('education', { items: education });
      } else if (activeSection === 'Skills') {
        await saveSectionNow('skills', { groups: skills });
      } else if (activeSection === 'Projects') {
        await saveSectionNow('projects', { items: projects });
      } else if (activeSection === 'Certifications') {
        await saveSectionNow('certs', { items: certs });
      } else if (activeSection === 'Experience' || activeSection === 'Internships') {
        await saveSectionNow('experience', { items: experience, internships });
      }
      setActiveSection(nextSection);
    } catch (e: any) {
      setSaveError(e.message);
      setSaveState('error');
    }
  }

  if (!resume) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFD]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo/20 border-t-indigo" />
      </div>
    );
  }

  const selectedTemplate = templates.find((t) => t.id === resume.template_id) ?? templates[0];
  const effectiveTargetRole = resume.target_role ?? profileTargetRole;
  const aiContext = [
    personal.fullName && `Name: ${personal.fullName}`,
    personal.email && `Email: ${personal.email}`,
    personal.phone && `Phone: ${personal.phone}`,
    personal.location && `Location: ${personal.location}`,
    effectiveTargetRole && `Target role: ${effectiveTargetRole}`,
    education.length && `Education: ${education.map((e) => `${e.degree} ${e.branch} at ${e.institution} (${e.years})`).join('; ')}`,
    skills.length && `Skills: ${skills.map((g) => `${g.group}: ${g.items.join(', ')}`).join('; ')}`,
    projects.length && `Projects: ${projects.filter((p) => p.included).map((p) => `${p.title} (${p.techStack.join(', ')})`).join('; ')}`,
    experience.length && `Experience: ${experience.filter((item) => item.included).map((item) => `${item.role} at ${item.organization}: ${item.description}`).join('; ')}`,
    internships.length && `Internships: ${internships.filter((item) => item.included).map((item) => `${item.role} at ${item.organization}: ${item.description}`).join('; ')}`,
    certs.length && `Certifications: ${certs.filter((c) => c.included).map((c) => `${c.name} - ${c.issuer}`).join('; ')}`,
  ]
    .filter(Boolean)
    .join('\n');
  const completionItems = [
    { label: 'Personal Info', ok: Boolean(personal.fullName && personal.email && personal.phone) },
    { label: 'Summary', ok: Boolean(personal.summary) },
    { label: 'Education', ok: education.length > 0 },
    { label: 'Projects', ok: projects.some((p) => p.included && p.title) },
    { label: 'Skills', ok: skills.some((g) => g.items.length > 0) },
    { label: 'Certifications', ok: certs.some((c) => c.included && c.name) },
    { label: 'Experience', ok: experience.some((item) => item.included && item.role) },
    { label: 'Internships', ok: internships.some((item) => item.included && item.role) },
  ];
  const completion = Math.round((completionItems.filter((item) => item.ok).length / completionItems.length) * 100);
  const navItems = ['Personal Info', 'Professional Summary', 'Experience', 'Education', 'Projects', 'Skills', 'Certifications', 'Achievements', 'Internships', 'Social Links', 'Interests'];
  const currentIndex = Math.max(0, navItems.indexOf(activeSection));
  const nextSection = navItems[(currentIndex + 1) % navItems.length];
  const sectionOk = (label: string) => {
    if (label === 'Personal Info' || label === 'Social Links') return Boolean(personal.fullName && personal.email && personal.phone);
    if (label === 'Professional Summary') return Boolean(personal.summary);
    if (label === 'Education') return education.length > 0;
    if (label === 'Projects') return projects.some((p) => p.included && p.title);
    if (label === 'Skills') return skills.some((g) => g.items.length > 0);
    if (label === 'Certifications') return certs.some((c) => c.included && c.name);
    if (label === 'Experience') return experience.some((item) => item.included && item.role);
    if (label === 'Internships') return internships.some((item) => item.included && item.role);
    return false;
  };
  const jumpSections = navItems.filter((label) => label !== activeSection).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAFD]">
      <div className="grid min-h-screen lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-ink/8 bg-white lg:block">
          <div className="flex h-20 items-center gap-3 border-b border-ink/8 px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo text-sm font-bold text-white">R</div>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="text-xl font-extrabold leading-5 text-ink">APTI</p>
              <p className="text-xs leading-4 text-ink/45">Resume Builder</p>
            </div>
          </div>
          <nav className="space-y-1 p-3">
            {navItems.map((label, index) => (
              <button
                key={label}
                onClick={() => setActiveSection(label)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${activeSection === label ? 'bg-indigo/8 text-indigo' : 'text-ink/70 hover:bg-indigo/5 hover:text-indigo'}`}
              >
                <span>{label}</span>
                <span className={`h-2 w-2 rounded-full ${sectionOk(label) ? 'bg-success/70' : 'bg-amber/60'}`} />
              </button>
            ))}
          </nav>
          <div className="mx-4 mt-4 rounded-2xl bg-indigo/5 p-4">
            <p className="text-sm font-bold text-ink">Need Help?</p>
            <p className="mt-1 text-xs text-ink/50">Read the guide or contact support.</p>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-ink/8 bg-white/95 px-4 backdrop-blur">
            <Link href="/dashboard" className="rounded-xl px-3 py-2 text-sm text-ink/50 hover:bg-ink/5">Back</Link>
            <div className="h-5 w-px bg-ink/10" />
            <div className="min-w-0 flex-1">
              <input
                value={resume.title}
                onChange={(e) => setResume({ ...resume, title: e.target.value })}
                onBlur={() => api.resumes.update(resume.id, { title: resume.title } as any)}
                className="w-full bg-transparent text-sm font-semibold text-ink outline-none"
                aria-label="Resume title"
              />
              <div className="truncate text-[10px] font-medium">
                {saveState === 'saving' && <span className="text-ink/40">Saving...</span>}
                {saveState === 'saved' && <span className="text-success">Saved</span>}
                {saveState === 'error' && <span className="text-danger">{saveError ? `Save failed - ${saveError}` : 'Save failed'}</span>}
              </div>
            </div>
            <Link href="/templates" className="hidden rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink shadow-sm md:block">Templates</Link>
            <button onClick={() => setActiveSection('Professional Summary')} className="hidden rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink shadow-sm md:block">AI Tools</button>
            <button onClick={exportPdf} disabled={exporting} className="rounded-xl bg-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-card disabled:opacity-50">
              {exporting ? 'Exporting...' : 'Download PDF'}
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="hidden rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink shadow-sm sm:block"
            >
              Share
            </button>
            <UserMenu />
          </header>

          <div className="grid gap-5 p-4 xl:grid-cols-[280px_minmax(0,1fr)_230px] 2xl:grid-cols-[300px_minmax(0,1fr)_260px]">
            <main className="min-w-0 space-y-4">
              {activeSection === 'Personal Info' && <PersonalInfoForm value={personal} onChange={setPersonal} />}
              {activeSection === 'Professional Summary' && (
                <SummaryForm value={personal.summary ?? ''} onChange={(summary) => setPersonal({ ...personal, summary })} resumeId={resume.id} targetRole={effectiveTargetRole} plan={plan} education={education} skills={skills} projects={projects} personal={personal} />
              )}
              {activeSection === 'Education' && <EducationForm value={education} onChange={setEducation} />}
              {activeSection === 'Projects' && <ProjectsSection value={projects} onChange={setProjects} resumeId={resume.id} targetRole={effectiveTargetRole} plan={plan} studentContext={aiContext} />}
              {activeSection === 'Skills' && <SkillsForm value={skills} onChange={setSkills} resumeId={resume.id} targetRole={effectiveTargetRole} plan={plan} />}
              {activeSection === 'Certifications' && <CertificationsSection value={certs} onChange={setCerts} />}
              {activeSection === 'Experience' && (
                <WorkSection title="Experience" roleLabel="Role / Position" orgLabel="Company" value={experience} onChange={setExperience} resumeId={resume.id} targetRole={effectiveTargetRole} plan={plan} studentContext={aiContext} />
              )}
              {activeSection === 'Achievements' && <EmptySection title="Achievements" />}
              {activeSection === 'Internships' && (
                <WorkSection title="Internships" roleLabel="Internship role" orgLabel="Company / Organization" value={internships} onChange={setInternships} resumeId={resume.id} targetRole={effectiveTargetRole} plan={plan} studentContext={aiContext} />
              )}
              {activeSection === 'Social Links' && <PersonalInfoForm value={personal} onChange={setPersonal} />}
              {activeSection === 'Interests' && <EmptySection title="Interests" />}
              {activeSection === 'Templates' && <TemplateSelector templates={templates} selectedId={resume.template_id} onSelect={selectTemplate} onUpgradeNeeded={() => setUpgradeReason('Unlock the full template library with Pro.')} />}
              <div className="space-y-3">
                {jumpSections.map((label) => (
                  <button
                    key={label}
                    onClick={() => setActiveSection(label)}
                    className="flex w-full items-center justify-between rounded-xl border border-ink/8 bg-white px-4 py-3 text-left text-sm shadow-sm hover:border-indigo/25 hover:text-indigo"
                  >
                    <span className="font-semibold">{label}</span>
                    <span className={sectionOk(label) ? 'text-success' : 'text-amber'}>{sectionOk(label) ? 'Done' : 'Add'}</span>
                  </button>
                ))}
              </div>
            </main>

            <section className="min-w-0">
              <LivePreview personal={personal} education={education} skills={skills} projects={projects} certs={certs} experience={experience} internships={internships} accent={selectedTemplate?.config.accent ?? '#5B4FE8'} template={selectedTemplate} />
            </section>

            <aside className="min-w-0 space-y-4">
              <ATSScoreBadge result={ats} />
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Completion</h3>
                  <span className="text-sm font-bold text-indigo">{completion}%</span>
                </div>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink/8">
                  <div className="h-full rounded-full bg-indigo" style={{ width: `${completion}%` }} />
                </div>
                <div className="space-y-2">
                  {completionItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setActiveSection(item.label === 'Summary' ? 'Professional Summary' : item.label)}
                      className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 text-left text-xs hover:bg-indigo/5"
                    >
                      <span className={item.ok ? 'text-ink' : 'text-ink/45'}>{item.label}</span>
                      <span className={item.ok ? 'text-success' : 'text-amber'}>{item.ok ? 'Done' : 'Add'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
                <h3 className="mb-3 text-sm font-bold text-ink">Suggestions</h3>
                <div className="space-y-2 text-xs text-ink/60">
                  <p>Add measurable outcomes to project bullets.</p>
                  <p>Add certificates with proof links or uploads.</p>
                  <p>Use AI after filling skills and target role.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {upgradeReason && <UpgradePrompt reason={upgradeReason} onClose={() => setUpgradeReason(null)} />}
    </div>
  );
}

export default function ResumeEditorPage() {
  return (
    <AuthGuard>
      <ResumeEditorContent />
    </AuthGuard>
  );
}
