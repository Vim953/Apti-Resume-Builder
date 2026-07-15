import { Body, ConflictException, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../supabase/supabase.module';

class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  portfolio?: string;

  @IsArray()
  education!: Array<Record<string, unknown>>;

  @IsArray()
  skills!: Array<Record<string, unknown>>;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    const metadata = {
      fullName: body.fullName,
      phone: body.phone,
      location: body.location,
      targetRole: body.targetRole ?? '',
      github: body.github ?? '',
      linkedin: body.linkedin ?? '',
      portfolio: body.portfolio ?? '',
      education: body.education,
      skills: body.skills,
    };

    const { data, error } = await this.supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('exists') || error.status === 422) {
        throw new ConflictException('An account with this email already exists. Please sign in instead.');
      }
      throw new InternalServerErrorException(error.message);
    }

    const userId = data.user?.id;
    if (!userId) {
      throw new InternalServerErrorException('Could not create account');
    }

    const { error: profileError } = await this.supabase.from('profiles').upsert({
      id: userId,
      plan: 'free',
      email: body.email,
      full_name: body.fullName,
      phone: body.phone,
      location: body.location,
      github: body.github ?? '',
      linkedin: body.linkedin ?? '',
      portfolio: body.portfolio ?? '',
      target_role: body.targetRole ?? '',
      education: body.education,
      skills: body.skills,
    });

    if (profileError) {
      throw new InternalServerErrorException(profileError.message);
    }

    return { ok: true };
  }
}
