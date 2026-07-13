import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ResumesModule } from './resumes/resumes.module';
import { AtsModule } from './ats/ats.module';
import { AiModule } from './ai/ai.module';
import { TemplatesModule } from './templates/templates.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // NF-COST-01: per-student caps prevent runaway spend — throttle as a
    // first line of defense in front of the AI credit ledger itself.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    SupabaseModule,
    AuthModule,
    ResumesModule,
    AtsModule,
    AiModule,
    TemplatesModule,
    IntegrationsModule,
    PdfModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
