export interface ResumeRenderData {
  personal: {
    fullName: string;
    email: string;
    phone: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    location?: string;
  };
  summary?: string;
  education: Array<{ degree: string; branch: string; institution: string; years: string; cgpa?: string }>;
  skills: Array<{ group: string; items: string[] }>;
  projects: Array<{ title: string; description: string; techStack: string[]; links?: { github?: string; live?: string } }>;
  certifications: Array<{ name: string; issuer: string }>;
  experience?: Array<{ role: string; org: string; dates: string; bullets: string[] }>;
  accent: string;
}

function esc(s: string | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// RB-TPL-02 compliance: single column, standard <h2> section headings,
// plain selectable text — no images, no multi-column CSS, no text-in-image.
export function renderResumeHtml(d: ResumeRenderData, watermarked: boolean, appUrl = 'apti.in'): string {
  const contactLine = [d.personal.email, d.personal.phone, d.personal.location, d.personal.github, d.personal.linkedin, d.personal.portfolio]
    .filter(Boolean)
    .map(esc)
    .join(' · ');

  const educationHtml = d.education
    .map(
      (e) => `<div class="entry">
        <div class="entry-title">${esc(e.degree)}${e.branch ? ', ' + esc(e.branch) : ''}</div>
        <div class="entry-sub">${esc(e.institution)} — ${esc(e.years)}${e.cgpa ? ' · CGPA ' + esc(e.cgpa) : ''}</div>
      </div>`,
    )
    .join('');

  const skillsHtml = d.skills
    .map((g) => `<div class="skill-group"><strong>${esc(g.group)}:</strong> ${g.items.map(esc).join(', ')}</div>`)
    .join('');

  const projectsHtml = d.projects
    .map(
      (p) => `<div class="entry">
        <div class="entry-title">${esc(p.title)}${p.techStack?.length ? ' — ' + p.techStack.map(esc).join(', ') : ''}</div>
        <div class="entry-body">${esc(p.description)}</div>
      </div>`,
    )
    .join('');

  const certsHtml = d.certifications
    .map((c) => `<div class="entry-line">${esc(c.name)} — ${esc(c.issuer)}</div>`)
    .join('');

  const experienceHtml = (d.experience ?? [])
    .map(
      (e) => `<div class="entry">
        <div class="entry-title">${esc(e.role)}, ${esc(e.org)}</div>
        <div class="entry-sub">${esc(e.dates)}</div>
        <ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    color: #1a1a1a;
    font-size: 10.5pt;
    line-height: 1.45;
    margin: 0;
  }
  h1 { font-size: 18pt; margin: 0 0 2pt 0; }
  .contact { font-size: 9.5pt; color: #444; margin-bottom: 12pt; }
  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1.5pt solid ${d.accent};
    color: ${d.accent};
    margin: 14pt 0 6pt 0;
    padding-bottom: 2pt;
  }
  .entry { margin-bottom: 8pt; }
  .entry-title { font-weight: 600; }
  .entry-sub { font-size: 9.5pt; color: #555; }
  .entry-body { margin-top: 2pt; }
  .entry-line { margin-bottom: 3pt; }
  .skill-group { margin-bottom: 3pt; }
  ul { margin: 3pt 0 0 14pt; padding: 0; }
  li { margin-bottom: 2pt; }
  .summary { margin-bottom: 4pt; }
  .watermark {
    position: fixed;
    bottom: 8mm;
    left: 0; right: 0;
    text-align: center;
    font-size: 7.5pt;
    color: #aaa;
  }
</style>
</head>
<body>
  <h1>${esc(d.personal.fullName)}</h1>
  <div class="contact">${contactLine}</div>

  ${d.summary ? `<h2>Summary</h2><p class="summary">${esc(d.summary)}</p>` : ''}

  ${d.education.length ? `<h2>Education</h2>${educationHtml}` : ''}
  ${d.skills.length ? `<h2>Skills</h2>${skillsHtml}` : ''}
  ${d.projects.length ? `<h2>Projects</h2>${projectsHtml}` : ''}
  ${experienceHtml ? `<h2>Experience</h2>${experienceHtml}` : ''}
  ${d.certifications.length ? `<h2>Certifications</h2>${certsHtml}` : ''}

  ${watermarked ? `<div class="watermark">Built with APTI · ${appUrl}</div>` : ''}
</body>
</html>`;
}
