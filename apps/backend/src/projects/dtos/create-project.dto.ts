import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Projeto Solidario 2026-1',
    description: 'Project name (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'cuid-da-osc',
    description: 'ID of the OSC (must be AVAILABLE)',
  })
  @IsString()
  @IsNotEmpty()
  oscId!: string;
}
