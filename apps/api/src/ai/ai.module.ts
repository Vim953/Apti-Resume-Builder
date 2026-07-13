import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CreditsService } from './credits.service';
import { AiEventsService } from './ai-events.service';

@Module({
  controllers: [AiController],
  providers: [AiService, CreditsService, AiEventsService],
  exports: [AiService, CreditsService],
})
export class AiModule {}
