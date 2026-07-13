import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthedRequest, SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { TemplatesService } from './templates.service';

@UseGuards(SupabaseAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.templates.listForPlan(req.plan);
  }
}
