import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { AtsModule } from '../ats/ats.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [AtsModule, IntegrationsModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
