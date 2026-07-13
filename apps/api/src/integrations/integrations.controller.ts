import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthedRequest, SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { IntegrationsService } from './integrations.service';

// Backs the "self-build" flow (SRS §2.1): first thing the editor calls when
// a resume is opened, so most content is present before the student types.
@UseGuards(SupabaseAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('prefill')
  prefill(@Req() req: AuthedRequest) {
    return this.integrations.prefill(req.studentId);
  }
}
