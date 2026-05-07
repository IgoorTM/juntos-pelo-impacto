import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Projeto Solidario 2026-1',
    description: 'Project name (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Plataforma de voluntariado para...',
    description: 'Free-text description of the project goal',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'cuid-da-osc',
    description: 'ID of the OSC (must be AVAILABLE)',
  })
  @IsString()
  @IsNotEmpty()
  oscId!: string;
}
