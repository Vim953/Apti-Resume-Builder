import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AtsService } from './ats.service';
import { ResumeSectionLike } from './ats.types';

class ScoreRequestDto {
  sections!: ResumeSectionLike[];
  targetKeywords?: string[];
}

// RB-ATS-01/02/03: live 0-100 score, weighted-sum breakdown, actionable fixes.
// Kept as a stateless scoring endpoint; ResumesService persists the result
// to ats_scores + mirrors it onto resumes.ats_score after each edit.
@UseGuards(SupabaseAuthGuard)
@Controller('ats')
export class AtsController {
  constructor(private readonly ats: AtsService) {}

  @Post('score')
  score(@Body() body: ScoreRequestDto) {
    return this.ats.score(body.sections, body.targetKeywords ?? []);
  }
}
