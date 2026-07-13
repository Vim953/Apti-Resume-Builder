import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateResumeDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;
}

export class UpdateResumeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

const SECTION_TYPES = ['personal', 'education', 'skills', 'projects', 'certs', 'experience', 'custom'] as const;

export class UpsertSectionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsIn(SECTION_TYPES)
  type!: (typeof SECTION_TYPES)[number];

  @IsInt()
  @Min(0)
  order!: number;

  @IsBoolean()
  visible!: boolean;

  @IsObject()
  content!: Record<string, unknown>;
}

export class ReorderSectionsDto {
  @ValidateNested({ each: true })
  @Type(() => SectionOrderEntry)
  sections!: SectionOrderEntry[];
}

export class SectionOrderEntry {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;

  @IsBoolean()
  visible!: boolean;
}
