import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium } from 'playwright-core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';
import { renderResumeHtml, ResumeRenderData } from './render-template';

function slugFileName(fullName: string): string {
  // RB-EXP-02: deterministic filename, e.g. Rahul_Sharma_Resume.pdf
  const safe = (fullName || 'Resume').trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
  return `${safe || 'Resume'}_Resume.pdf`;
}

@Injectable()
export class PdfService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  // RB-EXP-01: selectable (not rasterised) text so ATS can parse it.
  // RB-EXP-02: watermark footer for Free plan exports.
  async renderAndStore(resumeId: string, data: ResumeRenderData, watermarked: boolean): Promise<{ url: string; fileName: string }> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'apti.in';
    const html = renderResumeHtml(data, watermarked, appUrl);

    // Optional override for serverless hosts (e.g. @sparticuz/chromium on
    // Vercel/Lambda) — see README "Deploy" section. Falls back to the
    // Chromium binary installed by the `postinstall` script locally.
    const executablePath = this.config.get<string>('CHROMIUM_EXECUTABLE_PATH') || undefined;
    const browser = await chromium.launch({ headless: true, executablePath });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
      });

      const fileName = slugFileName(data.personal.fullName ?? '');
      const path = `resumes/${resumeId}/${fileName}`;

      const { error } = await this.supabase.storage
        .from('resume-exports')
        .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });
      if (error) {
        return { url: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`, fileName };
      }

      // NF-SEC-03: signed, expiring URL rather than a public one.
      const { data: signed, error: signErr } = await this.supabase.storage
        .from('resume-exports')
        .createSignedUrl(path, 60 * 60); // 1 hour
      if (signErr) {
        return { url: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`, fileName };
      }

      return { url: signed.signedUrl, fileName };
    } finally {
      await browser.close();
    }
  }
}
