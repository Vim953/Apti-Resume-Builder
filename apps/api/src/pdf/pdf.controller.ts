import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsObject, IsString } from 'class-validator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PdfService } from './pdf.service';
import { ResumeRenderData } from './render-template';

class ExportDto {
  @IsString()
  resumeId!: string;

  @IsObject()
  data!: ResumeRenderData;

  @IsBoolean()
  watermarked!: boolean;
}

// NF-PERF-03: target ~4s export. Playwright/Chromium render is the
// dominant cost — keep the HTML template lightweight (no web fonts fetch,
// no external images) to hit that budget.
@UseGuards(SupabaseAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdf: PdfService) {}

  @Post('export')
  export(@Body() body: ExportDto) {
    return this.pdf.renderAndStore(body.resumeId, body.data, body.watermarked);
  }
}
