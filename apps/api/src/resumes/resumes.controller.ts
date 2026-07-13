import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthedRequest, SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ResumesService } from './resumes.service';
import { CreateResumeDto, UpdateResumeDto, UpsertSectionDto, ReorderSectionsDto } from './dto';

@UseGuards(SupabaseAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumes: ResumesService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.resumes.list(req.accessToken);
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.resumes.get(req.accessToken, id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateResumeDto) {
    return this.resumes.create(req.accessToken, req.studentId, req.plan, dto);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateResumeDto) {
    return this.resumes.update(req.accessToken, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.resumes.remove(req.accessToken, id);
  }

  @Post(':id/sections')
  upsertSection(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpsertSectionDto) {
    return this.resumes.upsertSection(req.accessToken, id, dto);
  }

  @Patch(':id/sections/reorder')
  reorder(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: ReorderSectionsDto) {
    return this.resumes.reorderSections(req.accessToken, id, dto);
  }

  @Post(':id/ats/recompute')
  recomputeAts(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body('targetKeywords') targetKeywords: string[] = [],
  ) {
    return this.resumes.recomputeAts(req.accessToken, id, targetKeywords);
  }

  @Post(':id/duplicate')
  duplicate(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.resumes.duplicate(req.accessToken, req.studentId, req.plan, id);
  }
}
