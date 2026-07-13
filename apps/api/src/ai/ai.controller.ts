import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { SupabaseAuthGuard, AuthedRequest } from '../auth/supabase-auth.guard';
import { AiService } from './ai.service';
import { CreditsService } from './credits.service';
import { AiEventsService } from './ai-events.service';

class ImproveDto {
  @IsUUID()
  resumeId!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  studentContext?: string;

  @IsOptional()
  @IsIn(['free', 'pro'])
  plan?: 'free' | 'pro';
}

class TipDto {
  @IsUUID()
  resumeId!: string;

  @IsArray()
  @IsString({ each: true })
  currentSkills!: string[];

  @IsString()
  targetRole!: string;

  @IsOptional()
  @IsString()
  targetCompany?: string;

  @IsOptional()
  @IsIn(['free', 'pro'])
  plan?: 'free' | 'pro';
}

class DescDto {
  @IsUUID()
  resumeId!: string;

  @IsString()
  title!: string;

  @IsArray()
  @IsString({ each: true })
  techStack!: string[];

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  studentContext?: string;

  @IsOptional()
  @IsIn(['free', 'pro'])
  plan?: 'free' | 'pro';
}

class SummaryDto {
  @IsUUID()
  resumeId!: string;

  @IsString()
  profileContext!: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsIn(['free', 'pro'])
  plan?: 'free' | 'pro';
}

class AcceptDto {
  @IsUUID()
  eventId!: string;

  @IsBoolean()
  accepted!: boolean;
}

// RB-AI-04: every AI suggestion returns as an accept/reject diff — this
// controller never writes AI output directly into resume_sections. The
// client applies the diff locally and calls /ai/accept to record the
// decision in resume_ai_events.
@UseGuards(SupabaseAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly credits: CreditsService,
    private readonly events: AiEventsService,
  ) {}

  @Post('improve')
  async improve(@Req() req: AuthedRequest, @Body() body: ImproveDto) {
    await this.credits.assertAndConsume(req.studentId, req.plan, 1);
    const result = await this.ai.improve(body.text, body.targetRole, body.studentContext);
    const eventId = await this.events.log(body.resumeId, 'improve', body.text, result.output, result);
    return { eventId, ...result };
  }

  @Post('tip')
  async tip(@Req() req: AuthedRequest, @Body() body: TipDto) {
    await this.credits.assertAndConsume(req.studentId, req.plan, 1);
    const result = await this.ai.tip(body.currentSkills, body.targetRole, body.targetCompany);
    const eventId = await this.events.log(body.resumeId, 'tip', body.currentSkills.join(','), result.output, result);
    return { eventId, ...result };
  }

  @Post('project-description')
  async description(@Req() req: AuthedRequest, @Body() body: DescDto) {
    await this.credits.assertAndConsume(req.studentId, req.plan, 1);
    const result = await this.ai.projectDescription(body.title, body.techStack, body.targetRole, body.studentContext);
    const eventId = await this.events.log(body.resumeId, 'desc', body.title, result.output, result);
    return { eventId, ...result };
  }

  @Post('summary')
  async summary(@Req() req: AuthedRequest, @Body() body: SummaryDto) {
    await this.credits.assertAndConsume(req.studentId, req.plan, 1);
    const result = await this.ai.summary(body.profileContext, body.targetRole);
    const eventId = await this.events.log(body.resumeId, 'summary', body.profileContext, result.output, result);
    return { eventId, ...result };
  }

  @Post('accept')
  async accept(@Body() body: AcceptDto) {
    await this.events.setAccepted(body.eventId, body.accepted);
    return { ok: true };
  }
}
