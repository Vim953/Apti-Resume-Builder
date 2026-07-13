'use client';

import { CertEntry, EducationEntry, PersonalInfo, ProjectEntry, SkillGroup, Template, WorkEntry } from '@/lib/types';

function ContactLink({ href, text, className = '' }: { href?: string; text?: string; className?: string }) {
  if (!text) return null;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`hover:underline ${className}`}>
        {text}
      </a>
    );
  }
  return <span className={className}>{text}</span>;
}

function templateVariant(template?: Template | null): 'simple' | 'academic' | 'minimal' | 'executive' | 'professional' | 'creative' {
  const key = `${template?.config?.layout ?? ''} ${template?.name ?? ''} ${template?.config?.headingStyle ?? ''}`.toLowerCase();
  if (key.includes('executive')) return 'executive';
  if (key.includes('professional') || key.includes('modern') || key.includes('indigo') || key.includes('pill')) return 'professional';
  if (key.includes('creative')) return 'creative';
  if (key.includes('minimal') || key.includes('violet')) return 'minimal';
  if (key.includes('academic') || key.includes('classic')) return 'academic';
  return 'simple';
}

export function LivePreview({
  personal,
  education,
  skills,
  projects,
  certs,
  experience,
  internships,
  accent,
  template,
}: {
  personal: PersonalInfo;
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  certs: CertEntry[];
  experience: WorkEntry[];
  internships: WorkEntry[];
  accent: string;
  template?: Template | null;
}) {
  const variant = templateVariant(template);
  const isSidebar = ['executive', 'professional', 'creative', 'minimal'].includes(variant);
  const railColor =
    variant === 'executive' ? '#2F2B27' :
    variant === 'professional' ? '#1057A8' :
    variant === 'creative' ? '#507A44' :
    '#F1ECE2';
  const railDark = variant !== 'minimal';
  const heading = 'mt-4 mb-2 border-b pb-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em]';
  const wrap = 'min-w-0 max-w-full break-words [overflow-wrap:anywhere]';
  const visibleProjects = projects.filter((project) => project.included);
  const visibleCerts = certs.filter((cert) => cert.included);
  const visibleSkills = skills.filter((group) => group.items.length > 0);
  const hasContact = personal.email || personal.phone || personal.location || personal.github || personal.linkedin || personal.portfolio;

  const SectionHeading = ({ children }: { children: string }) => (
    <h2 className={heading} style={{ color: accent, borderColor: `${accent}40` }}>{children}</h2>
  );

  const ContactRow = ({ compact = false, light = false }: { compact?: boolean; light?: boolean }) => {
    if (!hasContact) return <p className={compact ? 'text-[8.5px] opacity-70' : 'text-[9px] text-[#bbb]'}>email - phone - location</p>;
    const textClass = light ? 'text-white/85' : 'text-[#555]';
    return (
      <p className={`${compact ? 'space-y-1 text-[8px]' : 'flex flex-wrap gap-x-1.5 gap-y-0.5 text-[9px]'} ${textClass} ${wrap}`}>
        {personal.email && <ContactLink text={personal.email} href={`mailto:${personal.email}`} className={compact ? 'block' : ''} />}
        {!compact && personal.email && personal.phone && <span className="text-[#ccc]">-</span>}
        {personal.phone && <ContactLink text={personal.phone} className={compact ? 'block' : ''} />}
        {!compact && personal.location && <span className="text-[#ccc]">-</span>}
        {personal.location && <ContactLink text={personal.location} className={compact ? 'block' : ''} />}
        {!compact && personal.github && <span className="text-[#ccc]">-</span>}
        {personal.github && <ContactLink text={personal.github} href={personal.github} className={compact ? 'block' : ''} />}
        {!compact && personal.linkedin && <span className="text-[#ccc]">-</span>}
        {personal.linkedin && <ContactLink text={personal.linkedin} href={personal.linkedin} className={compact ? 'block' : ''} />}
        {!compact && personal.portfolio && <span className="text-[#ccc]">-</span>}
        {personal.portfolio && <ContactLink text={personal.portfolio} href={personal.portfolio} className={compact ? 'block' : ''} />}
      </p>
    );
  };

  const renderWork = (title: string, items: WorkEntry[]) => {
    const visible = items.filter((item) => item.included && (item.role || item.organization || item.description));
    if (!visible.length) return null;
    return (
      <>
        <SectionHeading>{title}</SectionHeading>
        {visible.map((item) => (
          <div key={item.id} className={`mb-2 ${wrap}`}>
            <p className={`font-bold text-[#14121F] ${wrap}`}>
              {item.role}
              {item.organization && <span className="font-normal text-[#555]"> - {item.organization}</span>}
            </p>
            {(item.startDate || item.endDate) && (
              <p className={`text-[8.5px] text-[#777] ${wrap}`}>{[item.startDate, item.endDate].filter(Boolean).join(' - ')}</p>
            )}
            {item.description && <p className={`mt-0.5 text-[#333] ${wrap}`}>{item.description}</p>}
          </div>
        ))}
      </>
    );
  };

  const MainSections = ({ includeSkills = true }: { includeSkills?: boolean }) => (
    <>
      {personal.summary && (
        <>
          <SectionHeading>Summary</SectionHeading>
          <p className={`text-[9px] leading-relaxed text-[#333] ${wrap}`}>{personal.summary}</p>
        </>
      )}

      {education.length > 0 && (
        <>
          <SectionHeading>Education</SectionHeading>
          {education.map((item, i) => (
            <div key={i} className={`mb-1.5 ${wrap}`}>
              <p className={`font-bold text-[#14121F] ${wrap}`}>{item.degree}{item.branch ? `, ${item.branch}` : ''}</p>
              <p className={`text-[#555] ${wrap}`}>{item.institution}{item.years ? ` - ${item.years}` : ''}{item.cgpa ? ` - CGPA ${item.cgpa}` : ''}</p>
            </div>
          ))}
        </>
      )}

      {includeSkills && visibleSkills.length > 0 && (
        <>
          <SectionHeading>Skills</SectionHeading>
          {visibleSkills.map((group) => (
            <p key={group.group} className={`mb-0.5 ${wrap}`}>
              <span className="font-bold capitalize text-[#14121F]">{group.group}:</span>{' '}
              <span className="text-[#444]">{group.items.join(', ')}</span>
            </p>
          ))}
        </>
      )}

      {renderWork('Experience', experience)}
      {renderWork('Internships', internships)}

      {visibleProjects.length > 0 && (
        <>
          <SectionHeading>Projects</SectionHeading>
          {visibleProjects.map((project) => (
            <div key={project.id} className={`mb-2 ${wrap}`}>
              <p className={`font-bold text-[#14121F] ${wrap}`}>
                {project.title}
                {project.techStack.length > 0 && <span className="font-normal text-[#555]"> - {project.techStack.join(', ')}</span>}
              </p>
              {project.description && <p className={`mt-0.5 text-[#333] ${wrap}`}>{project.description}</p>}
              {project.links?.github && <a href={project.links.github} className={`text-[9px] text-[#5B4FE8] hover:underline ${wrap}`} target="_blank" rel="noreferrer">GitHub</a>}
              {project.links?.github && project.links?.live && <span className="mx-1 text-[#ccc]">-</span>}
              {project.links?.live && <a href={project.links.live} className={`text-[9px] text-[#5B4FE8] hover:underline ${wrap}`} target="_blank" rel="noreferrer">Live</a>}
            </div>
          ))}
        </>
      )}

      {visibleCerts.length > 0 && (
        <>
          <SectionHeading>Certifications</SectionHeading>
          {visibleCerts.map((cert) => (
            <p key={cert.id} className={`mb-0.5 text-[#333] ${wrap}`}>
              <span className="font-semibold text-[#14121F]">{cert.name}</span>
              {cert.issuer && <span className="text-[#777]"> - {cert.issuer}</span>}
              {cert.certificateUrl && <a href={cert.certificateUrl} target="_blank" rel="noreferrer" className="ml-1 text-[#5B4FE8] hover:underline">Certificate</a>}
            </p>
          ))}
        </>
      )}
    </>
  );

  const EmptyState = () => (
    !personal.fullName && education.length === 0 && skills.length === 0 && projects.length === 0 && experience.length === 0 && internships.length === 0 ? (
      <div className="py-8 text-center text-[10px] text-[#ccc]">Fill in the form to see your resume here.</div>
    ) : null
  );

  return (
    <div className="sticky top-[76px]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink/40">Live preview</p>
        <span className="text-[10px] text-ink/25">A4 - auto-updates</span>
      </div>

      <div
        className="mx-auto w-full overflow-x-hidden overflow-y-auto rounded-2xl bg-white shadow-card ring-1 ring-ink/6"
        style={{ maxHeight: '70vh', fontFamily: '"Plus Jakarta Sans", Arial, sans-serif' }}
      >
        {isSidebar ? (
          <div className="grid min-h-[560px] grid-cols-[31%_1fr] text-[9.5px] leading-[1.5] text-[#14121F]">
            <aside className={`p-5 ${railDark ? 'text-white' : 'text-[#14121F]'}`} style={{ backgroundColor: railColor }}>
              <div className={`mx-auto mb-4 aspect-square w-16 rounded-full ${railDark ? 'bg-white/85' : 'bg-[#ddd3bf]'}`} />
              <h1 className={`text-center text-[15px] font-extrabold ${railDark ? 'text-white' : 'text-[#14121F]'} ${wrap}`}>{personal.fullName || 'Your Name'}</h1>
              <p className={`mt-1 text-center text-[8px] ${railDark ? 'text-white/70' : 'text-[#555]'}`}>Final Year Student</p>
              <div className={`my-4 h-px ${railDark ? 'bg-white/25' : 'bg-ink/15'}`} />
              <p className="mb-2 text-[8px] font-extrabold uppercase tracking-widest">Contacts</p>
              <ContactRow compact light={railDark} />
              {visibleSkills.length > 0 && (
                <>
                  <div className={`my-4 h-px ${railDark ? 'bg-white/25' : 'bg-ink/15'}`} />
                  <p className="mb-2 text-[8px] font-extrabold uppercase tracking-widest">Skills</p>
                  {visibleSkills.flatMap((group) => group.items).slice(0, 10).map((skill) => (
                    <p key={skill} className={`mb-1 text-[8px] ${railDark ? 'text-white/85' : 'text-[#444]'}`}>- {skill}</p>
                  ))}
                </>
              )}
            </aside>
            <main className="min-w-0 px-6 py-6">
              <MainSections includeSkills={false} />
              <EmptyState />
            </main>
          </div>
        ) : (
          <div className={`px-7 py-7 text-[9.5px] leading-[1.5] text-[#14121F] ${wrap}`}>
            <h1 className={`mb-0.5 ${variant === 'academic' ? 'text-center text-[18px]' : 'text-[17px]'} font-extrabold tracking-tight text-[#14121F] ${wrap}`}>
              {personal.fullName || 'Your Name'}
            </h1>
            {variant === 'academic' ? (
              <div className="mb-2 text-center">
                <ContactRow />
              </div>
            ) : (
              <ContactRow />
            )}
            <MainSections />
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
}
